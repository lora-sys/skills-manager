"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Skill, PaginatedResponse, StatsResponse } from "./components/types";
import { StatPill } from "./components/SkillStats";
import { SkillCardGrid } from "./components/SkillCardGrid";
import { SkillList } from "./components/SkillList";
import { Pagination } from "./components/SkillPagination";
import { Toolbar } from "./components/SkillToolbar";
import { DetailModal } from "./components/SkillDetailModal";
import { EditModal } from "./components/EditModal";
import { ZipImportModal } from "./components/ZipImportModal";
import { SelectiveImportModal } from "./components/SelectiveImportModal";

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [paginated, setPaginated] = useState<PaginatedResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" }>>([]);
  const [modal, setModal] = useState<"none" | "create" | "edit">("none");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formData, setFormData] = useState({
    name: "", description: "", allowedToolsStr: "", content: "",
  });
  const [importMode, setImportMode] = useState<"none" | "selective" | "zip">("none");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [importConflict, setImportConflict] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [listExpanded, setListExpanded] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);

  const toast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const fetchData = useCallback(async (p: number, ps: number, src?: string, q?: string) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("pageSize", String(ps));
    if (src) params.set("source", src);
    if (q) params.set("search", q);
    try {
      const res = await fetch(`/api/skills?${params.toString()}`);
      const data: PaginatedResponse = await res.json();
      setSkills(data.skills);
      setPaginated(data);
    } catch {
      toast("Failed to load skills", "error");
    }
    try {
      const statsParams = new URLSearchParams();
      if (src) statsParams.set("source", src);
      const statsRes = await fetch(`/api/skills?action=stats&${statsParams.toString()}`);
      const statsData: StatsResponse = await statsRes.json();
      setStats(statsData);
    } catch {
      // ignore stats failure
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const timer = setTimeout(() => fetchData(1, pageSize, sourceFilter, search), 300);
    return () => clearTimeout(timer);
  }, [sourceFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(page, pageSize, sourceFilter, search), 300);
    return () => clearTimeout(timer);
  }, [page, pageSize, fetchData, sourceFilter]);

  const handlePageSizeChange = useCallback((s: number) => {
    setPageSize(s);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openCreate = () => {
    setFormData({ name: "", description: "", allowedToolsStr: "", content: "" });
    setModal("create");
  };
  const openEdit = (skill: Skill) => {
    setFormData({
      name: skill.name, description: skill.description,
      allowedToolsStr: skill.allowedTools.join(", "), content: skill.content,
    });
    setModal("edit");
  };

  const handleSave = async () => {
    const { name, description, allowedToolsStr, content } = formData;
    if (!name.trim()) { toast("Name is required", "error"); return; }
    const tools = allowedToolsStr.split(",").map((t) => t.trim()).filter(Boolean);
    const body = { name, description, allowedTools: tools, content };
    try {
      const method = modal === "create" ? "POST" : "PUT";
      const res = await fetch("/api/skills", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Save failed", "error"); return; }
      toast(modal === "create" ? `Created "${name}"` : `Updated "${name}"`, "success");
      setModal("none");
      fetchData(page, pageSize, sourceFilter, search);
    } catch { toast("Save failed", "error"); }
  };

  const handleDelete = async (name: string) => {
    setDeleting(name);
    try {
      const res = await fetch(`/api/skills?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); toast(err.error, "error"); return; }
      toast(`Deleted "${name}"`, "success");
      setDeleting(null);
      fetchData(page, pageSize, sourceFilter, search);
    } catch { toast("Delete failed", "error"); setDeleting(null); }
  };

  const handleExport = async (name: string) => {
    try {
      const res = await fetch(`/api/skills?action=export&name=${encodeURIComponent(name)}`);
      if (!res.ok) { toast("Export failed", "error"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${name}.zip`;
      a.click(); URL.revokeObjectURL(url);
      toast(`Exported "${name}"`, "success");
    } catch { toast("Export failed", "error"); }
  };

  const handleZipImport = async () => {
    if (!zipFile) { toast("Select a file first", "error"); return; }
    const fd = new FormData(); fd.append("file", zipFile);
    try {
      const res = await fetch("/api/skills?action=import-zip", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.conflict) { setImportConflict(data.error); return; }
        toast(data.error || "Import failed", "error"); return;
      }
      toast(`Imported "${data.name}"`, "success");
      setZipFile(null); setImportMode("none");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData(page, pageSize, sourceFilter, search);
    } catch { toast("Import failed", "error"); }
  };

  const toggleSelect = (name: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };
  const toggleAll = () => {
    if (selectAll) { setSelectedSkills(new Set()); setSelectAll(false); }
    else { setSelectedSkills(new Set(skills.map((s) => s.name))); setSelectAll(true); }
  };
  const handleSelectiveImport = async () => {
    const selected = skills.filter((s) => selectedSkills.has(s.name));
    if (!selected.length) { toast("No skills selected", "error"); return; }
    try {
      const res = await fetch("/api/skills?action=import-selective", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: selected }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error, "error"); return; }
      toast(`Imported ${data.imported.length}, skipped ${data.skipped.length}`, "success");
      setImportMode("none"); setSelectedSkills(new Set()); setSelectAll(false);
      fetchData(page, pageSize, sourceFilter, search);
    } catch { toast("Import failed", "error"); }
  };

  const handleBulkExport = async () => {
    const names = Array.from(selectedForExport);
    if (!names.length) { toast("No skills selected", "error"); return; }
    for (const name of names) { await handleExport(name); }
  };

  const toggleExpand = (name: string) => {
    setListExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toolCount = skills.reduce((s, sk) => s + sk.allowedTools.length, 0);

  return (
    <main className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* BG gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 0%, rgba(108,92,231,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(0,184,148,0.06) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {loading && paginated === null ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#8b8fa3]">Loading skills...</p>
              </div>
            </div>
          ) : (
            <>
              <Toolbar
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sourceFilter={sourceFilter}
                onSourceFilter={(s) => setSourceFilter(s)}
                onOpenCreate={openCreate}
                onOpenZipImport={() => setImportMode("zip")}
                onOpenSelectiveImport={() => { setImportMode("selective"); setSelectedSkills(new Set()); setSelectAll(false); }}
                selectedCount={selectedForExport.size}
                onBulkExport={handleBulkExport}
                sources={[]}
              />

              {/* Stats bar */}
              {stats && (
                <div className="flex gap-3 mb-4 flex-wrap items-center">
                  <StatPill count={stats.count} label="skills" />
                  <StatPill count={stats.totalFiles} label="files" />
                  <StatPill count={toolCount} label="tool bindings" />
                </div>
              )}

              {/* Search results hint */}
              {search && <p className="text-xs text-[#8b8fa3] mb-3 ml-1">Found {paginated?.total ?? 0} result{paginated?.total !== 1 ? "s" : ""}</p>}

              {/* ---- GRID VIEW ---- */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {skills.map((skill, i) => (
                    <SkillCardGrid key={skill.name} skill={skill} index={i}
                      onEdit={() => openEdit(skill)} onDelete={() => handleDelete(skill.name)}
                      onView={() => setDetailSkill(skill)} onExport={() => handleExport(skill.name)}
                      deleting={deleting === skill.name}
                      selected={selectedForExport.has(skill.name)}
                      onToggleSelect={() => {
                        setSelectedForExport((prev) => {
                          const next = new Set(prev);
                          if (next.has(skill.name)) next.delete(skill.name); else next.add(skill.name);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ---- LIST VIEW ---- */}
              {viewMode === "list" && (
                <SkillList
                  skills={skills}
                  listExpanded={listExpanded}
                  selectedForExport={selectedForExport}
                  deleting={deleting}
                  onToggleExpand={toggleExpand}
                  onToggleSelect={(name, checked) => {
                    setSelectedForExport((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(name); else next.delete(name);
                      return next;
                    });
                  }}
                  onSelectAll={() => {
                    if (selectAll) { setSelectedForExport(new Set()); setSelectAll(false); }
                    else { setSelectedForExport(new Set(skills.map((s) => s.name))); setSelectAll(true); }
                  }}
                  onEdit={openEdit}
                  onExport={handleExport}
                  onDelete={handleDelete}
                />
              )}

              {/* Empty state */}
              {skills.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-lg font-medium mb-1 text-[#8b8fa3]">{search ? "No matching skills found" : "No skills installed"}</p>
                  <p className="text-sm text-[#8b8fa3]">{search ? "Try a different search" : 'Click "+ New" or "Import ZIP" to add skills'}</p>
                </div>
              )}

              {/* Pagination */}
              {paginated && (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalPages={paginated.totalPages}
                  total={paginated.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {detailSkill && (
        <DetailModal
          skill={detailSkill}
          onClose={() => setDetailSkill(null)}
          onEdit={() => openEdit(detailSkill)}
          onExport={() => handleExport(detailSkill.name)}
          onDelete={() => handleDelete(detailSkill.name)}
        />
      )}

      {/* ===== EDIT MODAL ===== */}
      {modal !== "none" && (
        <EditModal
          modal={modal}
          name={formData.name}
          description={formData.description}
          allowedToolsStr={formData.allowedToolsStr}
          content={formData.content}
          onNameChange={(v) => setFormData({ ...formData, name: v })}
          onDescriptionChange={(v) => setFormData({ ...formData, description: v })}
          onAllowedToolsChange={(v) => setFormData({ ...formData, allowedToolsStr: v })}
          onContentChange={(v) => setFormData({ ...formData, content: v })}
          onSave={handleSave}
          onCancel={() => setModal("none")}
        />
      )}

      {/* ===== ZIP IMPORT MODAL ===== */}
      {importMode === "zip" && (
        <ZipImportModal
          zipFile={zipFile}
          importConflict={importConflict}
          onFileSelect={setZipFile}
          onImport={handleZipImport}
          onCancel={() => setImportMode("none")}
          fileInputRef={fileInputRef}
        />
      )}

      {/* ===== SELECTIVE IMPORT MODAL ===== */}
      {importMode === "selective" && (
        <SelectiveImportModal
          filtered={skills}
          skills={skills}
          selectedSkills={selectedSkills}
          selectAll={selectAll}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onImport={handleSelectiveImport}
          onCancel={() => setImportMode("none")}
        />
      )}

      {/* ===== TOASTS ===== */}
      {toasts.map((t) => (
        <div key={t.id} className="fixed bottom-4 right-4 z-200 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: "#1a1d27", border: "1px solid #2e3245", color: "#e4e6f0",
            borderLeft: `3px solid ${t.type === "success" ? "#00b894" : "#e74c3c"}`, animation: "slideDown 0.3s ease-out" }}>
          {t.type === "success" ? "✓ " : "✗ "}{t.message}
        </div>
      ))}
    </main>
  );
}
