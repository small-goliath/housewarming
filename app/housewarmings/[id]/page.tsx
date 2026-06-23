import { HousewarmingDetail } from "@/components/housewarming-detail";

// 로그인 필수 (middleware 보호). Next.js 15 비동기 params 패턴.
export default async function HousewarmingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HousewarmingDetail id={id} />;
}
