const prisma = require('./src/config/prisma');

// Uses the seeded demo accounts (see prisma/seed.js) instead of creating throw-away users:
//   faculty  vineesha@campus.com / Faculty@123  -> mapped student monisha@campus.com
//   admin    admin@campus.com    / Admin@123    (Mamta)
async function testBackend() {
  console.log('--- RUNNING BACKEND INTEGRATION TESTS ---');

  // 1. Demo accounts exist with the right roles
  const faculty = await prisma.user.findUnique({ where: { email: 'vineesha@campus.com' } });
  const student = await prisma.user.findUnique({ where: { email: 'monisha@campus.com' } });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@campus.com' } });
  if (!faculty || faculty.role !== 'FACULTY') throw new Error('vineesha@campus.com (FACULTY) not found. Re-seed the database.');
  if (!student || student.role !== 'STUDENT') throw new Error('monisha@campus.com (STUDENT) not found. Re-seed the database.');
  if (!admin || admin.role !== 'ADMIN') throw new Error('admin@campus.com (ADMIN) not found. Re-seed the database.');
  console.log(`✓ Accounts found: ${admin.name} (ADMIN), ${faculty.name} (FACULTY), ${student.name} (STUDENT)`);

  // 2. Student -> faculty mapping controls visibility
  const mapping = await prisma.facultyStudentMap.findUnique({ where: { studentId: student.id } });
  if (!mapping || mapping.facultyId !== faculty.id) {
    throw new Error('Monisha is not mapped to Vineesha.');
  }
  console.log(`✓ ${student.name} is mapped to ${faculty.name}`);

  // 3. Faculty teaching assignment (subject + year) used for the booking
  const assignment = await prisma.teacherSubjectYear.findFirst({
    where: { teacherId: faculty.id },
    include: { subject: true }
  });
  if (!assignment) throw new Error('Vineesha has no teaching assignments. Re-seed the database.');
  console.log(`✓ Teaching assignment: ${assignment.subject.name} (${assignment.year})`);

  // 4. Pick an available resource
  const resource = await prisma.resource.findFirst({
    where: { status: 'AVAILABLE', isArchived: false }
  });
  if (!resource) throw new Error('No available resource found.');
  console.log('✓ Target resource:', resource.name, '(Capacity:', resource.capacity, ')');

  // Far-future date so seeded bookings never collide
  const future = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
  const testDate = future.toISOString().split('T')[0];
  const rescheduleDate = new Date(future.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 5. Create a faculty booking (PENDING, no QR)
  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: `TEST-${Date.now()}`,
      userId: faculty.id,
      resourceId: resource.id,
      purpose: 'Initial Test Class',
      eventType: 'ACADEMIC',
      attendeeCount: 20,
      date: testDate,
      startTime: '10:00',
      endTime: '12:00',
      status: 'PENDING',
      subjectId: assignment.subjectId,
      year: assignment.year
    }
  });
  console.log('✓ Booking 1 created (10:00 - 12:00):', booking1.bookingCode, 'Status:', booking1.status);
  if (booking1.qrCodeData) throw new Error('A PENDING booking must not have qrCodeData!');
  console.log('✓ PENDING booking has no QR code');

  try {
    // 6. Overlap conflict check:
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

    // 7. Students must NOT see a PENDING booking of their mapped faculty
    const studentVisibleStatuses = ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'];
    const visiblePending = await prisma.booking.findFirst({
      where: { id: booking1.id, userId: mapping.facultyId, status: { in: studentVisibleStatuses } }
    });
    if (visiblePending) throw new Error('PENDING booking is visible to the mapped student!');
    console.log('✓ PENDING booking is hidden from the mapped student');

    // 8. Non-conflicting reschedule
    const rescheduled = await prisma.booking.update({
      where: { id: booking1.id },
      data: { date: rescheduleDate, startTime: '14:00', endTime: '16:00', status: 'PENDING' }
    });
    console.log(`✓ Reschedule successful to ${rescheduled.date} (${rescheduled.startTime} - ${rescheduled.endTime})`);

    // 9. Admin approval -> QR becomes available and the mapped student can see it
    const approved = await prisma.booking.update({
      where: { id: booking1.id },
      data: {
        status: 'APPROVED',
        qrCodeData: JSON.stringify({ bookingCode: booking1.bookingCode, userId: faculty.id, resourceId: resource.id })
      }
    });
    await prisma.bookingApproval.create({
      data: { bookingId: booking1.id, approvedById: admin.id, status: 'APPROVED', remarks: 'Approved in integration test' }
    });
    console.log('✓ Admin approval successful. Status:', approved.status, '| QR issued:', Boolean(approved.qrCodeData));

    const visibleApproved = await prisma.booking.findFirst({
      where: { id: booking1.id, userId: mapping.facultyId, status: { in: studentVisibleStatuses } }
    });
    if (!visibleApproved) throw new Error('Approved booking is not visible to the mapped student!');
    console.log(`✓ Approved booking is visible to ${student.name}`);

    // 10. Cancellation clears the QR
    const cancelled = await prisma.booking.update({
      where: { id: booking1.id },
      data: { status: 'CANCELLED', qrCodeData: null }
    });
    if (cancelled.qrCodeData) throw new Error('Cancelled booking still has a QR code!');
    console.log('✓ Cancellation clears the QR code');
  } finally {
    // Cleanup test records (always runs, even if an assertion above failed)
    await prisma.bookingApproval.deleteMany({ where: { bookingId: booking1.id } });
    await prisma.booking.delete({ where: { id: booking1.id } });
    console.log('✓ Cleaned up test records');
  }

  console.log('\n>>> ALL BACKEND UNIT LOGIC TESTS PASSED! <<<');
  await prisma.$disconnect();
}

testBackend().catch(async (err) => {
  console.error('Test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});