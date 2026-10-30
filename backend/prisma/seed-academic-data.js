/**
 * seed-academic-data.js
 *
 * Loads processed academic subjects and assignments while keeping demo users
 * limited to the configured faculty and student team.
 *
 * This is SEPARATE from prisma/seed.js on purpose:
 *   - seed.js wipes and recreates your core demo data (admin/faculty/student
 *     accounts, resources, buildings, etc.) — we don't want to touch that.
 *   - This script is additive and idempotent. It upserts subjects and maps
 *     imported teaching assignments to the three configured faculty accounts.
 *
 * Run with:
 *   node prisma/seed-academic-data.js
 *
 * Expects these files to exist (already generated and placed by you):
 *   backend/seed_data/processed/subjects.csv
 *   backend/seed_data/processed/years.csv
 *   backend/seed_data/processed/teachers.csv
 *   backend/seed_data/processed/students.csv
 *   backend/seed_data/processed/teacher_subject_year.csv
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const PROCESSED_DIR = path.join(__dirname, '..', 'seed_data', 'processed');

// ---------------------------------------------------------------------
// Tiny CSV reader (fine for our simple, comma-only, no-quoted-commas
// processed files). Returns an array of row objects keyed by header.
// ---------------------------------------------------------------------
function readCsv(filename) {
  const filePath = path.join(PROCESSED_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });
}

async function main() {
  console.log('🌱 Seeding academic subjects and teaching assignments...');

  // -------------------------------------------------------------
  // 0. Load CSVs
  // -------------------------------------------------------------
  const subjectsCsv = readCsv('subjects.csv');            // subject_id, subject_name
  const yearsCsv = readCsv('years.csv');                  // year_id, year_name
  const teachersCsv = readCsv('teachers.csv');             // teacher_id, name, email, contact_number, department
  const studentsCsv = readCsv('students.csv');             // student_id, name, email, contact_number, year_id, section
  const tsyCsv = readCsv('teacher_subject_year.csv');      // id, teacher_id, subject_id, year_id

  // year_id -> year_name lookup, e.g. "1" -> "1st Year"
  const yearNameById = {};
  yearsCsv.forEach((y) => {
    yearNameById[y.year_id] = y.year_name;
  });

  // -------------------------------------------------------------
  // 1. Create Subjects, keep a csv_id -> real_uuid map
  // -------------------------------------------------------------
  const subjectIdMap = {}; // subject_id (csv) -> Subject.id (uuid)
  for (const s of subjectsCsv) {
    const created = await prisma.subject.upsert({
      where: { name: s.subject_name },
      update: {},
      create: { name: s.subject_name },
    });
    subjectIdMap[s.subject_id] = created.id;
  }
  console.log(`✅ Created ${subjectsCsv.length} subjects.`);

  // -------------------------------------------------------------
  // 2. Map imported teacher IDs to the three configured faculty accounts.
  // -------------------------------------------------------------
  const facultyEmails = ['vineesha@campus.com', 'akash@campus.com', 'vikash@campus.com'];
  const facultyAccounts = [];
  for (const email of facultyEmails) {
    const account = await prisma.user.findUnique({ where: { email } });
    if (!account || account.role !== 'FACULTY') {
      throw new Error(`Required demo faculty account is missing: ${email}`);
    }
    facultyAccounts.push(account);
  }

  const teacherIdMap = {}; // teacher_id (csv) -> User.id (uuid)

  for (const [index, t] of teachersCsv.entries()) {
    const user = facultyAccounts[index % facultyAccounts.length];
    teacherIdMap[t.teacher_id] = user.id;
  }
  console.log(`✅ Mapped ${teachersCsv.length} academic teacher records to the demo faculty accounts.`);

  // -------------------------------------------------------------
  // 3. Keep the student list limited to the three configured demo accounts.
  // -------------------------------------------------------------
  console.log(`✅ Retained the three configured demo student accounts; skipped ${studentsCsv.length} imported user records.`);

  // -------------------------------------------------------------
  // 4. Create TeacherSubjectYear assignments
  // -------------------------------------------------------------
  let tsyCount = 0;
  for (const row of tsyCsv) {
    const teacherUuid = teacherIdMap[row.teacher_id];
    const subjectUuid = subjectIdMap[row.subject_id];
    const yearName = yearNameById[row.year_id];

    if (!teacherUuid || !subjectUuid || !yearName) {
      console.warn(`⚠️  Skipping row with unresolved reference:`, row);
      continue;
    }

    await prisma.teacherSubjectYear.upsert({
      where: {
        teacherId_subjectId_year: {
          teacherId: teacherUuid,
          subjectId: subjectUuid,
          year: yearName
        }
      },
      update: {},
      create: { teacherId: teacherUuid, subjectId: subjectUuid, year: yearName },
    });
    tsyCount++;
  }
  console.log(`✅ Created ${tsyCount} teacher-subject-year assignments.`);

  const demoStudents = [
    { email: 'monisha@campus.com', year: '1st Year', facultyEmail: 'vineesha@campus.com' },
    { email: 'jushya@campus.com', year: '2nd Year', facultyEmail: 'akash@campus.com' },
    { email: 'harishmitha@campus.com', year: '3rd Year', facultyEmail: 'vikash@campus.com' }
  ];
  for (const { email, year, facultyEmail } of demoStudents) {
    const student = await prisma.user.findUnique({ where: { email } });
    if (!student || student.role !== 'STUDENT') {
      throw new Error(`Required demo student account is missing: ${email}`);
    }
    const mappedFaculty = facultyAccounts.find((faculty) => faculty.email === facultyEmail);

    const courses = await prisma.teacherSubjectYear.findMany({
      where: { teacherId: mappedFaculty.id, year },
      select: { subjectId: true },
      distinct: ['subjectId']
    });
    if (courses.length > 0) {
      const department = student.department || 'Computer Science';
      for (const { subjectId } of courses) {
        await prisma.studentCourseEnrollment.upsert({
          where: {
            studentId_subjectId_department_year: {
              studentId: student.id,
              subjectId,
              department,
              year
            }
          },
          update: {},
          create: { studentId: student.id, subjectId, department, year }
        });
      }
    }
  }
  console.log('✅ Mapped demo students to courses taught by faculty for their academic year.');

  // Create one pending class booking per imported teacher for admin review.
  // Deterministic booking codes keep this additive seed safe to rerun.
  const sampleResource = await prisma.resource.findFirst({
    where: {
      isArchived: false,
      status: 'AVAILABLE',
      type: { category: { not: 'EQUIPMENT' } },
      operatingHoursStart: { lte: '09:00' },
      operatingHoursEnd: { gte: '10:00' }
    },
    orderBy: { capacity: 'asc' },
    select: { id: true, capacity: true }
  });

  if (sampleResource) {
    let datasetBookingCount = 0;
    for (const [index, teacher] of teachersCsv.entries()) {
      const assignment = tsyCsv.find((row) => row.teacher_id === teacher.teacher_id);
      const userId = teacherIdMap[teacher.teacher_id];
      const subjectId = assignment && subjectIdMap[assignment.subject_id];
      const year = assignment && yearNameById[assignment.year_id];

      if (!userId || !subjectId || !year) continue;

      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + index + 1);
      const date = bookingDate.toISOString().slice(0, 10);
      const bookingCode = `DATASET-TEACHER-${teacher.teacher_id}`;

      await prisma.booking.upsert({
        where: { bookingCode },
        update: { resourceId: sampleResource.id },
        create: {
          bookingCode,
          userId,
          resourceId: sampleResource.id,
          purpose: `${facultyAccounts[index % facultyAccounts.length].name} - ${year} ${subjectsCsv.find((subject) => subjectIdMap[subject.subject_id] === subjectId)?.subject_name || 'class'}`,
          eventType: 'ACADEMIC',
          attendeeCount: Math.min(30, sampleResource.capacity),
          requestedFacilities: '[]',
          date,
          startTime: '09:00',
          endTime: '10:00',
          status: 'PENDING',
          subjectId,
          year
        }
      });
      datasetBookingCount++;
    }
    console.log(`✅ Created/verified ${datasetBookingCount} pending dataset teacher bookings.`);
  } else {
    console.warn('⚠️  No available resource found for dataset teacher booking examples.');
  }

  console.log('🎉 Academic data seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
