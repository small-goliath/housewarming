"use client";

import { useState } from "react";
import { Clock, Heart, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// 방명록 항목 타입 정의
export interface GuestbookViewEntry {
  id: string;
  content: string;
  dateLabel: string; // 이미 KST로 포맷된 날짜 문자열 (예: "2026.06.23 14:30")
  likeCount: number;
  liked: boolean;
}

// 방명록 뷰 컴포넌트 props 타입 정의
export interface GuestbookViewProps {
  entries: GuestbookViewEntry[];
  loading: boolean;    // 목록 로딩 중
  submitting: boolean; // 작성 요청 처리 중
  onSubmit: (content: string) => Promise<void>; // 작성 제출. 성공 시 resolve, 실패 시 throw.
  onToggleLike: (id: string) => void; // 좋아요 토글
}

/**
 * 방명록 프레젠테이션 뷰 컴포넌트
 * - 메시지 작성 폼 (textarea + 작성하기 버튼)
 * - 익명 메시지 목록 (작성자 정보 없음)
 */
export function GuestbookView({
  entries,
  loading,
  submitting,
  onSubmit,
  onToggleLike,
}: GuestbookViewProps) {
  // textarea 입력값 상태 관리
  const [content, setContent] = useState("");

  // 최대 글자 수 제한
  const MAX_LENGTH = 2000;

  // 제출 가능 여부: 내용이 있고 제출 중이 아닌 경우
  const canSubmit = content.trim().length > 0 && !submitting;

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 내용이 비어있으면 제출하지 않음
    if (!canSubmit) return;

    try {
      await onSubmit(content.trim());
      // 성공 시 textarea 초기화
      setContent("");
    } catch {
      // 에러 발생 시 입력 유지 (에러 토스트는 외부에서 처리)
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      {/* 페이지 헤더 */}
      <header className="mb-12 text-center space-y-3">
        {/* 장식 구분선 */}
        <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
          <span className="block h-px w-8 bg-primary/30" />
          <span className="block h-1.5 w-1.5 rounded-full bg-primary/50" />
          <span className="block h-px w-8 bg-primary/30" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          도토리에게 하고싶은 말
        </h1>
        <p className="text-sm text-muted-foreground">
          따뜻한 메시지를 남겨주세요. 소중히 간직할게요.
        </p>
      </header>

      {/* 메시지 작성 폼 */}
      <section aria-label="메시지 작성" className="mb-12">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* 폼 헤더 */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50 bg-muted/30">
              <MessageCircle className="size-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">메시지 남기기</span>
            </div>

            {/* 텍스트 영역 */}
            <div className="p-5">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="축하 메시지를 남겨주세요 :)"
                disabled={submitting}
                maxLength={MAX_LENGTH}
                rows={4}
                aria-label="메시지 입력"
                className="resize-none border-border/60 focus-visible:ring-primary/30 bg-background/60 rounded-xl text-sm"
              />

              {/* 글자 수 안내 */}
              <p
                className={cn(
                  "mt-2 text-right text-xs",
                  content.length >= MAX_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground/70"
                )}
                aria-live="polite"
              >
                {content.length} / {MAX_LENGTH}
              </p>
            </div>

            {/* 작성 버튼 */}
            <div className="flex justify-end px-5 pb-5 pt-0">
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                className="rounded-lg px-5 font-semibold text-xs"
              >
                {submitting ? "작성 중..." : "작성하기"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* 메시지 목록 */}
      <section aria-label="메시지 목록">
        <h2 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
          남겨주신 메시지
          {entries.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {entries.length}
            </span>
          )}
        </h2>

        {/* 로딩 상태 */}
        {loading && (
          <p
            className="py-16 text-center text-sm text-muted-foreground"
            aria-live="polite"
          >
            불러오는 중...
          </p>
        )}

        {/* 빈 목록 상태 */}
        {!loading && entries.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            아직 메시지가 없어요. 첫 메시지를 남겨보세요!
          </p>
        )}

        {/* 메시지 카드 목록 */}
        {!loading && entries.length > 0 && (
          <ul className="space-y-3.5" role="list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <div className={cn(
                  "rounded-2xl border border-border/50 bg-card px-5 py-4",
                  "transition-all duration-200 hover:border-border/80 hover:shadow-sm"
                )}>
                  {/* 메시지 본문 */}
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-[1.75]">
                    {entry.content}
                  </p>

                  {/* 날짜 + 좋아요 */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <Clock className="size-3" aria-hidden="true" />
                      <time>{entry.dateLabel}</time>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleLike(entry.id)}
                      aria-pressed={entry.liked}
                      aria-label={entry.liked ? "좋아요 취소" : "좋아요"}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                        "transition-all duration-200",
                        entry.liked
                          ? "text-rose-500 bg-rose-50"
                          : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50/60"
                      )}
                    >
                      <Heart
                        className={cn("size-3.5", entry.liked && "fill-current")}
                        aria-hidden="true"
                      />
                      {entry.likeCount > 0 && (
                        <span className="tabular-nums font-medium">
                          {entry.likeCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
