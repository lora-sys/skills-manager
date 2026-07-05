import type { Skill } from "./types";

interface SkillCardGridProps {
  skill: Skill;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onExport: () => void;
  deleting: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}

export function SkillCardGrid({
  skill, index, onEdit, onDelete, onView, onExport, deleting, selected, onToggleSelect,
}: SkillCardGridProps) {
  return (
    <div className="group rounded-xl p-4.5 transition-all cursor-pointer hover:-translate-y-0.5"
      style={{ background: "#1a1d27", border: selected ? "2px solid #6c5ce7" : "1px solid #2e3245",
        animation: `fadeIn 0.3s ease-out ${index * 20}ms both` }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#6c5ce7";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(108,92,231,0.15)"; }}
      onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "#2e3245"; }
        e.currentTarget.style.boxShadow = "none"; }}
      onClick={onView}>
      {/* Source badge */}
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" checked={selected} onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
          onClick={(e) => e.stopPropagation()} className="accent-[#6c5ce7] mt-0.5" />
        <h3 className="text-sm font-semibold truncate flex-1 group-hover:text-[#6c5ce7] transition-colors">{skill.name}</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#0f1117", color: "#8b8fa3", border: "1px solid #2e3245" }}>
          {skill.source}
        </span>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded hover:bg-[#242736]" title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onExport(); }} className="p-1 rounded hover:bg-[#242736]" title="Export ZIP">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-[#242736]" title="Delete" disabled={deleting}>
            {deleting ? (
              <div className="w-3.5 h-3.5 border-2 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            )}
          </button>
        </div>
      </div>
      {skill.description && <p className="text-xs text-[#8b8fa3] mb-2 leading-relaxed line-clamp-2">{skill.description}</p>}
      {skill.allowedTools.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {skill.allowedTools.slice(0, 3).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#0f1117", color: "#00b894", border: "1px solid #2e3245" }}>{t}</span>
          ))}
          {skill.allowedTools.length > 3 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#0f1117", color: "#8b8fa3", border: "1px solid #2e3245" }}>+{skill.allowedTools.length - 3}</span>}
        </div>
      )}
      <div className="text-[10px] text-[#8b8fa3] pt-2 border-t border-[#2e3245] flex items-center gap-2">
        <span>{skill.allFiles.length} files</span>
        <span>·</span>
        <span>{skill.content.length.toLocaleString()} chars</span>
      </div>
    </div>
  );
}
