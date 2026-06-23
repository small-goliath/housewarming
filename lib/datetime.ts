// UTC 저장값을 KST(Asia/Seoul)로 변환해 표시하는 유틸 (Issue M5).

const KST = "Asia/Seoul";
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function toParts(iso: string) {
  const date = new Date(iso);
  // Asia/Seoul 기준 각 필드 추출
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date,
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"),
  };
}

/** 요일을 KST 기준으로 계산. */
function weekdayKo(date: Date): string {
  const idx = new Intl.DateTimeFormat("en-US", {
    timeZone: KST,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return WEEKDAYS_KO[map[idx] ?? 0];
}

/** 상세용: `YYYY.MM.DD (요일) HH:mm KST` (PRD 집들이 상세 페이지). */
export function formatEventKST(iso: string): string {
  const { date, year, month, day, hour, minute } = toParts(iso);
  return `${year}.${month}.${day} (${weekdayKo(date)}) ${hour}:${minute} KST`;
}

/** 목록용: `YYYY.MM.DD (요일) HH:mm` (KST). */
export function formatEventShortKST(iso: string): string {
  const { date, year, month, day, hour, minute } = toParts(iso);
  return `${year}.${month}.${day} (${weekdayKo(date)}) ${hour}:${minute}`;
}

/** 방명록용: `YYYY.MM.DD HH:mm` (KST). */
export function formatDateTimeKST(iso: string): string {
  const { year, month, day, hour, minute } = toParts(iso);
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

/**
 * 관리자 폼 datetime-local 입력값(KST 기준 naive, "YYYY-MM-DDTHH:mm")을
 * UTC ISO 문자열로 변환. KST = UTC+9 (DST 없음).
 */
export function kstInputToUtcIso(localStr: string): string {
  // 입력을 KST(+09:00)로 해석해 UTC ISO 로 변환
  return new Date(`${localStr}:00+09:00`).toISOString();
}

/** 저장된 UTC ISO 를 datetime-local 입력값(KST, "YYYY-MM-DDTHH:mm")으로 변환. */
export function utcIsoToKstInput(iso: string): string {
  const { year, month, day, hour, minute } = toParts(iso);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
