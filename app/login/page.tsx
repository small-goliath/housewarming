"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "로그인 코드가 전달되지 않았습니다. 다시 시도해 주세요.",
  exchange_failed: "로그인 처리에 실패했습니다. 다시 시도해 주세요.",
  profile_unidentified:
    "카카오 계정 정보를 확인할 수 없습니다. 닉네임·프로필 동의 후 다시 시도해 주세요.",
};

function LoginCard() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const errorKey = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  async function handleKakaoLogin() {
    setLoading(true);
    const supabase = createClient();
    const next = encodeURIComponent(redirectTo);
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        // 이메일 동의 미사용 — 닉네임·프로필 이미지만 요청 (KOE205 회피)
        scopes: "profile_nickname profile_image",
      },
    });
    // signInWithOAuth 는 외부로 리디렉션하므로 이후 코드는 실행되지 않음.
  }

  return (
    /* 로그인 카드 — 따뜻한 아이보리 배경 위의 우아한 카드 */
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border/60 bg-card shadow-lg shadow-foreground/[0.05] overflow-hidden">

        {/* 카드 상단 장식 배너 */}
        <div className="bg-primary/8 px-8 pt-10 pb-8 text-center border-b border-border/40">
          {/* 아이콘 장식 */}
          <div className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary/15">
            <svg
              className="size-7 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground mb-1.5">
            도토리의 집들이
          </h1>
          <p className="text-sm text-muted-foreground">
            카카오 계정으로 로그인하고 집들이에 참여하세요.
          </p>
        </div>

        {/* 카드 바디 */}
        <div className="px-8 py-8 flex flex-col gap-4">
          {/* 에러 메시지 */}
          {errorKey && (
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
              <p className="text-destructive text-sm text-center leading-relaxed">
                {ERROR_MESSAGES[errorKey] ?? "로그인 중 오류가 발생했습니다."}
              </p>
            </div>
          )}

          {/* 카카오 로그인 버튼 */}
          <Button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold bg-[#FEE500] text-[#191600] hover:bg-[#FADA0A] shadow-sm transition-all"
          >
            {loading ? "이동 중..." : "카카오로 로그인"}
          </Button>

          {/* 안내 문구 */}
          <p className="text-center text-xs text-muted-foreground/70 leading-relaxed">
            로그인하면 집들이 참여 신청과<br />방명록 작성이 가능해요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
