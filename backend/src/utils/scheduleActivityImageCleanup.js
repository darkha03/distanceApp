import { PrismaClient } from "../generated/prisma/client.js";
import fs from "fs";
import path from "path";
const prismaCleanup = new PrismaClient();
const CLEAN_INTERVAL_MS = 60 * 60 * 1000; // hourly

export function scheduleActivityImageCleanup() {
  setInterval(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const expired = await prismaCleanup.activityImage.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true, url: true }
      });
      if (expired.length) {
        for (const img of expired) {
          if (img.url.startsWith("/uploads/activity/")) {
            const abs = path.join(process.cwd(), img.url.replace(/^\/+/, ""));
            fs.promises.unlink(abs).catch(()=>{});
          }
        }
        await prismaCleanup.activityImage.deleteMany({
          where: { id: { in: expired.map(e => e.id) } }
        });
        console.log("Cleaned expired activity images:", expired.length);
      }
    } catch (e) {
      console.error("Cleanup error:", e.message);
    }
  }, CLEAN_INTERVAL_MS);
}