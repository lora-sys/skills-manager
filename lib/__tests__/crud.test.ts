import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { createSkill, updateSkill, deleteSkill, skillExists } from "../crud";

describe("crud", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "skill-crud-test-"));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe("createSkill", () => {
    it("creates a skill directory with SKILL.md", async () => {
      await createSkill(baseDir, {
        name: "test-skill",
        description: "A test",
        allowedTools: ["Read", "Edit"],
        content: "# Test skill",
      });

      const content = await readFile(join(baseDir, "test-skill", "SKILL.md"), "utf-8");
      expect(content).toContain("name: test-skill");
      expect(content).toContain("description: A test");
      expect(content).toContain("- Read");
      expect(content).toContain("# Test skill");
    });

    it("creates skill without optional fields", async () => {
      await createSkill(baseDir, {
        name: "minimal-skill",
        content: "just content",
      });

      const content = await readFile(join(baseDir, "minimal-skill", "SKILL.md"), "utf-8");
      expect(content).toContain("name: minimal-skill");
      expect(content).not.toContain("description:");
      expect(content).not.toContain("allowed-tools:");
    });
  });

  describe("updateSkill", () => {
    it("updates name and description", async () => {
      await createSkill(baseDir, {
        name: "old-name",
        description: "old desc",
        content: "old content",
      });

      await updateSkill(baseDir, {
        name: "old-name",
        description: "new desc",
        content: "new content",
      });

      const content = await readFile(join(baseDir, "old-name", "SKILL.md"), "utf-8");
      expect(content).toContain("description: new desc");
      expect(content).toContain("new content");
    });

    it("throws when skill does not exist", async () => {
      await expect(
        updateSkill(baseDir, { name: "nonexistent", description: "x" }),
      ).rejects.toThrow("Skill not found");
    });
  });

  describe("deleteSkill", () => {
    it("removes the skill directory recursively", async () => {
      await createSkill(baseDir, {
        name: "to-delete",
        content: "will be deleted",
      });

      // Create a nested file
      const { mkdir } = await import("fs/promises");
      await mkdir(join(baseDir, "to-delete", "rules"), { recursive: true });

      expect(await skillExists(baseDir, "to-delete")).toBe(true);
      await deleteSkill(baseDir, "to-delete");
      expect(await skillExists(baseDir, "to-delete")).toBe(false);
    });
  });

  describe("skillExists", () => {
    it("returns true for existing skill", async () => {
      await createSkill(baseDir, { name: "exists", content: "yes" });
      expect(await skillExists(baseDir, "exists")).toBe(true);
    });

    it("returns false for non-existing skill", async () => {
      expect(await skillExists(baseDir, "nope")).toBe(false);
    });
  });
});
