"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { toast } from "sonner";

import { apiJson } from "@/lib/api";
import { formatMonthKST } from "@/lib/datetime";
import type { DashboardItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function AdminParticipants() {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<DashboardItem[]>("/api/admin/housewarmings/stats");
      setItems(data);
    } catch {
      toast.error("참여 현황을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-muted-foreground py-20 text-center">불러오는 중...</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-20 text-center">
        등록된 집들이가 없습니다.
      </p>
    );
  }

  const totalParticipants = items.reduce((sum, i) => sum + i.participant_count, 0);

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4" />
        전체 참여 인원{" "}
        <span className="font-semibold text-foreground">{totalParticipants}명</span>
        <span className="text-muted-foreground/60">· 집들이 {items.length}개</span>
      </div>

      {/* 집들이별 카드 */}
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {formatMonthKST(item.event_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {item.participant_count}명
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {item.participants.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                아직 참여자가 없어요
              </p>
            ) : (
              <ul className="flex flex-wrap gap-x-4 gap-y-3">
                {item.participants.map((p, idx) => {
                  const name = p.nickname ?? "?";
                  return (
                    <li key={idx} className="flex items-center gap-2">
                      <Avatar className="size-8">
                        {p.profile_image_url && (
                          <AvatarImage src={p.profile_image_url} alt={name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
