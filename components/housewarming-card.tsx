// 집들이 목록에서 개별 집들이를 나타내는 카드 프레젠테이션 컴포넌트.
// 데이터 패칭/상태 관리 없이 props만 받아 정적으로 렌더링한다.

import Image from "next/image"
import Link from "next/link"
import { CalendarDays, ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import type { Housewarming } from "@/lib/types"

// ───────────────────────────────────────────────
// 타입 정의
// ───────────────────────────────────────────────

export interface HousewarmingCardProps {
  /** 집들이 데이터 객체 (image_url, organization 등 nullable 필드 포함) */
  housewarming: Housewarming
  /** 이미 KST로 포맷된 일시 문자열 (예: "2027.10.15 (금) 18:00") */
  eventLabel: string
  /** 상세 페이지 경로 (예: "/housewarmings/{id}") */
  detailHref: string
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 대표 이미지 영역
// ───────────────────────────────────────────────

function ThumbnailArea({
  imageUrl,
  name,
  detailHref,
}: {
  imageUrl: string | null
  name: string
  detailHref: string
}) {
  return (
    // 이미지 영역 전체를 링크로 감싸 상세 페이지로 이동
    <Link
      href={detailHref}
      className="block overflow-hidden rounded-t-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      aria-label={`${name} 상세 보기`}
      tabIndex={0}
    >
      {/* 16:9 비율 컨테이너 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted transition-transform duration-300 group-hover/card:scale-[1.02]">
        {imageUrl ? (
          // Supabase Storage 이미지 표시
          <Image
            src={imageUrl}
            alt={`${name} 대표 이미지`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          // image_url 없을 때 플레이스홀더
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted"
            aria-label="이미지 없음"
          >
            <ImageOff
              className="size-10 text-muted-foreground/50"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground/60">이미지 없음</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// ───────────────────────────────────────────────
// 메인 컴포넌트: HousewarmingCard
// ───────────────────────────────────────────────

export function HousewarmingCard({
  housewarming,
  eventLabel,
  detailHref,
}: HousewarmingCardProps) {
  const { name, organization, image_url } = housewarming

  return (
    <Card
      className={cn(
        // 너비는 부모 그리드가 담당; 카드 자체는 100% 채움
        "w-full",
        // hover 인터랙션: 그림자 강화 + 미세한 위로 이동
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/20",
        // 이미지 상단 패딩 제거 (Card 기본값 pt 덮어쓰기)
        "pt-0"
      )}
    >
      {/* ── 상단: 대표 이미지 (클릭 시 상세 이동) ── */}
      <ThumbnailArea
        imageUrl={image_url}
        name={name}
        detailHref={detailHref}
      />

      {/* ── 본문: 집들이명, 편성, 일시 ── */}
      <CardContent className="flex flex-col gap-2 pt-4">
        {/* 집들이명 */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground">
          {name}
        </h3>

        {/* 편성 — null이면 렌더링 생략 */}
        {organization && (
          <p className="text-xs font-medium text-muted-foreground">
            {organization}
          </p>
        )}

        {/* 일시 — 아이콘과 함께 표시 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays
            className="size-3.5 shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <time
            // TODO: event_at(ISO)으로 machine-readable dateTime 제공 필요
            dateTime={housewarming.event_at}
            className="tabular-nums"
          >
            {eventLabel}
          </time>
        </div>
      </CardContent>

      {/* ── 하단 푸터: "참여하기" 버튼 (전체 너비) ── */}
      <CardFooter className="pt-0">
        <Link
          href={detailHref}
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            // 전체 너비 + 높이 약간 키움
            "w-full h-9"
          )}
          aria-label={`${name} 참여하기`}
        >
          참여하기
        </Link>
      </CardFooter>
    </Card>
  )
}
