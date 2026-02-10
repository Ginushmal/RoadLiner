# RoadLiner Project Documentation

## 🛠 Tech Stack & Tools

This project is built using the following modern web technologies. All development and deployment workflows **MUST** adhere to these choices.

### Core Framework

- **Framework**: [React Router 7](https://reactrouter.com/) (formerly Remix 7).
- **Language**: TypeScript.

### Runtime & Package Manager

- **Runtime**: [Bun](https://bun.sh/).
- **Package Manager**: **Bun** (Do not use `npm` or `yarn`).
  - Install dependencies: `bun install`
  - Run dev server: `bun run dev`
  - Run scripts: `bun run <script-name>`

### Frontend & Styling

- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/).
- **Bundler**: [Vite](https://vitejs.dev/).
- **Maps**: [Leaflet](https://leafletjs.com/) via `react-leaflet`.
- **QR Scanning**: `html5-qrcode`.

### Database & Backend

- **Database**: PostgreSQL.
- **ORM**: [Prisma](https://www.prisma.io/) (v7).
  - **Migrations**: Managed via Prisma Migrate (`bun x prisma migrate dev`).
  - **Client**: Generated Prisma Client (Output: `node_modules/@prisma/client`).
- **Docker**: Used for local development (Postgres + App).

### Directory Structure

- `FrontEnd/`: Contains the React Router 7 application.
  - `app/components/ui/`: Reusable UI components (Button, Input, Card).
  - `app/components/map/`: Leaflet map components (`LiveMap`, `MapPicker`).
  - `app/routes/`: Route definitions (Dashboard, Admin, Auth).
  - `prisma/`: Contains schema and configuration.
- `compose.yaml`: Docker Compose configuration for the full stack.

---

## 🏗️ Development Guidelines & Best Practices

**All future implementations MUST strictly follow these rules:**

### 1. Code Style & Architecture
*   **Imports**: NEVER import server-side modules (like `db.server.ts` or Prisma types directly from the generated folder) into client-side components.
    *   Use `import type { UserRole } from "@prisma/client"` for types.
    *   Keep database logic strictly within `loader` and `action` functions.
*   **Maps & Leaflet**: Leaflet requires the `window` object. Always wrap map components in `ClientOnly` (from `remix-utils/client-only`) and `Suspense` to prevent Server-Side Rendering (SSR) crashes.
    *   Example:
        ```tsx
        <ClientOnly fallback={<Fallback />}>
          {() => <Suspense fallback={<Fallback />}><MapComponent /></Suspense>}
        </ClientOnly>
        ```
*   **UI Components**: Use the pre-built components in `app/components/ui` (`Button`, `Card`, `Input`, `ProximityButton`) to maintain visual consistency.
*   **Mobile-First**: Ensure all buttons and inputs have appropriate touch targets (min 44px height) and that layouts stack vertically on small screens.

### 2. Mandatory Workflow: Verify & Fix
To ensure the system remains stable, you **MUST** follow this sequence after **EVERY** code modification request:

1.  **Implement**: Write the code changes.
2.  **Build & Deploy**: Run the Docker command to rebuild the container.
    ```powershell
    docker compose up -d --build
    ```
3.  **Check Logs**: Inspect the logs for build errors or runtime crashes immediately after the container starts.
    ```powershell
    docker logs roadliner-frontend-1 --tail 50
    ```
4.  **Fix Errors**: If the build fails or the server crashes (e.g., "Prisma Client not found", "window is not defined"), you must **fix it immediately** before marking the task as complete. Do not wait for the user to report it.

### 3. Admin & Security
*   **Admin Access**: The Admin Panel (`/admin`) is restricted. Do not allow public registration for the `ADMIN` role.
*   **Credentials**: The seeded admin account is `admin@gmail.com` / `admin`.
*   **Route Management**: Routes are defined by Admin users via the drag-and-drop interface.

### 4. Proximity & Verification
*   **Location**: The system uses GPS to verify physical presence.
*   **DEV GPS**: For testing, use the floating "DEV GPS" panel (bottom-right) to mock your location.
*   **Threshold**: Actions like "Confirm Pickup" or "Unload" are blocked if the user is >500m away from the target.

---

## 🚀 Getting Started (Legacy)

Follow these steps to set up the project locally.

### 1. Prerequisites

- **Docker Desktop**: Ensure Docker is installed and running.
- **Bun**: Install Bun globally (e.g., via `powershell -c "irm bun.sh/install.ps1 | iex"` on Windows).

### 2. Environment Setup

1.  Navigate to the `FrontEnd` directory:
    ```bash
    cd FrontEnd
    ```
2.  Create a `.env` file based on the example:
    ```bash
    cp .env.example .env
    ```
3.  Ensure your `.env` contains the correct database connection string for local development:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
    ```

### 3. Install Dependencies (For Local Tools)

You need to install dependencies locally to run Prisma commands (migrations, studio, etc.).

```bash
cd FrontEnd
bun install
```

### 4. Start Application Stack (One Command)

To run both the PostgreSQL database and the Frontend application together:

```bash
docker compose up -d
```

This starts:

- Database on `localhost:5432`
- Frontend on `localhost:3000`

### 5. Initialize Database (First Run Only)

If this is your first time running the project (or after resetting docker), run migrations to set up the tables:

```bash
cd FrontEnd


```

_(This command requires the database to be running first)_

---

## 🗄️ Database Management

### Workflow

- **Modify Schema**: Edit `FrontEnd/prisma/schema.prisma`.
- **Create Migration**: Run `bun x prisma migrate dev --name <migration_name>` in `FrontEnd/`.
- **Generate Client**: Run `bun x prisma generate` (automatically happens after migrate, but run manually if types are out of sync).

### Prisma Studio

To visually inspect and manage your database data:

```bash
cd FrontEnd
bun x prisma studio
```

## 📦 Business Overview: RoadLiner

**RoadLiner** is a technology-enabled city-to-city logistics system designed to move small parcels across Sri Lanka effectively.

### 🌐 Core Concept

The system operates like a "shipping liner" but for land transport:

- **Van Network**: Operates on fixed routes and fixed time schedules.
- **Coverage**: Connects 4 major parcel traffic routes across Sri Lanka.
- **Smart Infrastructure**: Integrated **Smart Parcel Stations** are located at key hub points along these routes.

### 🚚 Logistics Ecosystem

The ecosystem connects Senders, Receivers, and Drivers through a seamless process involving:

1.  **RoadLiner Vans**: Act as the primary connector between Smart Parcel Stations.
2.  **Crowdsourced Drivers**: Employed to facilitate first-mile and last-mile connectivity.
3.  **Web App**: Integrated platform for Senders, Receivers, and Crowdsourced Drivers.

### 🔄 Operating Models

#### 1. Standard Dispatch & Delivery

- **First Mile (Sending)**:
  - **Self Drop-off**: Senders place parcels directly in Smart Parcel Stations.
  - **Home Pickup**: Senders choose "Home Delivery" option; a crowdsourced driver picks up the parcel and places it in the nearest station for the RoadLiner van.
- **Last Mile (Receiving)**:
  - **Self Pickup**: Receivers collect directly from the Parcel Station.
  - **Home Delivery**: A crowdsourced driver collects the parcel from the station and delivers it to the receiver's home.

#### 2. On-Route Pickup & Collect

A dynamic feature allowing direct interaction with the RoadLiner van while it is in transit:

- **Step 1 (Sender)**: Selects "On-Route Pickup & Collect" via the app.
- **Step 2 (Driver)**: Sees a map popup notification for a pickup at a specific location on the route and stops to collect the parcel. Details are instantly added to the system.
- **Step 3 (Receiver)**: Tracks the van's location and Estimated Time of Arrival (ETA) to a agreed point on the predefined route.
- **Step 4 (Collection)**: The receiver meets the van at the route point to collect the parcel directly.

---

## 📋 Functional Requirements & Implementation

### 1. User Roles

The application will serve three distinct user types:

1.  **Senders / Receivers**: Regular users who send or receive parcels.
2.  **Crowdsourced Drivers**: Freelance drivers who handle first-mile (Home -> Station) and last-mile (Station -> Home) deliveries.
3.  **RoadLiner Vans**: The core logistics operators managing the main transport routes.

### 2. Core Workflows

#### A. Sending a Package (Sender Flow)

1.  **Parcel Details Form**: Sender inputs size, weight, and parcel type.
2.  **Pickup Selection**:
    - **Parcel Station**: Drop off at a nearby hub.
    - **Home Pickup**: A crowdsourced driver collects it.
    - **On-Route Drop-off**: Meet the RoadLiner van at a specific route point.
3.  **Destination Selection**:
    - **Parcel Station**: Receiver collects from a hub.
    - **Home Delivery**: A crowdsourced driver delivers to receiver's door.
    - **On-Route Pick-up**: Receiver meets the van at a route point.
4.  **Receiver Selection**:
    - **Registered User**: Select from system users.
    - **Guest User**: Enter details; system generates a tracking link. Sender must share this link with the receiver manually.
5.  **Price Calculation**:
    - Formula: `Base Price + (Size * Weight Factor) + (RoadLiner Distance * Rate) + (Pickup/Dropoff Distance * Rate)`.
6.  **Payment**:
    - Mock Payment Portal: Simulate successful transaction.

#### B. Receiving a Package (Receiver Flow)

1.  **Notification**: Receiver gets notified of incoming parcel.
2.  **Guest Access**:
    - If Guest: Access system via shared link (mock login/session).
    - Functionality: View parcel details, tracking, and ETA only for that specific parcel.
3.  **Tracking**: View current status (e.g., "At Station", "In Transit", "Out for Delivery") and live location.
4.  **Verification**:
    - System generates a **Unique QR Code** for each parcel (physically stuck on the box).
    - Receiver MUST scan this QR code via the app (User or Guest view) to confirm receipt and complete the order.

#### C. Crowdsourced Driver Flow (Home Pickup/Delivery)

1.  **Job Board**: Drivers see available "Home Pickup" or "Home Delivery" requests nearby.
    - Details: Parcel size, location, earnings.
2.  **Job Acceptance**: Driver can accept one or multiple parcels based on capacity.
3.  **Execution**:
    - **Pickup**: Collect from Sender -> Deliver to designated Parcel Station.
    - **Delivery**: Collect from Parcel Station -> Deliver to Receiver.

#### D. RoadLiner Van Flow

1.  **Route Interface**: dedicated view showing the fixed route.
2.  **Stops Management**:
    - **Parcel Stations**: List of parcels to load/unload at each hub.
    - **On-Route Pickups**: Map notification for specific stop points to collect from Senders.
    - **On-Route Drop-offs**: Map notification for specific stop points to hand over to Receivers.

### 3. Technical Implementation Details

#### 🔐 Authentication & Guest Access

- **Standard Users**: Regular email/password or OAuth.
- **Guest Receivers**: No account creation required. Access via a generated tokenized URL (e.g., `/track/ parcel-id?token=xyz`). This token grants temporary "Receiver" permissions for that specific order.

#### 📍 Location & Routing

- **Distance Calculation**: Use a simple coordinate-based distance function (Haversine formula) for price estimation.
- **Live Tracking**: Mock location updates based on status changes (e.g., moving from "Station A" to "Station B").

#### 📷 QR Code Verification

- **Generation**: Generate a unique string (UUID) for each parcel upon order creation. Convert to QR code image.
- **Scanning**: Use a web-based QR scanner library (e.g., `react-qr-reader` or `html5-qrcode`) in the Receiver's interface to scan the physical code on delivery.

#### 💳 Payments

- **Mock Portal**: A simple modal accepting any dummy card details. Returns "Success" after a 2-second delay.