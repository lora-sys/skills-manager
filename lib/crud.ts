import { readdir, stat, mkdir, writeFile, access, constants, rm } from "fs/promises";
import { join } from "path";
import { parseFrontmatter } from "./parser";

export interface CreateSkillInput {
  name: string;
  description?: string;
  allowedTools?: string[];
  content: string;
}

export interface UpdateSkillInput {
  name: string;
  description?: string;
  allowedTools?: string[];
  content?: string;
}

async function mkdirp(dir: string): Promise<void> {
  try {
    await access(dir);
  } catch {
    await mkdirp(join(dir, "..")).catch(() => {});
    await mkdir(dir);
  }
}

export async function createSkill(basePath: string, input: CreateSkillInput): Promise<void> {
  const skillPath = join(basePath, input.name);
  await mkdirp(skillPath);

  let mdContent = `---\nname: ${input.name}\n`;
  if (input.description) mdContent += `description: ${input.description}\n`;
  if (input.allowedTools && input.allowedTools.length > 0) {
    mdContent += "allowed-tools:\n";
    for (const t of input.allowedTools) mdContent += `- ${t}\n`;
  }
  mdContent += `---\n\n${input.content || ""}`;

  await writeFile(join(skillPath, "SKILL.md"), mdContent, "utf-8");
}

export async function updateSkill(basePath: string, input: UpdateSkillInput): Promise<void> {
  const skillPath = join(basePath, input.name);
  const skillMdPath = join(skillPath, "SKILL.md");

  try {
    await access(skillMdPath, constants.R_OK);
  } catch {
    throw new Error("Skill not found");
  }

  const existing = await _readFile(skillMdPath);

  const lines = existing.split("\n");
  let fmStart = -1, fmEnd = -1, inFM = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      if (!inFM) {
        inFM = true;
        continue;
      } else {
        fmEnd = i;
        break;
      }
    }
  }

  let newFM = `name: ${input.name}\n`;
  if (input.description !== undefined) newFM += `description: ${input.description}\n`;
  if (input.allowedTools !== undefined && input.allowedTools.length > 0) {
    newFM += "allowed-tools:\n";
    for (const t of input.allowedTools) newFM += `- ${t}\n`;
  }

  let bodyContent = input.content || "";
  if (fmStart >= 0 && fmEnd >= 0) {
    const afterFM = lines.slice(fmEnd + 1).join("\n").trim();
    if (!bodyContent) bodyContent = afterFM;
  } else {
    const afterMarker = existing.replace(/^[\s\S]*?(?:^---\n)?/, "").trim();
    if (!bodyContent) bodyContent = afterMarker;
  }

  const updated = `---\n${newFM}---\n\n${bodyContent}`;
  await writeFile(skillMdPath, updated, "utf-8");
}

export async function deleteSkill(basePath: string, name: string): Promise<void> {
  const skillPath = join(basePath, name);
  await rm(skillPath, { recursive: true, force: true });
}

export async function skillExists(basePath: string, name: string): Promise<boolean> {
  try {
    await access(join(basePath, name), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Read a file, return empty string on failure
async function _readFile(filePath: string): Promise<string> {
  try {
    const { readFile } = await import("fs/promises");
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}
