"use client";

import { useState } from "react";
import { Clock, Heart, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

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
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* 페이지 헤더 */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          도토리에게 하고싶은 말
        </h1>
        <p className="text-sm text-muted-foreground">
          따뜻한 메시지를 남겨주세요. 소중히 간직할게요 :)
        </p>
      </header>

      {/* 메시지 작성 폼 */}
      <section aria-label="메시지 작성" className="mb-10">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageCircle className="size-4 text-primary" aria-hidden="true" />
                <span>메시지 남기기</span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* 메시지 입력 영역 */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="축하 메시지를 남겨주세요 :)"
                disabled={submitting}
                maxLength={MAX_LENGTH}
                rows={4}
                aria-label="메시지 입력"
                className="resize-none"
              />

              {/* 글자 수 안내 */}
              <p
                className={cn(
                  "mt-1.5 text-right text-xs",
                  content.length >= MAX_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
                aria-live="polite"
              >
                {content.length} / {MAX_LENGTH}
              </p>
            </CardContent>

            {/* 작성 버튼 */}
            <CardFooter className="justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
              >
                {submitting ? "작성 중..." : "작성하기"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      {/* 메시지 목록 */}
      <section aria-label="메시지 목록">
        <h2 className="text-base font-semibold text-foreground mb-4">
          남겨주신 메시지
        </h2>

        {/* 로딩 상태 */}
        {loading && (
          <p
            className="py-12 text-center text-sm text-muted-foreground"
            aria-live="polite"
          >
            불러오는 중...
          </p>
        )}

        {/* 빈 목록 상태 */}
        {!loading && entries.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            아직 메시지가 없어요. 첫 메시지를 남겨보세요!
          </p>
        )}

        {/* 메시지 카드 목록 (받은 순서대로 렌더링, 외부에서 최신순 정렬) */}
        {!loading && entries.length > 0 && (
          <ul className="space-y-3" role="list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <CardContent className="pt-4">
                    {/* 메시지 본문 (줄바꿈 유지) */}
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {entry.content}
                    </p>

                    {/* 날짜 + 좋아요 (작성자 정보 없음 — 완전 익명) */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden="true" />
                        <time>{entry.dateLabel}</time>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleLike(entry.id)}
                        aria-pressed={entry.liked}
                        aria-label={entry.liked ? "좋아요 취소" : "좋아요"}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors",
                          entry.liked
                            ? "text-red-500"
                            : "text-muted-foreground hover:text-red-500"
                        )}
                      >
                        <Heart
                          className={cn("size-4", entry.liked && "fill-current")}
                          aria-hidden="true"
                        />
                        {entry.likeCount > 0 && (
                          <span className="tabular-nums">{entry.likeCount}</span>
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
