import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin User
  const adminEmail = "admin@gmail.com";
  const adminPassword = "admin"; // In a real app, hash this!

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        password: adminPassword,
        role: "ADMIN",
      },
    });
    console.log("Admin user created.");
  } else {
    // Ensure role is admin if it exists
    await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMIN", password: adminPassword }
    });
    console.log("Admin user updated.");
  }

  // 2. Stations (Idempotent upsert logic or delete/create if dev)
  // For dev convenience, let's keep the delete/create strategy for stations/routes but preserve users
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  // Only delete stations if we are sure no parcels refer to them? 
  // In dev it's fine to clear parcels too for clean slate, but let's try to keep data if possible.
  // Actually, easiest for "Defining Routes" testing is a clean slate of Routes/Stations.
  
  // CAUTION: This wipes logistics data but keeps users
  await prisma.driverJob.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.station.deleteMany();

  const stationsData = [
    { name: "Colombo Central Hub", city: "Colombo", latitude: 6.9271, longitude: 79.8612 },
    { name: "Kandy City Center", city: "Kandy", latitude: 7.2906, longitude: 80.6337 },
    { name: "Galle Fort Station", city: "Galle", latitude: 6.0535, longitude: 80.2210 },
    { name: "Jaffna Main Station", city: "Jaffna", latitude: 9.6615, longitude: 80.0255 },
    { name: "Kurunegala Transit Point", city: "Kurunegala", latitude: 7.4863, longitude: 80.3647 },
  ];

  const stations = await Promise.all(
    stationsData.map(s => prisma.station.create({ data: s }))
  );

  console.log(`${stations.length} stations created.`);

  // 3. Routes
  const colombo = stations.find(s => s.city === "Colombo")!;
  const kandy = stations.find(s => s.city === "Kandy")!;
  const galle = stations.find(s => s.city === "Galle")!;
  const jaffna = stations.find(s => s.city === "Jaffna")!;
  const kurunegala = stations.find(s => s.city === "Kurunegala")!;

  // Colombo -> Kandy path
  const pathA = [
      { lat: 6.9271, lng: 79.8612 }, 
      { lat: 7.0840, lng: 80.0098 }, 
      { lat: 7.2450, lng: 80.3500 }, 
      { lat: 7.2906, lng: 80.6337 }
  ];

  const routes = [
    {
      name: "Route A: Colombo - Kandy (Express)",
      path: pathA,
      stops: [
        { stationId: colombo.id, sequenceOrder: 1 },
        { stationId: kandy.id, sequenceOrder: 2 },
      ]
    },
    // ... other routes can be added via Admin Panel now
  ];

  for (const r of routes) {
    await prisma.route.create({
      data: {
        name: r.name,
        path: r.path ? JSON.stringify(r.path) : undefined,
        stops: {
          create: r.stops
        }
      }
    });
  }

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
