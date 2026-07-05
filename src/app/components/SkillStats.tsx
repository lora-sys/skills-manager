interface Skill {
  name: string;
  description: string;
  allowedTools: string[];
  file: string;
  content: string;
  size: number;
  allFiles: string[];
  source: string;
  sourceLabel: string;
}

interface PaginatedResponse {
  skills: Skill[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface StatPillProps {
  count: number;
  label: string;
}

export function StatPill({ count, label }: StatPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
      style={{ background: "#1a1d27", border: "1px solid #2e3245", color: "#8b8fa3" }}>
      <strong className="text-sm" style={{ color: "#e4e6f0" }}>{count}</strong>{label}
    </span>
  );
}
