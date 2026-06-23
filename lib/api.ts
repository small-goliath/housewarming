import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * FastAPI 호출 래퍼 (Issue H4 / F015).
 * - 현재 세션의 access_token 을 Authorization 헤더에 실어 호출
 * - 401 수신 시 refreshSession 후 1회 재시도
 * - 갱신 실패(세션 만료) 시 /login 으로 이동
 *
 * 클라이언트 컴포넌트에서만 사용한다 (브라우저 Supabase 클라이언트 의존).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  let {
    data: { session },
  } = await supabase.auth.getSession();

  const call = (token?: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await call(session?.access_token);

  if (res.status === 401) {
    // 토큰 만료 추정 → 갱신 후 1회 재시도
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
    if (!session) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }
    res = await call(session.access_token);
  }

  return res;
}

/** 응답을 JSON 으로 파싱하고 비정상 상태코드는 에러로 던지는 헬퍼. */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    let detail = `요청 실패 (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // JSON 파싱 실패 무시
    }
    const error = new Error(detail) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
