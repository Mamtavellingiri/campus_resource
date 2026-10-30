const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const csvCell = (value) => {
  const text = String(value ?? '');
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

const isValidDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
};

const exportBookingsCsv = async (req, res) => {
  try {
    const { from, to } = req.query;
    if ((from && !isValidDate(from)) || (to && !isValidDate(to))) {
      return res.status(400).json({ success: false, message: 'Date filters must use YYYY-MM-DD format.' });
    }
    if (from && to && from > to) {
      return res.status(400).json({ success: false, message: 'The from date must be on or before the to date.' });
    }

    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        resource: { select: { name: true } }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    const rows = [
      ['Booking Code', 'User', 'User Email', 'Resource', 'Date', 'Start', 'End', 'Status', 'Estimated kWh', 'Eco Score'],
      ...bookings.map((booking) => [
        booking.bookingCode,
        booking.user.name,
        booking.user.email,
        booking.resource.name,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking.status,
        booking.estimatedEnergyKwh,
        booking.ecoScoreCalculated
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bookings.csv"'
    });
    return res.send(`\uFEFF${csv}\r\n`);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export bookings.', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        year: true,
        phone: true,
        createdAt: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      phone,
      year,
      section,
      subjectIds = [],
      years = [],
      enrolledSubjectIds = []
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const normalizedRole = role && ['STUDENT', 'FACULTY', 'ADMIN'].includes(String(role).toUpperCase())
      ? String(role).toUpperCase()
      : 'STUDENT';

    if (String(password).trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: normalizedRole,
        department: department || 'General',
        phone: phone || null,
        year: normalizedRole === 'STUDENT' ? (year || null) : null,
        section: normalizedRole === 'STUDENT' ? (section || null) : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        year: true,
        section: true,
        createdAt: true
      }
    });

    if (normalizedRole === 'FACULTY') {
      const selectedSubjectIds = Array.isArray(subjectIds)
        ? [...new Set(subjectIds.filter(Boolean))]
        : [];
      const selectedYears = Array.isArray(years) && years.length > 0
        ? [...new Set(years.filter(Boolean))]
        : ['1st Year', '2nd Year', '3rd Year', '4th Year'];

      if (selectedSubjectIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Select at least one subject for the teacher.' });
      }

      const validSubjects = await prisma.subject.findMany({
        where: { id: { in: selectedSubjectIds } },
        select: { id: true }
      });

      if (validSubjects.length !== selectedSubjectIds.length) {
        return res.status(400).json({ success: false, message: 'One or more selected subjects were not found.' });
      }

      await prisma.teacherSubjectYear.createMany({
        data: selectedSubjectIds.flatMap((subjectId) =>
          selectedYears.map((yearName) => ({
            teacherId: user.id,
            subjectId,
            year: yearName
          }))
        )
      });
    }

    if (normalizedRole === 'STUDENT') {
      const selectedSubjectIds = Array.isArray(enrolledSubjectIds)
        ? [...new Set(enrolledSubjectIds.filter(Boolean))]
        : [];

      if (selectedSubjectIds.length > 0) {
        const resolvedYear = year || '1st Year';
        const resolvedDepartment = department || 'General';

        const validSubjects = await prisma.subject.findMany({
          where: { id: { in: selectedSubjectIds } },
          select: { id: true }
        });

        if (validSubjects.length !== selectedSubjectIds.length) {
          return res.status(400).json({ success: false, message: 'One or more student subject selections were not found.' });
        }

        await prisma.studentCourseEnrollment.createMany({
          data: selectedSubjectIds.map((subjectId) => ({
            studentId: user.id,
            subjectId,
            department: resolvedDepartment,
            year: resolvedYear
          }))
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_USER',
        entity: 'USER',
        entityId: user.id,
        details: `Created ${normalizedRole} account for ${user.name} (${user.email})`
      }
    });

    return res.status(201).json({ success: true, message: 'User created successfully.', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user.', error: error.message });
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' }
    });

    return res.json({ success: true, subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects.', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'FACULTY', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    if (id === req.user.id && role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You cannot demote yourself.' });
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
       return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (userToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(403).json({ success: false, message: 'Cannot demote the last remaining admin.' });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER_ROLE',
        entity: 'USER',
        entityId: id,
        details: `Updated role of ${updated.name} (${updated.email}) to ${role}`
      }
    });

    return res.json({ success: true, message: `User role updated to ${role}`, user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user role.', error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.', error: error.message });
  }
};

