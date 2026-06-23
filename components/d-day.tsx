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
      ? `집들이까지 ${days}일 남았어요 🗓️`
      : days === 0
        ? "오늘이 바로 그 날! 🎉"
        : `집들이가 ${Math.abs(days)}일 지났어요 🥲`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium tracking-widest text-white/70 uppercase">
        2027 · 10 · 31
      </p>
      <p
        className="text-6xl font-black tracking-tight text-white drop-shadow-lg sm:text-7xl md:text-8xl"
        aria-label={`디데이 ${label}`}
      >
        {label}
      </p>
      <p className="text-sm text-white/80 drop-shadow sm:text-base">
        {sublabel}
      </p>
    </div>
  );
}
