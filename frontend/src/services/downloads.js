import api from './api';

const saveResponseAsFile = (response, filename) => {
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export async function downloadBookingCalendar(booking) {
  const response = await api.get(`/bookings/${encodeURIComponent(booking.id)}/ics`, {
    responseType: 'blob'
  });
  const filename = `${String(booking.bookingCode || 'booking').replace(/[\\/:*?"<>|]/g, '-')}.ics`;
  saveResponseAsFile(response, filename);
}

export async function downloadBookingsCsv() {
  const response = await api.get('/admin/export/bookings.csv', { responseType: 'blob' });
  saveResponseAsFile(response, 'bookings.csv');
}
