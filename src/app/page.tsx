import { connection } from "next/server";
import { MobileAppClient } from "@/components/layout/MobileAppClient";
import {
  getProductList,
  getCurrentRound,
  getRoundList,
  getRoundProgress,
  getCurrentUser,
  getUserList,
} from "@/db/queries";
import { DataProvider } from "@/lib/data-provider";
import { getServerSession } from "@/lib/auth/server";

export const instant = false;

export default async function Page() {
  await connection();

  // ───── Auth gate ─────
  // Check session BEFORE any data queries.
  // If not logged in, return a minimal shell — only what the Login page needs.
  const session = await getServerSession();
  if (!session || !session.user) {
    // No session: return empty initial data — LoginView will render
    return (
      <MobileAppClient
        initialData={{
          plants: await DataProvider.getPlants(),
          activeRound: null,
          rounds: [],
          progress: null,
          items: [],
          counts: [],
          adjustments: [],
          currentUser: null,
          users: [],
        }}
      />
    );
  }

  // ───── Authenticated: fetch data in parallel ─────
  const [
    plants,
    activeRound,
    rounds,
    items,
    currentUser,
    users,
  ] = await Promise.all([
    DataProvider.getPlants(),
    getCurrentRound(),
    getRoundList(),
    getProductList(),
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

  // counts and adjustments are loaded lazily on the client when tabs are opened
  // Do NOT load them on initial SSR to avoid the "query bottleneck on page open"
  return (
    <MobileAppClient
      initialData={{
        plants,
        activeRound: effectiveActiveRound,
        rounds: effectiveRounds,
        progress,
        items,
        counts: [],
        adjustments: [],
        currentUser,
        users,
      }}
    />
  );
}
