import { HousewarmingCard } from "@/components/housewarming-card";
import { formatMonthKST } from "@/lib/datetime";
import type { Housewarming } from "@/lib/types";

// 목록은 비로그인 공개 — 서버에서 인증 없이 FastAPI 호출.
export const dynamic = "force-dynamic";

async function getHousewarmings(): Promise<Housewarming[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/housewarmings`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("집들이 목록을 불러오지 못했습니다.");
  }
  return res.json();
}

export default async function HousewarmingsPage() {
  let housewarmings: Housewarming[] = [];
  let error = false;
  try {
    housewarmings = await getHousewarmings();
  } catch {
    error = true;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">집들이 참여하기</h1>
        <p className="text-muted-foreground mt-2">
          참여하실 집들이를 골라주세요. 카드를 누르면 상세 정보를 볼 수 있어요.
        </p>
      </header>

      {error ? (
        <p className="text-destructive py-20 text-center">
          목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : housewarmings.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center">
          아직 등록된 집들이가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {housewarmings.map((hw) => (
            <HousewarmingCard
              key={hw.id}
              housewarming={hw}
              eventLabel={formatMonthKST(hw.event_at)}
              detailHref={`/housewarmings/${hw.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
