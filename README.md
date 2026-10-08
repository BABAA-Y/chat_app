```
# Real-Time Chat Application

A full-stack, real-time messaging platform built with Node.js, Express, MySQL, Socket.io, and React. This application provides instantaneous 1-on-1 chat capabilities with persistent database storage, deterministic conversation routing, and an interactive modern UI styled with Tailwind CSS.

---

## Features

* **Instant Messaging**: Real-time, bidirectional communication powered by WebSockets (`Socket.io`).
* **Message Persistence**: Messages are saved directly to MySQL before broadcasting, ensuring no data loss.
* **Deterministic 1-on-1 Rooms**: Prevents duplicate conversation threads between users by sorting user IDs alphabetically prior to lookups or creation.
* **Historical Chat Retrieval**: REST endpoints fetch chat history with message timestamps, sender details, and avatars via SQL table joins.
* **Interactive UI**:
  * Sidebar displaying available contacts and active profiles.
  * Distinct message bubble styling for sender and receiver.
  * Auto-scrolling message container that stays anchored to the newest message.
  * Real-time connection status indicator.

---

## Tech Stack

### Frontend
* **React** (Vite template)
* **Tailwind CSS** (v4 styling and utility classes)
* **Socket.io Client** (WebSocket client)

### Backend
* **Node.js & Express** (MVC architecture, REST endpoints)
* **Socket.io** (WebSocket server running alongside Express via HTTP wrapper)
* **MySQL** (Relational database management via `mysql2` connection pool)
* **CORS & Dotenv** (Cross-origin security and environment variable management)

---

## Database Architecture

The application relies on three core relational tables:

1. **`users`**: Stores user accounts (`id`, `display_name`, `email`, `avatar_url`, `created_at`).
2. **`conversations`**: Manages unique pairing between two users (`id`, `user_one_id`, `user_two_id`, `created_at`).
3. **`messages`**: Stores chat history linked to conversations (`id`, `conversation_id`, `sender_id`, `message_text`, `created_at`).

---

## How It Works

1. **Room Creation**: When selecting a contact from the sidebar, the client sends a `POST /api/chat/conversations` request. The backend finds an existing room or creates a new conversation ID (`conv_<timestamp>`).
2. **History Loading**: The client makes a `GET /api/chat/messages/:conversationId` request to load prior conversations from MySQL using an inner join on the `users` table.
3. **Socket Subscription**: The client calls `socket.emit('join_room', conversationId)` to join an isolated room.
4. **Message Flow**:
   * Sender emits `send_message` with room ID, sender ID, and text.
   * Server executes an `INSERT INTO messages` query.
   * Server queries the newly inserted row to attach sender metadata.
   * Server emits `receive_message` strictly to sockets within that room.
   * Both clients update their local state and auto-scroll to the latest bubble.

---

## Getting Started

### 1. Prerequisites
* Node.js (v18+)
* MySQL Server running locally or remotely

### 2. Backend Setup
```bash
cd server
npm install

```

Create a `.env` file inside `/server`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chat_app

```

Start the backend server:

```bash
npm run dev

```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev

```

The client will typically run on `http://localhost:5173` and communicate with the backend on `http://localhost:5000`.

```

```
