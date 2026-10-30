/**
 * seed-campus-data.js  —  SAFE, ADDITIVE, IDEMPOTENT seed
 *
 * Adds buildings, resource types, resources, bookings and related records
 * (approvals, check-ins, maintenance, notifications, feedback, audit logs,
 * system settings) on top of the 7 demo accounts that already exist.
 *
 * It NEVER deletes anything and NEVER creates/overwrites users.
 * Safe to run repeatedly: every record is looked up by a natural key first.
 *
 * Run from the backend folder:
 *   node seed-campus-data.js
 *
 * Do NOT run prisma/seed.js against the deployed database — it wipes all tables.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { formatDateInTz } = require('./src/utils/time');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DAY = 86400000;
const dateOffset = (days) => formatDateInTz(new Date(Date.now() + days * DAY));
// App default timezone is Asia/Kolkata (UTC+05:30) -> build timestamps from date + HH:MM
const at = (dateStr, hhmm) => new Date(`${dateStr}T${hhmm}:00+05:30`);
const j = (v) => JSON.stringify(v);

const DEMO_EMAILS = {
  admin: 'admin@campus.com',
  vineesha: 'vineesha@campus.com',
  akash: 'akash@campus.com',
  vikash: 'vikash@campus.com',
  monisha: 'monisha@campus.com',
  jushya: 'jushya@campus.com',
  harishmitha: 'harishmitha@campus.com'
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Put it in backend/.env (never commit it).');
  }
  try {
    console.log(`🌱 Safe seed starting against DB host: ${new URL(process.env.DATABASE_URL).host}`);
  } catch {
    console.log('🌱 Safe seed starting...');
  }

  // -------------------------------------------------------------------------
  // 1. Existing demo users (fetched, never created)
  // -------------------------------------------------------------------------
  const found = await prisma.user.findMany({ where: { email: { in: Object.values(DEMO_EMAILS) } } });
  const U = {};
  for (const [key, email] of Object.entries(DEMO_EMAILS)) {
    U[key] = found.find((u) => u.email === email);
    if (!U[key]) throw new Error(`Demo user ${email} not found. Seed the demo accounts first; this script does not create users.`);
  }
  console.log(`✅ Found ${found.length} existing demo users`);

  // -------------------------------------------------------------------------
  // 2. System settings
  // -------------------------------------------------------------------------
  const settings = [
    { key: 'grace_period_minutes', value: '15', description: 'Grace period before marking un-checked-in bookings as NO_SHOW' },
    { key: 'blackout_dates', value: '', description: 'Comma-separated campus blackout dates in YYYY-MM-DD format' },
    { key: 'system_name', value: 'Campus Resource Management & Eco Booking System', description: 'Application System Name' },
    { key: 'energy_target_kwh', value: '500', description: 'Daily energy consumption target in kWh' }
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // -------------------------------------------------------------------------
  // 3. Subjects, teaching assignments, enrollments, faculty-student mapping
  // -------------------------------------------------------------------------
  const assignments = [
    { who: 'vineesha', subject: 'Engineering Mathematics I', year: '1st Year' },
    { who: 'vineesha', subject: 'Database Management System', year: '1st Year' },
    { who: 'vineesha', subject: 'Computational Problem Solving', year: '1st Year' },
    { who: 'akash', subject: 'Data Structures', year: '2nd Year' },
    { who: 'akash', subject: 'Computer Networks', year: '2nd Year' },
    { who: 'akash', subject: 'Operating Systems', year: '2nd Year' },
    { who: 'akash', subject: 'Cloud Computing', year: '2nd Year' },
    { who: 'vikash', subject: 'Humanities', year: '3rd Year' },
    { who: 'vikash', subject: 'Artificial Intelligence', year: '3rd Year' },
    { who: 'vikash', subject: 'Cyber Security', year: '3rd Year' },
    { who: 'vikash', subject: 'Machine Learning', year: '3rd Year' },
    { who: 'vikash', subject: 'Major Project', year: '3rd Year' }
  ];

  const subjectId = {};
  for (const name of [...new Set(assignments.map((a) => a.subject))]) {
    const s = await prisma.subject.upsert({ where: { name }, update: {}, create: { name, department: 'Computer Science' } });
    subjectId[name] = s.id;
  }

  for (const a of assignments) {
    await prisma.teacherSubjectYear.upsert({
      where: { teacherId_subjectId_year: { teacherId: U[a.who].id, subjectId: subjectId[a.subject], year: a.year } },
      update: {},
      create: { teacherId: U[a.who].id, subjectId: subjectId[a.subject], year: a.year }
    });
  }

  const pairs = [
    { faculty: 'vineesha', student: 'monisha', year: '1st Year' },
    { faculty: 'akash', student: 'jushya', year: '2nd Year' },
    { faculty: 'vikash', student: 'harishmitha', year: '3rd Year' }
  ];
  for (const p of pairs) {
    await prisma.facultyStudentMap.upsert({
      where: { studentId: U[p.student].id },
      update: {},
      create: { facultyId: U[p.faculty].id, studentId: U[p.student].id }
    });
    for (const a of assignments.filter((x) => x.who === p.faculty && x.year === p.year)) {
      const department = U[p.student].department || 'Computer Science';
      await prisma.studentCourseEnrollment.upsert({
        where: {
          studentId_subjectId_department_year: { studentId: U[p.student].id, subjectId: subjectId[a.subject], department, year: p.year }
        },
        update: {},
        create: { studentId: U[p.student].id, subjectId: subjectId[a.subject], department, year: p.year }
      });
    }
  }
  console.log('✅ Subjects, teaching assignments, enrollments, faculty-student map ready');

  // -------------------------------------------------------------------------
  // 4. Buildings
  // -------------------------------------------------------------------------
  const buildingsData = [
    { name: 'Turing Technology Hub', code: 'TECH-HUB', totalFloors: 4, energyEfficiencyRating: 94 },
    { name: 'Cure Hall Science Complex', code: 'SCI-COMPLEX', totalFloors: 5, energyEfficiencyRating: 88 },
    { name: 'Newton Innovation & Engineering Building', code: 'ENG-ENG', totalFloors: 3, energyEfficiencyRating: 91 },
    { name: 'Main Academic Pavilion', code: 'MAIN-PAVILION', totalFloors: 4, energyEfficiencyRating: 82 },
    { name: 'Olympia Athletics & Event Center', code: 'OLYMPIA-CENTER', totalFloors: 2, energyEfficiencyRating: 86 }
  ];
  const bId = {};
  for (const b of buildingsData) {
    const rec = await prisma.building.upsert({ where: { code: b.code }, update: {}, create: b });
    bId[b.code] = rec.id;
  }
  console.log(`✅ ${buildingsData.length} buildings ready`);

  // -------------------------------------------------------------------------
  // 5. Resource types
  // -------------------------------------------------------------------------
  const resourceTypesData = [
    { name: 'Smart Classroom', category: 'SMART_CLASSROOM', description: 'Interactive classroom equipped with dual smartboards, AI camera tracking, and ergonomic seating' },
    { name: 'Computer Lab', category: 'COMPUTER_LAB', description: 'High-performance workstation lab with specialized software suites and gigabit networking' },
    { name: 'Auditorium', category: 'AUDITORIUM', description: 'Large capacity venue with Dolby audio system, stage lighting, and acoustic optimization' },
    { name: 'Seminar Hall', category: 'SEMINAR_HALL', description: 'Medium capacity hall tailored for department symposiums, guest lectures, and workshops' },
    { name: 'Meeting Room', category: 'MEETING_ROOM', description: 'Collaborative conference space with video conferencing bar and digital whiteboard' },
    { name: 'Sports Ground', category: 'SPORTS_GROUND', description: 'Outdoor turf ground equipped with floodlights, spectator seating, and scoreboard' },
    { name: 'Equipment - Projector', category: 'EQUIPMENT', description: 'Portable 4K Laser Ultra Short Throw Projector' },
    { name: 'Equipment - Laptop Suite', category: 'EQUIPMENT', description: 'Cart of 15 High-Performance AI Workstation Laptops for mobile workshops' }
  ];
  const tId = {};
  for (const rt of resourceTypesData) {
    const rec = await prisma.resourceType.upsert({ where: { name: rt.name }, update: {}, create: rt });
    tId[rt.name] = rec.id;
  }
  console.log(`✅ ${resourceTypesData.length} resource types ready`);

  // -------------------------------------------------------------------------
  // 6. Resources (16) — declared in full BEFORE the loop that uses them
  // -------------------------------------------------------------------------
  const IMG = (id) => j([`https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`]);
  const resourcesData = [
    { name: 'Smart Classroom 204 (AI Enabled)', type: 'Smart Classroom', building: 'TECH-HUB', floor: 2, roomNumber: '204', capacity: 60,
      description: 'State-of-the-art smart classroom with high-efficiency inverter climate control, dual smart displays, and eco motion sensors.',
      facilities: ['Projector', 'Air Conditioning', 'Smartboard', 'Wi-Fi 6', 'Audio System', 'Microphone', 'Wheelchair Access'],
      equipment: ['Dual Laser Displays', 'Podium Mic', 'Document Camera'], img: 'photo-1517245386807-bb43f82c33c4',
      start: '08:00', end: '21:00', eff: 95, eco: 94, kw: 1.8 },
    { name: 'Advanced Computing Lab 301', type: 'Computer Lab', building: 'TECH-HUB', floor: 3, roomNumber: '301', capacity: 45,
      description: '45 High-spec RTX workstation PCs, high-density solar energy backed UPS system, and dual 85" display monitors.',
      facilities: ['Workstations (45)', 'Air Conditioning', 'Projector', 'Wi-Fi 6', 'LAN Ports', 'Smart Lighting'],
      equipment: ['RTX 4080 PCs', 'Gigabit Switches', '3D Printer'], img: 'photo-1526374965328-7f61d4dc18c5',
      start: '08:00', end: '22:00', eff: 90, eco: 89, kw: 3.2 },
    { name: 'Alan Turing Grand Auditorium', type: 'Auditorium', building: 'TECH-HUB', floor: 1, roomNumber: '101', capacity: 350,
      description: 'Premier campus auditorium for university keynotes, international conferences, and cultural celebrations.',
      facilities: ['4K Projection System', 'Central AC', 'Dolby Atmos Sound', 'Stage Lighting', 'Live Streaming Setup', 'Backstage Dressing Rooms'],
      equipment: ['Wireless Mics (8)', 'Podium System', 'Control Console'], img: 'photo-1475721027785-f74eccf877e2',
      start: '08:00', end: '22:00', eff: 82, eco: 80, kw: 12.5 },
    { name: 'Bio-Research Seminar Hall A', type: 'Seminar Hall', building: 'SCI-COMPLEX', floor: 1, roomNumber: 'S-102', capacity: 120,
      description: 'Tiered seating hall ideal for scientific presentations, faculty seminars, and thesis defenses.',
      facilities: ['Projector', 'Air Conditioning', 'Sound System', 'Podium Mic', 'Record & Stream Hardware'],
      equipment: ['Laser Pointer', 'Podium Mic', 'HDMI Switcher'], img: 'photo-1544531585-9847b68c8c86',
      start: '08:30', end: '20:00', eff: 88, eco: 86, kw: 4.5 },
    { name: 'Robotics & Automation Lab 105', type: 'Computer Lab', building: 'ENG-ENG', floor: 1, roomNumber: '105', capacity: 30,
      description: 'Equipped with robotic arm testbeds, PCB printing gear, micro-controller stations, and ventilation safety systems.',
      facilities: ['Workstations (20)', 'Solder Fume Extraction', '3D Printers', 'Smartboard', 'Wi-Fi 6'],
      equipment: ['Oscilloscopes', 'Soldering Stations', 'Robotic Arms'], img: 'photo-1581092160607-ee22621dd758',
      start: '08:00', end: '21:00', eff: 87, eco: 85, kw: 3.8 },
    { name: 'Executive Conference Room 402', type: 'Meeting Room', building: 'MAIN-PAVILION', floor: 4, roomNumber: '402', capacity: 20,
      description: 'Sleek executive meeting room with 4K video conferencing, glass whiteboards, and ergonomic lounge seating.',
      facilities: ['4K Video Bar', '75" Touch Display', 'Conference Phone', 'Air Conditioning', 'Coffee & Water Station'],
      equipment: ['Jabra Speakerphone', 'HDMI Wireless Dongles'], img: 'photo-1497366216548-37526070297c',
      start: '08:00', end: '20:00', eff: 92, eco: 92, kw: 1.2 },
    { name: 'Central Football & Athletics Field', type: 'Sports Ground', building: 'OLYMPIA-CENTER', floor: 1, roomNumber: 'FIELD-01', capacity: 500,
      description: 'Standard synthetic turf football field with solar LED floodlights, track lanes, and digital score display.',
      facilities: ['Solar Floodlights', 'Spectator Bleachers', 'Digital Scoreboard', 'Sound Horn System', 'Locker Rooms nearby'],
      equipment: ['Goals & Nets', 'Corner Flags', 'PA System'], img: 'photo-1529900748604-07564a03e7a6',
      start: '06:00', end: '22:00', eff: 96, eco: 97, kw: 0.5 },
    { name: 'Eco-Smart Lecture Hall 110', type: 'Smart Classroom', building: 'MAIN-PAVILION', floor: 1, roomNumber: '110', capacity: 80,
      description: 'Passively cooled green lecture hall featuring natural daylight skylights, solar glass, and zero-emission air purifiers.',
      facilities: ['Interactive Projector', 'Solar Power Backup', 'Smart Air Purifier', 'Acoustic Wall Panels', 'Wi-Fi 6'],
      equipment: ['Wireless Mic', 'Document Scanner'], img: 'photo-1509062522246-3755977927d7',
      start: '08:00', end: '20:00', eff: 98, eco: 98, kw: 1.0 },
    { name: 'Design Thinking & VR Studio 202', type: 'Smart Classroom', building: 'TECH-HUB', floor: 2, roomNumber: '202', capacity: 35,
      description: 'Flexible modular room with movable whiteboard walls, Meta Quest 3 VR headsets, and rapid prototyping tools.',
      facilities: ['VR Headsets (15)', 'Movable Writeable Walls', 'Smart TV', 'High-Speed Wi-Fi', 'Air Conditioning'],
      equipment: ['VR Workstation', 'Post-it & Design Kits'], img: 'photo-1531403009284-440f080d1e12',
      start: '09:00', end: '21:00', eff: 91, eco: 90, kw: 2.1 },
    { name: 'Chemistry Research Lab 304', type: 'Computer Lab', building: 'SCI-COMPLEX', floor: 3, roomNumber: '304', capacity: 25,
      description: 'Specialized chemical analysis lab under scheduled HVAC maintenance routine.',
      facilities: ['Fume Hoods', 'Spectrometer', 'Emergency Shower', 'Chemical Storage', 'Wi-Fi'],
      equipment: ['Analytical Balances', 'Rotary Evaporators'], img: 'photo-1532094349884-543bc11b234d',
      start: '09:00', end: '19:00', eff: 78, eco: 75, kw: 5.0, status: 'MAINTENANCE', maintenanceStatus: 'UNDER_REPAIR' },
    { name: 'Portable 4K Laser Projector Kit #1', type: 'Equipment - Projector', building: 'TECH-HUB', floor: 1, roomNumber: 'EQUIP-AV1', capacity: 1,
      description: 'Battery-powered ultra bright 4K Laser projector with Bluetooth audio speaker and portable screen.',
      facilities: ['4K Resolution', '10,000 Lumens', 'Wireless Casting', 'Carry Case'],
      equipment: ['Tripod Screen', 'HDMI Cables', 'Remote'], img: 'photo-1517694712202-14dd9538aa97',
      start: '08:00', end: '20:00', eff: 95, eco: 96, kw: 0.3 },
    { name: 'Mobile AI Workstation Laptop Cart (15 Laptops)', type: 'Equipment - Laptop Suite', building: 'TECH-HUB', floor: 1, roomNumber: 'EQUIP-LAP1', capacity: 15,
      description: 'Locking mobile charging cart containing 15 high-performance GPU laptops for temporary lab setup in any room.',
      facilities: ['15 GPU Laptops', 'Smart Fast Charging Cart', 'Pre-configured AI Software'],
      equipment: ['Wireless Mice (15)', 'Power Extension Cables'], img: 'photo-1593642632823-8f785ba67e45',
      start: '08:00', end: '20:00', eff: 93, eco: 93, kw: 0.9 },
    { name: 'Multipurpose Indoor Gymnasium', type: 'Sports Ground', building: 'OLYMPIA-CENTER', floor: 1, roomNumber: 'GYM-MAIN', capacity: 200,
      description: 'Hardwood floor indoor court for basketball, badminton, volleyball, and indoor sports events.',
      facilities: ['Electronic Scoreboard', 'Bleachers (200 seats)', 'PA Sound System', 'Climate Control'],
      equipment: ['Basketball Hoops', 'Volleyball Nets', 'Badminton Posts'], img: 'photo-1546519638-68e109498ffc',
      start: '06:00', end: '22:00', eff: 88, eco: 87, kw: 3.5 },
    { name: 'Engineering Seminar Hall B', type: 'Seminar Hall', building: 'ENG-ENG', floor: 2, roomNumber: 'E-201', capacity: 90,
      description: 'Acoustically isolated hall equipped with HD projection and smart response clicker systems.',
      facilities: ['HD Projector', 'Air Conditioning', 'Wireless Audio', 'Wi-Fi 6'],
      equipment: ['Wireless Mics (2)', 'Podium'], img: 'photo-1431540015161-0bf868a2d407',
      start: '08:00', end: '20:00', eff: 89, eco: 88, kw: 3.0 },
    { name: 'Innovation Hub Collaboration Zone 101', type: 'Meeting Room', building: 'TECH-HUB', floor: 1, roomNumber: '101-B', capacity: 15,
      description: 'Open glass meeting capsule designed for team hackathons, project reviews, and brainstorms.',
      facilities: ['55" Touchscreen', 'Glass Whiteboard', 'Wi-Fi 6', 'Smart Outlets'],
      equipment: ['HDMI Cable', 'Whiteboard Markers'], img: 'photo-1522071820081-009f0129c71c',
      start: '08:00', end: '22:00', eff: 96, eco: 95, kw: 0.8 }
  ];

  const R = {}; // resource name -> record
  for (const r of resourcesData) {
    let rec = await prisma.resource.findFirst({ where: { name: r.name } });
    if (!rec) {
      rec = await prisma.resource.create({
        data: {
          name: r.name,
          typeId: tId[r.type],
          buildingId: bId[r.building],
          floor: r.floor,
          roomNumber: r.roomNumber,
          capacity: r.capacity,
          description: r.description,
          facilities: j(r.facilities),
          availableEquipment: j(r.equipment),
          images: IMG(r.img),
          operatingHoursStart: r.start,
          operatingHoursEnd: r.end,
          status: r.status || 'AVAILABLE',
          maintenanceStatus: r.maintenanceStatus || 'NONE',
          energyEfficiencyRating: r.eff,
          ecoScore: r.eco,
          basePowerConsumptionKw: r.kw,
          hourlyCost: 0
        }
      });
    }
    R[r.name] = rec;
  }
  console.log(`✅ ${resourcesData.length} resources ready`);

  const smartClassroom204 = R['Smart Classroom 204 (AI Enabled)'];
  const compLab301 = R['Advanced Computing Lab 301'];
  const auditorium = R['Alan Turing Grand Auditorium'];
  const bioHall = R['Bio-Research Seminar Hall A'];
  const confRoom402 = R['Executive Conference Room 402'];
  const footballField = R['Central Football & Athletics Field'];
  const ecoHall110 = R['Eco-Smart Lecture Hall 110'];
  const chemLab304 = R['Chemistry Research Lab 304'];

  // -------------------------------------------------------------------------
  // 7. Bookings (12) — upsert on bookingCode, subjects/years match assignments
  //    Dates are relative to the day the script runs.
  //    BK-001 is now a COMPLETED past booking (not a stale "checked-in today").
  // -------------------------------------------------------------------------
  const today = dateOffset(0);
  const tomorrow = dateOffset(1);
  const yesterday = dateOffset(-1);
  const threeDaysAgo = dateOffset(-3);
  const fiveDaysAgo = dateOffset(-5);
  const nextWeek = dateOffset(7);

  const qr = (code, user, res, date, startTime, endTime) =>
    j({ bookingCode: code, userId: user.id, resourceId: res.id, date, startTime, endTime, issuedAt: new Date().toISOString() });

  const bookingsData = [
    { bookingCode: 'BK-2026-001', user: U.monisha, res: smartClassroom204, purpose: 'CS401 Senior Project Workshop & Presentation', eventType: 'ACADEMIC', attendeeCount: 40,
      facilities: ['Projector', 'Air Conditioning', 'Smartboard'], date: threeDaysAgo, startTime: '10:00', endTime: '12:00', status: 'CHECKED_OUT',
      checkedInAt: at(threeDaysAgo, '10:02'), checkedOutAt: at(threeDaysAgo, '11:58'), kwh: 3.6, eco: 94 },
    { bookingCode: 'BK-2026-002', user: U.monisha, res: compLab301, purpose: 'Deep Learning Model Training & Lab Sprint', eventType: 'WORKSHOP', attendeeCount: 30,
      facilities: ['Workstations (45)', 'Air Conditioning', 'Wi-Fi 6'], date: tomorrow, startTime: '14:00', endTime: '16:00', status: 'APPROVED', withQr: true, kwh: 6.4, eco: 89 },
    { bookingCode: 'BK-2026-003', user: U.vineesha, res: ecoHall110, purpose: 'Engineering Mathematics I Core Lecture', eventType: 'ACADEMIC', attendeeCount: 75,
      subject: 'Engineering Mathematics I', year: '1st Year', facilities: ['Interactive Projector', 'Solar Power Backup', 'Smart Air Purifier'],
      date: tomorrow, startTime: '09:00', endTime: '11:00', status: 'PENDING', isRecurring: true, recurringPattern: 'WEEKLY', kwh: 2.0, eco: 98 },
    { bookingCode: 'BK-2026-004', user: U.jushya, res: confRoom402, purpose: 'ACM Student Chapter Executive Strategy Meeting', eventType: 'MEETING', attendeeCount: 12,
      facilities: ['4K Video Bar', '75" Touch Display', 'Coffee & Water Station'], date: tomorrow, startTime: '15:00', endTime: '16:30', status: 'PENDING', kwh: 1.8, eco: 92 },
    { bookingCode: 'BK-2026-005', user: U.vineesha, res: auditorium, purpose: 'Annual University AI & Robotics Symposium', eventType: 'EVENT', attendeeCount: 300,
      facilities: ['4K Projection System', 'Central AC', 'Dolby Atmos Sound', 'Stage Lighting'], date: yesterday, startTime: '10:00', endTime: '13:00', status: 'CHECKED_OUT',
      checkedInAt: at(yesterday, '10:00'), checkedOutAt: at(yesterday, '13:00'), kwh: 37.5, eco: 80 },
    { bookingCode: 'BK-2026-006', user: U.harishmitha, res: smartClassroom204, purpose: 'Business Plan Peer Review', eventType: 'WORKSHOP', attendeeCount: 25,
      facilities: ['Projector', 'Air Conditioning'], date: yesterday, startTime: '14:00', endTime: '15:30', status: 'NO_SHOW',
      rejectionReason: 'Auto-released by system after 15-minute grace period expired with no check-in.', kwh: 0, eco: 94 },
    { bookingCode: 'BK-2026-007', user: U.jushya, res: compLab301, purpose: 'IEEE Circuit Simulation Study Session', eventType: 'PERSONAL', attendeeCount: 15,
      facilities: ['Workstations (45)'], date: fiveDaysAgo, startTime: '11:00', endTime: '13:00', status: 'CANCELLED',
      rejectionReason: 'Cancelled by user due to schedule shift.', kwh: 0, eco: 89 },
    { bookingCode: 'BK-2026-008', user: U.akash, res: bioHall, purpose: 'Data Structures Guest Seminar', eventType: 'EVENT', attendeeCount: 110,
      subject: 'Data Structures', year: '2nd Year', facilities: ['Projector', 'Air Conditioning', 'Sound System', 'Podium Mic'],
      date: nextWeek, startTime: '10:00', endTime: '12:30', status: 'PENDING', kwh: 11.25, eco: 86 },
    { bookingCode: 'BK-2026-009', user: U.vikash, res: auditorium, purpose: 'Artificial Intelligence Mid-Term Guest Assembly', eventType: 'EXAM', attendeeCount: 280,
      subject: 'Artificial Intelligence', year: '3rd Year', facilities: ['4K Projection System', 'Central AC', 'Dolby Atmos Sound'],
      date: nextWeek, startTime: '14:00', endTime: '17:00', status: 'APPROVED', withQr: true, kwh: 37.5, eco: 80 },
    { bookingCode: 'BK-2026-010', user: U.monisha, res: ecoHall110, purpose: 'Green Campus Initiative Team Huddle', eventType: 'WORKSHOP', attendeeCount: 50,
      facilities: ['Interactive Projector', 'Smart Air Purifier'], date: fiveDaysAgo, startTime: '15:00', endTime: '17:00', status: 'CHECKED_OUT',
      checkedInAt: at(fiveDaysAgo, '15:01'), checkedOutAt: at(fiveDaysAgo, '17:00'), kwh: 2.0, eco: 98 },
    { bookingCode: 'BK-2026-011', user: U.vineesha, res: smartClassroom204, purpose: 'Database Management System Lecture', eventType: 'ACADEMIC', attendeeCount: 45,
      subject: 'Database Management System', year: '1st Year', facilities: ['Projector', 'Smartboard'],
      date: tomorrow, startTime: '13:00', endTime: '14:00', status: 'APPROVED', withQr: true, kwh: 2.0, eco: 94 },
    { bookingCode: 'BK-2026-012', user: U.akash, res: confRoom402, purpose: 'Computer Networks Seminar', eventType: 'ACADEMIC', attendeeCount: 12,
      subject: 'Computer Networks', year: '2nd Year', facilities: ['Projector'],
      date: tomorrow, startTime: '12:00', endTime: '13:00', status: 'APPROVED', withQr: true, kwh: 1.0, eco: 92 }
  ];

  const B = {}; // bookingCode -> record
  for (const b of bookingsData) {
    const data = {
      bookingCode: b.bookingCode,
      userId: b.user.id,
      resourceId: b.res.id,
      purpose: b.purpose,
      eventType: b.eventType,
      attendeeCount: b.attendeeCount,
      requestedFacilities: j(b.facilities),
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      rejectionReason: b.rejectionReason || null,
      isRecurring: !!b.isRecurring,
      recurringPattern: b.recurringPattern || null,
      qrCodeData: b.withQr || b.status === 'CHECKED_OUT' ? qr(b.bookingCode, b.user, b.res, b.date, b.startTime, b.endTime) : null,
      checkedInAt: b.checkedInAt || null,
      checkedOutAt: b.checkedOutAt || null,
      estimatedEnergyKwh: b.kwh,
      ecoScoreCalculated: b.eco,
      subjectId: b.subject ? subjectId[b.subject] : null,
      year: b.year || null
    };
    // update: {} -> an existing booking (and any status changes made in the app) is left untouched
    B[b.bookingCode] = await prisma.booking.upsert({ where: { bookingCode: b.bookingCode }, update: {}, create: data });
  }
  console.log(`✅ ${bookingsData.length} bookings ready`);

  // -------------------------------------------------------------------------
  // 8. Related records — each guarded by a duplicate check
  // -------------------------------------------------------------------------
  // 8a. Approvals
  for (const b of bookingsData.filter((x) => ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(x.status))) {
    const rec = B[b.bookingCode];
    const exists = await prisma.bookingApproval.findFirst({ where: { bookingId: rec.id, approvedById: U.admin.id } });
    if (!exists) {
      await prisma.bookingApproval.create({
        data: { bookingId: rec.id, approvedById: U.admin.id, status: 'APPROVED', remarks: 'Approved automatically by system rule & admin clearance' }
      });
    }
  }

  // 8b. Check-ins for completed bookings
  for (const b of bookingsData.filter((x) => x.status === 'CHECKED_OUT')) {
    const rec = B[b.bookingCode];
    const exists = await prisma.checkIn.findFirst({ where: { bookingId: rec.id } });
    if (!exists) {
      await prisma.checkIn.create({
        data: { bookingId: rec.id, userId: b.user.id, checkInTime: b.checkedInAt, checkOutTime: b.checkedOutAt, status: 'CHECKED_OUT' }
      });
    }
  }

  // 8c. Maintenance
  const maintenanceData = [
    { res: chemLab304, issue: 'Fume Hood Ventilation Sensor Calibration & Filter Replacement', description: 'Scheduled semi-annual safety audit maintenance for chemistry lab exhaust hoods.',
      priority: 'HIGH', assignedStaff: 'Engineering Facilities Maintenance Team B', status: 'IN_PROGRESS', expectedCompletion: new Date(Date.now() + 3 * DAY) },
    { res: compLab301, issue: 'UPS Battery Module Diagnostics', description: 'Routine load check on backup batteries for Lab 301.',
      priority: 'MEDIUM', assignedStaff: 'Electrical Operations Staff', status: 'REPORTED', expectedCompletion: new Date(Date.now() + 5 * DAY) },
    { res: auditorium, issue: 'Stage Floodlight LED Array Replacement', description: 'Replaced 2 burnt out 200W LED stage spot lamps.',
      priority: 'LOW', assignedStaff: 'AV Technician John Miller', status: 'COMPLETED', expectedCompletion: new Date(Date.now() - 2 * DAY) },
    { res: smartClassroom204, issue: 'AC Thermostat Calibration', description: 'Fine-tuned inverter AC sensor for optimal energy efficiency.',
      priority: 'LOW', assignedStaff: 'Green Energy HVAC Specialist', status: 'COMPLETED', expectedCompletion: new Date(Date.now() - 1 * DAY) },
    { res: footballField, issue: 'Turf Irrigation & Lighting Pole Inspection', description: 'Quarterly field inspection for safety compliance.',
      priority: 'MEDIUM', assignedStaff: 'Grounds & Athletics Team', status: 'REPORTED', expectedCompletion: new Date(Date.now() + 7 * DAY) }
  ];
  for (const m of maintenanceData) {
    const exists = await prisma.maintenance.findFirst({ where: { resourceId: m.res.id, issue: m.issue } });
    if (!exists) {
      const { res, ...rest } = m;
      await prisma.maintenance.create({ data: { ...rest, resourceId: res.id } });
    }
  }

  // 8d. Notifications (dedupe on userId + title + booking code / title)
  const notify = async ({ userId, title, message, type, isRead = false, key }) => {
    const exists = await prisma.notification.findFirst({
      where: key ? { userId, title, message: { contains: key } } : { userId, title }
    });
    if (!exists) await prisma.notification.create({ data: { userId, title, message, type, isRead } });
  };

  // Students are told about approved faculty classes
  for (const b of bookingsData.filter((x) => x.status === 'APPROVED' && x.subject)) {
    const map = await prisma.facultyStudentMap.findFirst({ where: { facultyId: b.user.id } });
    if (map) {
      await notify({
        userId: map.studentId,
        title: 'New class scheduled',
        message: `${b.user.name} has a ${b.subject} class in ${b.res.name} on ${b.date} ${b.startTime}-${b.endTime}. (${b.bookingCode})`,
        type: 'BOOKING_APPROVED',
        key: b.bookingCode
      });
    }
  }
  await notify({ userId: U.monisha.id, title: 'Booking Approved & QR Ready', type: 'BOOKING_APPROVED', key: 'BK-2026-002',
    message: `Your booking (BK-2026-002) for ${compLab301.name} on ${tomorrow} has been APPROVED. Scan your QR code upon arrival.` });
  await notify({ userId: U.monisha.id, title: 'Eco-Score Achievement', type: 'INFO', isRead: true,
    message: 'Great job! Your recent booking scored 94/100 on energy efficiency, saving 2.4 kWh of power.' });
  await notify({ userId: U.vineesha.id, title: 'Class Booking Request Submitted', type: 'BOOKING_CREATED',
    message: `Recurring Engineering Mathematics I lecture request in ${ecoHall110.name} on ${tomorrow} is awaiting admin approval.` });
  await notify({ userId: U.admin.id, title: 'Pending Booking Approvals', type: 'BOOKING_CREATED',
    message: 'You have 3 pending resource booking requests awaiting approval in the Admin portal.' });
  await notify({ userId: U.harishmitha.id, title: 'Resource Auto-Released (No Show)', type: 'NO_SHOW', isRead: true, key: 'BK-2026-006',
    message: 'Your booking BK-2026-006 was auto-released after 15 minutes of inactivity without QR check-in.' });

  // 8e. Feedback — user must be the booking owner
  const feedbackData = [
    { code: 'BK-2026-001', rating: 5, comments: 'Excellent eco-friendly room! High quality AV and smooth AC cooling without unnecessary power drain.',
      resourceCondition: 'EXCELLENT', cleanliness: 'EXCELLENT', equipmentQuality: 'EXCELLENT' },
    { code: 'BK-2026-005', rating: 4, comments: 'Great acoustic system. Stage lighting was bright and responsive.',
      resourceCondition: 'EXCELLENT', cleanliness: 'GOOD', equipmentQuality: 'EXCELLENT' },
    { code: 'BK-2026-010', rating: 5, comments: 'Bright, quiet and very comfortable hall for our huddle.',
      resourceCondition: 'EXCELLENT', cleanliness: 'EXCELLENT', equipmentQuality: 'GOOD' }
  ];
  for (const f of feedbackData) {
    const booking = B[f.code];
    const exists = await prisma.feedback.findFirst({ where: { bookingId: booking.id, userId: booking.userId } });
    if (!exists) {
      const { code, ...rest } = f;
      await prisma.feedback.create({ data: { ...rest, bookingId: booking.id, userId: booking.userId, resourceId: booking.resourceId } });
    }
  }

  // 8f. Audit logs
  const auditLogsData = [
    { userId: U.admin.id, action: 'SYSTEM_INIT', entity: 'SYSTEM', entityId: null, details: 'Campus Resource Management System initialized with sample seed configuration.' },
    { userId: U.monisha.id, action: 'CREATE_BOOKING', entity: 'BOOKING', entityId: 'BK-2026-001', details: `Created booking for ${smartClassroom204.name}` },
    { userId: U.admin.id, action: 'APPROVE_BOOKING', entity: 'BOOKING', entityId: 'BK-2026-001', details: 'Approved student booking with instant QR generation.' },
    { userId: U.monisha.id, action: 'QR_CHECKIN', entity: 'BOOKING', entityId: 'BK-2026-001', details: `Scanned QR code and checked into ${smartClassroom204.name}.` }
  ];
  for (const log of auditLogsData) {
    const exists = await prisma.auditLog.findFirst({
      where: { userId: log.userId, action: log.action, entity: log.entity, entityId: log.entityId }
    });
    if (!exists) await prisma.auditLog.create({ data: log });
  }
  console.log('✅ Approvals, check-ins, maintenance, notifications, feedback, audit logs ready');

  // -------------------------------------------------------------------------
  // 9. Verification
  // -------------------------------------------------------------------------
  const counts = {
    users: await prisma.user.count(),
    buildings: await prisma.building.count(),
    resourceTypes: await prisma.resourceType.count(),
    resources: await prisma.resource.count(),
    bookings: await prisma.booking.count(),
    approvals: await prisma.bookingApproval.count(),
    checkIns: await prisma.checkIn.count(),
    maintenance: await prisma.maintenance.count(),
    notifications: await prisma.notification.count(),
    feedback: await prisma.feedback.count(),
    auditLogs: await prisma.auditLog.count(),
    subjects: await prisma.subject.count(),
    teachingAssignments: await prisma.teacherSubjectYear.count(),
    enrollments: await prisma.studentCourseEnrollment.count(),
    facultyStudentMaps: await prisma.facultyStudentMap.count(),
    systemSettings: await prisma.systemSetting.count()
  };
  console.log('\n📊 Row counts now in the database:');
  console.table(counts);
  console.log('Expected minimums: users>=7, buildings>=5, resourceTypes>=8, resources>=15, bookings>=12.');
  console.log('🎉 Safe seed complete. Re-running it will not create duplicates.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());