const prisma = require('../config/prisma');
const { calculateBookingEnergyAndEcoScore } = require('../services/ecoService');
const { getSmartRecommendations } = require('../services/recommendationService');
const { promoteNext } = require('../services/waitlistService');

/**
 * Check real-time availability and prevent double booking!
 */
const checkAvailability = async (req, res) => {
  try {
    const { resourceId, date, startTime, endTime } = req.body;

    if (!resourceId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'resourceId, date, startTime, and endTime are required.' });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { type: true, building: true }
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)) {
      return res.status(400).json({
        success: false,
        isAvailable: false,
        message: `Resource is currently ${resource.status} and cannot be booked.`
      });
    }

    // Overlap query: startTime < existing.endTime && endTime > existing.startTime
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        resourceId,
        date,
        status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      },
      include: { user: { select: { name: true, role: true } } }
    });

    if (overlappingBookings.length > 0) {
      const conflict = overlappingBookings[0];
      return res.status(409).json({
        success: false,
        isAvailable: false,
        message: `Resource already booked from ${conflict.startTime} to ${conflict.endTime} on ${date}.`,
        conflict: {
          startTime: conflict.startTime,
          endTime: conflict.endTime
        }
      });
    }

    return res.json({
      success: true,
      isAvailable: true,
      message: 'Resource is available for the requested time slot!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking availability.', error: error.message });
  }
};

/**
 * AI Smart Recommendation Endpoint
 */
