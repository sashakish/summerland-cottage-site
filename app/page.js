'use client';

import { useEffect, useMemo, useState } from 'react';

const photos = [
  '01-DQdubB9EYWm.jpg','02-DDSen_vSDH3.jpg','03-DDSSPt5vG2s.jpg','04-DASn_v1Rb9q.jpg','05-C_42knrR_KE.jpg','06-C_rHqDbS-hi.jpg','07-C_fHOr4x8pw.jpg','08-C_fG7UzxdfU.jpg','09-C_fGuTJRISW.jpg','10-C_fGm-Vxv6Y.jpg','11-C_fGcAuxS_g.jpg','12-C_fGQLURntp.jpg','13-C_fGHLFxA2y.jpg','14-C_fF5MoxELv.jpg','15-C_fFynLRpU7.jpg','16-C_blybbyval.jpg','17-C_blT9ZSqkz.jpg','18-C_Yw-nVS34y.jpg','19-C_YRTb1viE6.jpg','20-C_Xb3V6xxKT.jpg','21-C_XbqIvxDU6.jpg','22-C_XaQkLRELs.jpg'
];

function money(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(start, days) {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function apiUrl(path) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
  return base ? `${base}${path}` : `/api${path}`;
}

function nightsBetween(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000);
}

export default function Page() {
  const [availability, setAvailability] = useState(null);
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: '2', name: '', email: '', note: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const start = todayIso();
    const end = addDaysIso(start, 90);
    fetch(apiUrl(`/availability?start=${start}&end=${end}`)).then(r => r.json()).then(setAvailability).catch(() => setStatus('Availability could not load.'));
  }, []);

  const quote = useMemo(() => {
    if (!availability || !form.checkIn || !form.checkOut) return null;
    const nights = nightsBetween(form.checkIn, form.checkOut);
    if (nights <= 0) return null;
    const subtotal = nights * availability.baseNightlyCents + availability.cleaningFeeCents;
    const deposit = Math.round(subtotal * availability.depositPercent);
    return { nights, subtotal, deposit };
  }, [availability, form.checkIn, form.checkOut]);

  async function submit(e) {
    e.preventDefault();
    setStatus('Checking dates...');
    const res = await fetch(apiUrl('/checkout'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    if (data.mode === 'demo') {
      setStatus(`Dates pass validation. Deposit would be ${money(data.quote.depositCents)}. Payment processor is not connected yet. Once connected, this button will open secure checkout.`);
      return;
    }
    setStatus(data.error || 'Could not start checkout.');
  }

  const days = availability?.days?.slice(0, 42) || [];

  return <>
    <header className="site-header">
      <a className="brand" href="#top"><img src="/assets/instagram-profile.jpg" alt="Summerland Cottage" /><span>Summerland Cottage</span></a>
      <nav><a href="#cottage">The Cottage</a><a href="#photos">Photos</a><a href="#booking">Reserve</a></nav>
    </header>
    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Summerland, California</p>
          <h1>A lovingly restored beach cottage for Santa Barbara coast days.</h1>
          <p className="lede">Check real availability, choose dates, and reserve your stay with a secure card deposit.</p>
          <div className="actions"><a className="button primary" href="#booking">Check dates</a><a className="button secondary" href="#photos">See photos</a></div>
          <div className="trust-row"><span>Secure deposit</span><span>Live calendar ready</span><span>Near Montecito</span></div>
        </div>
        <div className="hero-collage"><img className="hero-photo main" src="/assets/instagram/02-DDSen_vSDH3.jpg" alt="Summerland Cottage" /><img className="hero-photo top" src="/assets/instagram/04-DASn_v1Rb9q.jpg" alt="Cottage detail" /><img className="hero-photo bottom" src="/assets/instagram/10-C_fGm-Vxv6Y.jpg" alt="Cottage interior" /></div>
      </section>

      <section className="intro" id="cottage">
        <p className="section-kicker">The cottage</p>
        <h2>Classic California character, refreshed for comfortable stays.</h2>
        <div className="intro-grid"><p>Summerland Cottage is built around the feeling of a real coastal home: warm details, easy gathering spaces, thoughtful touches, and a personal kind of hospitality guests remember.</p><ul className="feature-list"><li>2 bedrooms</li><li>1 bathroom</li><li>Up to 4 guests</li><li>Close to Montecito and Santa Barbara</li></ul></div>
      </section>

      <section className="photo-section" id="photos">
        <div className="section-heading"><p className="section-kicker">Photos</p><h2>Real moments from @summerland.cottage.</h2><p>Freshly pulled from the cottage Instagram: interiors, details, guest moments, and the Summerland feeling.</p></div>
        <div className="photo-mosaic">{photos.map((p, i) => <figure key={p} className={`photo-card ${i % 7 === 1 ? 'wide' : ''} ${i % 9 === 3 ? 'tall' : ''}`}><img src={`/assets/instagram/${p}`} alt="Summerland Cottage" loading="lazy" /></figure>)}</div>
      </section>

      <section className="booking" id="booking">
        <p className="section-kicker">Reserve your stay</p>
        <h2>Check availability and secure your dates.</h2>
        <p>Select dates to see the deposit amount. Available dates can be reserved through secure checkout with a card deposit.</p>
        <div className="booking-shell">
          <form className="booking-card" onSubmit={submit}>
            <label><span>Check-in</span><input type="date" value={form.checkIn} min={todayIso()} onChange={e => setForm({ ...form, checkIn: e.target.value })} required /></label>
            <label><span>Check-out</span><input type="date" value={form.checkOut} min={form.checkIn || todayIso()} onChange={e => setForm({ ...form, checkOut: e.target.value })} required /></label>
            <label><span>Guests</span><select value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
            <label><span>Name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Guest name" /></label>
            <label className="full"><span>Email</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
            <label className="full"><span>Trip note</span><textarea rows="3" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Tell us what brings you to Summerland" /></label>
            {quote && <div className="quote full"><strong>{quote.nights} nights</strong><span>Estimated total {money(quote.subtotal)}</span><span>Deposit due now {money(quote.deposit)}</span></div>}
            <button className="button primary full" type="submit">Reserve with deposit</button>
            {status && <p className="fine-print full">{status}</p>}
          </form>
          <div className="booking-details">
            <div className="property-facts"><span>2 bedrooms</span><span>1 bathroom</span><span>4 guests</span></div>
            <div className="mini-calendar"><div className="calendar-head"><strong>Availability</strong><span>{availability ? 'Loaded' : 'Loading...'}</span></div><div className="calendar-grid weekdays"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div className="calendar-grid dates">{days.map(d => <span key={d.date} title={d.note || d.source} className={d.available ? '' : 'blocked'}>{Number(d.date.slice(8,10))}<small>{d.available ? money(d.nightlyCents) : 'Booked'}</small></span>)}</div><div className="calendar-key"><span><i></i> Available</span><span><i className="blocked-key"></i> Booked/held</span></div></div>
            <div className="sleeping-card"><h3>Sleeping arrangements</h3><div><strong>Bedroom 1</strong><span>Queen bed</span></div><div><strong>Bedroom 2</strong><span>Double bed</span></div></div>
          </div>
        </div>
      </section>
    </main>
    <footer><p>Summerland Cottage · Summerland, California</p><a href="https://www.instagram.com/summerland.cottage/">@summerland.cottage</a></footer>
  </>;
}
