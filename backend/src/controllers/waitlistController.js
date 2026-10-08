const prisma = require('../config/prisma');
const { promoteNext } = require('../services/waitlistService');
const { getNowInTz } = require('../utils/time');

/**
 * POST /api/waitlist
 * Join waitlist — only allowed if the requested slot is actually taken.
 */
const joinWaitlist = async (req, res) => {
  try {
    const { resourceId, date, startTime, endTime, attendeeCount = 1, purpose } = req.body;

    if (!resourceId || !date || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'resourceId, date, startTime, endTime, and purpose are required.' });
    }

    // Verify the slot is actually taken
    const conflict = await prisma.booking.findFirst({
      where: {
        resourceId, date,
        status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      }
    });

    if (!conflict) {
      return res.status(400).json({
        success: false,
        message: 'The slot is currently available — you can book it directly instead of joining the waitlist.'
      });
    }

    // Check if user already has a WAITING entry for this slot
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        userId: req.user.id,
        resourceId, date,
        startTime, endTime,
        status: 'WAITING'
      }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'You are already on the waitlist for this slot.' });
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        userId: req.user.id,
        resourceId, date, startTime, endTime,
        attendeeCount: parseInt(attendeeCount, 10),
        purpose,
        status: 'WAITING'
      },
      include: { resource: { select: { name: true } } }
    });

    return res.status(201).json({
      success: true,
      message: `You've joined the waitlist for ${entry.resource.name} on ${date} (${startTime}–${endTime}). We'll notify you if a slot opens up.`,
      entry
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to join waitlist.', error: error.message });
  }
};

/**
 * GET /api/waitlist/mine
 * Get the current user's waitlist entries.
 */
const getMyWaitlist = async (req, res) => {
  try {
    const entries = await prisma.waitlistEntry.findMany({
      where: { userId: req.user.id },
      include: { resource: { include: { building: true, type: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, count: entries.length, entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch waitlist.', error: error.message });
  }
};

/**
 * DELETE /api/waitlist/:id
 * Cancel a waitlist entry (own entries only).
 */
const cancelWaitlistEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found.' });
    }

    if (entry.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this waitlist entry.' });
    }

    if (entry.status !== 'WAITING') {
      return res.status(400).json({ success: false, message: `Cannot cancel a waitlist entry with status ${entry.status}.` });
    }

    await prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    return res.json({ success: true, message: 'Waitlist entry cancelled successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel waitlist entry.', error: error.message });
  }
};

module.exports = { joinWaitlist, getMyWaitlist, cancelWaitlistEntry };
