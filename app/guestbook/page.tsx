"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { apiFetch, apiJson } from "@/lib/api";
import { formatDateTimeKST } from "@/lib/datetime";
import type {
  GuestbookEntry,
  GuestbookListResponse,
  LikeResponse,
} from "@/lib/types";
import {
  GuestbookView,
  type GuestbookViewEntry,
} from "@/components/guestbook-view";

// 로그인 필수 (middleware 보호).
export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookViewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toViewEntry = (e: GuestbookEntry): GuestbookViewEntry => ({
    id: e.id,
    content: e.content,
    dateLabel: formatDateTimeKST(e.created_at),
    likeCount: e.like_count,
    liked: e.liked,
  });

  const loadEntries = useCallback(async () => {
    try {
      const data = await apiJson<GuestbookListResponse>("/api/guestbook");
      setEntries(data.entries.map(toViewEntry));
    } catch {
      toast.error("방명록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const onSubmit = useCallback(async (content: string) => {
    setSubmitting(true);
    try {
      const created = await apiJson<GuestbookEntry>("/api/guestbook", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      // 최신글 상단 — 새 항목을 앞에 추가
      setEntries((prev) => [toViewEntry(created), ...prev]);
      toast.success("메시지를 남겼어요!");
    } catch (err) {
      toast.error("작성에 실패했습니다. 다시 시도해 주세요.");
      throw err; // 뷰가 입력값을 유지하도록 재던짐
    } finally {
      setSubmitting(false);
    }
  }, []);

  const onToggleLike = useCallback(
    async (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;
      const nextLiked = !target.liked;

      // 낙관적 업데이트
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                liked: nextLiked,
                likeCount: e.likeCount + (nextLiked ? 1 : -1),
              }
            : e,
        ),
      );

      try {
        const res = await apiFetch(`/api/guestbook/${id}/like`, {
          method: nextLiked ? "POST" : "DELETE",
        });
        if (!res.ok) throw new Error();
        const data: LikeResponse = await res.json();
        // 서버 실제 값으로 동기화
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, liked: data.liked, likeCount: data.like_count }
              : e,
          ),
        );
      } catch {
        // 실패 시 롤백
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  liked: target.liked,
                  likeCount: target.likeCount,
                }
              : e,
          ),
        );
        toast.error("좋아요 처리에 실패했습니다.");
      }
    },
    [entries],
  );

  return (
    <GuestbookView
      entries={entries}
      loading={loading}
      submitting={submitting}
      onSubmit={onSubmit}
      onToggleLike={onToggleLike}
    />
  );
}
