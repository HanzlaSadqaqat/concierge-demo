"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string; image?: string };
type Booking = { name: string; phone: string; reason: string; preferredTime: string };

const WELCOME = "Hi! Welcome to Bright Smile Dental 👋 I can help with our services, pricing, hours, or booking a free consultation. What can I help you with?";

export default function ChatWidget() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [booked, setBooked] = useState<Booking | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, showBooking, booked, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    // Only open the booking form when the CUSTOMER explicitly asks to book —
    // either directly, or by affirming a booking offer the assistant just made.
    // "wasOffered" requires the assistant's last message to be an actual
    // booking QUESTION (ends in "?" and mentions booking/consultation), not
    // just any reply that happens to contain the word "book" or "consultation"
    // somewhere — almost every reply does that, since the system prompt has
    // the bot end most answers with some kind of booking nudge. Without the
    // "ends in ?" requirement, a bare "yes"/"sure" to an unrelated question
    // would incorrectly pop the form.
    const lastAssistantMsg = messages[messages.length - 1];
    const wasOffered =
      lastAssistantMsg?.role === "assistant" &&
      /\?\s*$/.test(lastAssistantMsg.content.trim()) &&
      /book|schedule|consultation|get you in/i.test(lastAssistantMsg.content);
    const userWantsBooking =
      /\b(book|appointment|schedule me|sign me up)\b/i.test(content) ||
      (wasOffered && /^(yes|yeah|yep|sure|ok|okay|please|sounds good|let'?s do it)\b/i.test(content));

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply, image: data.image }]);
      if (userWantsBooking) {
        setTimeout(() => setShowBooking(true), 400);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const quick = ["How much are braces?", "What are your hours?", "Do you take insurance?", "Book a consultation"];

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} aria-label="Open chat"
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-2xl transition hover:scale-105 hover:bg-brand-dark">
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[600px] max-h-[85vh] w-[380px] max-w-[92vw] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-center justify-between bg-brand px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><ToothIcon /></span>
          <div>
            <p className="text-sm font-bold leading-tight">Bright Smile Dental</p>
            <p className="flex items-center gap-1.5 text-xs text-white/70"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online now</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Minimize" className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#F7FAFA] px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-black/5"}`}>
              {m.content}
            </div>
            {m.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.image} alt="Patient before and after" className="mt-1.5 h-32 w-full max-w-[80%] rounded-xl object-cover shadow-sm ring-1 ring-black/5" />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
              <Dot /><Dot d="150" /><Dot d="300" />
            </div>
          </div>
        )}

        {/* Booking form */}
        {showBooking && !booked && (
          <BookingForm
            onCancel={() => setShowBooking(false)}
            onBooked={(b) => { setBooked(b); setShowBooking(false);
              setMessages((m) => [...m, { role: "assistant", content: `You're all set, ${b.name}! 🎉 We've got your request${b.preferredTime ? ` for ${b.preferredTime}` : ""} and our team will text ${b.phone} to confirm. Anything else I can help with?` }]); }}
          />
        )}

        {/* Quick replies (only at start) */}
        {messages.length === 1 && !showBooking && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quick.map((q) => (
              <button key={q} onClick={() => send(q)} className="rounded-full border border-brand/25 bg-white px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand hover:text-white">
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…"
          className="flex-1 rounded-full bg-[#F1F5F5] px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent focus:ring-brand/30" />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </form>
    </div>
  );
}

function BookingForm({ onBooked, onCancel }: { onBooked: (b: Booking) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Booking>({ name: "", phone: "", reason: "", preferredTime: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const field = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  async function submit() {
    if (!form.name || !form.phone) { setErr("Please add your name and phone."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.ok) onBooked(form); else setErr(data.error || "Something went wrong.");
    } catch { setErr("Something went wrong."); } finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-brand/15 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-bold text-brand">Book your free consultation</p>
      <div className="space-y-2.5">
        <input className={field} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={field} placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={field} placeholder="Reason (e.g. braces consult)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <input className={field} placeholder="Preferred day/time" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
        {err && <p className="text-xs text-red-500">{err}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={saving} className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
            {saving ? "Booking…" : "Confirm booking"}
          </button>
          <button onClick={onCancel} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink/60 hover:bg-black/5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

const Dot = ({ d = "0" }: { d?: string }) => <span className="h-2 w-2 animate-bounce rounded-full bg-brand/40" style={{ animationDelay: `${d}ms` }} />;
const ChatIcon = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
const ToothIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5.5c-1.6-1.6-3.2-2-4.7-2C5 3.5 3.5 5.4 3.5 8c0 2 .6 3.2 1.1 5.2.4 1.6.5 3 .8 4.6.2 1.4.6 2.7 1.5 2.7 1 0 1.2-1.2 1.5-2.8.3-1.5.4-2.9 1.3-2.9h.6c.9 0 1 1.4 1.3 2.9.3 1.6.5 2.8 1.5 2.8.9 0 1.3-1.3 1.5-2.7.3-1.6.4-3 .8-4.6.5-2 1.1-3.2 1.1-5.2 0-2.6-1.5-4.5-3.8-4.5-1.5 0-3.1.4-4.7 2z" /></svg>;
