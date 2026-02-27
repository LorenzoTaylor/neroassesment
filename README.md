# Nero Party

## Walkthrough

Heres a quick loom walkthrough

**[Watch the Loom](https://www.loom.com/share/1aea640fc4304ab38c3e8358ddd76fe8)**

---

## Why I built it this way

**Pub/sub with Socket.IO** everything in this app is event driven. Someone adds a song, everyone sees it instantly. Someone votes, the queue updates in real time. Polling would have worked but felt pretty wrong for something that's supposed to feel alive and interactive in the moment.

**Spectator mode** modelled a lot  after Jackbox. When you've got a streamer with 200 viewers, you don't want 200 equal participants — that breaks the experience. Spectators beyond the member cap are treated as one collective entity: their votes aggregate into a single +-1 contribution, same as how Jackbox treats the audience. It keeps the game fair while still letting the crowd feel involved.

---

## Setup

### 1. Install deps

```bash
npm install
```

### 2. Set up your Spotify app (feel pretty bad about this one tried to pick the easiest route for you guys and it ended up being the hardest)

1. Go to [developer.spotify.com](https://developer.spotify.com/dashboard) and create an app
2. Add `http://127.0.0.1:5173/callback` as a Redirect URI in your app settings
3. Select Web Playback SDK and Web API for the API's you need
3. Copy your **Client ID** and **Client Secret**
4. Youll need to use spoitfy auth with a premium account to hear the songs later in app

### 3. Create your env files

You need two env files one for the backend (root) and one for the client side/frontend stuff.

**Root `.env`** (at `nero-party/.env`) — used by the backend server:

```env
PORT=3000
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**`frontend/.env`** (at `nero-party/frontend/.env`) — used by Vite/the browser:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_BACKEND_URL=http://localhost:3000
```

> The `VITE_` prefix is required — Vite only exposes variables prefixed with `VITE_` to the client bundle. The backend credentials (`SPOTIFY_CLIENT_SECRET`) stay in the root `.env` and never touch the frontend.

### 4. Run the database migration

```bash
cd backend && npx prisma migrate dev && cd ..
```

### 5. Start the dev servers

```bash
npm run dev
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

---