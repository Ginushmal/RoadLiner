import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create Stations
  const stationsData = [
    { name: "Colombo Central Hub", city: "Colombo", latitude: 6.9271, longitude: 79.8612 },
    { name: "Kandy City Center", city: "Kandy", latitude: 7.2906, longitude: 80.6337 },
    { name: "Galle Fort Station", city: "Galle", latitude: 6.0535, longitude: 80.2210 },
    { name: "Jaffna Main Station", city: "Jaffna", latitude: 9.6615, longitude: 80.0255 },
    { name: "Kurunegala Transit Point", city: "Kurunegala", latitude: 7.4863, longitude: 80.3647 },
  ];

  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.station.deleteMany();

  const stations = await Promise.all(
    stationsData.map(s => prisma.station.create({ data: s }))
  );

  const colombo = stations.find(s => s.city === "Colombo")!;
  const kandy = stations.find(s => s.city === "Kandy")!;
  const galle = stations.find(s => s.city === "Galle")!;
  const jaffna = stations.find(s => s.city === "Jaffna")!;
  const kurunegala = stations.find(s => s.city === "Kurunegala")!;

  // 2. Create 4 Major Fixed Routes
  const routes = [
    {
      name: "Route A: Colombo - Kandy (Express)",
      stops: [
        { stationId: colombo.id, sequenceOrder: 1 },
        { stationId: kandy.id, sequenceOrder: 2 },
      ]
    },
    {
      name: "Route B: Southern Coastal (Colombo - Galle)",
      stops: [
        { stationId: colombo.id, sequenceOrder: 1 },
        { stationId: galle.id, sequenceOrder: 2 },
      ]
    },
    {
      name: "Route C: North Gateway (Colombo - Kurunegala - Jaffna)",
      stops: [
        { stationId: colombo.id, sequenceOrder: 1 },
        { stationId: kurunegala.id, sequenceOrder: 2 },
        { stationId: jaffna.id, sequenceOrder: 3 },
      ]
    },
    {
      name: "Route D: Inter-City (Kandy - Jaffna)",
      stops: [
        { stationId: kandy.id, sequenceOrder: 1 },
        { stationId: jaffna.id, sequenceOrder: 2 },
      ]
    }
  ];

  for (const r of routes) {
    await prisma.route.create({
      data: {
        name: r.name,
        stops: {
          create: r.stops
        }
      }
    });
  }

  console.log("Seeding complete: Stations and 4 Fixed Routes created.");
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
