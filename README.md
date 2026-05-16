# Summerland Cottage Booking Engine

Next.js booking engine for Summerland Cottage.

## What works

- Live availability API: `/api/availability`
- Manual blocked dates in `data/bookings.json`
- Optional Airbnb iCal sync with `AIRBNB_ICAL_URL`
- Stay validation: minimum nights, max guests, blocked dates
- Deposit calculation
- Stripe Checkout endpoint: `/api/checkout`
- Demo mode when Stripe keys are missing

## Deploy

Deploy to Vercel or another host that supports Next.js API routes. GitHub Pages cannot run the booking/payment engine.

Required environment variables for live deposits:

```bash
STRIPE_SECRET_KEY=sk_live_or_test_...
NEXT_PUBLIC_SITE_URL=https://your-booking-domain.com
AIRBNB_ICAL_URL=https://www.airbnb.com/calendar/ical/...
```

Optional next step: add a Stripe webhook to persist confirmed reservations after successful payment.
