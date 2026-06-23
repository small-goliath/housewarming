"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          카카오 계정으로 로그인하고 집들이에 참여하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {errorKey && (
          <p className="text-destructive text-sm text-center">
            {ERROR_MESSAGES[errorKey] ?? "로그인 중 오류가 발생했습니다."}
          </p>
        )}
        <Button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full bg-[#FEE500] text-[#191600] hover:bg-[#FADA0A]"
        >
          {loading ? "이동 중..." : "카카오로 로그인"}
        </Button>
      </CardContent>
    </Card>
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
