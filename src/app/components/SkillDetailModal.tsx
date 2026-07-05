import type { Skill } from "./types";

interface DetailModalProps {
  skill: Skill;
  onClose: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function DetailModal({ skill, onClose, onEdit, onExport, onDelete }: DetailModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 rounded-2xl p-6 w-[92vw] max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{ background: "#1a1d27", border: "1px solid #2e3245", animation: "modalIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{skill.name}</h2>
            <p className="text-xs text-[#8b8fa3] mt-0.5">{skill.sourceLabel} · {skill.allFiles.length} files · {skill.content.length.toLocaleString()} chars</p>
          </div>
          <button onClick={onClose} className="text-[#8b8fa3] hover:text-[#e4e6f0] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {skill.description && <p className="text-sm text-[#8b8fa3] mb-4 leading-relaxed">{skill.description}</p>}
        {skill.allowedTools.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-[#8b8fa3] mb-2 uppercase tracking-wide">Allowed Tools</p>
            <div className="flex flex-wrap gap-1.5">
              {skill.allowedTools.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#0f1117", color: "#00b894", border: "1px solid #2e3245" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {skill.allFiles.length > 1 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-[#8b8fa3] mb-2 uppercase tracking-wide">All Files</p>
            <div className="flex flex-wrap gap-1.5">
              {skill.allFiles.map((f) => (
                <span key={f} className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#0f1117", color: "#8b8fa3", border: "1px solid #2e3245" }}>{f}</span>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-[#8b8fa3] mb-2 uppercase tracking-wide">SKILL.md</p>
          <pre className="rounded-lg p-4 text-xs leading-relaxed overflow-auto whitespace-pre-wrap break-all"
            style={{ background: "#0f1117", color: "#e4e6f0", border: "1px solid #2e3245", maxHeight: "35vh", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
            {skill.content || "(empty)"}
          </pre>
        </div>
        <div className="flex gap-2 mt-5 pt-4 border-t border-[#2e3245]">
          <button onClick={() => { onEdit(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#6c5ce7" }}>Edit</button>
          <button onClick={() => { onExport(); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: "#242736", color: "#e4e6f0", border: "1px solid #2e3245" }}>Export ZIP</button>
          <button onClick={() => { onDelete(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: "transparent", color: "#e74c3c", border: "1px solid #e74c3c" }}>Delete</button>
        </div>
      </div>
    </>
  );
}
