const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const model = prisma.studentCourseEnrollment;
    console.log('MODEL_EXISTS', !!model);
    await prisma.$disconnect();
  } catch (error) {
    console.error('ACADEMIC_MODEL_CHECK_FAILED');
    console.error(error.message);
    process.exit(1);
  }
})();
