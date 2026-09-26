# SANKALP — National Land Acquisition & Management System (API Foundation)

Production-ready TypeScript + Express backend foundation for **SANKALP** — a government-scale land acquisition orchestration platform.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication & Storage Engine**: Supabase JavaScript Client (`@supabase/supabase-js`)
- **Database**: PostgreSQL (`pg` Connection Pool)
- **Logger**: Custom Chalk-based Request & Error Logger
- **Security**: Helmet, CORS
- **Tooling**: `tsx`, ESLint, Prettier

---

## 📋 Prerequisites

- **Node.js**: `v18+` or `v20+`
- **npm**: `v9+`
- **PostgreSQL Database** or **Supabase Instance**

---

## 🚀 Getting Started

### 1. Installation

Install all required production and development dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your local credentials:

```bash
cp .env.example .env
```

Ensure the following variables are defined in `.env`:

```env
NODE_ENV=development
PORT=5000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

DATABASE_URL=postgresql://postgres:password@localhost:5432/SANKALP_dev

CORS_ORIGIN=http://localhost:3000
```

---

## 🏃 Running the Application

### Development Mode (Auto-reload)

Starts the server with `tsx` watch mode for automatic TypeScript compilation and restart:

```bash
npm run dev
```

### Production Build

Compiles TypeScript source code to `/dist`:

```bash
npm run build
```

### Production Execution

Runs the compiled JavaScript server from `/dist`:

```bash
npm start
```

### Code Formatting & Linting

```bash
# Run ESLint check
npm run lint

# Format codebase with Prettier
npm run format

# Check formatting compliance
npm run format:check
```

---

## 🏥 Health Endpoint

### `GET /health`

Verifies server status and availability.

#### Sample Response:

```json
{
  "success": true,
  "message": "SANKALP API is running",
  "timestamp": "2026-09-20T16:20:00.000Z"
}
```

---

## 🎨 Logging Baseline

The foundation utilizes a custom Chalk logger:

- **Request Log**: Displays timestamp, color-coded HTTP method, path, status code (2xx green, 3xx cyan, 4xx yellow, 5xx red), and response duration (<100ms green, <500ms yellow, >=500ms red).
- **Sensitive Field Redaction**: In development mode, request bodies for `POST`/`PUT`/`PATCH` are logged with sensitive fields (`password`, `confirmPassword`, `currentPassword`, `newPassword`, `token`, `refreshToken`) automatically redacted to `[REDACTED]`.
- **Graceful Shutdown**: Properly closes HTTP server connections and database connection pool on `SIGINT` / `SIGTERM` signals.
