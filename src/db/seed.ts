import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { seedFactoryActualStock } from "../../scripts/seed-factory-actual-stock";

export async function runSeed() {
  await seedFactoryActualStock();
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
