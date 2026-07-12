import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, practice } from "@/lib/practice";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Msg[] } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // ── Fallback demo mode (works with NO API key) ──
    // Lets you run and demo the widget instantly. Add a key for real AI replies.
    if (!apiKey) {
      return NextResponse.json({ reply: demoReply(messages), demo: true });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 400,
        system: buildSystemPrompt(),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ reply: demoReply(messages), demo: true });
    }
    const data = await res.json();
    const reply = data?.content?.[0]?.text ?? "Sorry, could you rephrase that?";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Sorry, something went wrong. Please call us at " + practice.phone + "." });
  }
}

// Simple keyword-based fallback so the demo works without an API key.
function demoReply(messages: Msg[]): string {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const price = (name: string) => practice.services.find((s) => name.includes(s.name.toLowerCase().split(" ")[0]))?.price;

  if (/hour|open|close|weekend|saturday|sunday/.test(last))
    return `We're open ${practice.hours}. Would you like to book a free consultation?`;
  if (/insurance|cost of|pay|financ|ppo/.test(last))
    return `${practice.insurance} Want me to book you a free consultation to go over the details?`;
  if (/brace|invisalign|straighten/.test(last))
    return `Braces and Invisalign start ${price("brace")}, and the consultation is free. I can book you in — shall I grab a few quick details?`;
  if (/implant/.test(last))
    return `Dental implants start ${price("implant")}. I'd recommend a free consult so we can assess you properly — want me to book that?`;
  if (/whiten/.test(last))
    return `Teeth whitening is ${price("whiten")}. Would you like to schedule a visit?`;
  if (/clean|exam|check/.test(last))
    return `A cleaning & exam is ${price("clean")}. Shall I book you in?`;
  if (/hurt|pain|ache|why|should i|do i need|infection|swollen/.test(last))
    return `I'm not able to give clinical advice, but our dental team can take a proper look. Would you like me to book you a visit? For urgent pain, call us at ${practice.phone}.`;
  if (/book|appointment|schedule|yes|consult/.test(last))
    return `Wonderful — I'll grab a few quick details and get you booked. (Opening the booking form for you.)`;
  if (/hi|hello|hey/.test(last))
    return `Hi! Welcome to ${practice.name} 👋 I can help with our services, pricing, hours, or booking a free consultation. What can I help you with?`;
  return `I can help with our services, pricing, hours, or booking a free consultation. What would you like to know? (Or call us at ${practice.phone}.)`;
}
