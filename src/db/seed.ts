import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { resetProductionToRealKcon } from "../../scripts/reset-production-kcon";

export async function runSeed() {
  await resetProductionToRealKcon();
}

if (process.argv[1]?.includes("seed")) {
  runSeed()
    .then(() => {
      console.log("Database seed completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database seed failed:", err);
      process.exit(1);
    });
}
