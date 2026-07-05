interface ZipImportModalProps {
  zipFile: File | null;
  importConflict: string | null;
  onFileSelect: (file: File | null) => void;
  onImport: () => void;
  onCancel: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ZipImportModal({
  zipFile, importConflict, onFileSelect, onImport, onCancel, fileInputRef,
}: ZipImportModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 rounded-2xl p-6 w-[92vw] max-w-md shadow-2xl"
        style={{ background: "#1a1d27", border: "1px solid #2e3245", animation: "modalIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Import from ZIP</h2>
          <button onClick={onCancel} className="text-[#8b8fa3] hover:text-[#e4e6f0]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-[#6c5ce7]"
            style={{ borderColor: zipFile ? "#6c5ce7" : "#2e3245" }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}>
            <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b8fa3" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm text-[#8b8fa3]">{zipFile ? zipFile.name : "Drop ZIP file here or click to browse"}</p>
            {zipFile && <p className="text-xs text-[#8b8fa3] mt-1">{(zipFile.size / 1024).toFixed(1)} KB</p>}
          </div>
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
          {importConflict && <p className="text-sm text-[#e74c3c] bg-[#e74c3c]/10 p-3 rounded-lg">{importConflict}</p>}
          <div className="flex gap-2">
            <button onClick={onImport} disabled={!zipFile}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "#6c5ce7" }}>Import</button>
            <button onClick={() => { onCancel(); onFileSelect(null); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ background: "#242736", color: "#8b8fa3", border: "1px solid #2e3245" }}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}
