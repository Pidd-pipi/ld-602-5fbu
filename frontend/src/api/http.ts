/**
 * 统一请求封装：只请求相对路径 /api（禁止硬编码 localhost）。
 * 后端不可用时抛出异常，由各实体 API 回退本地持久数据。
 */
export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      // 非 JSON 错误体直接忽略
    }
    throw new ApiUnavailableError(`请求失败 ${res.status} ${detail}`);
  }
  return (await res.json()) as T;
}

/** 后端在线探测：成功返回 true，离线/非数组响应返回 false（超时 1.2s，避免拖慢页面） */
export async function isBackendAlive(path: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(path, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
