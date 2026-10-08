const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
  const users = await prisma.user.findMany({ select: { name: true, email: true, role: true, department: true } });
  console.log('\n--- USERS (Total: ' + users.length + ') ---');
  users.slice(0, 8).forEach(u => console.log(`• ${u.name} | ${u.email} | Role: ${u.role} | Dept: ${u.department}`));

  const buildings = await prisma.building.findMany();
  console.log('\n--- BUILDINGS (Total: ' + buildings.length + ') ---');
  buildings.forEach(b => console.log(`• ${b.name} (${b.code}) - Energy Rating: ${b.energyEfficiencyRating}%`));

  const resources = await prisma.resource.findMany({ include: { building: true }, take: 8 });
  console.log('\n--- RESOURCES (Total: 15) ---');
  resources.forEach(r => console.log(`• ${r.name} | Cap: ${r.capacity} seats | Eco Score: ${r.ecoScore}/100 | Power: ${r.basePowerConsumptionKw} kW/h | Building: ${r.building.name}`));

  const bookings = await prisma.booking.findMany({ include: { resource: true, user: true }, take: 8 });
  console.log('\n--- BOOKINGS (Total: ' + bookings.length + ') ---');
  bookings.forEach(b => console.log(`• ${b.bookingCode} | User: ${b.user.name} | Resource: ${b.resource.name} | Status: ${b.status} | Date: ${b.date}`));

  await prisma.$disconnect();
}

list();
