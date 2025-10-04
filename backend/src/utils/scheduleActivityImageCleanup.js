import { PrismaClient } from "../generated/prisma/client.js";
import fs from "fs";
import path from "path";
import { getIO } from "./socket.js";
const prismaCleanup = new PrismaClient();
const CLEAN_INTERVAL_MS = 60 * 60 * 1000; // hourly

export function scheduleActivityImageCleanup() {
  setInterval(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log("Running activity image cleanup, cutoff:", cutoff);
    try {
      const expired = await prismaCleanup.activityImage.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true, userId:true, url: true }
      });
      console.log("Found expired images:", expired.length);
      if (expired.length) {
        for (const img of expired) {
          if (img.url.startsWith("/uploads/activity/")) {
            const abs = path.join(process.cwd(), img.url.replace(/^\/+/, ""));
            fs.promises.unlink(abs).catch(()=>{});
          }
        }
        const io = getIO();
        expired.forEach(img => {
          io.emit("activityImageDeleted", { id: img.id });
        });
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