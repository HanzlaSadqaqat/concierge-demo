import { NextRequest, NextResponse } from "next/server";

// Demo booking store. In production, swap this for MongoDB/Postgres,
// or POST to the client's real scheduler / your CRM / an email.
const bookings: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, reason, preferredTime } = body ?? {};
    if (!name || !phone) {
      return NextResponse.json({ ok: false, error: "Name and phone are required." }, { status: 400 });
    }
    const booking = { id: Date.now(), name, phone, reason: reason || "", preferredTime: preferredTime || "", createdAt: new Date().toISOString() };
    bookings.push(booking);
    console.log("📅 NEW BOOKING:", booking); // visible in your terminal — your proof it captured the lead
    return NextResponse.json({ ok: true, booking });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ count: bookings.length, bookings });
}
