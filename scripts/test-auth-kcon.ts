import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { auth } from "../src/lib/auth";

async function test() {
  console.log("Testing Admin login: admin@kcon.co.th / Admin@2026...");
  const res = await auth.api.signInEmail({
    body: { email: "admin@kcon.co.th", password: "Admin@2026" },
    asResponse: true,
  });
  console.log("Admin HTTP status:", res.status);
  const data = await res.json();
  console.log("Admin user:", data?.user?.id, "email:", data?.user?.email, "role:", data?.user?.role);

  console.log("Testing Staff login: pcryclc@kcon.co.th / Jib1105t...");
  const res2 = await auth.api.signInEmail({
    body: { email: "pcryclc@kcon.co.th", password: "Jib1105t" },
    asResponse: true,
  });
  console.log("Staff HTTP status:", res2.status);
  const data2 = await res2.json();
  console.log("Staff user:", data2?.user?.id, "email:", data2?.user?.email, "role:", data2?.user?.role);
}

test()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Test auth error:", e);
    process.exit(1);
  });
