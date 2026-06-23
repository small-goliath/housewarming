import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth 콜백 (F001, F010).
 * 1. Supabase 코드 교환 → Access Token(JWT) 발급 + 세션 쿠키 설정
 * 2. FastAPI POST /api/auth/profile 호출 → kakao_id 추출 + profiles upsert
 * 3. 저장된 복귀 경로(next) 또는 메인으로 리디렉션
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // profiles upsert — 실패해도 로그인 자체는 성공 처리하되, 식별 불가(422)면 로그인 차단.
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (res.status === 422) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=profile_unidentified`);
    }
  } catch {
    // 네트워크 오류 등은 로그인 흐름을 막지 않는다 (프로필은 재로그인 시 재시도 가능).
  }

  // 오픈 리디렉션 방지: 내부 경로만 허용
  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
