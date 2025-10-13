import { PrismaClient } from "../generated/prisma/client.js";
import { getIO } from "../utils/socket.js";
import { hashPassword } from "../utils/hash.js";
import cloudinary, { uploadBuffer } from "../utils/cloudinary.js";
import { notifyPartner } from "../utils/notifyPartner.js";
import { sendPushNotification } from "../utils/sendNotification.js";
import e from "cors";

const prisma = new PrismaClient();
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function activityCutoffDate() {
    return new Date(Date.now() - EXPIRY_MS);
}

// GET USER PROFILE
// Return user with partner info
export async function getUserProfile(req, res) {
    try {
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
                statusImageSet: true,
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
                        statusImageSet: true,
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

        let activityImages = [];
        if (user.partnerId) {
            activityImages = await prisma.activityImage.findMany({ 
                where: { userId: user.partnerId, createdAt: { gte: activityCutoffDate() } },
                orderBy: { createdAt: "asc" }
            });
        }
        user.partner = user.partner ? { ...user.partner, activityImages } : null;
        
        let userActivityImages = [];
        userActivityImages = await prisma.activityImage.findMany({ 
            where: { userId: id, createdAt: { gte: activityCutoffDate() } },
            orderBy: { createdAt: "asc" }
        });
        

        // Return combined payload (anniversary is relationship-level)
        res.json({
        ...user,
        anniversary,
        activityImages: userActivityImages
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

//DELETE USER PROFILE
export async function deleteUserProfile(req, res) {
    try{
        const userId = req.user.userId;
        // Delete invites where user is sender or receiver
        await prisma.invite.deleteMany({
            where: {
                OR: [ { senderId: userId }, { receiverId: userId } ]
            }
        });
        // Set partnerId to null for the partner user
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.partnerId) {
            await prisma.user.update({
                where: { id: user.partnerId },
                data: { partnerId: null }
            });
            // Notify partner via WebSocket
            const io = getIO();
            io.to(user.partnerId).emit("partner:removed");
        }
        // Delete the user
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
        console.error(error);
    }
}

// ADD PARTNER (SEND INVITE)
// Return message
// Emit socket event to the partner with invite details (e.g., fromUserId, fromUserName)
// Push notification
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
        // Push notification
        sendPushNotification(
          partner.notificationToken,
          "You got a new invite",
          `${user.username} has sent you an invite`,
          { type: "invite", fromUserId: user.id, fromUserName: user.username }
        );
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
        const userId = req.user.userId
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
            include: { sender: true }  // include sender info for notification
        });
        //console.log("Responding to invite:", invite);
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
            // Push notification
            sendPushNotification(
                invite.sender.notificationToken,
                "Your invite was accepted",
                `${user.username} has accepted your invite`,
                { type: "inviteResponse", fromUserId: user.id, fromUserName: user.username, status: "accepted" }
            );
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
            sendPushNotification(
                invite.sender.notificationToken,
                "Your invite was rejected",
                `${user.username} has rejected your invite`,
                { type: "inviteResponse", fromUserId: user.id, fromUserName: user.username, status: "rejected" }
            );
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
// Send notification to partner if offline
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
        // Notify partner via WebSocket and push notification
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user.partnerId) {
          await notifyPartner(
              user.partnerId,
              "partner:status",
              { partnerId: userId, status },
              () => ({ 
                body: `${user.name || user.username} updated their status to ${status}`,
                data: { type: "status", status } 
              })
          );
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
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

    // Upload buffer to Cloudinary (folder optional)
    const result = await uploadBuffer(req.file.buffer, {
      folder: "myapp/avatars",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
    });

    // Fetch existing to delete old avatar (if stored in Cloudinary)
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true }
    });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: result.secure_url,
        avatarPublicId: result.public_id
      },
      select: { id: true, username: true, avatarUrl: true, avatarPublicId: true, partnerId: true }
    });

    // Delete old on Cloudinary
    if (existing?.avatarPublicId && existing.avatarPublicId !== result.public_id) {
      cloudinary.uploader.destroy(existing.avatarPublicId).catch(()=>{});
    }

    if (updated.partnerId) {
      const io = getIO();
      io.to(updated.partnerId).emit("partner:update", {
        id: userId,
        avatarUrl: updated.avatarUrl
      });
    }
    res.json({ avatarUrl: updated.avatarUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Avatar upload failed" });
  }
}

