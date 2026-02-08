# 🚛 RoadLiner - Smart City-to-City Logistics Platform

**RoadLiner** is a next-generation logistics platform designed to streamline parcel delivery across Sri Lanka. It operates like a "shipping liner" for land transport, utilizing a network of fixed-route vans and crowdsourced drivers to provide efficient, location-aware delivery services.

---

## 🌟 Key Features

### 📦 For Senders
-   **Flexible Sending Options**: Choose from **Station Drop-off**, **Home Pickup**, or **On-Route Handover** (meet the van on the road).
-   **Interactive Map**: Pin your exact pickup and drop-off locations on a map—no need to type complex addresses.
-   **Instant Quotes**: Get real-time price estimates based on parcel size, weight, and distance.
-   **Easy Sharing**: Share a public tracking link with the receiver (even if they don't have an app).

### 🚚 For Crowd Drivers (Freelancers)
-   **Job Board**: View available "First Mile" (Pickup) and "Last Mile" (Delivery) jobs on a map.
-   **Proximity Security**: You can only confirm a pickup or delivery when you are physically within **500 meters** of the location (verified via GPS).
-   **Earnings**: See clear earning potential for each gig.

### 🚌 For Van Operators (Line Haul)
-   **Route Manager**: Select your active route (e.g., Colombo to Kandy) from a predefined list.
-   **Smart Dashboard**: See exactly which parcels to **Load** and **Unload** at each station stop.
-   **Live Route Map**: Visualize your path and upcoming stops.
-   **Dynamic Stops**: Handle "On-Route" pickups and drop-offs directly from the dashboard.

### 🏢 For Admins
-   **Network Management**: Define **Smart Parcel Stations** by pinning them on the map.
-   **Route Builder**: Create and edit logistics routes. Use **Drag-and-Drop** to reorder stops.
-   **Overview**: Monitor the entire network status.

### 👤 For Receivers
-   **Live Tracking**: Watch the parcel's journey on a live map, including the van's simulated location.
-   **Secure Verification**: Confirm receipt by scanning the **QR Code** on the parcel using your phone's camera.
-   **Location Check**: The system ensures you are at the correct delivery location before allowing confirmation.

---

## 🛠️ Technology Stack

This project is built with modern, high-performance tools:
-   **Frontend Framework**: [React Router 7](https://reactrouter.com/) (React 19)
-   **Runtime**: [Bun](https://bun.sh/) (Fast JavaScript runtime)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Database**: PostgreSQL
-   **ORM**: Prisma v7
-   **Maps**: Leaflet (OpenStreetMap)
-   **Containerization**: Docker

---

## 💻 Setup Guide: From Zero to Hero

Follow this guide to set up the project on a brand-new Windows laptop.

### Step 1: Install Prerequisites

1.  **Install VS Code**:
    *   Download and install [Visual Studio Code](https://code.visualstudio.com/).
    *   This is the code editor where you will work.

2.  **Install Git**:
    *   Download and install [Git for Windows](https://git-scm.com/download/win).
    *   During installation, you can just click "Next" through all the default options.

3.  **Install Docker Desktop**:
    *   Download [Docker Desktop](https://www.docker.com/products/docker-desktop/).
    *   Install it and **start it**. You might need to log out and log back in or enable virtualization in your BIOS if asked.
    *   *Verification*: Open PowerShell (search "PowerShell" in Start menu) and type `docker --version`. It should show a version number.

4.  **Install Bun**:
    *   Open PowerShell as Administrator.
    *   Run this command:
        ```powershell
        powershell -c "irm bun.sh/install.ps1 | iex"
        ```
    *   Close PowerShell and open a new one. Type `bun --version` to verify.

5.  **Install Gemini CLI** (Your AI Assistant):
    *   You need Node.js first. Download "LTS" version from [nodejs.org](https://nodejs.org/).
    *   Open PowerShell and run:
        ```powershell
        npm install -g @google/gemini-cli
        ```

### Step 2: Clone the Project

1.  Create a folder for your projects (e.g., in `Documents`).
2.  Right-click inside that folder and select **"Open in Terminal"** or "Git Bash Here".
3.  Run the clone command:
    ```bash
    git clone https://github.com/Ginushmal/RoadLiner.git
    ```
4.  Go into the project folder:
    ```bash
    cd RoadLiner
    ```

### Step 3: Run the Application

We use Docker to run everything (Database + App) with one command.

1.  Make sure Docker Desktop is running.
2.  In your terminal (inside the `RoadLiner` folder), run:
    ```bash
    docker compose up -d --build
    ```
    *   *This might take a few minutes the first time.*
3.  Once it finishes, open your browser and go to:
    👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🎮 User Guide: How to Use RoadLiner

### 🔧 **Developer Tools (Important!)**
Because this uses GPS location, testing on a laptop can be hard. We added a **DEV GPS** tool.
*   Look for the **"DEV GPS"** button in the bottom-right corner.
*   Click it -> **"Pick on Map"** -> Click a location (e.g., a Station) -> **"Set GPS"**.
*   Now the system thinks you are physically at that location! Use this to test "Proximity" features.

### 1. Admin Setup (Do this first!)
1.  Go to `http://localhost:3000/login`.
2.  Login with:
    *   **Email**: `admin@gmail.com`
    *   **Password**: `admin`
3.  You will be taken to the **Admin Dashboard**.
4.  **Create Stations**: Click "Add Station", give it a name, and pin it on the map.
5.  **Create Routes**: Click "Create New Route". Select stations in order (e.g., Station A -> Station B) and save.

### 2. Sending a Parcel (Sender)
1.  Register a new account (select "Send & Receive Parcels").
2.  Click **"Send New Parcel"**.
3.  Fill in details. Select **"Home Pickup"**.
4.  **Pin your home** on the map. The system will find the nearest station automatically.
5.  Pay for the parcel (Mock payment).
6.  You will see a **Tracking ID**.

### 3. Driving the Van (Van Operator)
1.  Register a new account (select "Operate RoadLiner Van").
2.  Select a route from the list (the one you created as Admin).
3.  You will see the **Route Manager**.
4.  **Load Parcels**: If a parcel is at your current station, click "Load". *Use DEV GPS to set your location to the station first!*
5.  **Unload**: When you reach the destination station, click "Unload".

### 4. Delivering (Crowd Driver)
1.  Register a new account (select "Drive & Earn").
2.  Go to **"Find New Jobs"**. You will see pickups/deliveries on the map.
3.  **Accept** a job.
4.  Go to **"My Active Jobs"**.
5.  **Confirm**: Use DEV GPS to set location to the pickup/dropoff point, then click "Confirm".

### 5. Receiving
1.  As a Sender, copy the **Tracking Link** from the parcel page.
2.  Open it in a new tab (simulating the receiver).
3.  When the status is `READY_FOR_PICKUP` or `OUT_FOR_DELIVERY`, a green **"Scan QR Code"** button appears.
4.  Click it. (On a laptop, allow camera access or use the "Enter Manually" option).
5.  Scan/Enter the Tracking ID to complete the order!

---

## 🤖 Developing with Gemini CLI

This project is AI-native. You can use Gemini CLI to add features without being an expert coder.

1.  **Open the Project**: Open the `RoadLiner` folder in **VS Code**.
2.  **Open Terminal**: Press `Ctrl + ~` (tilde) in VS Code.
3.  **Start Gemini**:
    ```bash
    gemini
    ```
4.  **Prompt**: Tell Gemini what you want to do.
    *   *Example*: "Change the color of the buttons to purple."
    *   *Example*: "Add a phone number field to the registration form."
5.  **Apply & Build**:
    *   Gemini will edit the files.
    *   After changes, always run:
        ```bash
        docker compose up -d --build
        ```
    *   This updates the running app with your new code.

---

## 📂 Troubleshooting

*   **"Window is not defined"**: This means map code ran on the server. Ensure map components are lazy-loaded.
*   **"Too far away!"**: You are trying to confirm an action but your GPS location is wrong. Use the **DEV GPS** button to set your location to the target.
*   **Database errors**: If things get messy, you can reset the database by running:
    ```bash
    cd FrontEnd
    bun run prisma/seed.ts
    ```
    *(Note: This resets data to the defaults).*
