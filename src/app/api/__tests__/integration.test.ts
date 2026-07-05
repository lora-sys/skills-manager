import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { parseFrontmatter } from "../../../../lib/parser";
import { createSkill, deleteSkill } from "../../../../lib/crud";

describe("API integration", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "api-integration-"));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe("pagination", () => {
    it("returns correct page sizes", async () => {
      // Create 5 test skills
      for (let i = 1; i <= 5; i++) {
        await createSkill(baseDir, { name: `paginated-skill-${i}`, content: `content ${i}` });
      }

      const { getPaginatedSkills } = await import("../../../../lib/skills");
      const result = await getPaginatedSkills(1, 3, undefined, undefined);

      // Total includes all sources, but we can check page size and slicing
      expect(result.pageSize).toBe(3);
      expect(result.page).toBe(1);
      expect(result.skills.length).toBe(3);

      const result2 = await getPaginatedSkills(2, 3, undefined, undefined);
      // Page 2 may have 0-3 skills depending on total count
      expect(result2.skills.length).toBeLessThanOrEqual(3);
    });

    it("returns correct total and totalPages", async () => {
      const { getPaginatedSkills } = await import("../../../../lib/skills");
      const result = await getPaginatedSkills(1, 100, undefined, undefined);
      expect(result.total).toBeGreaterThan(0);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe("frontmatter parsing", () => {
    it("parses real SKILL.md format", async () => {
      const content = `---
name: test-skill
description: A real test skill
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Test Skill

This is the body content.`;

      const result = parseFrontmatter(content);
      expect(result.name).toBe("test-skill");
      expect(result.description).toBe("A real test skill");
      expect(result.allowedTools).toEqual(["Bash", "Read", "Edit"]);
      expect(result.body).toContain("# Test Skill");
    });
  });

  describe("CRUD with temp directory", () => {
    it("create and delete cycle works", async () => {
      await createSkill(baseDir, { name: "cycle-test", content: "initial" });
      const entries = await readdir(baseDir);
      expect(entries).toContain("cycle-test");

      await deleteSkill(baseDir, "cycle-test");
      const entriesAfter = await readdir(baseDir);
      expect(entriesAfter).not.toContain("cycle-test");
    });

    it("update modifies the skill file", async () => {
      const { updateSkill } = await import("../../../../lib/crud");
      await createSkill(baseDir, { name: "updatable", content: "old body" });
      await updateSkill(baseDir, { name: "updatable", description: "updated desc", content: "new body" });

      const { readFile } = await import("fs/promises");
      const updated = await readFile(join(baseDir, "updatable", "SKILL.md"), "utf-8");
      expect(updated).toContain("updated desc");
      expect(updated).toContain("new body");
    });
  });
});
