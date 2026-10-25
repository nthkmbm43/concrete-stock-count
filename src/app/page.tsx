import { MobileAppClient } from "@/components/layout/MobileAppClient";
import {
  getProductList,
  getCurrentRound,
  getRoundList,
  getRoundProgress,
  getStockCounts,
  getAdjustments,
  getCurrentUser,
  getUserList,
} from "@/db/queries";
import { DataProvider } from "@/lib/data-provider";

/**
 * 15. INITIAL PAGE LOAD (SSR / Server Component)
 * Request Page -> Server Query -> Complete HTML -> Browser Render -> Realtime Subscription Take Over
 * 16. Zero full-page skeleton on initial load!
 * 30. Parallel execution of independent queries!
 */
export default async function Page() {
  const [
    plants,
    activeRound,
    rounds,
    items,
    counts,
    adjustments,
    currentUser,
    users,
  ] = await Promise.all([
    DataProvider.getPlants(),
    getCurrentRound(),
    getRoundList(),
    getProductList(),
    getStockCounts(),
    getAdjustments(),
    getCurrentUser(),
    getUserList(),
  ]);

  const fallbackRounds = await DataProvider.getCountRounds();
  const effectiveRounds = rounds.length > 0 ? rounds : fallbackRounds;
  const effectiveActiveRound =
    activeRound ||
    effectiveRounds.find((r) => r.status === "OPEN") ||
    effectiveRounds[0] ||
    null;

  let progress = null;
  if (effectiveActiveRound) {
    progress = await getRoundProgress(effectiveActiveRound.id);
  }

  return (
    <MobileAppClient
      initialData={{
        plants,
        activeRound: effectiveActiveRound,
        rounds: effectiveRounds,
        progress,
        items,
        counts,
        adjustments,
        currentUser,
        users,
      }}
    />
  );
}
