export interface Skill {
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

export interface PaginatedResponse {
  skills: Skill[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatsResponse {
  count: number;
  totalFiles: number;
  totalSize: number;
}
