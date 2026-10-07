const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  try {
    await prisma.$connect();
    console.log('✅ Database connected!');

    console.log('🗑️  Clearing existing data...');
    await prisma.booking.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Data cleared!');

    console.log('👤 Creating users...');

    const users = [
      {
        name: 'Admin User',
        email: 'admin@campus.com',
        password: 'Admin@123',
        role: 'ADMIN',
        department: 'Administration'
      },
      {
        name: 'Faculty User',
        email: 'faculty@campus.com',
        password: 'Faculty@123',
        role: 'FACULTY',
        department: 'Computer Science'
      },
      {
        name: 'Student User',
        email: 'student@campus.com',
        password: 'Student@123',
        role: 'STUDENT',
        department: 'Computer Science'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const created = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          department: user.department
        }
      });
      console.log(`   ✅ Created user: ${created.name} (${created.email}) - ${created.role}`);
    }

    console.log('🏫 Creating resources...');

    const resources = [
      {
        name: 'Room 101',
        roomNumber: '101',
        type: 'CLASSROOM',
        capacity: 30,
        building: 'Main Building',
        floor: 1,
        facilities: 'Projector, Whiteboard, AC',
        status: 'AVAILABLE',
        ecoScore: 80,
        basePowerConsumptionKw: 2.5
      },
      {
        name: 'Room 102',
        roomNumber: '102',
        type: 'CLASSROOM',
        capacity: 25,
        building: 'Main Building',
        floor: 1,
        facilities: 'Whiteboard, Fans',
        status: 'AVAILABLE',
        ecoScore: 70,
        basePowerConsumptionKw: 1.8
      },
      {
        name: 'Room 201',
        roomNumber: '201',
        type: 'CLASSROOM',
        capacity: 35,
        building: 'Main Building',
        floor: 2,
        facilities: 'Projector, AC, Smart Board',
        status: 'AVAILABLE',
        ecoScore: 75,
        basePowerConsumptionKw: 2.0
      },
      {
        name: 'Computer Lab A',
        roomNumber: 'A-201',
        type: 'LAB',
        capacity: 20,
        building: 'Block A',
        floor: 2,
        facilities: '20 Workstations, Projector, AC, Wi-Fi',
        status: 'AVAILABLE',
        ecoScore: 75,
        basePowerConsumptionKw: 8.5
      },
      {
        name: 'Computer Lab B',
        roomNumber: 'B-101',
        type: 'LAB',
        capacity: 25,
        building: 'Block B',
        floor: 1,
        facilities: '25 Workstations, Projector, AC',
        status: 'AVAILABLE',
        ecoScore: 72,
        basePowerConsumptionKw: 9.0
      },
      {
        name: 'Seminar Hall',
        roomNumber: 'SH-101',
        type: 'SEMINAR_HALL',
        capacity: 50,
        building: 'Main Building',
        floor: 2,
        facilities: 'Projector, Sound System, AC, 50 Chairs',
        status: 'AVAILABLE',
        ecoScore: 85,
        basePowerConsumptionKw: 5.0
      },
      {
        name: 'Auditorium',
        roomNumber: 'AUD-01',
        type: 'AUDITORIUM',
        capacity: 200,
        building: 'Block B',
        floor: 1,
        facilities: 'Stage, LED Screen, Sound System, AC, 200 Chairs',
        status: 'AVAILABLE',
        ecoScore: 65,
        basePowerConsumptionKw: 20.0
      },
      {
        name: 'Physics Lab',
        roomNumber: 'P-201',
        type: 'LAB',
        capacity: 30,
        building: 'Block C',
        floor: 2,
        facilities: 'Physics Equipment, Workbenches, AC',
        status: 'AVAILABLE',
        ecoScore: 70,
        basePowerConsumptionKw: 6.0
      },
      {
        name: 'Chemistry Lab',
        roomNumber: 'C-101',
        type: 'LAB',
        capacity: 25,
        building: 'Block C',
        floor: 1,
        facilities: 'Chemical Hoods, Safety Equipment, AC',
        status: 'AVAILABLE',
        ecoScore: 68,
        basePowerConsumptionKw: 6.5
      },
      {
        name: 'Conference Room',
        roomNumber: 'CR-301',
        type: 'SEMINAR_HALL',
        capacity: 20,
        building: 'Main Building',
        floor: 3,
        facilities: 'Smart Board, Video Conferencing, AC',
        status: 'AVAILABLE',
        ecoScore: 82,
        basePowerConsumptionKw: 3.5
      }
    ];

    for (const resource of resources) {
      const created = await prisma.resource.create({
        data: resource
      });
      console.log(`   ✅ Created resource: ${created.name} (${created.building} - Floor ${created.floor})`);
    }

    const userCount = await prisma.user.count();
    const resourceCount = await prisma.resource.count();

    console.log('\n✅ Seeding complete!');
    console.log(`   👤 ${userCount} users created`);
    console.log(`   🏫 ${resourceCount} resources created`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();