# Skill Manager 整体重构计划

## Problem Statement

当前 Skill Manager 应用存在三个核心问题：

1. **没有分页** — 当前 93 个 Claude skills + 17 个其他工具 skills = 110 个，一次性全部渲染导致页面卡顿，无法流畅使用。
2. **删除失败** — API 的 DELETE 端点使用 `access(skillPath, constants.W_OK)` 权限检查，在某些情况下会因为 Next.js API route 的执行上下文导致权限判断不准确，导致删除操作静默失败。
3. **只能管理 Claude skills** — `SKILLS_DIR` 硬编码为 `/home/lora/.claude/skills`，无法管理 Codex、Gemini、Cursor、Aider 等其他 AI 编码工具的 skills，而这些工具各自也有独立的 skills 目录。

此外，代码结构严重缺乏模块化：`page.tsx` 662 行一个组件包揽一切，`route.ts` 366 行混合了扫描、解析、CRUD、导入导出等多重职责，没有任何测试覆盖。

## Solution

将应用重构为模块化的三层架构：
- **lib/** — 纯业务逻辑（skill 扫描、YAML 解析、CRUD 操作、分页）
- **app/api/** — 薄路由层，仅负责请求解析和响应格式化
- **app/components/** — 可复用的 UI 组件

支持自动扫描所有已知 AI 工具的 skills 目录，在列表中显示来源标识，分页展示（20 个/页），修复删除 bug。

## Commits

### Commit 1: feat: add vitest config and test infrastructure
- Install vitest and @testing-library/react
- Create vitest.config.ts and vitest.setup.ts
- Add test scripts to package.json
- Goal: establish testing foundation before any refactoring

### Commit 2: refactor: extract skill scanning logic into lib/skills.ts
- Create `lib/skills.ts` with all directory scanning functions
- Define `SkillSource` type for multi-tool support (claude, codex, gemini, cursor, aider)
- Define `SkillEntry` type with source field
- Create `getAllSkillSources()` to auto-discover all AI tool skill directories
- Create `scanSkills(sources, options)` with pagination support (page, pageSize)
- Keep only API route handlers in route.ts

### Commit 3: refactor: extract YAML frontmatter parser into lib/parser.ts
- Create `lib/parser.ts` with `parseFrontmatter(content)` function
- Properly handle YAML frontmatter (name, description, allowed-tools as scalar and block sequence)
- Return typed `SkillMeta` object
- Create unit tests for the parser covering: standard frontmatter, no frontmatter, multi-line allowed-tools, malformed YAML, empty content

### Commit 4: refactor: extract CRUD operations into lib/crud.ts
- Create `lib/crud.ts` with pure functions: `createSkill(path, meta)`, `updateSkill(path, meta)`, `deleteSkill(path)`, `exportSkill(path)`
- Remove hardcoded `/home/lora/.claude/skills` — accept path as parameter
- Fix DELETE bug: use `fs.rm(path, { recursive: true, force: true })` instead of manual recursive removal + access() permission check
- Create unit tests for CRUD operations

### Commit 5: refactor: thin down API route to handler layer
- Rewrite `app/api/skills/route.ts` to import from lib/ modules
- GET handler: parse query params (page, pageSize, source, search), call scanSkills(), return paginated response
- POST/PUT/DELETE handlers: call lib/crud.ts functions
- Keep only request/response serialization logic in the route file
- Add input validation and error handling

### Commit 6: refactor: split page.tsx into components/
- Create `components/SkillCard.tsx` — grid view card component
- Create `components/SkillList.tsx` — list view component
- Create `components/SkillModal.tsx` — detail/edit/create modal
- Create `components/SkillPagination.tsx` — pagination controls
- Create `components/SkillToolbar.tsx` — search, view mode toggle, import buttons
- Create `components/SkillStats.tsx` — stats pills
- Main page.tsx becomes a clean orchestrator (~80 lines)

### Commit 7: feat: add pagination to skill listing
- Add page/pageSize query params to API (default 20)
- Return `{ skills, total, page, pageSize, totalPages }` from API
- Add pagination UI component with page numbers and prev/next
- Persist page in URL search params for bookmarkability

### Commit 8: feat: support multi-tool skill management
- Auto-discover skill directories: ~/.claude/skills, ~/.codex/skills, ~/.gemini/antigravity/skills, ~/.cursor/skills, ~/.aider-desk/skills
- Tag each skill with its source tool
- Add source filter in toolbar (All / Claude / Codex / Gemini / Cursor / Aider)
- Show source icon/badge on each skill card

### Commit 9: fix: repair delete operation
- Replace manual recursive directory removal with Node.js `fs.rm(dir, { recursive: true, force: true })`
- Remove the broken `access(W_OK)` check — use try/catch around the actual operation instead
- Add proper error propagation from fs operations

### Commit 10: test: add integration tests for API routes
- Test paginated GET with query params
- Test multi-source scanning
- Test CRUD operations with temp directories
- Test error cases (duplicate name, not found, invalid input)

### Commit 11: chore: clean up globals.css and remove unused CSS classes
- Remove unused `.skill-card`, `.toolbar`, `.empty-state` classes (moved to components)
- Keep only global resets and animations
- Or convert remaining utility classes to Tailwind equivalents

## Decision Document

### Modules
- `lib/skills.ts` — multi-source discovery, skill scanning, pagination
- `lib/parser.ts` — YAML frontmatter parsing
- `lib/crud.ts` — file-level CRUD operations
- `app/api/skills/route.ts` — thin API handler layer
- `components/SkillCard.tsx` — grid view card
- `components/SkillList.tsx` — list view
- `components/SkillModal.tsx` — all modals (detail, edit, create, import)
- `components/SkillPagination.tsx` — pagination controls
- `components/SkillToolbar.tsx` — search, filters, view toggle
- `components/SkillStats.tsx` — statistics pills
- `page.tsx` — orchestrator (~80 lines)

### Interfaces
- `SkillEntry`: { name, description, allowedTools, file, content, size, allFiles, source, sourceLabel }
- `SkillSource`: { id: string, label: string, path: string }
- Paginated response: { skills: SkillEntry[], total: number, page: number, pageSize: number, totalPages: number }

### Technical clarifications
- Each AI tool has its own skills directory; we scan all of them
- Source identification: map directory path to tool name (claude, codex, gemini, cursor, aider)
- Pagination is server-side (more efficient than client-side for 110+ items)
- Delete uses `fs.rm()` with `{ recursive: true, force: true }` — no manual recursion needed

### Architectural decisions
- Server-side pagination: reduces data transfer and rendering cost
- Thin API routes: business logic in lib/, route layer only handles HTTP
- Component decomposition: each component has a single responsibility
- Source-first scanning: discover tools first, then scan their skill directories
- No new dependencies for parsing: keep using simple string-based YAML parsing (no external yaml library) to avoid bloating the project

### Schema changes
- New `source` field on SkillEntry (string: "claude" | "codex" | "gemini" | "cursor" | "aider")
- New `sourceLabel` field for display name
- API response changes from `SkillEntry[]` to `{ skills: SkillEntry[], total: number, page: number, pageSize: number, totalPages: number }`

### API contracts
- GET /api/skills?source=claude&page=1&pageSize=20&search=query
- GET /api/skills?action=stats — returns { count, totalFiles, totalSize } (unchanged)
- POST /api/skills — { name, description, allowedTools, content } → { success, name }
- PUT /api/skills — { name, description, allowedTools, content } → { success, name }
- DELETE /api/skills?name=x — { success, name }
- GET /api/skills?action=export&name=x — binary zip download
- POST /api/skills?action=import-zip — multipart/form-data
- POST /api/skills?action=import-selective — { skills: [...] }

### Interactions
- Source filter changes the query param and triggers a new API call
- Pagination updates page param in URL
- Search filters client-side on current page (or server-side if needed)

## Testing Decisions

### What makes a good test
- Test external behavior: given a directory structure, does scan return the right skills?
- Given YAML content, does parseFrontmatter extract the right fields?
- Given a skill path, does delete actually remove it?
- For frontend: given props, does the component render correctly?

### Modules to test
1. **lib/parser.ts** — Unit tests for frontmatter parsing edge cases
2. **lib/skills.ts** — Unit tests for source discovery and scanning with temp directories
3. **lib/crud.ts** — Unit tests for create/update/delete with temp directories
4. **API routes** — Integration tests using vitest + http server

### Prior art
- No existing tests in the codebase — this is greenfield test coverage
- Use vitest's `vi.mock()` for fs operations where needed
- Use `temp.dir()` or `fs.mkdtemp()` for test fixtures

## Out of Scope
- Migrating inline styles to Tailwind CSS classes (visual design is not the goal)
- Adding authentication or access control
- Supporting custom/unknown AI tool skill directories (only the 5 known tools)
- Real-time file watching / auto-refresh
- Skill content syntax highlighting in the editor
- Moving ZIP operations to a pure Node.js library (zip via child_process is acceptable for now)
- Database migration or persistent storage (file-based is fine)

## Further Notes
- The refactor should be done in small, verifiable steps — each commit leaves the codebase in a working state
- The existing visual design (dark theme, colors, animations) should be preserved exactly
- The hardcoded path `/home/lora/.claude/skills` should become a configurable array of sources
- Consider adding a `.env` variable for the skill roots, but default to the known paths for convenience
