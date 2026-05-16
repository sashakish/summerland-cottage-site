import Stripe from 'stripe';
import { appendConfirmedBooking, getAvailabilityPayload, validateStay } from '../lib/booking.js';

const corsHeaders = {
  'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json'
};

function json(statusCode, payload) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(payload) };
}

function eventMethod(event) {
  return event.requestContext?.http?.method || event.httpMethod || 'GET';
}

function eventPath(event) {
  return event.rawPath || event.path || '/';
}

function rawBody(event) {
  if (!event.body) return '';
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
}

function parseBody(event) {
  const body = rawBody(event);
  return body ? JSON.parse(body) : {};
}

function eventHeader(event, name) {
  const headers = event.headers || {};
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match?.[1];
}

async function handleStripeWebhook(event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
  const payload = rawBody(event);
  const signature = eventHeader(event, 'stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeEvent = webhookSecret
    ? stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    : JSON.parse(payload);

  if (stripeEvent.type !== 'checkout.session.completed') {
    return json(200, { received: true, ignored: stripeEvent.type });
  }

  const session = stripeEvent.data.object;
  const { checkIn, checkOut, name = '', email = '' } = session.metadata || {};
  await appendConfirmedBooking({
    checkIn,
    checkOut,
    source: 'direct-site',
    note: `Direct site booking${name ? ` for ${name}` : ''}${email ? ` (${email})` : ''}`,
    stripeSessionId: session.id
  });

  return json(200, { received: true, booked: { checkIn, checkOut } });
}

export async function handler(event) {
  const method = eventMethod(event);
  const pathname = eventPath(event);

  if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };

  try {
    if (method === 'GET' && pathname.endsWith('/availability')) {
      const params = event.queryStringParameters || {};
      return json(200, await getAvailabilityPayload({ start: params.start, end: params.end }));
    }

    if (method === 'POST' && pathname.endsWith('/stripe-webhook')) {
      return await handleStripeWebhook(event);
    }

    if (method === 'POST' && pathname.endsWith('/checkout')) {
      const body = parseBody(event);
      const { checkIn, checkOut, guests = 2, name = '', email = '', note = '' } = body;
      const validated = await validateStay({ checkIn, checkOut, guests });

      if (!process.env.STRIPE_SECRET_KEY) {
        return json(202, {
          mode: 'demo',
          message: 'Payment processor is not connected yet. Add STRIPE_SECRET_KEY and SITE_URL to enable live card deposits.',
          quote: validated
        });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email || undefined,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: validated.depositCents,
            product_data: {
              name: 'Summerland Cottage deposit',
              description: `${checkIn} to ${checkOut}, ${validated.nights} nights, ${guests} guests`
            }
          }
        }],
        metadata: { checkIn, checkOut, guests: String(guests), name, email, note },
        success_url: `${siteUrl}/?booking=success`,
        cancel_url: `${siteUrl}/?booking=cancelled`
      });

      return json(200, { url: session.url });
    }

    return json(404, { error: 'Not found' });
  } catch (error) {
    return json(400, { error: error.message });
  }
}
