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

const carousel = document.querySelector('.testimonial-carousel');
if (carousel) {
  const track = carousel.querySelector('.review-track');
  const slides = [...track.querySelectorAll('article')];
  const dots = [...document.querySelectorAll('.testimonial-dots button')];
  const [prev, next] = carousel.querySelectorAll('.testimonial-arrow');
  let index = 0;
  let touchStartX = null;

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== index)));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  prev?.addEventListener('click', () => show(index - 1));
  next?.addEventListener('click', () => show(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(diff) < 45) return;
    show(index + (diff < 0 ? 1 : -1));
  });
  window.setInterval(() => show(index + 1), 8000);
  show(0);
}
