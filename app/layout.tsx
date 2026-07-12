import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Dental Concierge — Live Demo",
  description: "A 24/7 AI front desk that answers patient questions and books appointments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="font-sans">{children}</body></html>
  );
}
