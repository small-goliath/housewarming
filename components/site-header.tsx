"use client"

import Link from "next/link"
import { Home } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"

// ───────────────────────────────────────────────
// 타입 정의
// ───────────────────────────────────────────────

export interface SiteHeaderUser {
  nickname: string | null
  profileImageUrl: string | null
  isAdmin: boolean
}

export interface SiteHeaderProps {
  /** null = 비로그인 상태 */
  user: SiteHeaderUser | null
  /** 현재 경로 (활성 탭 강조용) */
  pathname: string
  /** 로그아웃 버튼 클릭 핸들러 — 구현은 외부에서 주입 */
  onLogout: () => void
  /** 세션 확인 중 여부 */
  loading?: boolean
}

// ───────────────────────────────────────────────
// 내부 헬퍼: 네비게이션 탭 항목
// ───────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
}

/** 현재 경로가 해당 href 로 시작하면 활성 탭으로 간주 */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/")
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 단일 네비게이션 링크
// ───────────────────────────────────────────────

function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative shrink-0 text-sm transition-colors duration-150 px-1 pb-0.5",
        "hover:text-foreground",
        active
          ? // 활성 탭: 진한 텍스트 + 하단 언더라인 강조
            "font-semibold text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-foreground"
          : "font-medium text-muted-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  )
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 우측 사용자 영역 스켈레톤
// ───────────────────────────────────────────────

function UserAreaSkeleton() {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label="사용자 정보 불러오는 중"
    >
      {/* 아바타 자리 스켈레톤 */}
      <span className="size-8 animate-pulse rounded-full bg-muted" />
      {/* 닉네임 자리 스켈레톤 */}
      <span className="h-4 w-16 animate-pulse rounded bg-muted" />
    </div>
  )
}

// ───────────────────────────────────────────────
// 내부 컴포넌트: 로그인 사용자 영역
// ───────────────────────────────────────────────

function LoggedInArea({
  user,
  onLogout,
}: {
  user: SiteHeaderUser
  onLogout: () => void
}) {
  /** 닉네임 첫 글자 (fallback 텍스트용) */
  const fallbackChar = user.nickname?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <div className="flex items-center gap-2">
      {/* 프로필 아바타 */}
      <Avatar size="default" aria-label={`${user.nickname ?? "사용자"} 프로필 사진`}>
        {user.profileImageUrl ? (
          <AvatarImage
            src={user.profileImageUrl}
            alt={user.nickname ?? "사용자"}
          />
        ) : null}
        <AvatarFallback>{fallbackChar}</AvatarFallback>
      </Avatar>

      {/* 닉네임 — 작은 화면에서는 숨김 */}
      <span className="hidden text-sm font-medium sm:inline">
        {user.nickname ?? "사용자"}
      </span>

      {/* 로그아웃 버튼 — 실제 로직은 onLogout prop으로 주입 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        aria-label="로그아웃"
      >
        로그아웃
      </Button>
    </div>
  )
}

// ───────────────────────────────────────────────
// 메인 컴포넌트: SiteHeader
// ───────────────────────────────────────────────

export function SiteHeader({
  user,
  pathname,
  onLogout,
  loading = false,
}: SiteHeaderProps) {
  /** 기본 네비게이션 탭 목록 */
  const navItems: NavItem[] = [
    { label: "집들이 참여하기", href: "/housewarmings" },
    { label: "방명록", href: "/guestbook" },
  ]

  /** 관리자일 때 관리자 탭 추가 */
  if (user?.isAdmin) {
    navItems.push({ label: "관리자", href: "/admin" })
  }

  return (
    <header
      className={cn(
        // 상단 고정 및 z-index
        "sticky top-0 z-50",
        // 배경: 반투명 + 블러
        "bg-background/80 backdrop-blur-md",
        // 하단 구분선
        "border-b border-border"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">

        {/* ── 좌측: 로고 / 사이트명 ── */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground hover:opacity-80 transition-opacity"
          aria-label="도토리의 집들이 홈으로 이동"
        >
          {/* 집 느낌의 아이콘 */}
          <Home
            className="size-5 shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          {/* 사이트명 — 매우 좁은 화면에서 숨김 */}
          <span className="hidden text-sm xs:inline sm:text-base">
            도토리의 집들이
          </span>
        </Link>

        {/* ── 중앙: 네비게이션 탭 ── */}
        <nav
          className="flex flex-1 items-center gap-4 overflow-x-auto scrollbar-none"
          aria-label="주요 메뉴"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        {/* ── 우측: 사용자 영역 ── */}
        <div className="ml-auto flex shrink-0 items-center">
          {loading ? (
            // 세션 확인 중 — 스켈레톤 표시
            <UserAreaSkeleton />
          ) : user ? (
            // 로그인 상태
            <LoggedInArea user={user} onLogout={onLogout} />
          ) : (
            // 비로그인 상태 — 로그인 링크 버튼
            <Button
              variant="default"
              size="sm"
              render={<Link href="/login" />}
              aria-label="로그인 페이지로 이동"
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
