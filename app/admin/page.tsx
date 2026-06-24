"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import type { Me } from "@/lib/types";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminParticipants } from "@/components/admin-participants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * 관리자 페이지. middleware 가 로그인 여부는 보호하고,
 * 여기서는 GET /api/auth/me 로 관리자 여부를 확인해 비관리자는 메인으로 리디렉션한다.
 * (서버 측 권한은 require_admin 으로 이중 강제됨)
 */
export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        const me: Me | null = res.ok ? await res.json() : null;
        if (!active) return;
        if (me?.is_admin) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          toast.error("관리자만 접근할 수 있습니다.");
          router.replace("/");
        }
      } catch {
        if (!active) return;
        setAuthorized(false);
        router.replace("/");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (authorized !== true) {
    return (
      <div className="text-muted-foreground py-24 text-center">
        접근 권한을 확인하는 중...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">관리자</h1>
      <Tabs defaultValue="manage">
        <TabsList className="mb-6">
          <TabsTrigger value="manage">집들이 관리</TabsTrigger>
          <TabsTrigger value="participants">참여 현황</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <AdminDashboard />
        </TabsContent>
        <TabsContent value="participants">
          <AdminParticipants />
        </TabsContent>
      </Tabs>
    </main>
  );
}
