interface EditModalProps {
  modal: "create" | "edit";
  name: string;
  description: string;
  allowedToolsStr: string;
  content: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onAllowedToolsChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditModal({
  modal, name, description, allowedToolsStr, content,
  onNameChange, onDescriptionChange, onAllowedToolsChange, onContentChange,
  onSave, onCancel,
}: EditModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 rounded-2xl p-6 w-[92vw] max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{ background: "#1a1d27", border: "1px solid #2e3245", animation: "modalIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{modal === "create" ? "Create New Skill" : "Edit Skill"}</h2>
          <button onClick={onCancel} className="text-[#8b8fa3] hover:text-[#e4e6f0]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8b8fa3] mb-1">Name <span className="text-[#e74c3c]">*</span></label>
            <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
              placeholder="my-skill" className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ background: "#0f1117", color: "#e4e6f0", border: "1px solid #2e3245" }}
              disabled={modal === "edit"} autoFocus
              onFocus={(e) => { e.target.style.borderColor = "#6c5ce7"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2e3245"; }} />
            {modal === "edit" && <p className="text-[10px] text-[#8b8fa3] mt-1">Name cannot be changed</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b8fa3] mb-1">Description</label>
            <textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="What does this skill do?" className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-none"
              style={{ background: "#0f1117", color: "#e4e6f0", border: "1px solid #2e3245" }} rows={2}
              onFocus={(e) => { e.target.style.borderColor = "#6c5ce7"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2e3245"; }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b8fa3] mb-1">Allowed Tools <span className="text-[#8b8fa3]">(comma sep.)</span></label>
            <input type="text" value={allowedToolsStr} onChange={(e) => onAllowedToolsChange(e.target.value)}
              placeholder="Bash(npx:*), Read, Edit" className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ background: "#0f1117", color: "#e4e6f0", border: "1px solid #2e3245" }}
              onFocus={(e) => { e.target.style.borderColor = "#6c5ce7"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2e3245"; }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b8fa3] mb-1">Content</label>
            <textarea value={content} onChange={(e) => onContentChange(e.target.value)}
              placeholder="# Skill prompt..." className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-monospace font-mono"
              style={{ background: "#0f1117", color: "#e4e6f0", border: "1px solid #2e3245", fontFamily: "'SF Mono', 'Fira Code', monospace", lineHeight: "1.6" }}
              rows={8}
              onFocus={(e) => { e.target.style.borderColor = "#6c5ce7"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2e3245"; }} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onSave}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#6c5ce7" }}>{modal === "create" ? "Create" : "Save"}</button>
            <button onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ background: "#242736", color: "#8b8fa3", border: "1px solid #2e3245" }}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}
