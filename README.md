# My App

Cross‑platform couple / partner activity tracker with real‑time status, expiring “activity images” (24h), location & weather context, and customizable status image themes.

## Stack

- Frontend: React Native (Expo), TypeScript/JS, Context API, Socket.IO client.
- Backend: Node.js (ESM), Express, Prisma ORM, PostgreSQL, Socket.IO, Cloudinary (image storage).
- Realtime: Socket.IO rooms (userId / partnerId).
- Auth: JWT (Bearer tokens).
- Images: Uploaded via multer memory storage → Cloudinary. Activity images auto-expire after 24h (DB + Cloudinary cleanup).
- Deployment: Render (API + DB + background scheduled cleanup).  
- Tooling: Prisma Migrate, dotenv.

## Monorepo Structure
```
my-app/ 
├── backend/ 
│ ├── prisma/ 
│ │ ├── schema.prisma 
│ │ └── migrations/ 
│ ├── src/ 
│ │ ├── server.js # Entry 
│ │ ├── app.js # Express app (routes, middleware) 
│ │ ├── routes/ 
│ │ ├── controllers/ 
│ │ ├── middleware/ 
│ │ ├── utils/ 
│ │ │ ├── socket.js 
│ │ │ ├── cloudinary.js 
│ │ │ └── scheduleActivityImageCleanup.js 
│ │ └── generated/ (Prisma client after build) 
│ └── README.md (service specific) 
├── frontend/ 
│ ├── app/ # Expo router / screens 
│ ├──  features/ 
│ ├── components/ 
│ ├── utils/ # authContext, PartnerContext, statusImageMap 
│ ├── constants/ 
│ ├── assets/ 
│ └── README.md
└── README.md
```
## Key Features

- Multi activity images (stories style) per user (24h lifetime).
- Swipe + full-screen viewer with age indicator (e.g. “2h ago”).
- Toggle between activity images and status image set.
- Partner real-time updates: status, images, avatar.
- Status image themes (default / 1 / 2) with pill selector + live preview.
- Weather & timezone display per partner.
- Automated cleanup (DB + Cloudinary) hourly.
- Notification on update