import { addDays, getAvailabilityForRange, getBlocks, iso, toDate } from '../../../lib/booking.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const today = iso(new Date());
  const start = searchParams.get('start') || today;
  const end = searchParams.get('end') || iso(addDays(toDate(start), 90));
  const { config, blocks } = await getBlocks();
  return Response.json({
    start,
    end,
    minimumNights: config.minimumNights,
    maxGuests: config.maxGuests,
    baseNightlyCents: config.baseNightlyCents,
    cleaningFeeCents: config.cleaningFeeCents,
    depositPercent: config.depositPercent,
    days: getAvailabilityForRange(start, end, blocks, config)
  });
}