const recommendResources = async (req, res) => {
  try {
    const {
      resourceType,
      date,
      startTime,
      endTime,
      attendeeCount = 1,
      requiredFacilities = [],
      preferredBuildingId
    } = req.body;

    const recommendations = await getSmartRecommendations({
      resourceType,
      date,
      startTime,
      endTime,
      attendeeCount,
      requiredFacilities,
      preferredBuildingId
    });

    return res.json({
      success: true,
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations.', error: error.message });
  }
};

/**
 * Get the (subject, year) pairs the logged-in faculty member is assigned
 * to teach. Used to populate the dropdown on the booking form.
 * Admins get all subject/year pairs across all teachers (so they can
 * book on behalf of any class).
 */
const getMyTeachingAssignments = async (req, res) => {
  try {
    if (req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Students do not have teaching assignments.' });
    }

    const where = req.user.role === 'ADMIN' ? {} : { teacherId: req.user.id };

    const assignments = await prisma.teacherSubjectYear.findMany({
      where,
      include: { subject: true },
      orderBy: [{ year: 'asc' }]
    });

    const formatted = assignments.map(a => ({
      id: a.id,
      subjectId: a.subjectId,
      subjectName: a.subject.name,
      year: a.year
    }));

    return res.json({ success: true, count: formatted.length, assignments: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch teaching assignments.', error: error.message });
  }
};

/**
 * Create a new Booking with conflict check
 */
const { z } = require('zod');
const crypto = require('crypto');

const bookingSchema = z.object({
  resourceId: z.string().min(1, 'resourceId is required'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(200),
  eventType: z.enum(['ACADEMIC', 'EVENT', 'WORKSHOP', 'EXAM', 'MEETING', 'PERSONAL']).default('ACADEMIC'),
  attendeeCount: z.number().int().min(1),
  requestedFacilities: z.array(z.string()).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  recurringEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // NEW: which (subject, year) this booking is for. Required for FACULTY,
  // optional for ADMIN (admin may book general-purpose resources with no class attached).
  subjectId: z.string().optional(),
  year: z.string().optional()
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"]
}).refine(data => {
  const { getNowInTz } = require('../utils/time');
  const now = getNowInTz();
  if (data.date > now.date) return true; // future date, always ok
  if (data.date < now.date) return false; // past date
  // Same day: reject if start time has already passed
  const [sH, sM] = data.startTime.split(':').map(Number);
  return (sH * 60 + sM) > now.minutes;
}, {
  message: "Cannot book a time slot that has already passed",
  path: ["startTime"]
}).refine(data => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: require('../config/env').TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return data.date >= today;
}, {
  message: "Date cannot be in the past",
  path: ["date"]
});

async function generateUniqueBookingCode(tx) {
  for (let i = 0; i < 5; i++) {
    const code = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await tx.booking.findUnique({ where: { bookingCode: code } });
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique booking code.');
}

const createBooking = async (req, res) => {
  try {
    // ===================== NOVELTY: FACULTY-ONLY BOOKING =====================
    // Students are no longer allowed to create bookings directly.
    // Only FACULTY and ADMIN may book resources.
    if (req.user.role === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can book resources. Students can view bookings made for their year.'
      });
    }
    // ===========================================================================

    const parsedData = bookingSchema.safeParse(req.body);
    if (!parsedData.success) {
      // Surface the first meaningful error message to the client
      const firstError = parsedData.error.issues?.[0];
      const firstMessage = firstError?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        message: firstMessage,
        errors: parsedData.error.format()
      });
    }
    
    const {
      resourceId, purpose, eventType, attendeeCount, requestedFacilities,
      date, startTime, endTime, isRecurring, recurringPattern, recurringEndDate,
      subjectId, year
    } = parsedData.data;

    const userId = req.user.id;

    // Subject and year are a single academic selection. Accepting one without
    // the other creates a booking that cannot be shown to the intended class.
    if (Boolean(subjectId) !== Boolean(year)) {
      return res.status(400).json({
        success: false,
        message: 'subjectId and year must be provided together.'
      });
    }

    // ===================== NOVELTY: VALIDATE TEACHER'S (SUBJECT, YEAR) =====================
    // If a FACULTY member provided subjectId/year, make sure they are actually
    // assigned to teach that subject for that year. Admins may skip this (they
    // can book on behalf of any class, or book with no subject/year at all).
    if (req.user.role === 'FACULTY') {
      if (!subjectId || !year) {
        return res.status(400).json({
          success: false,
          message: 'Please select which year and subject this booking is for.'
        });
      }

      const assignment = await prisma.teacherSubjectYear.findFirst({
        where: { teacherId: userId, subjectId, year }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to teach this subject for the selected year.'
        });
      }
    }

    // Admins may create non-academic bookings, but an academic selection must
    // still reference a real subject so Prisma errors never leak to the UI.
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        return res.status(400).json({ success: false, message: 'Selected subject was not found.' });
      }
    }
    // ==========================================================================================

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId, isArchived: false },
      include: { building: true }
    });

    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found.' });

    if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)) {
      return res.status(400).json({ success: false, message: `Resource is currently ${resource.status} and cannot be booked.` });
    }

    if (attendeeCount > resource.capacity) {
      return res.status(400).json({ success: false, message: `Attendee count exceeds resource capacity of ${resource.capacity}.` });
    }

    if (startTime < resource.operatingHoursStart || endTime > resource.operatingHoursEnd) {
      return res.status(400).json({ success: false, message: `Booking time is outside operating hours (${resource.operatingHoursStart} - ${resource.operatingHoursEnd}).` });
    }

    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const durationHours = Math.max(0.5, (eH * 60 + eM - (sH * 60 + sM)) / 60);
    const eco = calculateBookingEnergyAndEcoScore(resource, attendeeCount, durationHours);

    const initialStatus = req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';
    
    const datesToBook = [date];
    if (isRecurring && req.user.role !== 'STUDENT' && recurringPattern && recurringEndDate) {
       let currDate = new Date(date);
       const endDate = new Date(recurringEndDate);
       while (currDate < endDate) {
         if (recurringPattern === 'DAILY') currDate.setDate(currDate.getDate() + 1);
         else if (recurringPattern === 'WEEKLY') currDate.setDate(currDate.getDate() + 7);
         else if (recurringPattern === 'MONTHLY') currDate.setMonth(currDate.getMonth() + 1);
         datesToBook.push(currDate.toISOString().split('T')[0]);
       }
    }

    const recurringGroupId = isRecurring && datesToBook.length > 1 ? crypto.randomUUID() : null;
    const createdBookings = [];
    const skippedDates = [];

    await prisma.$transaction(async (tx) => {
      for (const d of datesToBook) {
        const existingConflict = await tx.booking.findFirst({
          where: {
            resourceId, date: d, status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
            AND: [ { startTime: { lt: endTime } }, { endTime: { gt: startTime } } ]
          }
        });

        if (existingConflict) {
          if (datesToBook.length > 1) {
            skippedDates.push(d);
            continue;
          } else {
            throw new Error(`Resource already booked from ${existingConflict.startTime} to ${existingConflict.endTime} on ${d}.`);
          }
        }

        const bookingCode = await generateUniqueBookingCode(tx);
        
        const qrData = JSON.stringify({
          bookingCode, userId, resourceId, date: d, startTime, endTime, issuedAt: new Date().toISOString()
        });

        const newBooking = await tx.booking.create({
          data: {
            bookingCode, userId, resourceId, purpose, eventType,
            attendeeCount, requestedFacilities: JSON.stringify(requestedFacilities),
            date: d, startTime, endTime, status: initialStatus,
            isRecurring, recurringPattern: isRecurring ? recurringPattern : null, recurringGroupId,
            qrCodeData: qrData, estimatedEnergyKwh: eco.estimatedEnergyKwh, ecoScoreCalculated: eco.ecoScoreCalculated,
            subjectId: subjectId || null,
            year: year || null
          },
          include: {
            resource: { include: { building: true, type: true } },
            user: { select: { name: true, email: true, role: true, department: true } },
            subject: true
          }
        });

        if (initialStatus === 'APPROVED') {
          await tx.bookingApproval.create({
            data: { bookingId: newBooking.id, approvedById: req.user.id, status: 'APPROVED', remarks: 'Auto-approved for administrator booking' }
          });
        }
        createdBookings.push(newBooking);
      }
      
      if (createdBookings.length === 0) {
         throw new Error('All requested dates have conflicts.');
      }

      await tx.auditLog.create({
        data: { userId, action: 'CREATE_BOOKING', entity: 'BOOKING', entityId: createdBookings[0].id, details: `Created ${createdBookings.length} bookings for ${resource.name}` }
      });
    });

    for (const b of createdBookings) {
      await prisma.notification.create({
        data: {
          userId,
          title: initialStatus === 'APPROVED' ? 'Booking Confirmed & QR Ready' : 'Booking Request Submitted',
          message: initialStatus === 'APPROVED' ? `Your booking for ${resource.name} on ${b.date} (${startTime} - ${endTime}) is APPROVED.` : `Your booking request for ${resource.name} on ${b.date} is PENDING.`,
          type: initialStatus === 'APPROVED' ? 'BOOKING_APPROVED' : 'BOOKING_CREATED'
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdBookings.length} booking(s). ${skippedDates.length > 0 ? `Skipped dates due to conflict: ${skippedDates.join(', ')}` : ''}`,
      booking: createdBookings.length === 1 ? { ...createdBookings[0], requestedFacilities: JSON.parse(createdBookings[0].requestedFacilities || '[]') } : createdBookings,
      createdCount: createdBookings.length,
      skippedDates
    });
  } catch (error) {
    if (error.message.includes('already booked') || error.message.includes('All requested dates have conflicts')) {
       return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create booking.', error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const { status, date, resourceId } = req.query;
    const where = {};
    const studentVisibleStatuses = ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'];

    // ===================== NOVELTY: ROLE-BASED VISIBILITY =====================
    // Students see only bookings made for THEIR year (they can't create their
    // own bookings anymore, so "my bookings" is replaced by "bookings for my year").
    // Faculty sees their own bookings + their department's; Admin sees all.
    if (req.user.role === 'STUDENT') {
      if (!req.user.year) {
        // Student has no year assigned yet - show nothing rather than everything
        where.id = '__none__';
      } else {
        const enrollments = await prisma.studentCourseEnrollment.findMany({
          where: {
            studentId: req.user.id,
            year: req.user.year,
            ...(req.user.department ? { department: req.user.department } : {})
          },
          select: { subjectId: true }
        });
        const subjectIds = enrollments.map((enrollment) => enrollment.subjectId);
        where.year = req.user.year;
        where.AND = [{ status: { in: studentVisibleStatuses } }];
        where.OR = [{ subjectId: null }, { subjectId: { in: subjectIds } }];
      }
    } else if (req.user.role === 'FACULTY') {
      // `view=all` is an admin UI convenience, not a permission override.
      where.OR = [{ userId: req.user.id }];
      if (req.user.department) {
        where.OR.push({ user: { department: req.user.department } });
      }
    }
    // ============================================================================

    if (status) {
      if (req.user.role === 'STUDENT') {
        where.AND = [...(where.AND || []), { status }];
      } else {
        where.status = status;
      }
    }

    if (date) {
      where.date = date;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        resource: { include: { building: true, type: true } },
        user: { select: { id: true, name: true, email: true, role: true, department: true } },
        subject: true,
        checkIns: true,
        feedbacks: true
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' }
      ]
    });

    const formatted = bookings.map(b => ({
      ...b,
      requestedFacilities: JSON.parse(b.requestedFacilities || '[]')
    }));

    return res.json({ success: true, count: formatted.length, bookings: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings.', error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        resource: { include: { building: true, type: true } },
        user: { select: { id: true, name: true, email: true, role: true, department: true } },
        subject: true,
        approvals: { include: { approvedBy: { select: { name: true, role: true } } } },
        checkIns: true,
        feedbacks: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isOwner = booking.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const isFacultyOfSameDept = Boolean(
      req.user.role === 'FACULTY' &&
      req.user.department &&
      booking.user.department &&
      req.user.department === booking.user.department
    );
    // NEW: a student may view a booking if it was made for their own year
    const isStudentOfSameYear = req.user.role === 'STUDENT' &&
      req.user.year &&
      req.user.year === booking.year &&
      ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(booking.status);

    if (!isOwner && !isAdmin && !isFacultyOfSameDept && !isStudentOfSameYear) {
      return res.status(403).json({ success: false, message: 'Access denied to view this booking.' });
    }

    return res.json({
      success: true,
      booking: {
        ...booking,
        requestedFacilities: JSON.parse(booking.requestedFacilities || '[]')
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch booking details.', error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only creator or Admin can cancel
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    if (['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking that is currently ${booking.status}` });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Cancelled',
          message: `Booking ${booking.bookingCode} for ${booking.resource.name} has been cancelled.`,
          type: 'BOOKING_CANCELLED'
        }
      });
      return b;
    });

    // Trigger waitlist promotion for the freed slot
    promoteNext(booking.resourceId, booking.date, booking.startTime, booking.endTime);

    return res.json({ success: true, message: 'Booking cancelled successfully.', booking: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.', error: error.message });
  }
};

