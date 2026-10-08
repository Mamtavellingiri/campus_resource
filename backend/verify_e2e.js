const API = 'http://localhost:5000/api';

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

async function verifyAll() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END SYSTEM VERIFICATION');
  console.log('====================================================');

  // 1. Health check
  const health = await request(`${API}/health`);
  console.log('1. Health Check:', health.status);

  // 2. Auth Tests: Demo logins
  console.log('\n2. Testing Authentication:');
  const adminLogin = await request(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@campus.com', password: 'Admin@123' })
  });
  console.log('✓ Admin Login Success:', adminLogin.user.name, `(${adminLogin.user.role})`);
  const adminToken = adminLogin.token;

  const studentLogin = await request(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'student@campus.com', password: 'Student@123' })
  });
  console.log('✓ Student Login Success:', studentLogin.user.name, `(${studentLogin.user.role})`);
  const studentToken = studentLogin.token;

  // Test registration with Role
  const newEmail = `verified_faculty_${Date.now()}@campus.com`;
  const regRes = await request(`${API}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Verification',
      email: newEmail,
      password: 'Password@123',
      role: 'FACULTY',
      department: 'Robotics'
    })
  });
  console.log('✓ Registration with Role Success:', regRes.user.name, `(Role: ${regRes.user.role})`);

  // 3. Resource Management & Search/Filters
  console.log('\n3. Testing Resource Filters (Type, Capacity, Location, Availability):');
  const resourcesAll = await request(`${API}/resources`);
  console.log(`✓ Total resources retrieved: ${resourcesAll.count}`);

  const filteredCap = await request(`${API}/resources?minCapacity=50`);
  console.log(`✓ Filtered minCapacity >= 50: ${filteredCap.count} resources`);
  if (!filteredCap.resources.every(r => r.capacity >= 50)) {
    throw new Error('Capacity filter failed');
  }

  const filteredStatus = await request(`${API}/resources?status=AVAILABLE`);
  console.log(`✓ Filtered status=AVAILABLE: ${filteredStatus.count} resources`);

  // 4. Booking & Double-Booking Overlap Tests
  console.log('\n4. Testing Booking & Conflict Overlap Rule:');
  const targetResource = resourcesAll.resources[0];
  const targetDate = '2026-11-20';

  // Create initial booking
  const b1Res = await request(`${API}/bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      resourceId: targetResource.id,
      purpose: 'AI Systems Verification Workshop',
      eventType: 'WORKSHOP',
      attendeeCount: 15,
      date: targetDate,
      startTime: '10:00',
      endTime: '12:00'
    })
  });
  console.log('✓ Created initial booking:', b1Res.booking.bookingCode, 'Status:', b1Res.booking.status);
  const booking1 = b1Res.booking;

  // Test Overlap 1: Exact conflict (10:00 - 12:00)
  try {
    await request(`${API}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        resourceId: targetResource.id,
        purpose: 'Conflicting Exact Session',
        eventType: 'ACADEMIC',
        attendeeCount: 10,
        date: targetDate,
        startTime: '10:00',
        endTime: '12:00'
      })
    });
    throw new Error('Should have rejected exact overlap conflict!');
  } catch (err) {
    if (err.status === 409) {
      console.log('✓ Successfully blocked exact overlap (409 Conflict):', err.data.message);
    } else {
      throw err;
    }
  }

  // Test Overlap 2: Partial overlap (11:00 - 13:00)
  try {
    await request(`${API}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        resourceId: targetResource.id,
        purpose: 'Conflicting Partial Session',
        eventType: 'ACADEMIC',
        attendeeCount: 10,
        date: targetDate,
        startTime: '11:00',
        endTime: '13:00'
      })
    });
    throw new Error('Should have rejected partial overlap conflict!');
  } catch (err) {
    if (err.status === 409) {
      console.log('✓ Successfully blocked partial overlap (409 Conflict):', err.data.message);
    } else {
      throw err;
    }
  }

  // Test Validation 3: End time <= Start time
  try {
    await request(`${API}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        resourceId: targetResource.id,
        purpose: 'Invalid Time Order Session',
        eventType: 'ACADEMIC',
        attendeeCount: 10,
        date: targetDate,
        startTime: '14:00',
        endTime: '13:00'
      })
    });
    throw new Error('Should have rejected end <= start!');
  } catch (err) {
    if (err.status === 400) {
      console.log('✓ Successfully blocked invalid end <= start (400 Bad Request):', err.data.message);
    } else {
      throw err;
    }
  }

  // Test Validation 4: Date in past
  try {
    await request(`${API}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        resourceId: targetResource.id,
        purpose: 'Past Date Session',
        eventType: 'ACADEMIC',
        attendeeCount: 10,
        date: '2020-01-01',
        startTime: '10:00',
        endTime: '11:00'
      })
    });
    throw new Error('Should have rejected past date!');
  } catch (err) {
    if (err.status === 400) {
      console.log('✓ Successfully blocked past date (400 Bad Request):', err.data.message);
    } else {
      throw err;
    }
  }

  // 5. Test Reschedule Feature
  console.log('\n5. Testing Reschedule Booking API:');
  const reschRes = await request(`${API}/bookings/${booking1.id}/reschedule`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      date: '2026-11-21',
      startTime: '14:00',
      endTime: '16:00'
    })
  });
  console.log('✓ Reschedule Success:', reschRes.message);
  console.log('✓ Rescheduled details:', reschRes.booking.date, `(${reschRes.booking.startTime} - ${reschRes.booking.endTime})`, 'Status:', reschRes.booking.status);

  // 6. Test Admin Approval Workflow
  console.log('\n6. Testing Admin Approval Workflow:');
  const approveRes = await request(`${API}/bookings/${booking1.id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      remarks: 'Approved by Administrator after conflict validation'
    })
  });
  console.log('✓ Admin Approval Success:', approveRes.message, 'Status:', approveRes.booking.status);

  // 7. Test Admin Dashboard & Utilization Analytics
  console.log('\n7. Testing Admin Analytics (Overview, Energy, Utilization):');
  const overview = await request(`${API}/analytics/overview`, { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log('✓ Overview Metrics - Total Resources:', overview.metrics.totalResources, '| Utilization:', `${overview.metrics.utilizationRate}%`);

  const util = await request(`${API}/analytics/utilization`, { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log(`✓ Utilization Metrics: ${util.resourceUtilization.length} resources analyzed`);
  const topResource = [...util.resourceUtilization].sort((a, b) => b.totalBookings - a.totalBookings)[0];
  console.log('✓ Top Most-Used Resource:', topResource.name, `(${topResource.totalBookings} bookings)`);

  // 8. Test Notifications
  console.log('\n8. Testing In-App Notifications:');
  const notifs = await request(`${API}/notifications`, { headers: { Authorization: `Bearer ${studentToken}` } });
  console.log(`✓ Notifications fetched: ${notifs.notifications.length} records. Latest: "${notifs.notifications[0]?.title}"`);

  // Cleanup test booking
  await request(`${API}/bookings/${booking1.id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✓ Cleaned up test booking');

  console.log('\n====================================================');
  console.log('🎉 ALL SYSTEM API & LOGIC VERIFICATIONS PASSED 100%!');
  console.log('====================================================');
}

verifyAll().catch(err => {
  console.error('Verification failed:', err.data || err.message);
  process.exit(1);
});
