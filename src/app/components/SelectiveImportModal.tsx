import type { Skill } from "./types";

interface SelectiveImportModalProps {
  filtered: Skill[];
  skills: Skill[];
  selectedSkills: Set<string>;
  selectAll: boolean;
  onToggleSelect: (name: string) => void;
  onToggleAll: () => void;
  onImport: () => void;
  onCancel: () => void;
}

export function SelectiveImportModal({
  filtered, skills, selectedSkills, selectAll,
  onToggleSelect, onToggleAll, onImport, onCancel,
}: SelectiveImportModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 rounded-2xl p-6 w-[92vw] max-w-2xl max-h-[80vh] shadow-2xl overflow-y-auto"
        style={{ background: "#1a1d27", border: "1px solid #2e3245", animation: "modalIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Bulk Import</h2>
            <p className="text-xs text-[#8b8fa3] mt-0.5">Select skills to import (only those not already installed)</p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={onToggleAll} className="text-xs text-[#6c5ce7] hover:underline">
              {selectAll ? "Deselect All" : "Select All"} ({selectedSkills.size}/{filtered.length})
            </button>
            <button onClick={onCancel} className="text-[#8b8fa3] hover:text-[#e4e6f0]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {filtered.map((skill) => {
            const installed = skills.find((s) => s.name === skill.name);
            return (
              <label key={skill.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedSkills.has(skill.name) ? "bg-[#6c5ce7]/10" : "hover:bg-[#242736]"}`}
                style={{ opacity: installed ? 0.5 : 1 }}>
                <input type="checkbox" checked={selectedSkills.has(skill.name)}
                  onChange={() => onToggleSelect(skill.name)}
                  className="accent-[#6c5ce7]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{skill.name}</p>
                  <p className="text-xs text-[#8b8fa3] truncate">{skill.description || "No description"}</p>
                </div>
                {installed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#0f1117", color: "#e74c3c", border: "1px solid #2e3245" }}>installed</span>
                )}
              </label>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#2e3245]">
          <button onClick={onImport} disabled={selectedSkills.size === 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "#6c5ce7" }}>Import Selected ({selectedSkills.size})</button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "#242736", color: "#8b8fa3", border: "1px solid #2e3245" }}>Cancel</button>
        </div>
      </div>
    </>
  );
}
