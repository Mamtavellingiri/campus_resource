const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verifies the academic models exist and that the demo data is wired as expected:
//   Vineesha -> Monisha, Akash -> Jushya, Vikash -> Harishmitha
const MAPPINGS = [
  { faculty: 'vineesha@campus.com', student: 'monisha@campus.com' },
  { faculty: 'akash@campus.com', student: 'jushya@campus.com' },
  { faculty: 'vikash@campus.com', student: 'harishmitha@campus.com' }
];

(async () => {
  try {
    const models = {
      subject: prisma.subject,
      teacherSubjectYear: prisma.teacherSubjectYear,
      facultyStudentMap: prisma.facultyStudentMap,
      studentCourseEnrollment: prisma.studentCourseEnrollment
    };
    for (const [name, model] of Object.entries(models)) {
      console.log(`MODEL_EXISTS ${name}`, !!model);
      if (!model) throw new Error(`Prisma model "${name}" is missing. Run "npx prisma db push".`);
    }

    for (const { faculty, student } of MAPPINGS) {
      const f = await prisma.user.findUnique({ where: { email: faculty } });
      const s = await prisma.user.findUnique({ where: { email: student } });
      if (!f || !s) throw new Error(`Missing demo account(s): ${faculty} / ${student}. Re-seed the database.`);

      const map = await prisma.facultyStudentMap.findUnique({ where: { studentId: s.id } });
      if (!map || map.facultyId !== f.id) throw new Error(`${s.name} is not mapped to ${f.name}.`);

      const assignments = await prisma.teacherSubjectYear.findMany({ where: { teacherId: f.id } });
      const enrollments = await prisma.studentCourseEnrollment.count({ where: { studentId: s.id } });
      console.log(`✓ ${f.name} → ${s.name} (${s.year || 'no year'}) | ${assignments.length} teaching assignments | ${enrollments} enrollments`);
    }

    console.log('ACADEMIC_MODEL_CHECK_PASSED');
    await prisma.$disconnect();
  } catch (error) {
    console.error('ACADEMIC_MODEL_CHECK_FAILED');
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();