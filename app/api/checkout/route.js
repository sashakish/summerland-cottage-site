import Stripe from 'stripe';
import { validateStay } from '../../../lib/booking.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, guests = 2, name = '', email = '', note = '' } = body;
    const validated = await validateStay({ checkIn, checkOut, guests });

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({
        mode: 'demo',
        message: 'Payment processor is not connected yet. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL to enable live card deposits.',
        quote: validated
      }, { status: 202 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
