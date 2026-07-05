export interface ParsedFrontmatter {
  name?: string;
  description?: string;
  allowedTools?: string[];
  body: string;
  bodyStart: number;
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {
    name: undefined,
    description: undefined,
    allowedTools: undefined,
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
      // Multi-line allowed-tools (YAML block sequence)
      if (line.match(/^allowed-tools:\s*$/) || line.match(/^allowed-tools:\s*\|/)) {
        const tools: string[] = [];
        for (let j = i + 1; j < Math.min(lines.length, i + 30); j++) {
          const tl = lines[j].match(/^\s*-\s+(.+)$/);
          if (tl) tools.push(tl[1].trim());
          else if (lines[j].trim() === "" || lines[j].match(/^[a-z]/) || lines[j].trim() === "---") break;
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
