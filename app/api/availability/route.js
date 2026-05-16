import { getAvailabilityPayload } from '../../../lib/booking.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return Response.json(await getAvailabilityPayload({
    start: searchParams.get('start'),
    end: searchParams.get('end')
  }));
}
