"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { Me } from "@/lib/types";
import { SiteHeader, type SiteHeaderUser } from "@/components/site-header";

/**
 * 헤더 컨테이너 (로직 담당).
 * - Supabase 세션 구독 → 로그인 여부 판별
 * - 로그인 시 GET /api/auth/me 로 닉네임/프로필/관리자 여부 조회
 * - 로그아웃 핸들러 제공
 * 프레젠테이션은 SiteHeader 에 위임한다.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SiteHeaderUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const me: Me = await res.json();
      setUser({
        nickname: me.nickname,
        profileImageUrl: me.profile_image_url,
        isAdmin: me.is_admin,
      });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange 는 구독 직후 INITIAL_SESSION 이벤트로 현재 세션을 한 번 전달하므로
    // 별도 getSession() 초기 호출은 두지 않는다(중복/락 경합 방지).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // 중요: 콜백 내부에서 supabase 함수(getSession/refreshSession)를 직접 호출하면
      // 내부 락 데드락이 발생한다. setTimeout 으로 콜백 컨텍스트 밖으로 분리한다.
      setTimeout(async () => {
        if (session) {
          await loadMe();
        } else {
          setUser(null);
        }
        setLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [loadMe]);

  const onLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <SiteHeader
      user={user}
      pathname={pathname}
      onLogout={onLogout}
      loading={loading}
    />
  );
}
