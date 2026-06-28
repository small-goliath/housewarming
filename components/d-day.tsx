"use client";

// 집들이 D-Day 카운터 — 기준일: 2027년 10월 31일 (KST)
const TARGET_DATE = "2027-10-31";

function calcDDay(): { label: string; days: number } {
  // 브라우저 현재 시각을 KST 날짜 문자열로 변환
  const todayStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date()); // "YYYY-MM-DD"

  const todayMs = new Date(`${todayStr}T00:00:00`).getTime();
  const targetMs = new Date(`${TARGET_DATE}T00:00:00`).getTime();
  const days = Math.round((targetMs - todayMs) / 86_400_000);

  if (days > 0) return { label: `D-${days}`, days };
  if (days === 0) return { label: "D-Day", days };
  return { label: `D+${Math.abs(days)}`, days };
}

export function DDay() {
  const { label, days } = calcDDay();

  const sublabel =
    days > 0
      ? `집들이까지 ${days}일 남았어요`
      : days === 0
        ? "오늘이 바로 그 날!"
        : `집들이가 ${Math.abs(days)}일 지났어요`;

  return (
    /* D-Day 컨테이너 — 글래스모피즘 느낌의 반투명 패널 */
    <div className="flex flex-col items-center gap-3">
      {/* 날짜 레이블 — 트래킹 넓게 */}
      <p className="text-xs font-medium tracking-[0.25em] text-white/55 uppercase">
        2027 · 10 · 31
      </p>

      {/* D-Day 숫자 — 세리프 폰트로 우아하게 */}
      <p
        className="font-heading text-7xl font-bold tracking-tight text-white drop-shadow-lg sm:text-8xl md:text-9xl"
        aria-label={`디데이 ${label}`}
      >
        {label}
      </p>

      {/* 서브레이블 — 반투명 캡슐 배경 */}
      <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm sm:text-sm">
        {sublabel}
      </span>
    </div>
  );
}
