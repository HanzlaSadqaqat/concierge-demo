import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, practice } from "@/lib/practice";

type Msg = { role: "user" | "assistant"; content: string };

// The system prompt requires testimonials to be quoted verbatim, so we can
// reliably detect which one (if any) ended up in a reply — by author name,
// which survives even if the model lightly rewraps the surrounding text —
// and attach its photo for the widget to render inline.
function findTestimonialImage(reply: string) {
  let bestImage: string | undefined;
  let bestIndex = Infinity;
  for (const t of practice.testimonials) {
    if (!t.image) continue;
    const idx = reply.indexOf(t.author);
    if (idx !== -1 && idx < bestIndex) {
      bestIndex = idx;
      bestImage = t.image;
    }
  }
  return bestImage;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Msg[] } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // ── Fallback demo mode (works with NO API key) ──
    // Lets you run and demo the widget instantly. Add a key for real AI replies.
    if (!apiKey) {
      const reply = demoReply(messages);
      return NextResponse.json({
        reply,
        demo: true,
        image: findTestimonialImage(reply),
      });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: buildSystemPrompt(),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        // Forcing a tool call (rather than relying on prompt instructions
        // alone) makes it structurally impossible for the model to prepend
        // reasoning/labels like "Intent: Ready to book" to the reply — the
        // equivalent prompt-only instruction leaked through in practice.
        tools: [
          {
            name: "send_reply",
            description:
              "Send the reply message to show the patient in the chat widget.",
            input_schema: {
              type: "object",
              properties: { reply: { type: "string" } },
              required: ["reply"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "send_reply" },
      }),
    });

    if (!res.ok) {
      const reply = demoReply(messages);
      return NextResponse.json({
        reply,
        demo: true,
        image: findTestimonialImage(reply),
      });
    }
    const data = await res.json();
    const toolUse = data?.content?.find(
      (c: { type: string }) => c.type === "tool_use",
    );
    const reply = toolUse?.input?.reply ?? "Sorry, could you rephrase that?";
    return NextResponse.json({ reply, image: findTestimonialImage(reply) });
  } catch {
    return NextResponse.json({
      reply:
        "Sorry, something went wrong. Please call us at " +
        practice.phone +
        ".",
    });
  }
}

type ServiceEntry = {
  re: RegExp;
  topic: string;
  priceKey: string;
  label: string;
  verb: "start" | "starts" | "is";
};
const SERVICE_REGISTRY: ServiceEntry[] = [
  {
    re: /brace|invisalign|straighten/,
    topic: "Braces",
    priceKey: "brace",
    label: "braces/Invisalign",
    verb: "start",
  },
  {
    re: /implant/,
    topic: "Implants",
    priceKey: "implant",
    label: "implants",
    verb: "start",
  },
  {
    re: /whiten/,
    topic: "Whitening",
    priceKey: "whiten",
    label: "whitening",
    verb: "is",
  },
  {
    re: /clean|exam|check/,
    topic: "Cleaning & Exam",
    priceKey: "clean",
    label: "a cleaning & exam",
    verb: "is",
  },
  {
    re: /root canal/,
    topic: "Root Canal",
    priceKey: "root",
    label: "a root canal",
    verb: "starts",
  },
  {
    re: /emergency|urgent|broke|chip|crack/,
    topic: "Emergency Visit",
    priceKey: "emergency",
    label: "an emergency visit",
    verb: "is",
  },
];

