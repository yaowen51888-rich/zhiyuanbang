import type { components } from "@/types/api";

// SSR 在 Next 容器内执行：localhost 指向容器自身(无服务)，必须用内部服务名 backend；
// 浏览器侧仍用映射到宿主的 NEXT_PUBLIC_API_BASE_URL。
const BASE =
  typeof window === "undefined"
    ? process.env.API_BASE_URL_INTERNAL ?? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** 业务/请求错误，携带后端 code 便于 UI 区分提示（如「分数超范围」1001） */
export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

type Schemas = components["schemas"];
type ApiResponse<T> = { code: number; message: string; data: T | null };

/** 通用分页结构（与后端 Page[T] 一致） */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// 实体类型（来自 openapi 生成契约）
export type SchoolOut = Schemas["SchoolOut"];
export type SchoolDetailOut = Schemas["SchoolDetailOut"];
export type SchoolYearScore = Schemas["SchoolYearScore"];
export type MajorOut = Schemas["MajorOut"];
export type ScoreRankOut = Schemas["ScoreRankOut"];
export type RecommendItemOut = Schemas["RecommendItemOut"];
export type SubjectType = Schemas["SubjectType"];

/** 发起请求并解包统一响应 {code,message,data}；code !== 0 抛 ApiError */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(`请求失败：${res.status} ${res.statusText}`, res.status);
  }
  if (!res.ok || !body || body.code !== 0) {
    throw new ApiError(
      body?.message ?? `请求失败（${res.status}）`,
      body?.code ?? res.status,
    );
  }
  return body.data as T;
}

function qs(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ---- 类型化 API 调用 ----

export function listSchools(
  params: {
    keyword?: string;
    province?: string;
    is_985?: boolean;
    is_211?: boolean;
    type?: string;
    page?: number;
    page_size?: number;
  } = {},
): Promise<Page<SchoolOut>> {
  return request<Page<SchoolOut>>(`/schools${qs(params)}`);
}

export function getSchool(id: number): Promise<SchoolDetailOut> {
  return request<SchoolDetailOut>(`/schools/${id}`);
}

export function listMajors(
  params: { keyword?: string; category?: string; page?: number; page_size?: number } = {},
): Promise<Page<MajorOut>> {
  return request<Page<MajorOut>>(`/majors${qs(params)}`);
}

export function majorScores(id: number): Promise<SchoolYearScore[]> {
  return request<SchoolYearScore[]>(`/majors/${id}/scores`);
}

export function scoreRank(
  params: {
    province_id: number;
    year: number;
    subject_type: SubjectType;
    score: number;
  },
): Promise<ScoreRankOut> {
  return request<ScoreRankOut>(`/score-rank${qs(params)}`);
}

export function recommend(
  req: {
    province_id: number;
    subject_type: SubjectType;
    score: number;
    batch?: string;
  },
): Promise<RecommendItemOut[]> {
  return request<RecommendItemOut[]>(`/recommend`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function health(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}
