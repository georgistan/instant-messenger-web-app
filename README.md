# ChatApp — Instant Messenger

Real-time web chat application built with React and Node.js, supporting multiple channels, file sharing, and emoji.

---

## Tech Stack

| Layer        | Technologies                                   |
|--------------|------------------------------------------------|
| Frontend     | React 19, TypeScript, Vite, Tailwind CSS       |
| Backend      | Node.js, Express 5, TypeScript                 |
| Real-time    | Socket.IO 4 (WebSocket)                        |
| Database     | PostgreSQL via Prisma ORM (hosted on Supabase) |
| Auth         | JWT + Argon2id password hashing                |
| File uploads | Multer                                         |

---

## Features

- **Real-time messaging** — messages appear instantly for all users in the channel via WebSocket
- **Multiple channels** — users can switch between channels; each has its own message history
- **File & image sharing** — upload and preview images inline; download other file types (PDF, ZIP, etc.)
- **Emoji picker** — built-in emoji panel to insert emojis into messages
- **Message search** — search through messages in the current channel with highlighted matches and up/down navigation
- **Message deletion** — users can delete only their own messages; deletion is reflected in real-time for all connected users
- **Optimistic UI** — deleted messages disappear immediately without waiting for server confirmation
- **JWT authentication** — sessions persist via localStorage; token is validated on every protected request
- **Secure logout** — token is revoked server-side on logout

---

## Project Structure

```
instant-messenger-web-app/
├── backend/
│   ├── src/
│   │   └── index.ts          # Express app, Socket.IO, all API routes
│   ├── prisma/
│   │   └── schema.prisma     # Database models (User, Channel, Message)
│   ├── .env.example          # Required environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx    # Main chat area
│   │   │   ├── MessageBubble.tsx # Individual message rendering
│   │   │   ├── Sidebar.tsx       # Channel list + user info
│   │   │   └── LoginModal.tsx    # Register / Login form
│   │   ├── hooks/
│   │   │   ├── UseSocket.ts         # Socket.IO lifecycle + message state
│   │   │   ├── UseMessageSearch.ts  # Search logic and navigation
│   │   │   └── UseFileUpload.ts     # Pending files + preview URLs
│   │   ├── types.ts          # TypeScript interfaces (Message, Channel, User)
│   │   └── App.tsx           # Root component, channel fetching, routing
│   └── .env.example
└── uploads/                  # Uploaded files (auto-created)
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT token |
| POST | `/api/auth/logout` | ✓ | Revoke token server-side |
| GET | `/api/channels` | — | List all channels |
| GET | `/api/channels/:name/messages` | — | Fetch message history |
| DELETE | `/api/messages/:id` | ✓ | Delete own message |
| POST | `/api/upload` | ✓ | Upload a file |

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_channel` | client → server | Join a channel room |
| `send_message` | client → server | Send a new message |
| `receive_message` | server → client | Broadcast new message to room |
| `message_deleted` | server → client | Broadcast deletion to room |

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or a Supabase project)

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd instant-messenger-web-app
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Fill in `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_long_random_secret
PORT=3001
```

```bash
npm install
npx prisma generate
```

### 3. Frontend

```bash
cd frontend
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

```bash
npm install
```

---

## Run

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Connecting from another device (ngrok)

To allow someone on a different network to connect:

1. Start ngrok: `ngrok http 3001`
2. Copy the forwarding URL (e.g. `https://abc123.ngrok-free.app`)
3. Set `VITE_API_URL=https://abc123.ngrok-free.app` in `frontend/.env`
4. Restart the frontend: `Ctrl+C` → `npm run dev`
5. The other person clones the repo, sets the same `VITE_API_URL`, and runs `npm run dev`

> **Note:** The ngrok URL changes on every restart (free tier). Update `VITE_API_URL` on both machines each time and restart the frontend.

---

## Security

- Passwords hashed with **Argon2id** + random 32-byte salt per user
- JWT tokens verified on every protected HTTP request and Socket.IO connection
- Revoked tokens stored server-side on logout
- Login endpoint rate-limited to **10 requests per 15 minutes** per IP
- File uploads validated by MIME type (images, PDF, TXT, ZIP, DOC) and capped at **10 MB**
- Message deletion restricted to the message's author (verified from JWT, not client payload)
