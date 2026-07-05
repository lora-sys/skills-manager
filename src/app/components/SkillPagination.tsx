interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ page, pageSize, totalPages, total, onPageChange, onPageSizeChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <div className="flex items-center gap-2">
        <label className="text-xs text-[#8b8fa3]">Per page:</label>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="text-xs px-2 py-1 rounded"
          style={{ background: "#1a1d27", color: "#e4e6f0", border: "1px solid #2e3245" }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-30"
          style={{ background: "#1a1d27", color: "#e4e6f0", border: "1px solid #2e3245" }}>
          Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-[#8b8fa3]">...</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p as number)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${p === page ? "" : "hover:opacity-80"}`}
              style={{
                background: p === page ? "#6c5ce7" : "#1a1d27",
                color: p === page ? "#fff" : "#e4e6f0",
                border: p === page ? "1px solid #6c5ce7" : "1px solid #2e3245",
              }}>
              {p}
            </button>
          ),
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-30"
          style={{ background: "#1a1d27", color: "#e4e6f0", border: "1px solid #2e3245" }}>
          Next
        </button>
      </div>
      <span className="text-xs text-[#8b8fa3]">
        {total} total
      </span>
    </div>
  );
}
