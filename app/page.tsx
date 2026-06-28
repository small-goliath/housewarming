import { BookHeart, Home, UtensilsCrossed } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { DDay } from "@/components/d-day"
import { cn } from "@/lib/utils"

/* 집들이 소개 포인트 카드 데이터 */
const highlights = [
  {
    icon: Home,
    title: "새 보금자리 구경",
    description:
      "드디어 내 집! 침대 위치부터 냉장고 속까지 — 직접 오셔서 품평회 열어주세요.",
  },
  {
    icon: UtensilsCrossed,
    title: "집밥 한 끼",
    description:
      "배달 앱 말고 직접 만든 음식입니다. 맛 보장은 못 하지만 정성은 보장해요.",
  },
  {
    icon: BookHeart,
    title: "방명록 한 줄",
    description:
      "\"잘 살아라\" 한 마디도 환영. 두고두고 꺼내볼 소중한 기록이 될 거예요.",
  },
]

export default function HomePage() {
  return (
    /* 전체 페이지 래퍼 */
    <div className="flex flex-col">

      {/* ───────────────────────────────────────────
          섹션 1: 히어로 — 배너 동영상
      ─────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "88vh", minHeight: "520px" }}
        aria-label="히어로 배너"
      >
        {/* 배경 동영상 */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/banner.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        {/* 그라데이션 오버레이 — 하단으로 갈수록 진해지는 따뜻한 다크 */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/75"
          aria-hidden="true"
        />

        {/* 히어로 텍스트 + CTA — 하단 중앙 배치 */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-4 text-center">

          {/* 서브 태그라인 */}
          <p className="mb-3 text-xs font-medium tracking-[0.2em] uppercase text-white/60 drop-shadow">
            2027 · 내집마련 집들이 초대
          </p>

          {/* 메인 타이틀 — 세리프 폰트로 우아함 강조 */}
          <h1 className="font-heading text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl">
            도토리의 집들이
          </h1>

          <p className="mt-4 text-sm text-white/70 drop-shadow sm:text-base">
            내집마련을 함께 축하해 주세요
          </p>

          {/* D-Day 카운터 */}
          <div className="mt-10">
            <DDay />
          </div>

          {/* CTA 버튼 */}
          <Link
            href="/housewarmings"
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-10 h-12 px-10 text-sm font-semibold rounded-full shadow-lg",
              /* 버튼에 따뜻한 글로우 */
              "shadow-primary/30"
            )}
          >
            집들이 참여하기
          </Link>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 2: 집들이 소개
      ─────────────────────────────────────────── */}
      <section
        className="w-full bg-background py-24 px-4"
        aria-labelledby="intro-heading"
      >
        <div className="max-w-5xl mx-auto space-y-20">

          {/* 소개 텍스트 — 세리프 제목 + 산세리프 본문 조합 */}
          <div className="max-w-xl mx-auto text-center space-y-8">
            {/* 장식 구분선 */}
            <div className="flex items-center justify-center gap-3" aria-hidden="true">
              <span className="block h-px w-10 bg-primary/30" />
              <span className="block h-1.5 w-1.5 rounded-full bg-primary/50" />
              <span className="block h-px w-10 bg-primary/30" />
            </div>

            <h2
              id="intro-heading"
              className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              저의 집들이에 여러분을 초대합니다.
            </h2>

            <div className="space-y-5 text-[15px] leading-[1.85] text-muted-foreground sm:text-base">
              <p>
                드디어 내집!!!<br />
                긴 여정이 끝났습니다.<br />
                자축하고 싶은데 혼자 하긴 좀 쓸쓸해서<br />
                여러분과 함께 즐기려고합니다.
              </p>
              <p>
                거창한 거 없습니다.<br />
                맛있는 거 먹고, 수다 떨고, 새집 구경하고,<br />
                그냥 같이 있어 주시면 돼요.
              </p>
              <p>
                여러분이 와주는 것만으로<br />
                이 집이 사람냄새가 나는 진짜 집이 될 것 같아요.<br />
                꼭 와주세요. 기다리고 있을게요!
              </p>
            </div>

            {/* 장식 구분선 */}
            <div className="flex items-center justify-center gap-3" aria-hidden="true">
              <span className="block h-px w-10 bg-primary/30" />
              <span className="block h-1.5 w-1.5 rounded-full bg-primary/50" />
              <span className="block h-px w-10 bg-primary/30" />
            </div>
          </div>

          {/* 포인트 카드 그리드 */}
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            role="list"
            aria-label="집들이 주요 안내"
          >
            {highlights.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                role="listitem"
                className={cn(
                  /* 카드 기본 구조 */
                  "flex flex-col items-center text-center",
                  /* 배경과 테두리 */
                  "bg-card rounded-2xl border border-border/60",
                  /* 패딩 */
                  "px-8 py-10",
                  /* 호버 인터랙션 */
                  "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/[0.06] hover:border-primary/25"
                )}
              >
                {/* 아이콘 원형 배경 — 따뜻한 앰버 틴트 */}
                <div
                  className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <Icon className="size-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground mb-3">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 3: 하단 CTA 재노출
      ─────────────────────────────────────────── */}
      <section
        className="w-full bg-muted/50 border-t border-border/40 py-24 px-4"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-7 text-center">
          <h2
            id="cta-heading"
            className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
          >
            아직 신청 안 하셨나요?
          </h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            자리가 무한정은 아니에요.<br />
            일정 확인하고 편한 날로 신청해 주세요.
          </p>
          <Link
            href="/housewarmings"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 px-10 text-sm font-semibold rounded-full shadow-md shadow-primary/20"
            )}
          >
            집들이 참여하기
          </Link>
        </div>
      </section>

    </div>
  )
}