export async function uploadActivityImages(req, res) {
  try {
    const userId = req.user.userId;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images" });
    }

    // Lazy cleanup expired (DB only, Cloudinary deletion handled separately)
    await prisma.activityImage.deleteMany({
      where: { userId, createdAt: { lt: activityCutoffDate() } }
    });

    // Upload each buffer
    const uploads = await Promise.all(
      req.files.map(f =>
        uploadBuffer(f.buffer, {
          folder: "myapp/activity",
          transformation: [{ width: 1080, height: 1080, crop: "limit" }]
        })
      )
    );

    const created = await prisma.$transaction(
      uploads.map(u =>
        prisma.activityImage.create({
          data: {
            userId,
            url: u.secure_url,
            publicId: u.public_id
          }
        })
      )
    );

    const partnerInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { partnerId: true }
    });

    if (partnerInfo?.partnerId) {
      // Notify partner via WebSocket and push notification
      await notifyPartner(
        partnerInfo.partnerId,
        "partner:activityImages",
        {
          userId,
          images: created.map(c => ({
            id: c.id,
            url: c.url,
            createdAt: c.createdAt
          }))
        },
        () => ({ 
          body: `${created.length} new activity image${created.length > 1 ? "s" : ""} from your partner`,
          data: { 
            type: "activityImages", 
            count: created.length,
            userId,
            imageIds: created.map(c => c.id)
          } 
        })
      );
    }



    res.json({
      uploaded: created.map(c => ({
        id: c.id,
        url: c.url,
        createdAt: c.createdAt
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
}

export async function getActiveActivityImages(req, res) {
  try {
    const { id } = req.params;
    const cutoff = activityCutoffDate();

    // Purge expired (DB + Cloudinary)
    const expired = await prisma.activityImage.findMany({
      where: { userId: id, createdAt: { lt: cutoff } },
      select: { id: true, publicId: true }
    });

    if (expired.length) {
      await prisma.activityImage.deleteMany({
        where: { id: { in: expired.map(e => e.id) } }
      });
      // Batch destroy
      const publicIds = expired.filter(e => e.publicId).map(e => e.publicId);
      if (publicIds.length) {
        // Cloudinary bulk delete
        for (const chunk of chunkArray(publicIds, 100)) {
          cloudinary.api.delete_resources(chunk).catch(()=>{});
        }
      }
    }

    const active = await prisma.activityImage.findMany({
      where: { userId: id, createdAt: { gte: cutoff } },
      orderBy: { createdAt: "asc" }
    });

    res.json(active);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Fetch failed" });
  }
}

// Helper for chunking
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function setStatusImageSet(req, res) {
  try {
    const userId = req.user.userId;
    const { statusImageSet } = req.body; // e.g., "default", "1", "2", etc.
    const validSets = ["default", "1", "2"]; // Define valid sets
    if (!validSets.includes(statusImageSet)) {
      return res.status(400).json({ error: "Invalid status image set" });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { statusImageSet },
      select: { id: true, statusImageSet: true }
    });
    res.json(updated);
    const socket = getIO();
    // Notify partner via WebSocket
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.partnerId) {
        socket.to(user.partnerId).emit("partner:update", { id: userId, statusImageSet });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Update failed" });
  }
}

// SAVE NOTIFICATION TOKEN
// Save the Expo push notification token for the user
// Return message
export async function saveNotificationToken(req, res) {
  try {
    const userId = req.user.userId;
    const { notificationToken } = req.body;
    console.log("Saving notification token for user", userId, notificationToken);
    if (!notificationToken) {
      return res.status(400).json({ error: "No token provided" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { notificationToken: notificationToken }
    });
    res.json({ message: "Notification token saved" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function clearNotificationToken(req, res) {
  try {
    const userId = req.user.userId;
    await prisma.user.update({
      where: { id: userId },
      data: { notificationToken: null }
    });
    res.json({ message: "Notification token cleared" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}