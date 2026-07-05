import type { Skill } from "./types";

interface SkillListProps {
  skills: Skill[];
  listExpanded: Set<string>;
  selectedForExport: Set<string>;
  deleting: string | null;
  onToggleExpand: (name: string) => void;
  onToggleSelect: (name: string, checked: boolean) => void;
  onSelectAll: (e: React.MouseEvent) => void;
  onEdit: (skill: Skill) => void;
  onExport: (name: string) => void;
  onDelete: (name: string) => void;
}

export function SkillList({
  skills, listExpanded, selectedForExport, deleting,
  onToggleExpand, onToggleSelect, onSelectAll,
  onEdit, onExport, onDelete,
}: SkillListProps) {
  return (
    <div className="space-y-1">
      {skills.map((skill) => {
        const expanded = listExpanded.has(skill.name);
        return (
          <div key={skill.name} className="rounded-lg overflow-hidden transition-all"
            style={{ background: expanded ? "#1a1d27" : "transparent", border: expanded ? "1px solid #2e3245" : "1px solid transparent" }}>
            <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#1a1d27]/50 transition-colors"
              onClick={() => onToggleExpand(skill.name)}>
              <svg className={`transition-transform ${expanded ? "rotate-90" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <input type="checkbox" checked={selectedForExport.has(skill.name)}
                onChange={(e) => { e.stopPropagation(); onToggleSelect(skill.name, e.target.checked); }}
                onClick={(e) => e.stopPropagation()}
                className="accent-[#6c5ce7]" />
              <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#0f1117", color: "#8b8fa3", border: "1px solid #2e3245" }}>
                {skill.source}
              </span>
              <span className="text-sm font-medium flex-1 truncate">{skill.name}</span>
              <span className="text-xs text-[#8b8fa3]">{skill.allFiles.length} files</span>
              {skill.allowedTools.length > 0 && (
                <span className="text-xs text-[#00b894]">{skill.allowedTools.length} tools</span>
              )}
              <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onEdit(skill)} className="p-1 rounded hover:bg-[#242736] transition-colors" title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => onExport(skill.name)} className="p-1 rounded hover:bg-[#242736] transition-colors" title="Export ZIP">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button onClick={() => onDelete(skill.name)} className="p-1 rounded hover:bg-[#242736] transition-colors" title="Delete">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            {expanded && (
              <div className="px-3 pb-3 space-y-2">
                {skill.description && <p className="text-xs text-[#8b8fa3]">{skill.description}</p>}
                {skill.allowedTools.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skill.allowedTools.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#0f1117", color: "#00b894", border: "1px solid #2e3245" }}>{t}</span>
                    ))}
                  </div>
                )}
                <details className="text-xs" style={{ fontFamily: "monospace", color: "#e4e6f0", background: "#0f1117", borderRadius: 6, padding: 8 }}>
                  <summary className="cursor-pointer text-[#8b8fa3]">SKILL.md ({skill.content.length} chars)</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all max-h-48">{skill.content || "(empty)"}</pre>
                </details>
                {skill.allFiles.length > 1 && (
                  <div>
                    <p className="text-xs text-[#8b8fa3] mb-1">Related files:</p>
                    <div className="flex flex-wrap gap-1">
                      {skill.allFiles.slice(1).map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded" style={{ background: "#0f1117", color: "#8b8fa3" }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
