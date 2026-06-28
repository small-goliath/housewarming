// 집들이를 외부 캘린더에 추가하기 위한 URL/.ics 생성 유틸.
// 집들이는 월 단위 데이터이므로 해당 월 1일의 "종일(all-day)" 일정으로 만든다.

import type { Housewarming } from "@/lib/types";

/** event_at(ISO UTC)을 KST 기준 "YYYYMMDD" 문자열로 변환. */
function kstYmd(iso: string): string {
  const s = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    new Date(iso),
  ); // "YYYY-MM-DD"
  return s.split("-").join("");
}

/** 종일 일정 종료일(다음 날, 배타적) "YYYYMMDD". */
function nextDayYmd(ymd: string): string {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function buildTitle(hw: Housewarming): string {
  return `${hw.name} 집들이`;
}

function buildDescription(hw: Housewarming): string {
  const parts: string[] = [];
  if (hw.organization) parts.push(`편성: ${hw.organization}`);
  if (hw.dress_code) parts.push(`드레스코드: ${hw.dress_code}`);
  if (hw.note) parts.push(`비고: ${hw.note}`);
  if (hw.kakao_open_chat_url) parts.push(`오픈채팅: ${hw.kakao_open_chat_url}`);
  return parts.join("\n");
}

/** 구글 캘린더 일정 추가 URL (종일). */
export function googleCalendarUrl(hw: Housewarming): string {
  const start = kstYmd(hw.event_at);
  const end = nextDayYmd(start);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: buildTitle(hw),
    dates: `${start}/${end}`,
    details: buildDescription(hw),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** .ics 텍스트(RFC 5545). 종료일 배타적 종일 일정. */
function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(hw: Housewarming): string {
  const start = kstYmd(hw.event_at);
  const end = nextDayYmd(start);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tori-house//housewarming//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${hw.id}@tori-house`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(buildTitle(hw))}`,
    `DESCRIPTION:${escapeIcs(buildDescription(hw))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** .ics 파일 다운로드 (Apple 캘린더·카카오 톡캘린더 등 .ics 가져오기용). */
export function downloadIcs(hw: Housewarming): void {
  const blob = new Blob([buildIcs(hw)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${hw.name}_집들이.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
