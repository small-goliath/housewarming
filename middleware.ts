import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * 인증 보호 라우팅 (Next.js 15 정식 middleware API).
 * 세션 갱신 + 보호 경로 검사를 updateSession 에 위임한다.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 자산·이미지 최적화·favicon 을 제외한 모든 경로에서 실행.
     * (세션 쿠키 갱신을 위해 광범위하게 매칭하되 보호 검사는 경로별로 분기)
     */
    "/((?!_next/static|_next/image|favicon.ico|banner.mp4|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
