import { PrismaClient } from "../generated/prisma/client.js";
import { getIO } from "../utils/socket.js";
import { hashPassword } from "../utils/hash.js";

const prisma = new PrismaClient();

// GET USER PROFILE
// Return user with partner info
export async function getUserProfile(req, res) {
    try {
        console.log("Fetching user profile");
        const id = req.user.userId;
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
                latitude: true,
                longitude: true,
                timezone: true,
                birthday: true,
                activityImageUrl: true,
                avatarUrl: true,
                partner: {
                    select: {
                        name: true,
                        status: true,
                        location: true,
                        latitude: true,
                        longitude: true,
                        timezone: true,
                        birthday: true,
                        activityImageUrl: true,
                        avatarUrl: true,
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        let anniversary = null;
        if (user.partnerId) {
        const invite = await prisma.invite.findFirst({
            where: {
            status: "accepted",
            OR: [
                { senderId: id },
                { receiverId: id }
            ]
            },
            select: { anniversary: true }
        });
        anniversary = invite?.anniversary || null;
        }

        // Return combined payload (anniversary is relationship-level)
        res.json({
        ...user,
        anniversary
        });
    } catch (error) {
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
}

// UPDATE USER PROFILE
// Return updated user with partner info
export async function updateUserProfile(req, res) {
    try {
        const userId = req.user.userId;
        const { name, birthday, location, latitude, longitude, timezone, avatarUrl } = req.body;
        const updateData = { name, location, birthday, latitude, longitude, timezone, avatarUrl };

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
            id: true,
            username: true,
            email: true,
            name: true,
            code: true,
            birthday: true,
            status: true,
            location: true,
            partnerId: true,
            latitude: true,
            longitude: true,
            timezone: true,
            avatarUrl: true,
            partner: {
                select: {
                    name: true,
                    status: true,
                    location: true,
                    latitude: true,
                    longitude: true,
                    timezone: true,
                    birthday: true,
                    activityImageUrl: true,
                }
            }},
        });
        res.json(updatedUser);
        const socket = getIO();
        // Notify partner via WebSocket
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user.partnerId) {
            socket.to(user.partnerId).emit("partner:update", updatedUser);
        }
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
        console.error(error);
    }
}

// ADD PARTNER (SEND INVITE)
// Return message
// Emit socket event to the partner with invite details (e.g., fromUserId, fromUserName)
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
          sender: { id: user.id, username: user.username }, // unify shape
          senderId: user.id,
          receiverId: partner.id,
          status: invite.status
        });
        res.json({ message: "Partner invite sent" });
    }
    catch (error){
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
}

// GET INVITE
// Return pending invite details 
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
// Return message
// If accepted, update both users to set each other as partners
// Emit socket event to the inviter with the response (accepted/rejected)
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
            await prisma.$transaction([
                prisma.user.update({ where: { id: userId }, data: { partnerId: invite.senderId } }),
                prisma.user.update({ where: { id: invite.senderId }, data: { partnerId: userId } }),
                prisma.invite.update({ where: { id: invite.id }, data: { status: "accepted" } })
            ]);

            const receiverView = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, username: true, name: true, status: true, location: true, partnerId: true, latitude: true, longitude: true, timezone: true  }
            });
            const senderPartnerInfo = await prisma.user.findUnique({
                where: { id: invite.senderId },
                select: { id: true, username: true, name: true, status: true, location: true, latitude: true, longitude: true, timezone: true  }
            });

            const io = getIO();
            io.to(invite.senderId).emit("partner:accepted", senderPartnerInfo);

            return res.json({
                message: "Invite accepted",
                user: receiverView,              // updated receiver (caller)
                partner: senderPartnerInfo       // partner details (sender)
            });
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
// Return latest invite status for the user
// (if user sent an invite, check its status)
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

// CHANGE PASSWORD
// Return message
export async function changePassword(req, res) {
    try {
        const userId = req.user.userId;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}

// UPDATE USER STATUS
// Return updated user with partner info
// Emit socket event to the partner with the new status
export async function updateUserStatus(req, res) {
    try {
        const userId = req.user.userId;
        const { status } = req.body;
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: {
            id: true,
            username: true,
            email: true,
            name: true,
            code: true, 
            status: true,
            location: true,
            partnerId: true,
            partner: {
                select: {  
                    name: true,
                    status: true,
                    location: true,
                }
            }
            },
        });
        // Notify partner via WebSocket
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user.partnerId) {
            const io = getIO();
            io.to(user.partnerId).emit("partner:status", { partnerId: userId, status });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}

// RESPOND TO ACTIVITY IMAGE UPLOAD
// Return updated user with partner info
// Emit socket event to the partner with the new activity image URL
export async function respondActivityImage(req, res) {
  try {
    console.log("Received file:", req.file);
    if (!req.file) return res.status(400).json({ error: "No image" });
    const userId = req.user.userId;
    // Build a public URL (for dev you can serve /uploads statically)
    const relativePath = `/uploads/activity/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { activityImageUrl: relativePath },
      select: {
        id: true,
        username: true,
        status: true,
        activityImageUrl: true,
        partnerId: true,
        partner: {
          select: { id: true, username: true, status: true, activityImageUrl: true }
        }
      }
    });

    if (updated.partnerId) {
      const io = getIO();
      io.to(updated.partnerId).emit("partner:activityImage", {
        userId,
        activityImageUrl: relativePath
      });
    }

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
}

// UPDATE ANNIVERSARY
// Return updated invite with anniversary info
// Anniversary is stored in the invite record when the invite is accepted
// Emit socket event to the partner with the new anniversary date
export async function updateAnniversary(req, res) {
  try {
    const userId = req.user.userId;
    const { anniversary } = req.body; // Should be ISO string

    // Find the accepted invite where user is sender or receiver
    const invite = await prisma.invite.findFirst({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        status: "accepted"
      }
    });

    if (!invite) {
      return res.status(404).json({ error: "No accepted invite found" });
    }

    // Update anniversary
    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data: { anniversary: anniversary ? new Date(anniversary) : null }
    });

    res.json(updated);
    // Notify partner via WebSocket
    const partnerId = (invite.senderId === userId) ? invite.receiverId : invite.senderId;
    const io = getIO();
    io.to(partnerId).emit("partner:anniversary", {
        userId: userId, 
        anniversary: updated.anniversary });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

//AVATAR UPLOAD
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No image" });
    const userId = req.user.userId;
    const relativePath = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: relativePath },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        partnerId: true
      }
    });
    // Notify partner (merge-friendly partial)
    if (updated.partnerId) {
      const io = getIO();
      io.to(updated.partnerId).emit("partner:update", {
        id: userId,
        avatarUrl: relativePath
      });
    }
    res.json({ avatarUrl: relativePath });
    console.log("Avatar uploaded:", updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Avatar upload failed" });
  }
}