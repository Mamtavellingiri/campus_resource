const API = process.env.API_URL || 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// Demo accounts (see prisma/seed.js)
// ---------------------------------------------------------------------------
const ACCOUNTS = {
  admin: { email: 'admin@campus.com', password: 'Admin@123', name: 'Mamta', role: 'ADMIN' },
  vineesha: { email: 'vineesha@campus.com', password: 'Faculty@123', name: 'Vineesha', role: 'FACULTY' },
  akash: { email: 'akash@campus.com', password: 'Faculty@123', name: 'Akash', role: 'FACULTY' },
  vikash: { email: 'vikash@campus.com', password: 'Faculty@123', name: 'Vikash', role: 'FACULTY' },
  monisha: { email: 'monisha@campus.com', password: 'Student@123', name: 'Monisha', role: 'STUDENT' },
  jushya: { email: 'jushya@campus.com', password: 'Student@123', name: 'Jushya', role: 'STUDENT' },
  harishmitha: { email: 'harishmitha@campus.com', password: 'Student@123', name: 'Harishmitha', role: 'STUDENT' }
};

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const get = (path, token) => request(`${API}${path}`, token ? { headers: auth(token) } : {});
const send = (method, path, token, body) =>
  request(`${API}${path}`, {
    method,
    headers: token ? auth(token) : {},
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

// Expects the promise to be rejected with one of the given HTTP statuses.
async function expectStatus(promise, statuses, label) {
  const allowed = [].concat(statuses);
  try {
    await promise;
  } catch (err) {
    if (allowed.includes(err.status)) return err;
    throw new Error(`${label}: expected HTTP ${allowed.join('/')} but got ${err.status || 'error'} (${err.message})`);
  }
  throw new Error(`${label}: expected HTTP ${allowed.join('/')} but the request succeeded`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------------------
// Pass / fail reporting
// ---------------------------------------------------------------------------
const results = [];

async function check(label, fn) {
  try {
    const detail = await fn();
    results.push({ label, ok: true });
    console.log(`  [PASS] ${label}${detail ? ` — ${detail}` : ''}`);
    return true;
  } catch (err) {
    results.push({ label, ok: false, error: err.data?.message || err.message });
    console.log(`  [FAIL] ${label} — ${err.data?.message || err.message}`);
    return false;
  }
}

// Timezone-aware "today + N days" (YYYY-MM-DD) matching the server's TIMEZONE.
function dateFromToday(offsetDays) {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000));
}

const slotsOf = (data) => (Array.isArray(data) ? data : data.busySlots || data.slots || data.bookings || []);
const hasId = (list, id) => list.some((b) => b.id === id);

async function verifyAll() {
  console.log('====================================================');
  console.log('RUNNING COMPREHENSIVE END-TO-END SYSTEM VERIFICATION');
  console.log('====================================================');

  const tokens = {};
  const users = {};
  const createdBookingIds = [];

  // -------------------------------------------------------------------------
  console.log('\n1. Health & Authentication (all demo accounts):');
  await check('Health endpoint is healthy', async () => {
    const health = await get('/health');
    assert(health.status === 'healthy', `status was ${health.status}`);
  });

  for (const [key, acc] of Object.entries(ACCOUNTS)) {
    await check(`Login ${acc.email} (${acc.role})`, async () => {
      const login = await send('POST', '/auth/login', null, { email: acc.email, password: acc.password });
      assert(login.user.role === acc.role, `expected role ${acc.role}, got ${login.user.role}`);
      assert(login.user.name === acc.name, `expected name ${acc.name}, got ${login.user.name}`);
      tokens[key] = login.token;
      users[key] = login.user;
    });
  }

  await check('Registration with role FACULTY', async () => {
    const regRes = await send('POST', '/auth/register', null, {
      name: 'Dr. Verification',
      email: `verified_faculty_${Date.now()}@campus.com`,
      password: 'Password@123',
      role: 'FACULTY',
      department: 'Robotics'
    });
    assert(regRes.user.role === 'FACULTY', `got role ${regRes.user.role}`);
  });

  const required = ['admin', 'vineesha', 'akash', 'monisha', 'jushya', 'harishmitha'];
  if (!required.every((k) => tokens[k])) {
    throw new Error('Cannot continue: one or more demo accounts could not log in. Re-seed the database (node prisma/seed.js).');
  }

  // -------------------------------------------------------------------------
  console.log('\n2. Resources & filters:');
  let resources = [];
  await check('List resources', async () => {
    const all = await get('/resources');
    resources = all.resources;
    assert(all.count > 0, 'no resources returned');
    return `${all.count} resources`;
  });
  await check('Filter minCapacity >= 50', async () => {
    const r = await get('/resources?minCapacity=50');
    assert(r.resources.every((x) => x.capacity >= 50), 'capacity filter returned a smaller room');
    return `${r.count} resources`;
  });
  await check('Filter status=AVAILABLE', async () => {
    const r = await get('/resources?status=AVAILABLE');
    assert(r.resources.every((x) => x.status === 'AVAILABLE'), 'status filter returned a non-available room');
    return `${r.count} resources`;
  });

  // Two bookable rooms for the 10:00-12:00 slot.
  const bookable = resources.filter((r) =>
    r.status === 'AVAILABLE' &&
    r.capacity >= 5 &&
    r.operatingHoursStart <= '10:00' &&
    r.operatingHoursEnd >= '17:00' &&
    (!r.maintenances || r.maintenances.length === 0) &&
    (!r.maintenanceStatus || r.maintenanceStatus === 'NONE')
  );
  if (bookable.length < 2) throw new Error('Need at least 2 bookable resources to run the booking checks.');
  const roomA = bookable[0];
  const roomB = bookable[1];

  // Random far-future day so repeated runs / seeded bookings never collide.
  const baseOffset = 45 + Math.floor(Math.random() * 250);
  const testDate = dateFromToday(baseOffset);
  const otherDate = dateFromToday(baseOffset + 1);
  const rescheduleDate = dateFromToday(baseOffset + 2);

  // Faculty class (subject + year) comes from each faculty's own teaching assignments.
  let vineeshaClass;
  let akashClass;
  console.log('\n3. Teaching assignments:');
  await check('Vineesha has at least one teaching assignment', async () => {
    const r = await get('/bookings/my-assignments', tokens.vineesha);
    assert(r.assignments.length > 0, 'no assignments');
    vineeshaClass = r.assignments[0];
    return `${vineeshaClass.subjectName} / ${vineeshaClass.year}`;
  });
  await check('Akash has at least one teaching assignment', async () => {
    const r = await get('/bookings/my-assignments', tokens.akash);
    assert(r.assignments.length > 0, 'no assignments');
    akashClass = r.assignments[0];
    return `${akashClass.subjectName} / ${akashClass.year}`;
  });
  await check('Students cannot read teaching assignments (403)', async () => {
    await expectStatus(get('/bookings/my-assignments', tokens.monisha), 403, 'student my-assignments');
  });
  if (!vineeshaClass || !akashClass) throw new Error('Cannot continue without teaching assignments.');

  const classPayload = (cls) => ({ subjectId: cls.subjectId, year: cls.year });
  const slot = { date: testDate, startTime: '10:00', endTime: '12:00' };
  const purpose = `E2E verification class ${Date.now()}`;

  // -------------------------------------------------------------------------
  console.log('\n4. Booking rules & validation:');
  await check('Student cannot create a booking (403)', async () => {
    await expectStatus(send('POST', '/bookings', tokens.monisha, {
      resourceId: roomA.id, purpose, eventType: 'ACADEMIC', attendeeCount: 5, ...slot
    }), 403, 'student booking');
  });
  await check('Faculty booking without subject/year is rejected (400)', async () => {
    await expectStatus(send('POST', '/bookings', tokens.vineesha, {
      resourceId: roomA.id, purpose, eventType: 'ACADEMIC', attendeeCount: 5, ...slot
    }), 400, 'missing subject/year');
  });
  await check('End time <= start time is rejected (400)', async () => {
    await expectStatus(send('POST', '/bookings', tokens.vineesha, {
      resourceId: roomA.id, purpose, eventType: 'ACADEMIC', attendeeCount: 5,
      date: testDate, startTime: '14:00', endTime: '13:00', ...classPayload(vineeshaClass)
    }), 400, 'end <= start');
  });
  await check('Past date is rejected (400)', async () => {
    await expectStatus(send('POST', '/bookings', tokens.vineesha, {
      resourceId: roomA.id, purpose, eventType: 'ACADEMIC', attendeeCount: 5,
      date: '2020-01-01', startTime: '10:00', endTime: '11:00', ...classPayload(vineeshaClass)
    }), 400, 'past date');
  });

  // -------------------------------------------------------------------------
  console.log('\n5. Faculty booking lifecycle (PENDING -> approved):');
  let booking;
  await check('Vineesha creates a booking', async () => {
    const r = await send('POST', '/bookings', tokens.vineesha, {
      resourceId: roomA.id, purpose, eventType: 'ACADEMIC', attendeeCount: 5,
      ...slot, ...classPayload(vineeshaClass)
    });
    booking = r.booking;
    createdBookingIds.push(booking.id);
    return `${booking.bookingCode} in ${roomA.name} on ${testDate}`;
  });
  if (!booking) throw new Error('Cannot continue: the faculty booking was not created.');

  await check('(a) Faculty booking is PENDING and has no qrCodeData', async () => {
    assert(booking.status === 'PENDING', `status is ${booking.status}`);
    assert(!booking.qrCodeData, 'qrCodeData should be empty while PENDING');
  });

  await check('(c) Check-in before approval is refused', async () => {
    await expectStatus(send('POST', '/checkin/scan', tokens.vineesha, { bookingId: booking.id }), [400, 403], 'check-in before approval');
    const fresh = await get(`/bookings/${booking.id}`, tokens.vineesha);
    assert(fresh.booking.status === 'PENDING', `status changed to ${fresh.booking.status}`);
  });

  await check('(d) Second faculty (Akash) gets 409 for the exact same room/date/time', async () => {
    await expectStatus(send('POST', '/bookings', tokens.akash, {
      resourceId: roomA.id, purpose: 'Conflicting exact class', eventType: 'ACADEMIC', attendeeCount: 5,
      ...slot, ...classPayload(akashClass)
    }), 409, 'exact overlap');
  });
  await check('(d) Second faculty (Akash) gets 409 for a partial overlap (11:00-13:00)', async () => {
    await expectStatus(send('POST', '/bookings', tokens.akash, {
      resourceId: roomA.id, purpose: 'Conflicting partial class', eventType: 'ACADEMIC', attendeeCount: 5,
      date: testDate, startTime: '11:00', endTime: '13:00', ...classPayload(akashClass)
    }), 409, 'partial overlap');
  });
  await check('(d) /bookings/check-availability reports the room as taken', async () => {
    await expectStatus(send('POST', '/bookings/check-availability', tokens.akash, {
      resourceId: roomA.id, ...slot
    }), 409, 'check-availability');
  });
  await check('(d) The room is NOT in /bookings/recommend results for that slot', async () => {
    const r = await send('POST', '/bookings/recommend', tokens.akash, { ...slot, attendeeCount: 5 });
    assert(r.recommendations.length > 0, 'recommend returned nothing, so this check would be meaningless');
    const found = r.recommendations.some((x) => x.resource.id === roomA.id);
    assert(!found, `${roomA.name} was recommended even though it is booked`);
    return `${r.recommendations.length} other rooms recommended`;
  });

  await check('(e) Monisha does NOT see Vineesha\'s booking while PENDING', async () => {
    const list = await get('/bookings', tokens.monisha);
    assert(!hasId(list.bookings, booking.id), 'PENDING booking is visible to the mapped student');
    await expectStatus(get(`/bookings/${booking.id}`, tokens.monisha), 403, 'student fetch of pending booking');
  });

  // (g) busy-slots, checked while the booking is still PENDING (PENDING must count as busy)
  const ALLOWED_SLOT_KEYS = ['date', 'endTime', 'isMine', 'resourceId', 'startTime'];
  await check('(g) busy-slots for Vineesha: only resourceId/date/startTime/endTime/isMine, isMine=true', async () => {
    const data = await get(`/bookings/busy-slots?resourceId=${roomA.id}&date=${testDate}`, tokens.vineesha);
    const slots = slotsOf(data);
    const mine = slots.find((s) => s.startTime === slot.startTime && s.endTime === slot.endTime);
    assert(mine, `own pending slot missing (response keys: ${Object.keys(data).join(', ')})`);
    assert(JSON.stringify(Object.keys(mine).sort()) === JSON.stringify(ALLOWED_SLOT_KEYS), `unexpected keys: ${Object.keys(mine).join(', ')}`);
    assert(mine.isMine === true, 'isMine should be true for the owner');
    assert(mine.resourceId === roomA.id && mine.date === testDate, 'resourceId/date mismatch');
  });
  await check('(g) busy-slots for Akash: Vineesha\'s slot shows as isMine=false with no names or details', async () => {
    const data = await get(`/bookings/busy-slots?resourceId=${roomA.id}&date=${testDate}`, tokens.akash);
    const slots = slotsOf(data);
    const other = slots.find((s) => s.startTime === slot.startTime && s.endTime === slot.endTime);
    assert(other, 'the other faculty\'s slot is not reported as busy');
    assert(other.isMine === false, 'isMine should be false for another faculty');
    for (const s of slots) {
      assert(JSON.stringify(Object.keys(s).sort()) === JSON.stringify(ALLOWED_SLOT_KEYS), `unexpected keys: ${Object.keys(s).join(', ')}`);
    }
    const raw = JSON.stringify(data).toLowerCase();
    const leaks = ['vineesha', 'e2e verification', booking.bookingCode.toLowerCase(), 'bookingcode', 'qrcodedata', 'purpose', 'subject']
      .filter((word) => raw.includes(word));
    assert(leaks.length === 0, `response leaks private data: ${leaks.join(', ')}`);
  });
  await check('(g) busy-slots for students is an empty list', async () => {
    for (const key of ['monisha', 'jushya', 'harishmitha']) {
      const data = await get(`/bookings/busy-slots?resourceId=${roomA.id}&date=${testDate}`, tokens[key]);
      const slots = slotsOf(data);
      assert(slots.length === 0, `${key} received ${slots.length} busy slot(s)`);
    }
  });

  await check('Faculty cannot approve a booking (403, admin only)', async () => {
    await expectStatus(send('POST', `/bookings/${booking.id}/approve`, tokens.vineesha, { remarks: 'self approve' }), 403, 'faculty approve');
  });

  let approved;
  await check('Admin (Mamta) approves the booking', async () => {
    const r = await send('POST', `/bookings/${booking.id}/approve`, tokens.admin, {
      remarks: 'Approved by Administrator after conflict validation'
    });
    approved = r.booking;
    assert(approved.status === 'APPROVED', `status is ${approved.status}`);
  });

  await check('(b) After approval the booking has qrCodeData and is in Vineesha\'s list', async () => {
    const list = await get('/bookings', tokens.vineesha);
    const mine = list.bookings.find((b) => b.id === booking.id);
    assert(mine, 'approved booking missing from the faculty list');
    assert(mine.status === 'APPROVED', `status is ${mine.status}`);
    assert(mine.qrCodeData, 'qrCodeData is empty after approval');
    assert(JSON.parse(mine.qrCodeData).bookingCode === booking.bookingCode, 'QR payload has the wrong bookingCode');
  });

  await check('Faculty list only contains Vineesha\'s own bookings', async () => {
    const list = await get('/bookings', tokens.vineesha);
    assert(list.bookings.every((b) => b.userId === users.vineesha.id), 'faculty list contains another user\'s booking');
  });
  await check('Akash cannot see Vineesha\'s booking in his list or by id', async () => {
    const list = await get('/bookings', tokens.akash);
    assert(!hasId(list.bookings, booking.id), 'other faculty booking visible in list');
    await expectStatus(get(`/bookings/${booking.id}`, tokens.akash), 403, 'other faculty fetch');
  });

  await check('(e) Monisha SEES Vineesha\'s approved booking with faculty name and subject', async () => {
    const list = await get('/bookings', tokens.monisha);
    const seen = list.bookings.find((b) => b.id === booking.id);
    assert(seen, 'approved booking missing from the mapped student\'s list');
    assert(seen.user && seen.user.name === 'Vineesha', `faculty name is ${seen.user && seen.user.name}`);
    assert(seen.subject && seen.subject.name === vineeshaClass.subjectName, `subject is ${seen.subject && seen.subject.name}`);
  });
  await check('(e) Jushya and Harishmitha never see Vineesha\'s booking (list or by id)', async () => {
    for (const key of ['jushya', 'harishmitha']) {
      const list = await get('/bookings', tokens[key]);
      assert(!hasId(list.bookings, booking.id), `${key} can see the booking in the list`);
      await expectStatus(get(`/bookings/${booking.id}`, tokens[key]), 403, `${key} fetch by id`);
    }
  });
  await check('(f) Students never receive qrCodeData', async () => {
    const list = await get('/bookings', tokens.monisha);
    assert(list.bookings.length > 0, 'Monisha has no bookings to inspect');
    assert(list.bookings.every((b) => !b.qrCodeData), 'a booking in the student list contains qrCodeData');
    const single = await get(`/bookings/${booking.id}`, tokens.monisha);
    assert(!single.booking.qrCodeData, 'single booking fetch contains qrCodeData');
    assert(!JSON.stringify(list).includes('issuedAt'), 'QR payload leaked in the student response');
  });
  await check('(e) Monisha received a "New class scheduled" notification', async () => {
    const n = await get('/notifications', tokens.monisha);
    assert(n.notifications.some((x) => x.title === 'New class scheduled'), 'notification not found');
  });

  // -------------------------------------------------------------------------
  console.log('\n6. Reschedule (faculty booking returns to PENDING):');
  let rescheduleTarget;
  await check('Vineesha creates a second booking in another room', async () => {
    const r = await send('POST', '/bookings', tokens.vineesha, {
      resourceId: roomB.id, purpose: `${purpose} (reschedule)`, eventType: 'ACADEMIC', attendeeCount: 5,
      date: otherDate, startTime: '10:00', endTime: '11:00', ...classPayload(vineeshaClass)
    });
    rescheduleTarget = r.booking;
    createdBookingIds.push(rescheduleTarget.id);
  });
  await check('Reschedule keeps the booking PENDING with no QR', async () => {
    const r = await send('PATCH', `/bookings/${rescheduleTarget.id}/reschedule`, tokens.vineesha, {
      date: rescheduleDate, startTime: '14:00', endTime: '15:00'
    });
    assert(r.booking.date === rescheduleDate, 'date was not updated');
    assert(r.booking.status === 'PENDING', `status is ${r.booking.status}`);
    assert(!r.booking.qrCodeData, 'qrCodeData should be empty for a pending reschedule');
  });
  await check('Rescheduled slot is held: second faculty gets 409 for it', async () => {
    await expectStatus(send('POST', '/bookings', tokens.akash, {
      resourceId: roomB.id, purpose: 'Conflict with rescheduled class', eventType: 'ACADEMIC', attendeeCount: 5,
      date: rescheduleDate, startTime: '14:30', endTime: '15:30', ...classPayload(akashClass)
    }), 409, 'conflict after reschedule');
  });
  await check('Admin rejects the rescheduled booking (reason required)', async () => {
    await expectStatus(send('POST', `/bookings/${rescheduleTarget.id}/reject`, tokens.admin, {}), 400, 'reject without reason');
    const r = await send('POST', `/bookings/${rescheduleTarget.id}/reject`, tokens.admin, { reason: 'E2E rejection test' });
    assert(r.booking.status === 'REJECTED', `status is ${r.booking.status}`);
    assert(!r.booking.qrCodeData, 'qrCodeData should be empty for a rejected booking');
  });

  // -------------------------------------------------------------------------
  console.log('\n7. Cancellation of the approved booking:');
  await check('(h) Vineesha cancels the approved booking and the QR is cleared', async () => {
    const r = await send('PATCH', `/bookings/${booking.id}/cancel`, tokens.vineesha);
    assert(r.booking.status === 'CANCELLED', `status is ${r.booking.status}`);
    assert(!r.booking.qrCodeData, 'qrCodeData was not cleared');
    const fresh = await get(`/bookings/${booking.id}`, tokens.vineesha);
    assert(!fresh.booking.qrCodeData, 'qrCodeData is still stored in the database');
  });
  await check('(h) The cancelled booking disappears from Monisha\'s list', async () => {
    const list = await get('/bookings', tokens.monisha);
    assert(!hasId(list.bookings, booking.id), 'cancelled booking is still visible to the mapped student');
    await expectStatus(get(`/bookings/${booking.id}`, tokens.monisha), 403, 'student fetch of cancelled booking');
  });
  await check('(h) Monisha received a "Class cancelled" notification', async () => {
    const n = await get('/notifications', tokens.monisha);
    assert(n.notifications.some((x) => x.title === 'Class cancelled'), 'notification not found');
  });
  await check('The room is free again (Akash can now book the same slot)', async () => {
    const r = await send('POST', '/bookings', tokens.akash, {
      resourceId: roomA.id, purpose: `${purpose} (after cancel)`, eventType: 'ACADEMIC', attendeeCount: 5,
      ...slot, ...classPayload(akashClass)
    });
    createdBookingIds.push(r.booking.id);
    assert(r.booking.status === 'PENDING', `status is ${r.booking.status}`);
  });

  // -------------------------------------------------------------------------
  console.log('\n8. Admin analytics & notifications:');
  await check('Analytics overview', async () => {
    const overview = await get('/analytics/overview', tokens.admin);
    return `${overview.metrics.totalResources} resources, utilization ${overview.metrics.utilizationRate}%`;
  });
  await check('Analytics utilization', async () => {
    const util = await get('/analytics/utilization', tokens.admin);
    assert(Array.isArray(util.resourceUtilization), 'resourceUtilization missing');
    return `${util.resourceUtilization.length} resources analyzed`;
  });
  await check('Faculty notifications', async () => {
    const n = await get('/notifications', tokens.vineesha);
    assert(Array.isArray(n.notifications), 'notifications missing');
    return `${n.notifications.length} records`;
  });

  // -------------------------------------------------------------------------
  // Cleanup: cancel anything this run created (ignore errors for already-final bookings).
  for (const id of createdBookingIds) {
    await send('PATCH', `/bookings/${id}/cancel`, tokens.admin).catch(() => {});
  }
  console.log('\nCleaned up test bookings.');
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log('\n====================================================');
  console.log(`SUMMARY: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED CHECKS:');
    failed.forEach((f) => console.log(`  [FAIL] ${f.label} — ${f.error}`));
    console.log('====================================================');
    process.exit(1);
  }
  console.log('ALL SYSTEM API & LOGIC VERIFICATIONS PASSED');
  console.log('====================================================');
}

verifyAll()
  .catch((err) => {
    console.error('\nVerification aborted:', err.data?.message || err.message);
    results.push({ label: 'Run aborted', ok: false, error: err.message });
  })
  .finally(printSummary);