const getStudentEnrollments = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollments = await prisma.studentCourseEnrollment.findMany({
      where: { studentId: id },
      include: { subject: true },
      orderBy: [{ year: 'asc' }, { subject: { name: 'asc' } }]
    });

    return res.json({
      success: true,
      count: enrollments.length,
      enrollments: enrollments.map((item) => ({
        id: item.id,
        subjectId: item.subjectId,
        subjectName: item.subject.name,
        department: item.department,
        year: item.year
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student enrollments.', error: error.message });
  }
};

const assignStudentEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectIds = [], department, year } = req.body;

    const selectedSubjectIds = Array.isArray(subjectIds)
      ? [...new Set(subjectIds.filter(Boolean))]
      : [];

    if (selectedSubjectIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one subject for the student.' });
    }

    const student = await prisma.user.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const validSubjects = await prisma.subject.findMany({
      where: { id: { in: selectedSubjectIds } },
      select: { id: true }
    });

    if (validSubjects.length !== selectedSubjectIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected subjects were not found.' });
    }

    const resolvedDepartment = department || student.department || 'General';
    const resolvedYear = year || student.year || '1st Year';

    await prisma.studentCourseEnrollment.createMany({
      data: selectedSubjectIds.map((subjectId) => ({
        studentId: student.id,
        subjectId,
        department: resolvedDepartment,
        year: resolvedYear
      })),
      skipDuplicates: true
    });

    return res.status(201).json({ success: true, message: 'Student course enrollments updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to assign student enrollments.', error: error.message });
  }
};

const getFacultyStudentMap = async (req, res) => {
  try {
    const mappings = await prisma.facultyStudentMap.findMany({
      include: {
        faculty: { select: { id: true, name: true, email: true, department: true } },
        student: { select: { id: true, name: true, email: true, department: true, year: true } }
      },
      orderBy: [{ faculty: { name: 'asc' } }, { student: { name: 'asc' } }]
    });
    return res.json({ success: true, mappings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch faculty-student mappings.', error: error.message });
  }
};

const assignFacultyStudentMap = async (req, res) => {
  try {
    const { facultyId, studentId } = req.body;
    if (!facultyId || !studentId) {
      return res.status(400).json({ success: false, message: 'facultyId and studentId are required.' });
    }

    const [faculty, student] = await Promise.all([
      prisma.user.findUnique({ where: { id: facultyId }, select: { id: true, name: true, role: true } }),
      prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true, role: true } })
    ]);
    if (!faculty || faculty.role !== 'FACULTY') {
      return res.status(400).json({ success: false, message: 'Select a valid faculty account.' });
    }
    if (!student || student.role !== 'STUDENT') {
      return res.status(400).json({ success: false, message: 'Select a valid student account.' });
    }

    const mapping = await prisma.$transaction(async (tx) => {
      const previous = await tx.facultyStudentMap.findUnique({
        where: { studentId },
        include: { faculty: { select: { name: true } } }
      });
      const updated = await tx.facultyStudentMap.upsert({
        where: { studentId },
        update: { facultyId },
        create: { facultyId, studentId },
        include: {
          faculty: { select: { id: true, name: true, email: true, department: true } },
          student: { select: { id: true, name: true, email: true, department: true, year: true } }
        }
      });
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: previous ? 'REASSIGN_FACULTY_STUDENT' : 'ASSIGN_FACULTY_STUDENT',
          entity: 'FACULTY_STUDENT_MAP',
          entityId: updated.id,
          details: `${student.name} mapped to ${faculty.name}${previous ? ` (previously ${previous.faculty.name})` : ''}.`
        }
      });
      return updated;
    });

    return res.json({ success: true, message: 'Faculty-student mapping saved.', mapping });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save faculty-student mapping.', error: error.message });
  }
};

const deleteFacultyStudentMap = async (req, res) => {
  try {
    const { studentId } = req.params;
    const mapping = await prisma.facultyStudentMap.findUnique({
      where: { studentId },
      include: {
        faculty: { select: { name: true } },
        student: { select: { name: true } }
      }
    });
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Faculty-student mapping not found.' });
    }

    await prisma.$transaction([
      prisma.facultyStudentMap.delete({ where: { studentId } }),
      prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'REMOVE_FACULTY_STUDENT',
          entity: 'FACULTY_STUDENT_MAP',
          entityId: mapping.id,
          details: `Removed ${mapping.student.name} from ${mapping.faculty.name}.`
        }
      })
    ]);

    return res.json({ success: true, message: 'Faculty-student mapping removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove faculty-student mapping.', error: error.message });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch system settings.', error: error.message });
  }
};

const updateSystemSetting = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Setting key and value are required.' });
    }

    if (key === 'blackout_dates' && String(value).split(',').some((date) => {
      const trimmedDate = date.trim();
      return trimmedDate !== '' && !isValidDate(trimmedDate);
    })) {
      return res.status(400).json({
        success: false,
        message: 'Blackout dates must be comma-separated dates in YYYY-MM-DD format.'
      });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), description: 'Configured by Admin' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SETTING',
        entity: 'SETTING',
        details: `Changed system setting ${key} = ${value}`
      }
    });

    return res.json({ success: true, message: `Setting ${key} updated successfully!`, setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update system setting.', error: error.message });
  }
};

module.exports = {
  exportBookingsCsv,
  getAllUsers,
  createUser,
  getAllSubjects,
  getStudentEnrollments,
  assignStudentEnrollments,
  getFacultyStudentMap,
  assignFacultyStudentMap,
  deleteFacultyStudentMap,
  updateUserRole,
  getAuditLogs,
  getSystemSettings,
  updateSystemSetting
};
