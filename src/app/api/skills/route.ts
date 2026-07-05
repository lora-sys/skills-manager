import { NextResponse } from "next/server";
import {
  getPaginatedSkills,
  getStats,
} from "../../../../lib/skills";
import { createSkill, updateSkill, deleteSkill } from "../../../../lib/crud";
import {
  readdir, stat, access, constants, cp, mkdir, writeFile, rm, readFile, unlink,
} from "fs/promises";
import { join, dirname, basename } from "path";
import { tmpdir } from "os";

const SKILLS_BASE = "/home/lora/.claude/skills";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "export") {
    const name = searchParams.get("name");
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    return handleExport(name);
  }

  if (action === "stats") {
    const source = searchParams.get("source") || undefined;
    const stats = await getStats(source);
    return NextResponse.json(stats);
  }

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const sourceFilter = searchParams.get("source") || undefined;
  const searchFilter = searchParams.get("search") || undefined;

  const result = await getPaginatedSkills(page, pageSize, sourceFilter, searchFilter);
  return NextResponse.json(result);
}

async function handleExport(name: string) {
  const tmpZip = `/tmp/skill-export-${crypto.randomUUID()}.zip`;

  return new Promise<NextResponse>((resolve) => {
    import("child_process").then(({ exec }) => {
      exec(`cd "${SKILLS_BASE}" && zip -r "${tmpZip}" "${name}"`, {}, async (err) => {
        if (err) {
          resolve(NextResponse.json({ error: "export failed" }, { status: 500 }));
          return;
        }
        try {
          const buf = await readFile(tmpZip);
          resolve(new NextResponse(buf, {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename="${name}.zip"`,
            },
          }));
        } finally {
          try { await unlink(tmpZip); } catch { /* ignore */ }
        }
      });
    }).catch(() => resolve(NextResponse.json({ error: "export failed" }, { status: 500 })));
  });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "import-zip") return handleImportZip(request);
  if (action === "import-selective") return handleImportSelective(request);

  const body = await request.json();
  const { name, description, allowedTools, content } = body as {
    name?: string; description?: string; allowedTools?: string[]; content?: string;
  };

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    await createSkill(SKILLS_BASE, { name, description, allowedTools, content: content || "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("exists")) {
      return NextResponse.json({ error: "Skill already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, name }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { name, description, allowedTools, content } = body as {
    name: string; description?: string; allowedTools?: string[]; content?: string;
  };
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    await updateSkill(SKILLS_BASE, { name, description, allowedTools, content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "Skill not found") {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, name });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    await deleteSkill(SKILLS_BASE, name);
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, name });
}

// ---- ZIP Import ----
async function handleImportZip(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const { mkdtemp, unlink } = await import("fs/promises");
  const tmpDir = await mkdtemp(join(tmpdir(), "skill-upload-"));

  const bytes = await file.arrayBuffer();
  await writeFile(join(tmpDir, "upload.zip"), Buffer.from(bytes));

  try {
    const { exec } = await import("child_process");
    await new Promise<void>((resolve, reject) => {
      exec(`unzip -o "${join(tmpDir, "upload.zip")}" -d "${tmpDir}"`, (err) =>
        err ? reject(err) : resolve(),
      );
    });
  } catch {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json({ error: "unzip failed" }, { status: 500 });
  }

  const entries = await readdir(tmpDir);
  let skillDir = tmpDir;
  const dirs = entries.filter((e) => e !== "upload.zip");
  if (dirs.length === 1) {
    const ds = await stat(join(tmpDir, dirs[0]));
    if (ds.isDirectory()) skillDir = join(tmpDir, dirs[0]);
  }

  const skillName = basename(skillDir);
  const destPath = join(SKILLS_BASE, skillName);

  try {
    await access(destPath, constants.F_OK);
    await rm(tmpDir, { recursive: true, force: true });
    return NextResponse.json({ error: `Skill "${skillName}" already exists`, conflict: true }, { status: 409 });
  } catch {
    // ok, doesn't exist
  }

  await cp(skillDir, destPath, { recursive: true });
  await rm(tmpDir, { recursive: true, force: true });

  return NextResponse.json({ success: true, name: skillName, imported: true });
}

// ---- Selective Import ----
async function handleImportSelective(req: Request) {
  const body = await req.json();
  const { skills } = body as { skills: Array<{ name: string; description: string; allowedTools: string[]; content: string }> };
  if (!Array.isArray(skills)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const imported: string[] = [];
  const skipped: string[] = [];

  for (const skill of skills) {
    const destPath = join(SKILLS_BASE, skill.name);
    try {
      await access(destPath, constants.F_OK);
      skipped.push(skill.name);
      continue;
    } catch {
      // doesn't exist, proceed
    }

    await createSkill(SKILLS_BASE, {
      name: skill.name,
      description: skill.description,
      allowedTools: skill.allowedTools,
      content: skill.content,
    });
    imported.push(skill.name);
  }

  return NextResponse.json({ success: true, imported, skipped });
}
