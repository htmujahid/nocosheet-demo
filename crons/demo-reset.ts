import { defineScheduled } from "void";

import { resetDemo } from "@/lib/demo/reset";

export const cron = "0 */12 * * *";

export default defineScheduled(async () => {
  await resetDemo();
});