const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: true, user: true, subject: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only PENDING bookings can be approved.' });
    }

    if (req.user.role === 'FACULTY') {
      const isSameDepartment = Boolean(
        req.user.department &&
        booking.user.department &&
        req.user.department === booking.user.department
      );
      const teachesBookedClass = Boolean(
        booking.subjectId &&
        booking.year &&
        await prisma.teacherSubjectYear.findFirst({
          where: {
            teacherId: req.user.id,
            subjectId: booking.subjectId,
            year: booking.year
          },
          select: { id: true }
        })
      );

      if (!isSameDepartment && !teachesBookedClass) {
        return res.status(403).json({
          success: false,
          message: 'Faculty can only approve bookings in their department or for a subject/year they teach.'
        });
      }
    }

    // Re-run conflict check
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        resourceId: booking.resourceId,
        date: booking.date,
        status: { in: ['APPROVED', 'CHECKED_IN'] },
        AND: [
          { startTime: { lt: booking.endTime } },
          { endTime: { gt: booking.startTime } }
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({ success: false, message: 'Cannot approve. Resource is already booked for this time.' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    await prisma.bookingApproval.create({
      data: {
        bookingId: id,
        approvedById: req.user.id,
        status: 'APPROVED',
        remarks: remarks || 'Approved by Administrator / Faculty Head'
      }
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: `Resource assigned: ${booking.resource.name}`,
        message: `Your booking for ${booking.resource.name} is scheduled on ${booking.date} (${booking.startTime} - ${booking.endTime}).`,
        type: 'BOOKING_APPROVED'
      }
    });

    if (booking.year) {
      const recipients = booking.subjectId
        ? await prisma.studentCourseEnrollment.findMany({
          where: {
            subjectId: booking.subjectId,
            year: booking.year,
            ...(booking.subject?.department ? { department: booking.subject.department } : {})
          },
          select: { studentId: true }
        })
        : await prisma.user.findMany({
          where: {
            role: 'STUDENT',
            year: booking.year,
            ...(booking.user.department ? { department: booking.user.department } : {})
          },
          select: { id: true }
        });

      for (const recipient of recipients) {
        const studentId = recipient.studentId || recipient.id;
        await prisma.notification.create({
          data: {
            userId: studentId,
            title: `Class resource assigned: ${booking.resource.name}`,
            message: `${booking.subject?.name ? `${booking.subject.name} is` : 'Your class is'} scheduled in ${booking.resource.name} on ${booking.date} (${booking.startTime} - ${booking.endTime}).`,
            type: 'BOOKING_APPROVED'
          }
        });
      }
    }

    return res.json({ success: true, message: 'Booking approved successfully!', booking: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve booking.', error: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectionReason = typeof reason === 'string' ? reason.trim() : '';

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: true, user: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only PENDING bookings can be rejected.' });
    }

    if (req.user.role === 'FACULTY') {
      const isSameDepartment = Boolean(
        req.user.department &&
        booking.user.department &&
        req.user.department === booking.user.department
      );
      const teachesBookedClass = Boolean(
        booking.subjectId &&
        booking.year &&
        await prisma.teacherSubjectYear.findFirst({
          where: {
            teacherId: req.user.id,
            subjectId: booking.subjectId,
            year: booking.year
          },
          select: { id: true }
        })
      );

      if (!isSameDepartment && !teachesBookedClass) {
        return res.status(403).json({
          success: false,
          message: 'Faculty can only reject bookings in their department or for a subject/year they teach.'
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason
        }
      });

      await tx.bookingApproval.create({
        data: {
          bookingId: id,
          approvedById: req.user.id,
          status: 'REJECTED',
          remarks: rejectionReason
        }
      });

      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Request Declined',
          message: `Your booking request for ${booking.resource.name} was declined: ${rejectionReason}`,
          type: 'BOOKING_REJECTED'
        }
      });

      return b;
    });

    // Trigger waitlist promotion for the freed slot
    promoteNext(booking.resourceId, booking.date, booking.startTime, booking.endTime);

    return res.json({ success: true, message: 'Booking request rejected.', booking: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reject booking.', error: error.message });
  }
};