// Simple keyword-based fallback so the demo works without an API key.
// Mirrors the real system prompt's intent framework: ready-to-book gets a
// fast confirm-and-book, hesitant/curious gets empathy + a matching
// testimonial before a low-pressure offer, and pain/symptoms always route
// to the dentist rather than getting advice. Unlike a plain per-message
// keyword matcher, it resolves "which service" against the WHOLE
// conversation so far (falling back from the current message), so a
// follow-up like "yes, book me in" still remembers the service that was
// being discussed instead of replying as if from a blank slate.
function demoReply(messages: Msg[]): string {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const transcript = messages
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();
  const price = (key: string) =>
    practice.services.find((s) => s.name.toLowerCase().includes(key))?.price;
  const testimonial = (topic: string) =>
    practice.testimonials.find(
      (t) => t.topic.toLowerCase() === topic.toLowerCase(),
    );
  const matchService = (text: string) =>
    SERVICE_REGISTRY.find((s) => s.re.test(text));

  // The service mentioned in THIS message wins; otherwise fall back to
  // whatever was established earlier in the conversation.
  const service = matchService(last) ?? matchService(transcript);

  if (/hurt|pain|ache|infection|swollen|should i|do i need/.test(last))
    return `I'm not able to give clinical advice, but our dental team can take a proper look. Would you like me to book you a visit? For urgent pain, call us at ${practice.phone}.`;

  // A direct ask for testimonials/reviews is its own intent — answer it
  // directly instead of falling through to an unrelated booking question.
  if (
    /test\w*monial|\breview|patient stor|success stor|what do (other )?patients say|social proof/.test(
      last,
    )
  ) {
    if (service) {
      const t = testimonial(service.topic);
      return `Of course! Here's what one of our patients said: "${t?.quote}" — ${t?.author}. Want me to set up a free consultation?`;
    }
    const picks = ["Braces", "Implants", "Whitening"]
      .map(testimonial)
      .filter(Boolean);
    const lines = picks.map((t) => `"${t?.quote}" — ${t?.author}`).join(" ");
    return `Happy to share! ${lines} Which service are you most interested in?`;
  }

  const ready =
    /\b(book|appointment|schedule|sign me up|yes)\b|available|availability|what times|when can i|this week|next week|\btoday\b|\btomorrow\b/.test(
      last,
    );
  const hesitant =
    /nervous|scared|afraid|anxious|anxiety|not sure|unsure|worried|hesitant|how do i know|are you (any )?good|have you done|trust/.test(
      last,
    );

  if (ready) {
    if (service)
      return `Perfect — ${service.label} ${service.verb} ${price(service.priceKey)}. I can get you booked, let me grab a few quick details.`;
    return `Perfect — I can get you booked. Let me grab a few quick details (name, phone, reason, and a preferred day/time).`;
  }

  if (hesitant) {
    if (service) {
      const t = testimonial(service.topic);
      if (t)
        return `Totally understand — that's a fair thing to ask. One patient shared: "${t.quote}" — ${t.author}. A free consultation is a no-pressure way to see if we're the right fit.`;
    }
    const t = testimonial("Dental anxiety");
    return `I hear you, that's a really common feeling. One patient told us: "${t?.quote}" — ${t?.author}. A free consultation is a low-pressure way to see if we're the right fit, no obligation.`;
  }

  if (
    /confus|don'?t know what|not sure what|which service|what should i (get|choose)|help me choose/.test(
      last,
    ) &&
    !service
  )
    return `No problem! Are you thinking about a cleaning, whitening, braces/Invisalign, implants, a root canal, or is this for an emergency?`;

  if (/hour|open|close|weekend|saturday|sunday/.test(last))
    return `We're open ${practice.hours}. Would you like to book a free consultation?`;
  if (/insurance|cost of|pay|financ|ppo/.test(last))
    return `${practice.insurance} Want me to book you a free consultation to go over the details?`;
  if (service)
    return `${service.label[0].toUpperCase()}${service.label.slice(1)} ${service.verb} ${price(service.priceKey)}. Are you looking to book, or want to know more first?`;
  if (/hi|hello|hey/.test(last))
    return `Hi! Welcome to ${practice.name} 👋 Are you looking to book a visit, or would you like to know more about how we work first?`;
  return `Happy to help! Are you looking to book a visit, or would you like to know more about how we work first?`;
}
