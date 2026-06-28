"use client";

import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import type { Housewarming } from "@/lib/types";
import { Button } from "@/components/ui/button";

/**
 * 집들이를 외부 캘린더에 추가.
 * - 구글: 일정 추가 페이지를 새 탭으로 연다.
 * - 애플 / 카카오: 표준 .ics 파일을 내려받는다.
 *   (Apple 캘린더는 자동 열림, 카카오 톡캘린더는 .ics 가져오기로 등록)
 */
export function AddToCalendar({ housewarming }: { housewarming: Housewarming }) {
  function handleGoogle() {
    window.open(googleCalendarUrl(housewarming), "_blank", "noopener,noreferrer");
  }

  function handleIcs() {
    downloadIcs(housewarming);
    toast.success("일정 파일(.ics)을 내려받았어요. 캘린더 앱에서 열어 추가하세요.");
  }

  return (
    /* 캘린더 추가 섹션 — 부드러운 배경으로 구분 */
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <CalendarPlus className="size-4 text-primary/80" aria-hidden="true" />
        캘린더에 추가
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoogle}
          className="rounded-lg text-xs font-medium border-border/70 hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          구글
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIcs}
          className="rounded-lg text-xs font-medium border-border/70 hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          애플
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIcs}
          className="rounded-lg text-xs font-medium border-border/70 hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          카카오
        </Button>
      </div>
    </div>
  );
}
