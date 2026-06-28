"use client"

// 집들이 상세 페이지 프레젠테이션 뷰 컴포넌트.
// 데이터 패칭/상태 관리 없이 props만 받아 정적으로 렌더링한다.
// 모든 이벤트 핸들러는 컨테이너(부모)에서 주입받는다.

import Image from "next/image"
import {
  CalendarDays,
  Home,
  MessageCircle,
  Shirt,
  StickyNote,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import type { Housewarming, Participant } from "@/lib/types"

// ───────────────────────────────────────────────
// 타입 정의
// ───────────────────────────────────────────────

/** 현재 로그인 사용자의 집들이 참여 상태 */
export type ParticipationStatus = "none" | "current" | "other"
// none    = 미참여
// current = 이 집들이에 참여 중
// other   = 다른 집들이에 참여 중

export interface HousewarmingDetailViewProps {
  /** 집들이 상세 정보 (image_url/organization/dress_code/note/description nullable) */
  housewarming: Housewarming
  /** KST로 포맷된 일시 문자열 (예: "2027.10.15 (금) 18:00 KST") */
  eventLabel: string
  /** 참여자 목록 */
  participants: Participant[]
  /** 현재 사용자의 참여 상태 */
  status: ParticipationStatus
  /** 참여/취소/변경 요청 처리 중 여부 (true이면 버튼 비활성) */
  busy: boolean
  /** status === "none" 일 때 "참여하기" 클릭 핸들러 */
  onParticipate: () => void
  /** status === "current" 일 때 "취소하기" 클릭 핸들러 */
  onCancel: () => void
  /** status === "other" 일 때 "변경하기" 클릭 핸들러 */
  onChange: () => void
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 대표 이미지 영역
// ───────────────────────────────────────────────

function HeroImage({
  imageUrl,
  name,
}: {
  imageUrl: string | null
  name: string
}) {
  return (
    /* 16:9 비율 이미지 컨테이너 — 라운드 더 크게 */
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
      {imageUrl ? (
        /* Supabase Storage 이미지 표시 */
        <Image
          src={imageUrl}
          alt={`${name} 대표 이미지`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      ) : (
        /* image_url 없을 때 플레이스홀더 */
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted"
          aria-label="대표 이미지 없음"
        >
          <Home
            className="size-14 text-muted-foreground/30"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground/50">이미지 없음</span>
        </div>
      )}
    </div>
  )
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 상세 정보 행 (라벨 + 값)
// ───────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex gap-3.5", className)}>
      {/* 아이콘 영역 — 포인트 컬러 */}
      <div className="mt-0.5 flex shrink-0 items-start text-primary/70">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        {/* 라벨 텍스트 */}
        <span className="text-xs font-medium text-muted-foreground tracking-wide">
          {label}
        </span>
        {/* 값 영역 */}
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 참여 버튼 & 안내 문구 영역
// ───────────────────────────────────────────────

function ParticipationSection({
  status,
  busy,
  onParticipate,
  onCancel,
  onChange,
}: {
  status: ParticipationStatus
  busy: boolean
  onParticipate: () => void
  onCancel: () => void
  onChange: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* status별 안내 문구 */}
      {status === "current" && (
        <p className="text-center text-sm text-muted-foreground">
          이 집들이에 참여 중이에요
        </p>
      )}
      {status === "other" && (
        <p className="text-center text-sm text-muted-foreground">
          다른 집들이에 참여 중이에요. 이 집들이로 변경할까요?
        </p>
      )}

      {/* status별 버튼 렌더링 — 하나만 표시 */}
      {status === "none" && (
        /* 미참여: 기본 강조 스타일 */
        <Button
          size="lg"
          variant="default"
          className="w-full h-12 text-base font-semibold rounded-xl shadow-md shadow-primary/20 transition-all"
          disabled={busy}
          onClick={onParticipate}
        >
          {busy ? "처리 중..." : "참여하기"}
        </Button>
      )}

      {status === "current" && (
        /* 참여 중: destructive 스타일 */
        <Button
          size="lg"
          variant="destructive"
          className="w-full h-12 text-base font-semibold rounded-xl"
          disabled={busy}
          onClick={onCancel}
        >
          {busy ? "처리 중..." : "취소하기"}
        </Button>
      )}

      {status === "other" && (
        /* 다른 집들이 참여 중: outline 스타일 */
        <Button
          size="lg"
          variant="outline"
          className="w-full h-12 text-base font-semibold rounded-xl"
          disabled={busy}
          onClick={onChange}
        >
          {busy ? "처리 중..." : "변경하기"}
        </Button>
      )}
    </div>
  )
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 참여자 목록
// ───────────────────────────────────────────────

function ParticipantList({ participants }: { participants: Participant[] }) {
  return (
    <section aria-labelledby="participants-heading">
      {/* 섹션 제목 */}
      <div className="mb-5 flex items-center gap-2">
        <Users
          className="size-4 text-primary/70"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <h2
          id="participants-heading"
          className="text-base font-semibold text-foreground"
        >
          참여자{" "}
          <span className="font-normal text-muted-foreground">
            ({participants.length}명)
          </span>
        </h2>
      </div>

      {participants.length === 0 ? (
        /* 참여자 없을 때 안내 */
        <p className="py-8 text-center text-sm text-muted-foreground">
          아직 참여자가 없어요
        </p>
      ) : (
        /* 참여자 그리드 목록 */
        <ul
          className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-x-3 gap-y-5"
          aria-label="참여자 목록"
        >
          {participants.map((participant, index) => {
            // nickname이 null이면 "?" 사용
            const displayName = participant.nickname ?? "?"
            // 아바타 fallback용 첫 글자
            const initial = displayName.charAt(0)

            return (
              <li
                key={index}
                className="flex flex-col items-center gap-2"
              >
                {/* 프로필 아바타 */}
                <Avatar size="lg" className="size-12 ring-2 ring-border/50">
                  {participant.profile_image_url && (
                    <AvatarImage
                      src={participant.profile_image_url}
                      alt={`${displayName} 프로필 이미지`}
                    />
                  )}
                  <AvatarFallback
                    aria-label={displayName}
                    className="bg-primary/10 text-primary font-semibold text-sm"
                  >
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {/* 닉네임 */}
                <span className="max-w-[72px] truncate text-center text-xs font-medium text-muted-foreground">
                  {displayName}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ───────────────────────────────────────────────
// 메인 컴포넌트: HousewarmingDetailView
// ───────────────────────────────────────────────

export function HousewarmingDetailView({
  housewarming,
  eventLabel,
  participants,
  status,
  busy,
  onParticipate,
  onCancel,
  onChange,
}: HousewarmingDetailViewProps) {
  const {
    name,
    organization,
    event_at,
    image_url,
    dress_code,
    note,
    description,
    kakao_open_chat_url,
  } = housewarming

  return (
    /* 최대 너비 컨테이너 — 모바일 우선, 중앙 정렬 */
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-col gap-8">

        {/* ── 1. 대표 이미지 ── */}
        <HeroImage imageUrl={image_url} name={name} />

        {/* ── 2. 상세 정보 카드 ── */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6">

            {/* 집들이명 */}
            <div className="flex flex-col gap-2">
              {organization && (
                <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {organization}
                </span>
              )}
              <h1 className="font-heading text-2xl font-bold leading-snug tracking-tight text-foreground">
                {name}
              </h1>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-border/60" aria-hidden="true" />

            {/* 상세 정보 행 목록 */}
            <div className="flex flex-col gap-5">

              {/* 일시 — 항상 표시 */}
              <DetailRow
                icon={
                  <CalendarDays
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                }
                label="일시"
              >
                <time dateTime={event_at} className="tabular-nums">
                  {eventLabel}
                </time>
              </DetailRow>

              {/* 드레스코드 — null이면 렌더링 생략 */}
              {dress_code && (
                <DetailRow
                  icon={
                    <Shirt
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  }
                  label="드레스코드"
                >
                  {dress_code}
                </DetailRow>
              )}

              {/* 비고 — null이면 렌더링 생략 */}
              {note && (
                <DetailRow
                  icon={
                    <StickyNote
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  }
                  label="비고"
                >
                  {note}
                </DetailRow>
              )}
            </div>

            {/* 상세 설명 — null이면 렌더링 생략 */}
            {description && (
              <div className="rounded-xl bg-muted/50 px-4 py-4 border border-border/40">
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {description}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── 3. 캘린더에 추가 ── */}
        <AddToCalendar housewarming={housewarming} />

        {/* ── 4. 카카오 오픈채팅 버튼 (URL 있을 때만) ── */}
        {kakao_open_chat_url && (
          <a
            href={kakao_open_chat_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3.5",
              "text-base font-semibold text-[#191600]",
              "bg-[#FEE500] hover:bg-[#FADA0A]",
              "transition-colors duration-200 shadow-sm"
            )}
          >
            <MessageCircle className="size-5" strokeWidth={2} aria-hidden="true" />
            카카오톡 오픈채팅 참여하기
          </a>
        )}

        {/* ── 5. 참여 버튼 영역 ── */}
        <ParticipationSection
          status={status}
          busy={busy}
          onParticipate={onParticipate}
          onCancel={onCancel}
          onChange={onChange}
        />

        {/* ── 6. 참여자 목록 ── */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <ParticipantList participants={participants} />
        </div>

      </div>
    </main>
  )
}
