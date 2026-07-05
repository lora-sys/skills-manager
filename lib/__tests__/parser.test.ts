import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../../lib/parser";

describe("parseFrontmatter", () => {
  it("parses standard frontmatter with name and description", () => {
    const content = `---
name: my-skill
description: A test skill
---

This is the skill content.`;

    const result = parseFrontmatter(content);
    expect(result.name).toBe("my-skill");
    expect(result.description).toBe("A test skill");
    expect(result.allowedTools).toBeUndefined();
    expect(result.body).toBe("This is the skill content.");
  });

  it("parses allowed-tools as comma-separated", () => {
    const content = `---
name: tool-skill
allowed-tools: Bash, Read, Edit
---

Content here.`;

    const result = parseFrontmatter(content);
    expect(result.allowedTools).toEqual(["Bash", "Read", "Edit"]);
  });

  it("parses multi-line allowed-tools", () => {
    const content = `---
name: tool-skill
allowed-tools:
  - Bash(npx:*)
  - Read
  - Edit
---

Content here.`;

    const result = parseFrontmatter(content);
    expect(result.allowedTools).toEqual(["Bash(npx:*)", "Read", "Edit"]);
  });

  it("returns body without frontmatter when no delimiter", () => {
    const content = `# Just a skill file
No frontmatter here.`;

    const result = parseFrontmatter(content);
    expect(result.name).toBeUndefined();
    expect(result.body).toBe("# Just a skill file\nNo frontmatter here.");
  });

  it("handles empty content", () => {
    const result = parseFrontmatter("");
    expect(result.body).toBe("");
    expect(result.name).toBeUndefined();
  });

  it("handles case-insensitive frontmatter keys", () => {
    const content = `---
NAME: UPPER-CASE
DESCRIPTION: upper desc
---

Body.`;

    const result = parseFrontmatter(content);
    expect(result.name).toBe("UPPER-CASE");
    expect(result.description).toBe("upper desc");
  });

  it("trims whitespace from parsed values", () => {
    const content = `---
name:   spaced-name
description:   spaced desc
---

Body.`;

    const result = parseFrontmatter(content);
    expect(result.name).toBe("spaced-name");
    expect(result.description).toBe("spaced desc");
  });

  it("handles only frontmatter with no body", () => {
    const content = `---
name: empty-skill
---`;

    const result = parseFrontmatter(content);
    expect(result.name).toBe("empty-skill");
    expect(result.body).toBe("");
  });
});
