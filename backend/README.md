# Backend

Node.js + Express + Prisma + PostgreSQL + Socket.IO + Cloudinary.

## Stack
- Runtime: Node.js (ES Modules)
- Framework: Express
- DB: PostgreSQL (Prisma ORM)
- Realtime: Socket.IO
- Auth: JWT (Bearer)
- Images: Cloudinary (avatar + 24h activity images)
- Cleanup: Scheduled job (hourly) deleting expired images (DB + Cloudinary)

## Structure
```
backend/
 ├─ prisma/
 │   ├─ schema.prisma
 │   └─ migrations/
 ├─ src/
 │   ├─ app.js                  # Express app (middlewares, routes)
 │   ├─ server.js               # Starts HTTP + Socket.IO + schedulers
 │   ├─ routes/                 # Route definitions
 │   ├─ controllers/            # Business logic
 │   ├─ middleware/             # auth / errors / etc.
 │   ├─ utils/                  # socket, cloudinary, cleanup
 │   ├─ config/                 # env config (if present)
 │   └─ generated/              # Prisma client (build/generated)
 ├─ .env / .env.example
 ├─ package.json
 └─ README.md
```

## Key Features
- Multi activity images (stories style) expire after 24h
- Incremental socket updates (only new images)
- Status image theme selection (`statusImageSet`)
- Partner status / avatar sync
- Hourly cleanup (DB rows + Cloudinary resources)
- Secure JWT-protected endpoints

## Environment Variables (.env)
```
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## Install & Run (Dev)
```bash
npm install
npx prisma migrate dev
npm run dev
```

## Production Migration
```bash
npx prisma migrate deploy
```

## Scripts (package.json)
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

## Prisma
- Change schema → `npx prisma migrate dev --name <change>`
- Deploy → `npx prisma migrate deploy`
- Client generated on install (`postinstall`)

## Image Handling
- Multer memory storage → Cloudinary `upload_stream`
- DB stores `url` (secure_url) + `publicId`
- Expiry: 24h (constant `EXPIRY_MS`)
- Cleanup: `scheduleActivityImageCleanup()` (hourly)
- Optional socket emit for expirations

## Realtime (Socket.IO)
Rooms keyed by userId.
Events (examples):
```
partner:update
partner:activityImages  (new images only)
activityImages:expired  (optional)
```

## Security
- JWT validation in `authMiddleware`
- File size limit (5MB) + mimetype check
- Delete old Cloudinary assets on replacement
- Use HTTPS in production

## Selected Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/auth/login | Login |
| POST | /api/users/avatar | Upload avatar |
| POST | /api/users/activity-images | Upload multiple activity images |
| GET  | /api/users/:id/activity-images | Active images (filtered, prunes expired) |
| PUT  | /api/users/:id/status-image-set | Update status image theme |
| PUT  | /api/users/status | Update status |
| PUT  | /api/users/anniversary | Update anniversary |
| GET  | /api/users/:id | User profile |

(All require JWT except auth endpoints.)

## Cleanup Logic
1. Find expired rows (`createdAt < now - 24h`)
2. Delete rows
3. Batch delete Cloudinary resources (chunks of 100)

## Deployment (Render)
Build command:
```
npm install && npx prisma migrate deploy && npx prisma generate
```
Start command:
```
npm run start
```
Set env vars in Render dashboard.

## Suggested Additions
- OpenAPI / Swagger spec
- Tests (Jest + supertest + socket integration)
- Rate limiting middleware
- CI pipeline (GitHub Actions)
- Monitoring (pino logs / healthcheck)

## License
Add a LICENSE file (MIT recommended).

## Quick Start
```bash
cp .env.example .env
# fill credentials
npm i
npx prisma migrate dev
npm run dev
```


