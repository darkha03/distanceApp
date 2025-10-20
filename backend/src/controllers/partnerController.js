import { PrismaClient } from "../generated/prisma/client.js";
import { getIO } from "../utils/socket.js";

const prisma = new PrismaClient();

// Get current user's partner info
export async function getPartner(req, res) {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                        activityImageUrl: true,
                        avatarUrl: true,
                        createdAt: true,
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
        console.log("Fetched partner info for user:", user);
    } catch (error) {
        console.error("Error fetching partner:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


//Delete partner by ID
export async function deletePartner(req, res) {
    try {
        const partnerId = req.params.id;
        const userId = req.user.userId;
                
        // Check if partner exists
        const partner = await prisma.user.findUnique({
            where: { id: partnerId },
        });
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }

        // Check if the partner is actually linked to the user
        if (partner.partnerId !== userId) {
            return res.status(403).json({ error: "You can only delete your own partner" });
        }

        // Remove partner link from both users
        await prisma.user.update({
            where: { id: userId, partnerId: partnerId },
            data: {partnerId: null},
        });

        await prisma.user.update({
            where: { id: partnerId },
            data: { partnerId: null },
        });
        // Update invite status to 'breakup' for all related invites
        await prisma.invite.updateMany({
            where: {
                OR: [
                    { senderId: partnerId, receiverId: userId },
                    { receiverId: partnerId, senderId: userId }
                ]
            },
            data: { status: "breakup" }
        });
        res.json({ message: "Partner removed successfully" });
        // Notify both users via WebSocket
        const io = getIO();
        io.to(userId).emit("partner:removed", { partnerId: null });
        io.to(partnerId).emit("partner:removed", { partnerId: null });
    } catch (error) {
        console.error("Error deleting partner:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


        