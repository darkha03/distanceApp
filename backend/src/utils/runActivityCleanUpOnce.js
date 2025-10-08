import { PrismaClient } from "../generated/prisma/client.js";
import cloudinary from "./cloudinary.js";
import { getIO } from "./socket.js";

const prismaCleanup = new PrismaClient();
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function runActivityImageCleanupOnce() {
  try {
    const cutoff = new Date(Date.now() - EXPIRY_MS);
    const expired = await prismaCleanup.activityImage.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, publicId: true }
    });
    if (!expired.length) {
      console.log("No expired activity images to clean.");
      return;
    }
    const io = getIO();
    io.emit("activityImages:expired", expired.map(e => e.id));
    await prismaCleanup.activityImage.deleteMany({
      where: { id: { in: expired.map(e => e.id) } }
    });
    const publicIds = expired.filter(e => e.publicId).map(e => e.publicId);
    for (const chunk of chunkArray(publicIds, 100)) {
      await cloudinary.api.delete_resources(chunk).catch(() => {});
    }
    console.log("Cleaned expired activity images:", expired.length);
  } catch (e) {
    console.error("Cleanup error:", e.message);
  }
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}