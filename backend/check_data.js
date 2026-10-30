const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Expected demo accounts (see prisma/seed.js)
const EXPECTED = [
  { email: 'admin@campus.com', name: 'Mamta', role: 'ADMIN' },
  { email: 'vineesha@campus.com', name: 'Vineesha', role: 'FACULTY' },
  { email: 'akash@campus.com', name: 'Akash', role: 'FACULTY' },
  { email: 'vikash@campus.com', name: 'Vikash', role: 'FACULTY' },
  { email: 'monisha@campus.com', name: 'Monisha', role: 'STUDENT' },
  { email: 'jushya@campus.com', name: 'Jushya', role: 'STUDENT' },
  { email: 'harishmitha@campus.com', name: 'Harishmitha', role: 'STUDENT' }
];

async function list() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true, department: true, year: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });
  console.log('\n--- USERS (Total: ' + users.length + ') ---');
  users.forEach(u => console.log(`• ${u.name} | ${u.email} | Role: ${u.role} | Dept: ${u.department}${u.year ? ` | ${u.year}` : ''}`));

  console.log('\n--- DEMO ACCOUNT CHECK ---');
  EXPECTED.forEach(e => {
    const found = users.find(u => u.email === e.email);
    if (!found) console.log(`✗ MISSING: ${e.email} (${e.role}) - re-seed the database`);
    else if (found.role !== e.role || found.name !== e.name) console.log(`✗ MISMATCH: ${e.email} is ${found.name}/${found.role}, expected ${e.name}/${e.role}`);
    else console.log(`✓ ${e.email} (${e.name}, ${e.role})`);
  });

  const mappings = await prisma.facultyStudentMap.findMany({
    include: { faculty: { select: { name: true } }, student: { select: { name: true, year: true } } }
  });
  console.log('\n--- FACULTY → STUDENT MAPPING (Total: ' + mappings.length + ') ---');
  mappings.forEach(m => console.log(`• ${m.faculty.name} → ${m.student.name} (${m.student.year || 'no year'})`));

  const assignments = await prisma.teacherSubjectYear.findMany({
    include: { teacher: { select: { name: true } }, subject: true },
    orderBy: [{ year: 'asc' }]
  });
  const byTeacher = {};
  assignments.forEach(a => {
    byTeacher[a.teacher.name] = byTeacher[a.teacher.name] || {};
    byTeacher[a.teacher.name][a.year] = byTeacher[a.teacher.name][a.year] || [];
    byTeacher[a.teacher.name][a.year].push(a.subject.name);
  });
  console.log('\n--- TEACHING ASSIGNMENTS (Total: ' + assignments.length + ') ---');
  Object.entries(byTeacher).forEach(([teacher, years]) => {
    console.log(`• ${teacher}`);
    Object.entries(years).forEach(([year, subjects]) => console.log(`    ${year}: ${subjects.join(', ')}`));
  });

  const buildings = await prisma.building.findMany();
  console.log('\n--- BUILDINGS (Total: ' + buildings.length + ') ---');
  buildings.forEach(b => console.log(`• ${b.name} (${b.code}) - Energy Rating: ${b.energyEfficiencyRating}%`));

  const resourceCount = await prisma.resource.count();
  const resources = await prisma.resource.findMany({ include: { building: true }, take: 8 });
  console.log('\n--- RESOURCES (Total: ' + resourceCount + ', showing ' + resources.length + ') ---');
  resources.forEach(r => console.log(`• ${r.name} | Cap: ${r.capacity} seats | Eco Score: ${r.ecoScore}/100 | Power: ${r.basePowerConsumptionKw} kW/h | Building: ${r.building.name}`));

  const bookingCount = await prisma.booking.count();
  const bookings = await prisma.booking.findMany({
    include: { resource: true, user: true, subject: true },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    take: 8
  });
  console.log('\n--- BOOKINGS (Total: ' + bookingCount + ', showing ' + bookings.length + ') ---');
  bookings.forEach(b => console.log(`• ${b.bookingCode} | User: ${b.user.name} | Resource: ${b.resource.name} | Status: ${b.status} | Date: ${b.date}${b.subject ? ` | ${b.subject.name}` : ''}${b.year ? ` (${b.year})` : ''} | QR: ${b.qrCodeData ? 'yes' : 'no'}`));

  await prisma.$disconnect();
}

list().catch(async (err) => {
  console.error('check_data failed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});