import { PrismaClient } from "../generated/prisma/client.js";
import { getIO } from "../utils/socket.js";

const prisma = new PrismaClient();

// GET USER PROFILE
export async function getUserProfile(req, res) {
    try {
        console.log("Fetching user profile");
        const { id } = req.params;

        const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            code: true,
            status: true,
            location: true,
            partnerId: true,
        },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}

// UPDATE USER PROFILE
export async function updateUserProfile(req, res) {
    try {
        const userId = req.user.userId;
        const { name, location, password } = req.body;
        const updateData = { name, location };

        if (password) {
            const hashedPassword = await hashPassword(password);
            updateData.password = hashedPassword;
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
            id: true,
            username: true,
            email: true,
            name: true,
            code: true,
            status: true,
            location: true,
            partnerId: true,
        },
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}

// ADD PARTNER (SEND INVITE)
export async function addPartner(req, res) {
    try {

        const userId = req.user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user.partnerId) {
            return res.status(400).json({ error: "You already have a partner" });
        }
        const { partnerCode } = req.body;
        // Find partner by code
        const partner = await prisma.user.findUnique({
            where: { code: partnerCode },
        });
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }
        if (partner.id === userId) {
            return res.status(400).json({ error: "Cannot add yourself as a partner" });
        }
        if (partner.partnerId) {
            return res.status(400).json({ error: "User already has a partner" });
        }
        // Create a pending invite
        const invite = await prisma.invite.create({
            data: {
                senderId: userId,
                receiverId: partner.id,
                status: "pending",
            },
        });
        // Emit socket event to the partner
        const io = getIO();
        io.to(partner.id).emit("partner:invite", { 
            id: invite.id,
            fromUserId: userId,
            fromUser: user.username
        });
        res.json({ message: "Partner invite sent" });
    }
    catch (error){
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
}

// GET INVITE
export async function getInvite(req, res) {
    try {
        const userId = req.user.userId;
        console.log("Getting invite for user:", userId);
        const invite = await prisma.invite.findMany({
            where: {
                receiverId: userId,
                status: "pending",
            },
            orderBy: { createdAt: "desc" },
            include: {
                sender: { // Include sender user info
                    select: {
                        id: true,
                        username: true,
                    }
                }
            }
        });
        console.log("Fetching invite for user:", userId, invite);
        if (!invite || invite.length === 0) {
            return res.status(404).json({ error: "No pending invite found" });
        }
        res.json(invite);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}

// RESPOND TO INVITE (ACCEPT/REJECT)
export async function respondInvite(req, res) {
    try {
        const userId = req.user.userId;
        const { status } = req.body;
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        // Find the pending invite
        const invite = await prisma.invite.findFirst({
            where: {
                receiverId: userId,
                status: "pending",
            },
            orderBy: { createdAt: "desc" },
        });
        console.log("Responding to invite:", invite);
        if (!invite) {
            return res.status(404).json({ error: "No pending invite found" });
        }
        if (status === "accepted") {
            // Update both users to set each other as partners
            await prisma.user.update({
                where: { id: userId },
                data: { partnerId: invite.senderId },
            });
            console.log("User updated with partner:", invite.senderId);
            await prisma.user.update({
                where: { id: invite.senderId },
                data: { partnerId: userId },
            });
            console.log("Partner updated with user:", userId);
            // Update invite status
            await prisma.invite.update({
                where: { id: invite.id },
                data: { status: "accepted" },
            });
            console.log("Invite status updated to accepted");
            // Emit socket event to the inviter
            const io = getIO();
            io.to(invite.senderId).emit("partner:accepted", { partnerId: userId });
            return res.json({ message: "Invite accepted", partnerId: invite.senderId });
        }
        else {
            // Update invite status to rejected
            await prisma.invite.update({
                where: { id: invite.id },
                data: { status: "rejected" },
            });
            // Emit socket event to the inviter
            const io = getIO();
            io.to(invite.senderId).emit("partner:rejected");
            return res.json({ message: "Invite rejected" });
        }
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}

// GET INVITE RESPONSE (ACCEPTED/REJECTED/PENDING)
export async function getResponseInvite(req, res) {
    try {
        const userId = req.user.userId;
        const invite = await prisma.invite.findFirst({
            where: {
                senderId: userId,
            },
            orderBy: { createdAt: "desc" },
        });
        if (!invite) {
            return res.status(404).json({ error: "No pending invite found" });
        }
        res.json(invite);

    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}