"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { apiFetch, apiJson } from "@/lib/api";
import { formatMonthKST } from "@/lib/datetime";
import type { Housewarming, MyParticipation, Participant } from "@/lib/types";
import {
  HousewarmingDetailView,
  type ParticipationStatus,
} from "@/components/housewarming-detail-view";

/**
 * 상세 페이지 컨테이너 (로직 담당).
 * - 상세/참여자/내 참여 데이터 로드
 * - 참여 상태머신 (none/current/other) 및 POST/DELETE/PUT 핸들러
 *   · POST 409 → "이미 참여 중" 안내
 *   · PUT 404 → POST 로 fallback
 */
export function HousewarmingDetail({ id }: { id: string }) {
  const [housewarming, setHousewarming] = useState<Housewarming | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myHousewarmingId, setMyHousewarmingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [detail, parts, mine] = await Promise.all([
        apiJson<Housewarming>(`/api/housewarmings/${id}`),
        apiJson<Participant[]>(`/api/housewarmings/${id}/participants`),
        apiJson<MyParticipation>(`/api/housewarmings/me/participation`),
      ]);
      setHousewarming(detail);
      setParticipants(parts);
      setMyHousewarmingId(mine.housewarming_id);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) {
        setNotFound(true);
      } else {
        toast.error("정보를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const status: ParticipationStatus =
    myHousewarmingId === null
      ? "none"
      : myHousewarmingId === id
        ? "current"
        : "other";

  const refreshParticipation = useCallback(async () => {
    const [parts, mine] = await Promise.all([
      apiJson<Participant[]>(`/api/housewarmings/${id}/participants`),
      apiJson<MyParticipation>(`/api/housewarmings/me/participation`),
    ]);
    setParticipants(parts);
    setMyHousewarmingId(mine.housewarming_id);
  }, [id]);

  const onParticipate = useCallback(async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/housewarmings/${id}/participate`, {
        method: "POST",
      });
      if (res.status === 409) {
        toast.error("이미 다른 집들이에 참여 중입니다.");
        await refreshParticipation();
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("참여 신청이 완료되었어요!");
      await refreshParticipation();
    } catch {
      toast.error("참여 신청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [id, refreshParticipation]);

  const onCancel = useCallback(async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/housewarmings/${id}/participate`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 404) throw new Error();
      toast.success("참여를 취소했어요.");
      await refreshParticipation();
    } catch {
      toast.error("취소에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [id, refreshParticipation]);

  const onChange = useCallback(async () => {
    setBusy(true);
    try {
      let res = await apiFetch(`/api/housewarmings/${id}/participate`, {
        method: "PUT",
      });
      // PUT 404 (미참여 상태) → POST 로 fallback
      if (res.status === 404) {
        res = await apiFetch(`/api/housewarmings/${id}/participate`, {
          method: "POST",
        });
      }
      if (!res.ok) throw new Error();
      toast.success("이 집들이로 변경했어요!");
      await refreshParticipation();
    } catch {
      toast.error("변경에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [id, refreshParticipation]);

  if (loading) {
    return (
      <div className="text-muted-foreground py-24 text-center">불러오는 중...</div>
    );
  }

  if (notFound || !housewarming) {
    return (
      <div className="text-muted-foreground py-24 text-center">
        집들이를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <HousewarmingDetailView
      housewarming={housewarming}
      eventLabel={formatMonthKST(housewarming.event_at)}
      participants={participants}
      status={status}
      busy={busy}
      onParticipate={onParticipate}
      onCancel={onCancel}
      onChange={onChange}
    />
  );
}
