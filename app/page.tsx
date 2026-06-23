import { BookHeart, Home, UtensilsCrossed } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    /* 전체 페이지 래퍼 — 배경색은 layout body에서 상속 */
    <div className="flex flex-col">

      {/* ───────────────────────────────────────────
          섹션 1: 히어로 — 배너 동영상
      ─────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "80vh", minHeight: "480px" }}
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

        {/* 어두운 그라데이션 오버레이 */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70"
          aria-hidden="true"
        />

        {/* 히어로 텍스트 + CTA — 하단 중앙 배치 */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
            도토리의 집들이
          </h1>
          <p className="mt-4 text-base text-white/85 drop-shadow sm:text-lg md:text-xl">
            내집마련을 함께 축하해 주세요 · 2027년 10월 입주
          </p>

          {/* CTA 버튼 — buttonVariants로 Link를 스타일링 */}
          <Link
            href="/housewarmings"
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-8 h-11 px-8 text-base rounded-full shadow-lg"
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
        className="w-full bg-background py-20 px-4"
        aria-labelledby="intro-heading"
      >
        <div className="max-w-5xl mx-auto space-y-16">

          {/* 소개 텍스트 */}
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2
              id="intro-heading"
              className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              저의 집들이에 여러분을 초대합니다.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              드디어 내집!!!<br />
              긴 여정이 끝났습니다.<br />
              자축하고 싶은데 혼자 하긴 좀 쓸쓸해서<br />
              여러분과 함께 즐기려고합니다.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              거창한 거 없습니다.<br />
              맛있는 거 먹고, 수다 떨고, 새집 구경하고,<br />
              그냥 같이 있어 주시면 돼요.<br />
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              여러분이 와주는 것만으로<br />
              이 집이 사람냄새가 나는 진짜 집이 될 것 같아요.<br />
              꼭 와주세요. 기다리고 있을게요!
            </p>
          </div>

          {/* 포인트 카드 그리드 */}
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            role="list"
            aria-label="집들이 주요 안내"
          >
            {highlights.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                role="listitem"
                className="flex flex-col items-center text-center p-2 hover:shadow-md transition-shadow"
              >
                <CardContent className="flex flex-col items-center gap-4 pt-6 pb-4">
                  {/* 아이콘 원형 배경 */}
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-7" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 3: 하단 CTA 재노출
      ─────────────────────────────────────────── */}
      <section
        className="w-full bg-muted/40 py-20 px-4"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 text-center">
          <h2
            id="cta-heading"
            className="text-xl font-semibold text-foreground sm:text-2xl"
          >
            아직 신청 안 하셨죠? 👀
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            자리가 무한정은 아니에요.<br />
            일정 확인하고 편한 날로 신청해 주세요.
          </p>
          <Link
            href="/housewarmings"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 px-8 text-base rounded-full shadow"
            )}
          >
            집들이 참여하기
          </Link>
        </div>
      </section>

    </div>
  )
}
