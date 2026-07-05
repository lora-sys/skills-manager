import { readdir, stat, access, constants, readFile } from "fs/promises";
import { join, basename } from "path";

export interface SkillSource {
  id: string;
  label: string;
  path: string;
}

export interface SkillEntry {
  name: string;
  description: string;
  allowedTools: string[];
  file: string;
  content: string;
  size: number;
  allFiles: string[];
  source: string;
  sourceLabel: string;
}

export interface PaginatedResult<T> {
  skills: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const KNOWN_SOURCES: SkillSource[] = [
  { id: "claude", label: "Claude Code", path: "/home/lora/.claude/skills" },
  { id: "codex", label: "Codex", path: "/home/lora/.codex/skills" },
  { id: "gemini", label: "Gemini", path: "/home/lora/.gemini/antigravity/skills" },
  { id: "cursor", label: "Cursor", path: "/home/lora/.cursor/skills" },
  { id: "aider", label: "Aider", path: "/home/lora/.aider-desk/skills" },
];

export function getSkillSources(): SkillSource[] {
  return KNOWN_SOURCES.filter((s) => true);
}

async function readSkillFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function parseFrontmatter(content: string): Promise<{
  name?: string;
  description?: string;
  allowedTools?: string[];
  body: string;
  bodyStart: number;
}> {
  const result = {
    name: undefined as string | undefined,
    description: undefined as string | undefined,
    allowedTools: undefined as string[] | undefined,
    body: "",
    bodyStart: 0,
  };

  const lines = content.split("\n");
  let inFM = false;
  let fmEnd = -1;

  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("---")) {
      if (!inFM) {
        inFM = true;
        continue;
      } else {
        fmEnd = i;
        break;
      }
    }
    if (inFM) {
      const nm = line.match(/^name:\s*(.+)$/i);
      if (nm) result.name = nm[1].trim();
      const dm = line.match(/^description:\s*(.+)$/i);
      if (dm) result.description = dm[1].trim();
      const tm = line.match(/^allowed-tools:\s*(.+)$/i);
      if (tm) {
        result.allowedTools = tm[1].split(",").map((t) => t.trim()).filter(Boolean);
      }
      // Multi-line allowed-tools
      if (line.match(/^allowed-tools:\s*$/) || line.match(/^allowed-tools:\s*\|/)) {
        const tools: string[] = [];
        for (let j = i + 1; j < Math.min(lines.length, i + 30); j++) {
          const tl = lines[j].match(/^\s*-\s*(.+)$/);
          if (tl) tools.push(tl[1].trim());
          else if (lines[j].trim() === "" || lines[j].match(/^[a-z]/)) break;
        }
        if (tools.length) result.allowedTools = tools;
      }
    }
  }

  let cs = 0;
  if (fmEnd >= 0) {
    cs = fmEnd + 1;
  } else {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].trim() === "---") {
        cs = i + 1;
        break;
      }
    }
  }
  result.body = lines.slice(cs).join("\n").trim();
  result.bodyStart = cs;
  return result;
}

async function listSkillFiles(skillPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(skillPath).catch(() => []);
  for (const entry of entries) {
    const fp = join(skillPath, entry);
    const s = await stat(fp).catch(() => null);
    if (!s) continue;
    if (s.isDirectory()) {
      files.push(...(await listSkillFiles(fp)));
    } else {
      files.push(fp);
    }
  }
  return files;
}

async function scanSingleSource(
  source: SkillSource,
  searchFilter?: string,
): Promise<SkillEntry[]> {
  try {
    await access(source.path, constants.R_OK);
  } catch {
    return [];
  }

  const entries = await readdir(source.path).catch(() => []);
  const skills: SkillEntry[] = [];
  const searchLower = searchFilter?.toLowerCase();

  for (const dir of entries.sort()) {
    const skillPath = join(source.path, dir);
    const s = await stat(skillPath).catch(() => null);
    if (!s?.isDirectory()) continue;

    // Search filter
    if (searchLower) {
      const mdFiles = ["SKILL.md", "skill.md", "README.md"];
      let mainMd = "";
      for (const f of mdFiles) {
        const fp = join(skillPath, f);
        try {
          await access(fp, constants.R_OK);
          mainMd = fp;
          break;
        } catch {
          // skip
        }
      }
      if (!mainMd) {
        const files = await readdir(skillPath).catch(() => []);
        const md = files.find((f) => f.endsWith(".md"));
        if (!md) continue;
        mainMd = join(skillPath, md);
      }
      const content = await readSkillFile(mainMd);
      if (!content.toLowerCase().includes(searchLower)) continue;
    }

    const mdFiles = ["SKILL.md", "skill.md", "README.md"];
    let mainMd = "";
    for (const f of mdFiles) {
      const fp = join(skillPath, f);
      try {
        await access(fp, constants.R_OK);
        mainMd = fp;
        break;
      } catch {
        // skip
      }
    }
    if (!mainMd) {
      const files = await readdir(skillPath).catch(() => []);
      const md = files.find((f) => f.endsWith(".md"));
      if (!md) continue;
      mainMd = join(skillPath, md);
    }

    const content = await readSkillFile(mainMd);
    if (!content) continue;

    const fm = await parseFrontmatter(content);

    const allFiles = await listSkillFiles(skillPath);

    skills.push({
      name: fm.name || dir,
      description: fm.description || "",
      allowedTools: fm.allowedTools || [],
      file: mainMd,
      content: fm.body,
      size: content.length,
      allFiles: allFiles.map((f) => f.replace(new RegExp("^" + source.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/"), "")),
      source: source.id,
      sourceLabel: source.label,
    });
  }

  return skills;
}

export async function getAllSkills(
  sourceFilter?: string,
  searchFilter?: string,
): Promise<SkillEntry[]> {
  const sources = sourceFilter
    ? KNOWN_SOURCES.filter((s) => s.id === sourceFilter)
    : KNOWN_SOURCES;

  const allSkills: SkillEntry[] = [];
  for (const src of sources) {
    const skills = await scanSingleSource(src, searchFilter);
    allSkills.push(...skills);
  }
  return allSkills;
}

export async function getPaginatedSkills(
  page: number,
  pageSize: number,
  sourceFilter?: string,
  searchFilter?: string,
): Promise<PaginatedResult<SkillEntry>> {
  const allSkills = await getAllSkills(sourceFilter, searchFilter);
  const total = allSkills.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const skills = allSkills.slice(start, start + pageSize);

  return { skills, total, page, pageSize, totalPages };
}

export async function getStats(sourceFilter?: string): Promise<{
  count: number;
  totalFiles: number;
  totalSize: number;
}> {
  const skills = await getAllSkills(sourceFilter);
  const totalFiles = skills.reduce((s, sk) => s + sk.allFiles.length, 0);
  const totalSize = skills.reduce((s, sk) => s + sk.size, 0);
  return { count: skills.length, totalFiles, totalSize };
}
