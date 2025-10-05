# Frontend (Expo / React Native)

Cross‑platform partner activity app UI with:
- Realtime partner status & images (Socket.IO)
- Expiring activity images (24h, swipe + full screen)
- Status image theme sets (default / 1 / 2) with live preview
- Weather + timezone display
- Auth (JWT) + partner linking
- Cloudinary-hosted images (secure URLs)

## Tech Stack
- React Native (Expo Router)
- TypeScript / JavaScript mix
- Context API (AuthContext, PartnerContext)
- Socket.IO client
- UI primitives (custom App* components)
- Cloudinary image URLs (no local file serving)

## Project Structure
```
frontend/ 
├─ app/ # Expo Router (screens & layouts) 
│ ├─ auth/ # Login / Register 
│ └─ dashboard/(tabs)/ # Tabbed main UI 
├─ features/ # Feature cards (Activity, Partner info, etc.) 
├─ components/ # Reusable UI 
├─ utils/ # Contexts, helpers, statusImage map 
├─ constants/ # Theme tokens 
├─ assets/ # Images / status sets 
├─ package.json 
└─ README.md
```
## Key Screens / Components
| Component | Purpose |
|-----------|---------|
| ActivityCard | Upload & preview multiple activity images (stories style) |
| PartnerInfoCard | Partner status, images carousel, weather, time |
| AddPartnerCard | Invite / link partner |
| Status image set selector | Pill control + 4‑image preview |


## Install & Run

```bash
npm install
npx expo start
```

## Contexts
| Context | Holds |
|---------|-------|
| AuthContext | user, token, setUser, login/logout |
| PartnerContext | partner live data, socket merge logic |

Merge strategy: append new activity images by id, keep unique, sort by `createdAt`.

## Socket Events (Client Listening)

partner:activityImages # New images only (incremental) 
partner:update # General partner field update (avatar/status) 
partner:status # Legacy status event 
activityImages:expired # (Optional) cleanup notifications

## Styling Conventions
- Dark theme base
- Primary accent: `Colors.light.primary`
- Cards: consistent padding + rounded corners
- Pills: segmented pressable with active background


## Useful Commands
| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Start dev server | `npx expo start` |
| Clear Expo cache | `npx expo start -c` |
| Add RN lib (Expo) | `npx expo install <pkg>` |
| Prebuild (bare) | `npx expo prebuild` |

## Production Builds (EAS)

`eas build --platform android `
`eas build --platform ios`
(Requires EAS setup & login.)