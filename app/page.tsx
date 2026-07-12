import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#EFF5F4] to-white">
      {/* Fake practice site behind the widget, so the demo looks real */}
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5.5c-1.6-1.6-3.2-2-4.7-2C5 3.5 3.5 5.4 3.5 8c0 2 .6 3.2 1.1 5.2.4 1.6.5 3 .8 4.6.2 1.4.6 2.7 1.5 2.7 1 0 1.2-1.2 1.5-2.8.3-1.5.4-2.9 1.3-2.9h.6c.9 0 1 1.4 1.3 2.9.3 1.6.5 2.8 1.5 2.8.9 0 1.3-1.3 1.5-2.7.3-1.6.4-3 .8-4.6.5-2 1.1-3.2 1.1-5.2 0-2.6-1.5-4.5-3.8-4.5-1.5 0-3.1.4-4.7 2z" /></svg>
            </span>
            <span className="font-bold text-brand">Bright Smile Dental</span>
          </div>
          <nav className="hidden gap-6 text-sm font-medium text-ink/70 sm:flex">
            <span>Services</span><span>About</span><span>Reviews</span><span>Contact</span>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <span className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand">Live Demo</span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-brand sm:text-5xl">
          This practice never misses a patient.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink/60">
          The chat bubble in the corner is a 24/7 AI front desk. Ask it about braces, hours, insurance, or booking — it answers instantly and captures the appointment. Try it 👉
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            ["Answers 24/7", "Pricing, hours, insurance — instantly, any hour."],
            ["Books appointments", "Captures name, phone & reason. Never drops a lead."],
            ["Routes clinical to staff", "Never gives medical advice — hands off to the team."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5">
              <p className="font-bold text-brand">{t}</p>
              <p className="mt-1 text-sm text-ink/60">{d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-md text-xs text-ink/40">
          Demo tip: try "How much are braces and can I come Saturday?" — watch it answer and book.
        </p>
      </section>

      <ChatWidget />
    </main>
  );
}
