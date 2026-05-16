# Summerland Cottage Booking Engine

Next.js frontend with an AWS Lambda backend for Summerland Cottage direct booking.

## What works

- Serverless availability API: `GET /availability` on AWS Lambda/API Gateway
- Serverless checkout API: `POST /checkout` on AWS Lambda/API Gateway
- Stripe webhook API: `POST /stripe-webhook` records completed site bookings
- Cheapest calendar persistence: one private S3 JSON object, default key `calendar/bookings.json`
- Local dev fallback: `data/bookings.json`
- Optional Airbnb iCal sync with `AIRBNB_ICAL_URL`
- Stay validation: minimum nights, max guests, blocked dates
- Deposit calculation
- Stripe Checkout demo mode when Stripe keys are missing

## Why S3 for calendar persistence

For this traffic pattern, S3 is cheaper and simpler than DynamoDB or RDS. Calendar rendering only needs to read a small JSON document, with occasional writes when blocked dates, pricing rules, or completed site bookings change. Lambda reads that object, merges optional Airbnb iCal blocks, and returns the calendar payload. API Gateway/CloudFront can cache the response later if needed.

## Backend: AWS Lambda

Main Lambda entrypoint:

```bash
lambda/booking-api.js
```

AWS SAM template:

```bash
template.yaml
```

Routes exposed through API Gateway HTTP API:

```bash
GET  /availability?start=YYYY-MM-DD&end=YYYY-MM-DD
POST /checkout
POST /stripe-webhook
```

Required Lambda environment variables:

```bash
BOOKING_CONFIG_S3_BUCKET=your-private-calendar-bucket
BOOKING_CONFIG_S3_KEY=calendar/bookings.json
AWS_REGION=us-west-2
SITE_URL=https://your-booking-domain.com
ALLOWED_ORIGIN=https://your-booking-domain.com
```

Optional:

```bash
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AIRBNB_ICAL_URL=https://www.airbnb.com/calendar/ical/...
```

The S3 object should use the same shape as `data/bookings.json`. Completed Stripe Checkout sessions are appended to `blockedDates` with `source: "direct-site"`, so site bookings automatically appear as booked in the calendar rendering.

After deploy, upload the initial calendar config:

```bash
aws s3 cp data/bookings.json s3://<BookingConfigBucketName>/calendar/bookings.json
```

## Frontend

Set the frontend API base URL to the API Gateway URL:

```bash
NEXT_PUBLIC_API_BASE_URL=https://abc123.execute-api.us-west-2.amazonaws.com
```

If `NEXT_PUBLIC_API_BASE_URL` is not set, local development uses the Next.js API route fallback under `/api/*`.

## Local development

```bash
npm install
npm run dev
```

Local availability uses `data/bookings.json` unless `BOOKING_CONFIG_S3_BUCKET` is set.

## Build

```bash
npm run build
```

Optional next step: add an admin-only date/rate editor so calendar changes can update the S3 object without touching JSON manually.
