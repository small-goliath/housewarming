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
    <div className="rounded-xl border p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <CalendarPlus className="size-4" aria-hidden="true" />
        캘린더에 추가
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={handleGoogle}>
          구글
        </Button>
        <Button variant="outline" size="sm" onClick={handleIcs}>
          애플
        </Button>
        <Button variant="outline" size="sm" onClick={handleIcs}>
          카카오
        </Button>
      </div>
    </div>
  );
}
