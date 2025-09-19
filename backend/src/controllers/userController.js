import { PrismaClient } from "../generated/prisma/client.js";


const prisma = new PrismaClient();

// GET USER PROFILE
export async function getUserProfile(req, res) {
    try {
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