const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'date, startTime, and endTime are required to reschedule.'
      });
    }

    // Format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format (expected YYYY-MM-DD).' });
    }
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ success: false, message: 'Invalid time format (expected HH:MM).' });
    }

    // Validate end > start
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.'
      });
    }

    // Validate date is not in the past
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: require('../config/env').TIMEZONE || 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    if (date < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a date in the past.'
      });
    }

    // Find existing booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: { include: { building: true, type: true } }, user: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Permission check: owner or Admin
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reschedule this booking.'
      });
    }

    if (['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a booking that is currently ${booking.status}.`
      });
    }

    const resource = booking.resource;

    // Check resource status
    if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)) {
      return res.status(400).json({
        success: false,
        message: `Resource is currently ${resource.status} and cannot be booked.`
      });
    }

    // Operating hours check
    if (startTime < resource.operatingHoursStart || endTime > resource.operatingHoursEnd) {
      return res.status(400).json({
        success: false,
        message: `Requested time is outside resource operating hours (${resource.operatingHoursStart} - ${resource.operatingHoursEnd}).`
      });
    }

    // Overlap rule: (existing_start < new_end AND existing_end > new_start)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        resourceId: booking.resourceId,
        date,
        id: { not: id }, // exclude current booking!
        status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      },
      include: { user: { select: { name: true, role: true } } }
    });

    if (conflictingBookings.length > 0) {
      const conflict = conflictingBookings[0];
      return res.status(409).json({
        success: false,
        isAvailable: false,
        message: `Resource already booked from ${conflict.startTime} to ${conflict.endTime} on ${date}.`,
        conflict: {
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          date,
          purpose: conflict.purpose
        }
      });
    }

    // Recalculate duration & eco metrics
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const durationHours = Math.max(0.5, (eH * 60 + eM - (sH * 60 + sM)) / 60);
    const eco = calculateBookingEnergyAndEcoScore(resource, booking.attendeeCount, durationHours);

    // If rescheduled, non-admin bookings return to PENDING status for review
    const newStatus = req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const qrData = JSON.stringify({
      bookingCode: booking.bookingCode,
      userId: booking.userId,
      resourceId: booking.resourceId,
      date,
      startTime,
      endTime,
      rescheduledAt: new Date().toISOString()
    });

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        date,
        startTime,
        endTime,
        status: newStatus,
        qrCodeData: qrData,
        estimatedEnergyKwh: eco.estimatedEnergyKwh,
        ecoScoreCalculated: eco.ecoScoreCalculated
      },
      include: {
        resource: { include: { building: true, type: true } },
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Rescheduled',
        message: `Booking ${booking.bookingCode} for ${resource.name} has been rescheduled to ${date} (${startTime} - ${endTime}). Status: ${newStatus}.`,
        type: 'INFO'
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RESCHEDULE_BOOKING',
        entity: 'BOOKING',
        entityId: id,
        details: `Rescheduled from ${booking.date} (${booking.startTime}-${booking.endTime}) to ${date} (${startTime}-${endTime})`
      }
    });

    return res.json({
      success: true,
      message: `Booking rescheduled successfully to ${date} (${startTime} - ${endTime}).`,
      booking: {
        ...updatedBooking,
        requestedFacilities: JSON.parse(updatedBooking.requestedFacilities || '[]')
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking.',
      error: error.message
    });
  }
};

module.exports = {
  checkAvailability,
  recommendResources,
  getMyTeachingAssignments,
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  approveBooking,
  rejectBooking
};
