const { PrismaClient } = require('@prisma/client');
   const { formatDateInTz } = require('../src/utils/time');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Campus Resource Booking System...');

  // Clean existing data
  await prisma.feedback.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.bookingApproval.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.resourceType.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  console.log('🧹 Cleaned previous database records.');

  // System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'grace_period_minutes', value: '15', description: 'Grace period before marking un-checked-in bookings as NO_SHOW' },
      { key: 'system_name', value: 'Campus Resource Management & Eco Booking System', description: 'Application System Name' },
      { key: 'energy_target_kwh', value: '500', description: 'Daily energy consumption target in kWh' }
    ]
  });

  // Password hashing for demo accounts
  const hashedAdminPassword = await bcrypt.hash('Admin@123', 10);
  const hashedFacultyPassword = await bcrypt.hash('Faculty@123', 10);
  const hashedStudentPassword = await bcrypt.hash('Student@123', 10);

  // Users creation (20 Users)
  const usersData = [
    { name: 'MAMTA', email: 'admin@campus.com', password: hashedAdminPassword, role: 'ADMIN', department: 'IT Administration', phone: '+1 555-0100' },
    { name: 'Prof. Robert Langdon', email: 'faculty@campus.com', password: hashedFacultyPassword, role: 'FACULTY', department: 'Computer Science', phone: '+1 555-0101' },
    { name: 'Alex Johnson', email: 'student@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Computer Science', phone: '+1 555-0102' },

    // Additional Faculty
    { name: 'Dr. Elizabeth Shaw', email: 'elizabeth.shaw@campus.com', password: hashedFacultyPassword, role: 'FACULTY', department: 'Biotechnology', phone: '+1 555-0103' },
    { name: 'Prof. Charles Xavier', email: 'charles.xavier@campus.com', password: hashedFacultyPassword, role: 'FACULTY', department: 'Physics & Engineering', phone: '+1 555-0104' },
    { name: 'Dr. Henry Walton', email: 'henry.walton@campus.com', password: hashedFacultyPassword, role: 'FACULTY', department: 'Humanities & Design', phone: '+1 555-0105' },
    { name: 'Prof. Alan Turing', email: 'alan.turing@campus.com', password: hashedFacultyPassword, role: 'FACULTY', department: 'Mathematics & Data Science', phone: '+1 555-0106' },
    { name: 'Dr. Rosalind Franklin', email: 'rosalind.franklin@campus.com', password: hashedFacultyPassword, role: 'FACULTY', department: 'Chemistry & Bio-Engineering', phone: '+1 555-0107' },

    // Additional Students
    { name: 'Maya Patel', email: 'maya.patel@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Computer Science', phone: '+1 555-0108' },
    { name: 'Liam Davies', email: 'liam.davies@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Electrical Engineering', phone: '+1 555-0109' },
    { name: 'Sophia Chen', email: 'sophia.chen@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Business Administration', phone: '+1 555-0110' },
    { name: 'Marcus Aurelius', email: 'marcus.a@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Philosophy & Design', phone: '+1 555-0111' },
    { name: 'Emma Watson', email: 'emma.watson@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Biotechnology', phone: '+1 555-0112' },
    { name: 'David Miller', email: 'david.miller@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Mechanical Engineering', phone: '+1 555-0113' },
    { name: 'Chloe Grace', email: 'chloe.grace@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Data Science', phone: '+1 555-0114' },
    { name: 'Noah Smith', email: 'noah.smith@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Civil Engineering', phone: '+1 555-0115' },
    { name: 'Olivia Taylor', email: 'olivia.taylor@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Architecture & Fine Arts', phone: '+1 555-0116' },
    { name: 'Ethan Hunt', email: 'ethan.hunt@campus.com', password: hashedStudentPassword, role: 'STUDENT', department: 'Cyber Security', phone: '+1 555-0117' },

    // Additional Admins
    { name: 'Marcus Brody (Facility Ops)', email: 'facilities@campus.com', password: hashedAdminPassword, role: 'ADMIN', department: 'Campus Operations', phone: '+1 555-0118' },
    { name: 'Elena Rostova (Green Energy Lead)', email: 'green.admin@campus.com', password: hashedAdminPassword, role: 'ADMIN', department: 'Sustainability Office', phone: '+1 555-0119' }
  ];

  const users = [];
  for (const u of usersData) {
    const created = await prisma.user.create({ data: u });
    users.push(created);
  }
  console.log(`✅ Seeded ${users.length} Users`);

  const adminUser = users.find(u => u.email === 'admin@campus.com');
  const facultyUser = users.find(u => u.email === 'faculty@campus.com');
  const studentUser = users.find(u => u.email === 'student@campus.com');

  // Seed faculty teaching assignments so the default campus demo accounts can
  // legitimately book academic resources using the year + subject validation.
  const defaultSubjectNames = [
    'Data Structures',
    'Database Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Physics',
    'Biology',
    'Chemistry',
    'Humanities',
    'Mathematics',
    'Artificial Intelligence',
    'Cloud Computing',
    'Cyber Security',
    'Machine Learning',
    'Major Project'
  ];

  const subjectMap = {};
  for (const subjectName of defaultSubjectNames) {
    const subject = await prisma.subject.upsert({
      where: { name: subjectName },
      update: {},
      create: { name: subjectName }
    });
    subjectMap[subjectName] = subject.id;
  }

  const defaultAssignments = [
    { email: 'faculty@campus.com', subject: 'Data Structures', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'faculty@campus.com', subject: 'Database Systems', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'elizabeth.shaw@campus.com', subject: 'Biology', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'charles.xavier@campus.com', subject: 'Physics', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'henry.walton@campus.com', subject: 'Humanities', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'alan.turing@campus.com', subject: 'Mathematics', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'rosalind.franklin@campus.com', subject: 'Chemistry', years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
    { email: 'faculty@campus.com', subject: 'Artificial Intelligence', years: ['4th Year'] },
    { email: 'faculty@campus.com', subject: 'Cloud Computing', years: ['4th Year'] },
    { email: 'faculty@campus.com', subject: 'Cyber Security', years: ['4th Year'] },
    { email: 'faculty@campus.com', subject: 'Machine Learning', years: ['4th Year'] },
    { email: 'faculty@campus.com', subject: 'Major Project', years: ['4th Year'] }
  ];

  for (const assignment of defaultAssignments) {
    const targetUser = users.find(u => u.email === assignment.email);
    if (!targetUser) continue;

    for (const year of assignment.years) {
      await prisma.teacherSubjectYear.upsert({
        where: {
          teacherId_subjectId_year: {
            teacherId: targetUser.id,
            subjectId: subjectMap[assignment.subject],
            year
          }
        },
        update: {},
        create: {
          teacherId: targetUser.id,
          subjectId: subjectMap[assignment.subject],
          year
        }
      });
    }
  }

  console.log('✅ Seeded faculty teaching assignments for default demo accounts.');

  // Buildings Creation
  const buildingsData = [
    { name: 'Turing Technology Hub', code: 'TECH-HUB', totalFloors: 4, energyEfficiencyRating: 94 },
    { name: 'Cure Hall Science Complex', code: 'SCI-COMPLEX', totalFloors: 5, energyEfficiencyRating: 88 },
    { name: 'Newton Innovation & Engineering Building', code: 'ENG-ENG', totalFloors: 3, energyEfficiencyRating: 91 },
    { name: 'Main Academic Pavilion', code: 'MAIN-PAVILION', totalFloors: 4, energyEfficiencyRating: 82 },
    { name: 'Olympia Athletics & Event Center', code: 'OLYMPIA-CENTER', totalFloors: 2, energyEfficiencyRating: 86 }
  ];

  const buildings = [];
  for (const b of buildingsData) {
    const created = await prisma.building.create({ data: b });
    buildings.push(created);
  }
  console.log(`✅ Seeded ${buildings.length} Buildings`);

  // Resource Types
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

  const resourceTypes = [];
  for (const rt of resourceTypesData) {
    const created = await prisma.resourceType.create({ data: rt });
    resourceTypes.push(created);
  }
  console.log(`✅ Seeded ${resourceTypes.length} Resource Types`);

  // Helper maps
  const bMap = Object.fromEntries(buildings.map(b => [b.code, b.id]));
  const rtMap = Object.fromEntries(resourceTypes.map(rt => [rt.category, rt.id]));

  // Resources Creation (16 Resources)
  const resourcesData = [
    {
      name: 'Smart Classroom 204 (AI Enabled)',
      typeId: rtMap['SMART_CLASSROOM'],
      buildingId: bMap['TECH-HUB'],
      floor: 2,
      roomNumber: '204',
      capacity: 60,
      description: 'State-of-the-art smart classroom with high-efficiency inverter climate control, dual smart displays, and eco motion sensors.',
      facilities: JSON.stringify(['Projector', 'Air Conditioning', 'Smartboard', 'Wi-Fi 6', 'Audio System', 'Microphone', 'Wheelchair Access']),
      availableEquipment: JSON.stringify(['Dual Laser Displays', 'Podium Mic', 'Document Camera']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '21:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 95,
      ecoScore: 94,
      basePowerConsumptionKw: 1.8,
      hourlyCost: 0
    },
    {
      name: 'Advanced Computing Lab 301',
      typeId: rtMap['COMPUTER_LAB'],
      buildingId: bMap['TECH-HUB'],
      floor: 3,
      roomNumber: '301',
      capacity: 45,
      description: '45 High-spec RTX workstation PCs, high-density solar energy backed UPS system, and dual 85" display monitors.',
      facilities: JSON.stringify(['Workstations (45)', 'Air Conditioning', 'Projector', 'Wi-Fi 6', 'LAN Ports', 'Smart Lighting']),
      availableEquipment: JSON.stringify(['RTX 4080 PCs', 'Gigabit Switches', '3D Printer']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '22:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 90,
      ecoScore: 89,
      basePowerConsumptionKw: 3.2,
      hourlyCost: 0
    },
    {
      name: 'Alan Turing Grand Auditorium',
      typeId: rtMap['AUDITORIUM'],
      buildingId: bMap['TECH-HUB'],
      floor: 1,
      roomNumber: '101',
      capacity: 350,
      description: 'Premier campus auditorium for university keynotes, international conferences, and cultural celebrations.',
      facilities: JSON.stringify(['4K Projection System', 'Central AC', 'Dolby Atmos Sound', 'Stage Lighting', 'Live Streaming Setup', 'Backstage Dressing Rooms']),
      availableEquipment: JSON.stringify(['Wireless Mics (8)', 'Podium System', 'Control Console']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '22:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 82,
      ecoScore: 80,
      basePowerConsumptionKw: 12.5,
      hourlyCost: 0
    },
    {
      name: 'Bio-Research Seminar Hall A',
      typeId: rtMap['SEMINAR_HALL'],
      buildingId: bMap['SCI-COMPLEX'],
      floor: 1,
      roomNumber: 'S-102',
      capacity: 120,
      description: 'Tiered seating hall ideal for scientific presentations, faculty seminars, and thesis defenses.',
      facilities: JSON.stringify(['Projector', 'Air Conditioning', 'Sound System', 'Podium Mic', 'Record & Stream Hardware']),
      availableEquipment: JSON.stringify(['Laser Pointer', 'Podium Mic', 'HDMI Switcher']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:30',
      operatingHoursEnd: '20:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 88,
      ecoScore: 86,
      basePowerConsumptionKw: 4.5,
      hourlyCost: 0
    },
    {
      name: 'Robotics & Automation Lab 105',
      typeId: rtMap['COMPUTER_LAB'],
      buildingId: bMap['ENG-ENG'],
      floor: 1,
      roomNumber: '105',
      capacity: 30,
      description: 'Equipped with robotic arm testbeds, PCB printing gear, micro-controller stations, and ventilation safety systems.',
      facilities: JSON.stringify(['Workstations (20)', 'Solder Fume Extraction', '3D Printers', 'Smartboard', 'Wi-Fi 6']),
      availableEquipment: JSON.stringify(['Oscilloscopes', 'Soldering Stations', 'Robotic Arms']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '21:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 87,
      ecoScore: 85,
      basePowerConsumptionKw: 3.8,
      hourlyCost: 0
    },
    {
      name: 'Executive Conference Room 402',
      typeId: rtMap['MEETING_ROOM'],
      buildingId: bMap['MAIN-PAVILION'],
      floor: 4,
      roomNumber: '402',
      capacity: 20,
      description: 'Sleek executive meeting room with 4K video conferencing, glass whiteboards, and ergonomic lounge seating.',
      facilities: JSON.stringify(['4K Video Bar', '75" Touch Display', 'Conference Phone', 'Air Conditioning', 'Coffee & Water Station']),
      availableEquipment: JSON.stringify(['Jabra Speakerphone', 'HDMI Wireless Dongles']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 92,
      ecoScore: 92,
      basePowerConsumptionKw: 1.2,
      hourlyCost: 0
    },
    {
      name: 'Central Football & Athletics Field',
      typeId: rtMap['SPORTS_GROUND'],
      buildingId: bMap['OLYMPIA-CENTER'],
      floor: 1,
      roomNumber: 'FIELD-01',
      capacity: 500,
      description: 'Standard synthetic turf football field with solar LED floodlights, track lanes, and digital score display.',
      facilities: JSON.stringify(['Solar Floodlights', 'Spectator Bleachers', 'Digital Scoreboard', 'Sound Horn System', 'Locker Rooms nearby']),
      availableEquipment: JSON.stringify(['Goals & Nets', 'Corner Flags', 'PA System']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '06:00',
      operatingHoursEnd: '22:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 96,
      ecoScore: 97,
      basePowerConsumptionKw: 0.5,
      hourlyCost: 0
    },
    {
      name: 'Eco-Smart Lecture Hall 110',
      typeId: rtMap['SMART_CLASSROOM'],
      buildingId: bMap['MAIN-PAVILION'],
      floor: 1,
      roomNumber: '110',
      capacity: 80,
      description: 'Passively cooled green lecture hall featuring natural daylight skylights, solar glass, and zero-emission air purifiers.',
      facilities: JSON.stringify(['Interactive Projector', 'Solar Power Backup', 'Smart Air Purifier', 'Acoustic Wall Panels', 'Wi-Fi 6']),
      availableEquipment: JSON.stringify(['Wireless Mic', 'Document Scanner']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 98,
      ecoScore: 98,
      basePowerConsumptionKw: 1.0,
      hourlyCost: 0
    },
    {
      name: 'Design Thinking & VR Studio 202',
      typeId: rtMap['SMART_CLASSROOM'],
      buildingId: bMap['TECH-HUB'],
      floor: 2,
      roomNumber: '202',
      capacity: 35,
      description: 'Flexible modular room with movable whiteboard walls, Meta Quest 3 VR headsets, and rapid prototyping tools.',
      facilities: JSON.stringify(['VR Headsets (15)', 'Movable Writeable Walls', 'Smart TV', 'High-Speed Wi-Fi', 'Air Conditioning']),
      availableEquipment: JSON.stringify(['VR Workstation', 'Post-it & Design Kits']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '09:00',
      operatingHoursEnd: '21:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 91,
      ecoScore: 90,
      basePowerConsumptionKw: 2.1,
      hourlyCost: 0
    },
    {
      name: 'Chemistry Research Lab 304',
      typeId: rtMap['COMPUTER_LAB'],
      buildingId: bMap['SCI-COMPLEX'],
      floor: 3,
      roomNumber: '304',
      capacity: 25,
      description: 'Specialized chemical analysis lab under scheduled HVAC maintenance routine.',
      facilities: JSON.stringify(['Fume Hoods', 'Spectrometer', 'Emergency Shower', 'Chemical Storage', 'Wi-Fi']),
      availableEquipment: JSON.stringify(['Analytical Balances', 'Rotary Evaporators']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '09:00',
      operatingHoursEnd: '19:00',
      status: 'MAINTENANCE',
      maintenanceStatus: 'UNDER_REPAIR',
      energyEfficiencyRating: 78,
      ecoScore: 75,
      basePowerConsumptionKw: 5.0,
      hourlyCost: 0
    },
    {
      name: 'Portable 4K Laser Projector Kit #1',
      typeId: rtMap['EQUIPMENT'],
      buildingId: bMap['TECH-HUB'],
      floor: 1,
      roomNumber: 'EQUIP-AV1',
      capacity: 1,
      description: 'Battery-powered ultra bright 4K Laser projector with Bluetooth audio speaker and portable screen.',
      facilities: JSON.stringify(['4K Resolution', '10,000 Lumens', 'Wireless Casting', 'Carry Case']),
      availableEquipment: JSON.stringify(['Tripod Screen', 'HDMI Cables', 'Remote']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 95,
      ecoScore: 96,
      basePowerConsumptionKw: 0.3,
      hourlyCost: 0
    },
    {
      name: 'Mobile AI Workstation Laptop Cart (15 Laptops)',
      typeId: rtMap['EQUIPMENT'],
      buildingId: bMap['TECH-HUB'],
      floor: 1,
      roomNumber: 'EQUIP-LAP1',
      capacity: 15,
      description: 'Locking mobile charging cart containing 15 high-performance GPU laptops for temporary lab setup in any room.',
      facilities: JSON.stringify(['15 GPU Laptops', 'Smart Fast Charging Cart', 'Pre-configured AI Software']),
      availableEquipment: JSON.stringify(['Wireless Mice (15)', 'Power Extension Cables']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 93,
      ecoScore: 93,
      basePowerConsumptionKw: 0.9,
      hourlyCost: 0
    },
    {
      name: 'Multipurpose Indoor Gymnasium',
      typeId: rtMap['SPORTS_GROUND'],
      buildingId: bMap['OLYMPIA-CENTER'],
      floor: 1,
      roomNumber: 'GYM-MAIN',
      capacity: 200,
      description: 'Hardwood floor indoor court for basketball, badminton, volleyball, and indoor sports events.',
      facilities: JSON.stringify(['Electronic Scoreboard', 'Bleachers (200 seats)', 'PA Sound System', 'Climate Control']),
      availableEquipment: JSON.stringify(['Basketball Hoops', 'Volleyball Nets', 'Badminton Posts']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '06:00',
      operatingHoursEnd: '22:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 88,
      ecoScore: 87,
      basePowerConsumptionKw: 3.5,
      hourlyCost: 0
    },
    {
      name: 'Engineering Seminar Hall B',
      typeId: rtMap['SEMINAR_HALL'],
      buildingId: bMap['ENG-ENG'],
      floor: 2,
      roomNumber: 'E-201',
      capacity: 90,
      description: 'Acoustically isolated hall equipped with HD projection and smart response clicker systems.',
      facilities: JSON.stringify(['HD Projector', 'Air Conditioning', 'Wireless Audio', 'Wi-Fi 6']),
      availableEquipment: JSON.stringify(['Wireless Mics (2)', 'Podium']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 89,
      ecoScore: 88,
      basePowerConsumptionKw: 3.0,
      hourlyCost: 0
    },
    {
      name: 'Innovation Hub Collaboration Zone 101',
      typeId: rtMap['MEETING_ROOM'],
      buildingId: bMap['TECH-HUB'],
      floor: 1,
      roomNumber: '101-B',
      capacity: 15,
      description: 'Open glass meeting capsule designed for team hackathons, project reviews, and brainstorms.',
      facilities: JSON.stringify(['55" Touchscreen', 'Glass Whiteboard', 'Wi-Fi 6', 'Smart Outlets']),
      availableEquipment: JSON.stringify(['HDMI Cable', 'Whiteboard Markers']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80']),
      operatingHoursStart: '08:00',
      operatingHoursEnd: '22:00',
      status: 'AVAILABLE',
      energyEfficiencyRating: 96,
      ecoScore: 95,
      basePowerConsumptionKw: 0.8,
      hourlyCost: 0
    }
  ];

  const resources = [];
  for (const r of resourcesData) {
    const created = await prisma.resource.create({ data: r });
    resources.push(created);
  }
  console.log(`✅ Seeded ${resources.length} Resources`);

  const smartClassroom204 = resources.find(r => r.name.includes('Smart Classroom 204'));
  const compLab301 = resources.find(r => r.name.includes('Advanced Computing Lab 301'));
  const auditorium = resources.find(r => r.name.includes('Alan Turing Grand Auditorium'));
  const ecoHall110 = resources.find(r => r.name.includes('Eco-Smart Lecture Hall 110'));
  const confRoom402 = resources.find(r => r.name.includes('Executive Conference Room 402'));
  const chemLab304 = resources.find(r => r.name.includes('Chemistry Research Lab 304'));

  // Today's Date String format YYYY-MM-DD
  const today = new Date();
   const { formatDateInTz } = require('../src/utils/time');
   const formatDate = (d) => formatDateInTz(d);
  const todayStr = formatDate(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 5);
  const pastDateStr = formatDate(pastDate);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = formatDate(nextWeek);

  // Bookings Creation (22 Bookings across states)
  const bookingsData = [
    // 1. Student Active Checked-in booking for today
    {
      bookingCode: 'BK-2026-001',
      userId: studentUser.id,
      resourceId: smartClassroom204.id,
      purpose: 'CS401 Senior Project Workshop & Presentation',
      eventType: 'ACADEMIC',
      attendeeCount: 40,
      requestedFacilities: JSON.stringify(['Projector', 'Air Conditioning', 'Smartboard']),
      date: todayStr,
      startTime: '10:00',
      endTime: '12:00',
      status: 'CHECKED_IN',
      qrCodeData: JSON.stringify({ bookingCode: 'BK-2026-001', userId: studentUser.id, resourceId: smartClassroom204.id, expiresAt: todayStr + 'T12:00:00' }),
      checkedInAt: new Date(),
      estimatedEnergyKwh: 3.6,
      ecoScoreCalculated: 94
    },

    // 2. Student Upcoming Approved booking for today
    {
      bookingCode: 'BK-2026-002',
      userId: studentUser.id,
      resourceId: compLab301.id,
      purpose: 'Deep Learning Model Training & Lab Sprint',
      eventType: 'WORKSHOP',
      attendeeCount: 30,
      requestedFacilities: JSON.stringify(['Workstations (45)', 'Air Conditioning', 'Wi-Fi 6']),
      date: todayStr,
      startTime: '14:00',
      endTime: '16:00',
      status: 'APPROVED',
      qrCodeData: JSON.stringify({ bookingCode: 'BK-2026-002', userId: studentUser.id, resourceId: compLab301.id, expiresAt: todayStr + 'T16:00:00' }),
      estimatedEnergyKwh: 6.4,
      ecoScoreCalculated: 89
    },

    // 3. Faculty Approved Class booking for tomorrow
    {
      bookingCode: 'BK-2026-003',
      userId: facultyUser.id,
      resourceId: ecoHall110.id,
      purpose: 'CS202 Data Structures & Algorithms Core Lecture',
      eventType: 'ACADEMIC',
      attendeeCount: 75,
      requestedFacilities: JSON.stringify(['Interactive Projector', 'Solar Power Backup', 'Smart Air Purifier']),
      date: tomorrowStr,
      startTime: '09:00',
      endTime: '11:00',
      status: 'APPROVED',
      isRecurring: true,
      recurringPattern: 'WEEKLY',
      qrCodeData: JSON.stringify({ bookingCode: 'BK-2026-003', userId: facultyUser.id, resourceId: ecoHall110.id, expiresAt: tomorrowStr + 'T11:00:00' }),
      estimatedEnergyKwh: 2.0,
      ecoScoreCalculated: 98
    },

    // 4. Pending Booking from Student
    {
      bookingCode: 'BK-2026-004',
      userId: users[8].id, // Maya Patel
      resourceId: confRoom402.id,
      purpose: 'ACM Student Chapter Executive Strategy Meeting',
      eventType: 'MEETING',
      attendeeCount: 12,
      requestedFacilities: JSON.stringify(['4K Video Bar', '75" Touch Display', 'Coffee & Water Station']),
      date: tomorrowStr,
      startTime: '15:00',
      endTime: '16:30',
      status: 'PENDING',
      estimatedEnergyKwh: 1.8,
      ecoScoreCalculated: 92
    },

    // 5. Past Checked Out booking (Completed)
    {
      bookingCode: 'BK-2026-005',
      userId: facultyUser.id,
      resourceId: auditorium.id,
      purpose: 'Annual University AI & Robotics Symposium',
      eventType: 'EVENT',
      attendeeCount: 300,
      requestedFacilities: JSON.stringify(['4K Projection System', 'Central AC', 'Dolby Atmos Sound', 'Stage Lighting']),
      date: yesterdayStr,
      startTime: '10:00',
      endTime: '13:00',
      status: 'CHECKED_OUT',
      checkedInAt: new Date(yesterday.getTime() - 24 * 3600 * 1000 + 10 * 3600 * 1000),
      checkedOutAt: new Date(yesterday.getTime() - 24 * 3600 * 1000 + 13 * 3600 * 1000),
      estimatedEnergyKwh: 37.5,
      ecoScoreCalculated: 80
    },

    // 6. No-Show Auto Released Booking (Past)
    {
      bookingCode: 'BK-2026-006',
      userId: users[10].id, // Sophia Chen
      resourceId: smartClassroom204.id,
      purpose: 'Business Plan Peer Review',
      eventType: 'WORKSHOP',
      attendeeCount: 25,
      requestedFacilities: JSON.stringify(['Projector', 'Air Conditioning']),
      date: yesterdayStr,
      startTime: '14:00',
      endTime: '15:30',
      status: 'NO_SHOW',
      rejectionReason: 'Auto-released by system after 15-minute grace period expired with no check-in.',
      estimatedEnergyKwh: 0.0,
      ecoScoreCalculated: 94
    },

    // 7. Cancelled Booking
    {
      bookingCode: 'BK-2026-007',
      userId: users[9].id, // Liam Davies
      resourceId: compLab301.id,
      purpose: 'IEEE Circuit Simulation Study Session',
      eventType: 'PERSONAL',
      attendeeCount: 15,
      requestedFacilities: JSON.stringify(['Workstations (45)']),
      date: pastDateStr,
      startTime: '11:00',
      endTime: '13:00',
      status: 'CANCELLED',
      rejectionReason: 'Cancelled by user due to schedule shift.',
      estimatedEnergyKwh: 0.0,
      ecoScoreCalculated: 89
    },

    // 8. Future Pending Booking
    {
      bookingCode: 'BK-2026-008',
      userId: users[3].id, // Dr. Elizabeth Shaw
      resourceId: resources[3].id, // Bio Seminar Hall
      purpose: 'Biotech Synthetic Biology Guest Seminar',
      eventType: 'EVENT',
      attendeeCount: 110,
      requestedFacilities: JSON.stringify(['Projector', 'Air Conditioning', 'Sound System', 'Podium Mic']),
      date: nextWeekStr,
      startTime: '10:00',
      endTime: '12:30',
      status: 'PENDING',
      estimatedEnergyKwh: 11.25,
      ecoScoreCalculated: 86
    },

    // 9. Approved Booking Next Week
    {
      bookingCode: 'BK-2026-009',
      userId: users[4].id, // Prof. Charles Xavier
      resourceId: auditorium.id,
      purpose: 'Quantum Physics Mid-Term Guest Assembly',
      eventType: 'EXAM',
      attendeeCount: 280,
      requestedFacilities: JSON.stringify(['4K Projection System', 'Central AC', 'Dolby Atmos Sound']),
      date: nextWeekStr,
      startTime: '14:00',
      endTime: '17:00',
      status: 'APPROVED',
      qrCodeData: JSON.stringify({ bookingCode: 'BK-2026-009', userId: users[4].id, resourceId: auditorium.id, expiresAt: nextWeekStr + 'T17:00:00' }),
      estimatedEnergyKwh: 37.5,
      ecoScoreCalculated: 80
    },

    // 10. Checked Out Past Booking
    {
      bookingCode: 'BK-2026-010',
      userId: studentUser.id,
      resourceId: ecoHall110.id,
      purpose: 'Green Campus Initiative Team Huddle',
      eventType: 'WORKSHOP',
      attendeeCount: 50,
      requestedFacilities: JSON.stringify(['Interactive Projector', 'Smart Air Purifier']),
      date: pastDateStr,
      startTime: '15:00',
      endTime: '17:00',
      status: 'CHECKED_OUT',
      checkedInAt: new Date(pastDate.getTime() + 15 * 3600 * 1000),
      checkedOutAt: new Date(pastDate.getTime() + 17 * 3600 * 1000),
      estimatedEnergyKwh: 2.0,
      ecoScoreCalculated: 98
    }
  ];

  const bookings = [];
  for (const b of bookingsData) {
    const created = await prisma.booking.create({ data: b });
    bookings.push(created);

    // Create approval record for APPROVED or CHECKED_IN or CHECKED_OUT
    if (['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(created.status)) {
      await prisma.bookingApproval.create({
        data: {
          bookingId: created.id,
          approvedById: adminUser.id,
          status: 'APPROVED',
          remarks: 'Approved automatically by system rule & admin clearance'
        }
      });
    }
  }
  console.log(`✅ Seeded ${bookings.length} Bookings with approval logs`);

  // CheckIn records for checked in / checked out bookings
  const checkedInBooking = bookings.find(b => b.status === 'CHECKED_IN');
  if (checkedInBooking) {
    await prisma.checkIn.create({
      data: {
        bookingId: checkedInBooking.id,
        userId: checkedInBooking.userId,
        checkInTime: new Date(),
        status: 'CHECKED_IN'
      }
    });
  }

  const checkedOutBooking = bookings.find(b => b.status === 'CHECKED_OUT');
  if (checkedOutBooking) {
    await prisma.checkIn.create({
      data: {
        bookingId: checkedOutBooking.id,
        userId: checkedOutBooking.userId,
        checkInTime: new Date(Date.now() - 86400000),
        checkOutTime: new Date(Date.now() - 86400000 + 7200000),
        status: 'CHECKED_OUT'
      }
    });
  }

  // Maintenance Records (5 Records)
  const maintenanceData = [
    {
      resourceId: chemLab304.id,
      issue: 'Fume Hood Ventilation Sensor Calibration & Filter Replacement',
      description: 'Scheduled semi-annual safety audit maintenance for chemistry lab exhaust hoods.',
      priority: 'HIGH',
      assignedStaff: 'Engineering Facilities Maintenance Team B',
      status: 'IN_PROGRESS',
      expectedCompletion: new Date(Date.now() + 3 * 86400000)
    },
    {
      resourceId: compLab301.id,
      issue: 'UPS Battery Module Diagnostics',
      description: 'Routine load check on backup batteries for Lab 301.',
      priority: 'MEDIUM',
      assignedStaff: 'Electrical Operations Staff',
      status: 'REPORTED',
      expectedCompletion: new Date(Date.now() + 5 * 86400000)
    },
    {
      resourceId: auditorium.id,
      issue: 'Stage Floodlight LED Array Replacement',
      description: 'Replaced 2 burnt out 200W LED stage spot lamps.',
      priority: 'LOW',
      assignedStaff: 'AV Technician John Miller',
      status: 'COMPLETED',
      expectedCompletion: new Date(Date.now() - 2 * 86400000)
    },
    {
      resourceId: smartClassroom204.id,
      issue: 'AC Thermostat Calibration',
      description: 'Fine-tuned inverter AC sensor for optimal energy efficiency.',
      priority: 'LOW',
      assignedStaff: 'Green Energy HVAC Specialist',
      status: 'COMPLETED',
      expectedCompletion: new Date(Date.now() - 1 * 86400000)
    },
    {
      resourceId: resources[6].id, // Central Football Field
      issue: 'Turf Irrigation & Lighting Pole Inspection',
      description: 'Quarterly field inspection for safety compliance.',
      priority: 'MEDIUM',
      assignedStaff: 'Grounds & Athletics Team',
      status: 'REPORTED',
      expectedCompletion: new Date(Date.now() + 7 * 86400000)
    }
  ];

  for (const m of maintenanceData) {
    await prisma.maintenance.create({ data: m });
  }
  console.log(`✅ Seeded ${maintenanceData.length} Maintenance Records`);

  // Notifications
  const notificationsData = [
    {
      userId: studentUser.id,
      title: 'Booking Approved & QR Ready',
      message: `Your booking (BK-2026-001) for ${smartClassroom204.name} on ${todayStr} has been APPROVED. Scan your QR code upon arrival.`,
      type: 'BOOKING_APPROVED',
      isRead: false
    },
    {
      userId: studentUser.id,
      title: 'Eco-Score Achievement',
      message: 'Great job! Your recent booking scored 94/100 on energy efficiency, saving 2.4 kWh of power.',
      type: 'INFO',
      isRead: true
    },
    {
      userId: facultyUser.id,
      title: 'Class Booking Confirmed',
      message: `Recurring lecture slot for CS202 in ${ecoHall110.name} confirmed for ${tomorrowStr} at 09:00 AM.`,
      type: 'BOOKING_APPROVED',
      isRead: false
    },
    {
      userId: adminUser.id,
      title: 'Pending Booking Approvals',
      message: 'You have 2 pending resource booking requests awaiting approval in the Admin portal.',
      type: 'BOOKING_CREATED',
      isRead: false
    },
    {
      userId: users[10].id, // Sophia Chen
      title: 'Resource Auto-Released (No Show)',
      message: 'Your booking BK-2026-006 was auto-released after 15 minutes of inactivity without QR check-in.',
      type: 'NO_SHOW',
      isRead: true
    }
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ Seeded ${notificationsData.length} Notifications`);

  // Feedback Records
  if (checkedOutBooking) {
    await prisma.feedback.create({
      data: {
        bookingId: checkedOutBooking.id,
        userId: studentUser.id,
        resourceId: checkedOutBooking.resourceId,
        rating: 5,
        comments: 'Excellent eco-friendly room! High quality AV and smooth AC cooling without unnecessary power drain.',
        resourceCondition: 'EXCELLENT',
        cleanliness: 'EXCELLENT',
        equipmentQuality: 'EXCELLENT'
      }
    });

    await prisma.feedback.create({
      data: {
        bookingId: bookings[4].id,
        userId: facultyUser.id,
        resourceId: auditorium.id,
        rating: 4,
        comments: 'Great acoustic system. Stage lighting was bright and responsive.',
        resourceCondition: 'EXCELLENT',
        cleanliness: 'GOOD',
        equipmentQuality: 'EXCELLENT'
      }
    });
  }
  console.log(`✅ Seeded Feedback records`);

  // Audit Logs
  const auditLogsData = [
    { userId: adminUser.id, action: 'SYSTEM_INIT', entity: 'SYSTEM', details: 'Campus Resource Management System initialized with sample seed configuration.' },
    { userId: studentUser.id, action: 'CREATE_BOOKING', entity: 'BOOKING', entityId: 'BK-2026-001', details: `Created booking for ${smartClassroom204.name}` },
    { userId: adminUser.id, action: 'APPROVE_BOOKING', entity: 'BOOKING', entityId: 'BK-2026-001', details: 'Approved student booking with instant QR generation.' },
    { userId: studentUser.id, action: 'QR_CHECKIN', entity: 'BOOKING', entityId: 'BK-2026-001', details: 'Scanned QR code and checked into Smart Classroom 204.' }
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`✅ Seeded Audit Logs`);

  console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('--------------------------------------------------');
  console.log('DEMO ACCOUNTS READY:');
  console.log('1. Admin:   admin@campus.com   / Admin@123');
  console.log('2. Faculty: faculty@campus.com / Faculty@123');
  console.log('3. Student: student@campus.com / Student@123');
  console.log('--------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
