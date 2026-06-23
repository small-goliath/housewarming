import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인 필수 경로 (prefix 매칭). PRD '페이지 라우팅' 기준. */
const PROTECTED_PREFIXES = ["/guestbook", "/admin"];

/** /housewarmings/[id] (상세) 는 보호, /housewarmings (목록) 는 공개. */
function isProtected(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // /housewarmings/{id} 상세만 보호 (목록 /housewarmings 는 공개)
  if (/^\/housewarmings\/[^/]+/.test(pathname)) {
    return true;
  }
  return false;
}

/**
 * 세션 쿠키를 갱신하고 보호 경로 접근을 검사한다.
 * 비로그인 사용자가 보호 경로 접근 시 /login?redirectTo= 로 리디렉션한다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() 로 토큰 유효성까지 확인 (getSession 은 쿠키만 신뢰하므로 미사용)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
