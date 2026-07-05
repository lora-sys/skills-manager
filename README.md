# Skill Manager

Visualize, edit, and manage AI coding tool skills across multiple platforms.

## Features

- **Multi-tool support** — Manage skills from Claude Code, Codex, Gemini, Cursor, and Aider in one place
- **Server-side pagination** — Browse 100+ skills efficiently (10/20/50 per page)
- **Source filtering** — Filter by AI tool (Claude, Codex, Gemini, Cursor, Aider)
- **Full-text search** — Search by name, description, content, or tool bindings
- **Grid & list views** — Toggle between card grid and expandable list
- **Import/Export** — Import from ZIP files or selectively import across tools; export individual skills as ZIP
- **CRUD operations** — Create, edit, and delete skills with YAML frontmatter parsing

## Tech Stack

- [Next.js 16](https://nextjs.org) — React framework with App Router
- [Tailwind CSS v4](https://tailwindcss.com) — Utility-first CSS
- [Vitest](https://vitest.dev) — Unit and integration testing
- [React 19](https://react.dev) — UI library

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3456](http://localhost:3456) in your browser.

## Project Structure

```
lib/
  skills.ts       — Multi-source skill scanning & pagination
  parser.ts       — YAML frontmatter parser for SKILL.md files
  crud.ts         — Create, update, delete skill operations
lib/__tests__/
  parser.test.ts  — Frontmatter parsing unit tests
  crud.test.ts    — CRUD operation unit tests
src/app/
  components/     — React UI components
    types.ts      — Shared TypeScript interfaces
    SkillCardGrid.tsx
    SkillList.tsx
    SkillPagination.tsx
    SkillToolbar.tsx
    SkillStats.tsx
    DetailModal.tsx
    EditModal.tsx
    ZipImportModal.tsx
    SelectiveImportModal.tsx
  api/skills/
    route.ts      — API route handlers (GET/POST/PUT/DELETE)
    __tests__/
      integration.test.ts  — API integration tests
  page.tsx        — Main page (orchestrator)
  layout.tsx      — Root layout
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills?page=N&pageSize=N&source=X&search=Q` | Paginated skill list |
| GET | `/api/skills?action=stats&source=X` | Aggregate statistics |
| GET | `/api/skills?action=export&name=X` | Export skill as ZIP |
| POST | `/api/skills` | Create new skill |
| POST | `/api/skills?action=import-zip` | Import from ZIP upload |
| POST | `/api/skills?action=import-selective` | Bulk import selected skills |
| PUT | `/api/skills` | Update existing skill |
| DELETE | `/api/skills?name=X` | Delete skill directory |

### Query Parameters

- `page` — Page number (default: 1)
- `pageSize` — Items per page (default: 20, options: 10, 20, 50)
- `source` — Filter by tool: `claude`, `codex`, `gemini`, `cursor`, `aider`
- `search` — Full-text search across name, description, content, and tools

## Testing

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
```

## Skill Sources

Skills are auto-discovered from these directories:

| Tool | Directory |
|------|-----------|
| Claude Code | `~/.claude/skills` |
| Codex | `~/.codex/skills` |
| Gemini | `~/.gemini/antigravity/skills` |
| Cursor | `~/.cursor/skills` |
| Aider | `~/.aider-desk/skills` |
