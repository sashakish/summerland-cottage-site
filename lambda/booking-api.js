import Stripe from 'stripe';
import { getAvailabilityPayload, validateStay } from '../lib/booking.js';

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

function parseBody(event) {
  if (!event.body) return {};
  const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(body);
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
        metadata: { checkIn, checkOut, guests: String(guests), name, note },
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
