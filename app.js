const form = document.querySelector('#booking-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const checkIn = document.querySelector('#check-in').value;
    const checkOut = document.querySelector('#check-out').value;
    const guests = document.querySelector('#guests').value;
    const coupon = document.querySelector('#coupon').value.trim();
    const note = document.querySelector('#trip-note').value.trim();
    const subject = encodeURIComponent('Summerland Cottage direct booking request');
    const lines = [
      'Hi, I would like to check availability for Summerland Cottage.',
      '',
      `Check-in: ${checkIn || 'TBD'}`,
      `Check-out: ${checkOut || 'TBD'}`,
      `Guests: ${guests}`,
      `Coupon code: ${coupon || 'None'}`,
      '',
      `Trip note: ${note || 'None'}`
    ];
    window.location.href = `mailto:sashakish@gmail.com?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
  });
}
