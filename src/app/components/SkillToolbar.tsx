import type { Skill } from "./types";

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (m: "grid" | "list") => void;
  sourceFilter: string;
  onSourceFilter: (s: string) => void;
  onOpenCreate: () => void;
  onOpenZipImport: () => void;
  onOpenSelectiveImport: () => void;
  selectedCount: number;
  onBulkExport: () => void;
  sources: Array<{ id: string; label: string }>;
}

const TOOL_OPTIONS = [
  { id: "all", label: "All Tools" },
  { id: "claude", label: "Claude Code" },
  { id: "codex", label: "Codex" },
  { id: "gemini", label: "Gemini" },
  { id: "cursor", label: "Cursor" },
  { id: "aider", label: "Aider" },
];

export function Toolbar({
  search, onSearchChange, viewMode, onViewModeChange,
  sourceFilter, onSourceFilter,
  onOpenCreate, onOpenZipImport, onOpenSelectiveImport,
  selectedCount, onBulkExport, sources,
}: ToolbarProps) {
  return (
    <>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Skill Manager</h1>
          <p className="text-sm text-[#8b8fa3] mt-0.5">Visualize, edit, delete, import/export AI coding skills</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#6c5ce7" }} onClick={onOpenCreate}>+ New</button>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#242736", color: "#e4e6f0", border: "1px solid #2e3245" }}
            onClick={onOpenZipImport}>Import ZIP</button>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#242736", color: "#e4e6f0", border: "1px solid #2e3245" }}
            onClick={onOpenSelectiveImport}>
            Bulk Import
          </button>
          {selectedCount > 0 && (
            <button className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#00b894", color: "#fff" }} onClick={onBulkExport}>
              Export ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 mb-3 items-center">
        <span className="text-xs text-[#8b8fa3]">Source:</span>
        <select value={sourceFilter} onChange={(e) => onSourceFilter(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg transition-all"
          style={{ background: "#1a1d27", color: "#e4e6f0", border: "1px solid #2e3245" }}>
          {TOOL_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id === "all" ? "" : opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search by name, description, content, or tools..." value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ background: "#1a1d27", color: "#e4e6f0", border: "1px solid #2e3245" }}
            onFocus={(e) => { e.target.style.borderColor = "#6c5ce7"; }}
            onBlur={(e) => { e.target.style.borderColor = "#2e3245"; }} />
        </div>
        {search && (
          <button onClick={() => onSearchChange("")} className="px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "#1a1d27", color: "#8b8fa3", border: "1px solid #2e3245" }}>Clear</button>
        )}
        <div className="flex items-center gap-1">
          <button onClick={() => onViewModeChange("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#6c5ce7]" : "bg-[#242736]"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </button>
          <button onClick={() => onViewModeChange("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-[#6c5ce7]" : "bg-[#242736]"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2"/><line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2"/><line x1="3" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
