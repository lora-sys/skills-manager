import { NextResponse } from "next/server";
import { readdir, readFile, writeFile, stat, unlink, access } from "fs/promises";
import { constants } from "fs";
import { join } from "path";

const SKILLS_DIR = "/home/lora/.claude/skills";

interface SkillMeta {
  name: string;
  description: string;
  allowedTools?: string[];
  file: string;
  content: string;
  size: number;
}

async function readSkillFile(filePath: string): Promise<string> {
  try {
    const data = await readFile(filePath, "utf-8");
    return data;
  } catch {
    return "";
  }
}

async function parseSkillMeta(content: string, filePath: string): Promise<Partial<SkillMeta>> {
  const meta: Partial<SkillMeta> = {};
  const lines = content.split("\n");

  // Parse frontmatter-like metadata at the top of SKILL.md
  let inFrontmatter = false;
  let frontmatterEnd = -1;

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("---")) {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
    if (inFrontmatter) {
      const nameMatch = line.match(/^name:\s*(.+)$/i);
      if (nameMatch) meta.name = nameMatch[1].trim();
      const descMatch = line.match(/^description:\s*(.+)$/i);
      if (descMatch) meta.description = descMatch[1].trim();
      const toolsMatch = line.match(/^allowed-tools:\s*(.+)$/i);
      if (toolsMatch) {
        meta.allowedTools = toolsMatch[1]
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }
  }

  // If no frontmatter found, parse inline markers
  if (!meta.name || !frontmatterEnd) {
    const nameMatch = content.match(/name:\s*([^\n]+)/i);
    const descMatch = content.match(/description:\s*\|?\s*\n([\s\S]*?)^(allowed-tools|file|size)/m);
    const toolsMatch = content.match(/allowed-tools:\s*\n([\s\S]*?)(?=^---|\n^[a-z]|$)/m);

    if (nameMatch && !meta.name) meta.name = nameMatch[1].trim();
  }

  // Strip frontmatter and leading --- for content display
  let contentStart = 0;
  if (frontmatterEnd >= 0) {
    contentStart = frontmatterEnd + 1;
  } else {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].trim() === "---") {
        contentStart = i + 1;
        break;
      }
    }
  }

  meta.file = filePath;
  meta.content = content.split("\n").slice(contentStart).join("\n").trim();
  meta.size = content.length;

  return meta;
}

export async function GET() {
  try {
    await access(SKILLS_DIR, constants.R_OK);
  } catch {
    return NextResponse.json({ error: "Skills directory not accessible" }, { status: 500 });
  }

  const entries = await readdir(SKILLS_DIR);
  const dirs = entries.filter((e) => {
    return true; // all entries in skills dir are skill folders
  });

  const skills: SkillMeta[] = [];

  for (const dir of dirs.sort()) {
    const skillPath = join(SKILLS_DIR, dir);
    const st = await stat(skillPath).catch(() => null);
    if (!st?.isDirectory()) continue;

    // Find SKILL.md or any .md file
    const mdFiles = ["SKILL.md", "skill.md", "README.md"];
    let mainMd = "";
    for (const f of mdFiles) {
      const fp = join(skillPath, f);
      try {
        await access(fp, constants.R_OK);
        mainMd = fp;
        break;
      } catch {}
    }
    if (!mainMd) {
      // fallback: first .md file
      const files = await readdir(skillPath);
      const md = files.find((f) => f.endsWith(".md"));
      if (!md) continue;
      mainMd = join(skillPath, md);
    }

    const content = await readSkillFile(mainMd);
    if (!content) continue;

    const meta = await parseSkillMeta(content, mainMd);
    skills.push({
      name: meta.name || dir,
      description: meta.description || "",
      allowedTools: meta.allowedTools || [],
      file: mainMd,
      content: meta.content || "",
      size: meta.size || 0,
    } as SkillMeta);
  }

  return NextResponse.json(skills);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, allowedTools, content } = body as {
    name?: string;
    description?: string;
    allowedTools?: string[];
    content?: string;
  };

  if (!name) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  const skillPath = join(SKILLS_DIR, name);
  try {
    await access(SKILLS_DIR, constants.W_OK);
    await access(skillPath, constants.F_OK);
    return NextResponse.json({ error: "Skill already exists" }, { status: 409 });
  } catch {
    // directory doesn't exist, that's fine
  }

  await mkdirp(skillPath);

  let mdContent = "";
  if (description) {
    mdContent += `name: ${name}\n`;
    mdContent += `description: ${description}\n`;
  }
  if (allowedTools && allowedTools.length > 0) {
    mdContent += `allowed-tools:\n`;
    for (const t of allowedTools) {
      mdContent += `- ${t}\n`;
    }
  }
  if (content) {
    if (mdContent && !mdContent.endsWith("\n\n")) mdContent += "\n";
    mdContent += content;
  }
  if (!mdContent) {
    mdContent = `name: ${name}\n\n# Skill content\n`;
  }

  const skillMdPath = join(skillPath, "SKILL.md");
  await writeFile(skillMdPath, mdContent, "utf-8");

  const meta = await parseSkillMeta(mdContent, skillMdPath);
  return NextResponse.json({ ...meta, name, description, allowedTools: allowedTools || [] }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { name, description, allowedTools, content } = body as {
    name: string;
    description?: string;
    allowedTools?: string[];
    content?: string;
  };

  if (!name) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  const skillPath = join(SKILLS_DIR, name);
  const skillMdPath = join(skillPath, "SKILL.md");

  try {
    await access(skillMdPath, constants.R_OK | constants.W_OK);
  } catch {
    return NextResponse.json({ error: "Skill file not found" }, { status: 404 });
  }

  let existing = await readSkillFile(skillMdPath);

  // Update frontmatter-style fields
  const lines = existing.split("\n");
  let inFM = false;
  let fmStart = -1;
  let fmEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      if (!inFM) { inFM = true; fmStart = i; continue; }
      else { fmEnd = i; break; }
    }
  }

  let newFM = "";
  if (description !== undefined) {
    newFM += `description: ${description}\n`;
  }
  if (allowedTools !== undefined) {
    if (allowedTools.length > 0) {
      newFM += `allowed-tools:\n`;
      for (const t of allowedTools) {
        newFM += `- ${t}\n`;
      }
    }
  }

  if (fmStart >= 0 && fmEnd >= 0) {
    existing = lines.slice(0, fmStart).join("\n") + "\n---\n" + newFM + "---\n" + lines.slice(fmEnd + 1).join("\n");
  } else if (existing.startsWith("name:") || existing.startsWith("---")) {
    existing = "---\n" + newFM + "---\n" + (content || existing.replace(/^[\s\S]*?(?:^---\n)?/, "").trim());
  } else {
    const preamble = `---\n${newFM}---\n\n`;
    existing = preamble + (content || existing);
  }

  await writeFile(skillMdPath, existing, "utf-8");
  const meta = await parseSkillMeta(existing, skillMdPath);
  return NextResponse.json({ ...meta, name, description, allowedTools });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  const skillPath = join(SKILLS_DIR, name);

  try {
    await access(skillPath, constants.W_OK);
  } catch {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  await removeDir(skillPath);
  return NextResponse.json({ success: true, name });
}

async function mkdirp(dir: string) {
  try {
    await access(dir);
  } catch {
    await mkdirp(join(dir, ".."));
    await mkdir(dir);
  }
}

async function removeDir(dir: string) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const p = join(dir, entry);
    const st = await stat(p);
    if (st.isDirectory()) await removeDir(p);
    else await unlink(p);
  }
  await rmdir(dir);
}

import { mkdir, rmdir } from "fs/promises";
