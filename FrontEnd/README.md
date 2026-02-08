# RoadLiner - Frontend Application

RoadLiner is a technology-enabled city-to-city logistics system designed to move small parcels across Sri Lanka effectively. This directory contains the frontend application built with React Router 7.

## 🛠 Tech Stack

- **Framework**: [React Router 7](https://reactrouter.com/)
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM**: [Prisma v7](https://www.prisma.io/)
- **Language**: TypeScript

## 🚀 Getting Started

### 1. Prerequisites

- **Bun**: Ensure Bun is installed (`powershell -c "irm bun.sh/install.ps1 | iex"` on Windows).
- **Docker**: For running the PostgreSQL database.

### 2. Setup

1.  **Install dependencies**:
    ```bash
    bun install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and update the `DATABASE_URL` if necessary.
    ```bash
    cp .env.example .env
    ```

3.  **Database Migration**:
    Ensure your database is running (e.g., via Docker Compose in the root) and run migrations:
    ```bash
    bun x prisma migrate dev
    ```

### 3. Development

#### Option A: Running with Docker (Recommended)
From the **root directory**, run:
```bash
docker compose up -d
```
This starts the PostgreSQL database, pgAdmin, and the Frontend application.
- **Frontend**: `http://localhost:3000`
- **pgAdmin**: `http://localhost:5050`

#### Option B: Running Locally with Bun
1.  **Start Database**: Ensure you have a running PostgreSQL instance (or use the one from `docker compose`).
2.  **Run Dev Server**:
    ```bash
    bun run dev
    ```
    The app will be available at `http://localhost:5173`.

### 4. Production Build

```bash
bun run build
bun run start
```

## 🗄️ Database Management

Prisma is configured to generate the client into `app/generated/prisma`.

- **Update Schema**: Edit `prisma/schema.prisma`.
- **Apply Changes**: `bun x prisma migrate dev --name <name>`
- **Prisma Studio**: `bun x prisma studio`

## 📁 Project Structure

- `app/`: Application source code.
  - `routes/`: Page components and routing logic.
  - `db.server.ts`: Prisma client initialization.
  - `generated/prisma/`: Generated Prisma client.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets.

## 📦 Business Context

RoadLiner operates a van network on fixed routes across Sri Lanka, integrating Smart Parcel Stations and crowdsourced drivers for first/last-mile delivery.

Key Workflows:
- **Sender Flow**: Parcel details, pickup selection (Station/Home/On-Route), payment.
- **Receiver Flow**: Notification, tracking, QR code verification.
- **Driver Flow**: Job board for home pickup/delivery.
- **Van Flow**: Route management and stop-based parcel handling.

---
Built with ❤️ for RoadLiner.