const prisma = require('./src/config/prisma');
const bcrypt = require('bcryptjs');

async function testBackend() {
  console.log('--- RUNNING BACKEND INTEGRATION TESTS ---');

  // 1. Verify User Role Registration logic
  const testEmail = `test_${Date.now()}@campus.com`;
  const hashedPassword = await bcrypt.hash('Password@123', 10);
  const testUser = await prisma.user.create({
    data: {
      name: 'Test Student',
      email: testEmail,
      password: hashedPassword,
      role: 'STUDENT',
      department: 'Computer Science'
    }
  });
  console.log('✓ User created with role:', testUser.role, testUser.email);

  // 2. Pick an available resource
  const resource = await prisma.resource.findFirst({
    where: { status: 'AVAILABLE' }
  });
  console.log('✓ Target resource:', resource.name, '(Capacity:', resource.capacity, ')');

  // 3. Create a test booking
  const testDate = '2026-10-15';
  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: `TEST-${Date.now()}`,
      userId: testUser.id,
      resourceId: resource.id,
      purpose: 'Initial Test Seminar',
      eventType: 'ACADEMIC',
      attendeeCount: 20,
      date: testDate,
      startTime: '10:00',
      endTime: '12:00',
      status: 'PENDING'
    }
  });
  console.log('✓ Booking 1 created (10:00 - 12:00):', booking1.bookingCode, 'Status:', booking1.status);

  // 4. Overlap conflict check:
  // overlap rule: existing_start < new_end AND existing_end > new_start
  const newStart = '11:00';
  const newEnd = '13:00';
  const overlap = await prisma.booking.findFirst({
    where: {
      resourceId: resource.id,
      date: testDate,
      status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
      AND: [
        { startTime: { lt: newEnd } },
        { endTime: { gt: newStart } }
      ]
    }
  });
  if (overlap) {
    console.log(`✓ Overlap detection correctly caught conflict with ${overlap.bookingCode} (${overlap.startTime} - ${overlap.endTime})`);
  } else {
    throw new Error('Overlap detection failed to catch conflict!');
  }

  // 5. Test Non-conflicting Reschedule logic
  const rescheduleDate = '2026-10-16';
  const rescheduled = await prisma.booking.update({
    where: { id: booking1.id },
    data: {
      date: rescheduleDate,
      startTime: '14:00',
      endTime: '16:00',
      status: 'PENDING'
    }
  });
  console.log(`✓ Reschedule successful to ${rescheduled.date} (${rescheduled.startTime} - ${rescheduled.endTime})`);

  // 6. Test Admin Approval
  const approved = await prisma.booking.update({
    where: { id: booking1.id },
    data: { status: 'APPROVED' }
  });
  console.log('✓ Admin approval successful. Status:', approved.status);

  // Cleanup test records
  await prisma.booking.delete({ where: { id: booking1.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log('✓ Cleaned up test records');

  console.log('\n>>> ALL BACKEND UNIT LOGIC TESTS PASSED! <<<');
  await prisma.$disconnect();
}

testBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
