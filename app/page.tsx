import Link from "next/link"
import { Home, UtensilsCrossed, BookHeart } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/* 집들이 소개 포인트 카드 데이터 */
const highlights = [
  {
    icon: Home,
    title: "새 보금자리",
    description:
      "오랫동안 꿈꿔온 우리만의 공간입니다. 직접 눈으로 보러 오세요.",
  },
  {
    icon: UtensilsCrossed,
    title: "집밥 한 끼",
    description:
      "정성껏 준비한 음식과 함께 따뜻하고 즐거운 시간을 나눠요.",
  },
  {
    icon: BookHeart,
    title: "방명록 남기기",
    description:
      "소중한 한 마디를 남겨주세요. 오래도록 간직하겠습니다.",
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
              집들이에 초대합니다 🏡
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              오랜 기다림 끝에 드디어 우리 집이 생겼습니다.
              이 기쁨을 가까운 분들과 함께 나누고 싶어 자리를 마련했어요.
              부담 없이, 편하게 들러 주세요.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              정성껏 준비한 음식과 함께 도란도란 이야기 나누며
              따뜻한 시간을 보내고 싶습니다.
              오시는 길이 멀더라도 꼭 얼굴 한번 비춰주세요.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              새집의 첫 손님들과 함께하는 이 순간이
              평생 소중한 기억으로 남을 것 같습니다.
              기다리고 있을게요. 🍀
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
            함께해 주실 거죠?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            참여 신청과 방명록은 아래 버튼에서 확인하실 수 있어요.
            일정을 확인하고 편한 날 들러 주세요.
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
