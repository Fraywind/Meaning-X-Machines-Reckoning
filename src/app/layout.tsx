import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reckoning — AI Deliberation Engine",
  description:
    "An AI Deliberation Engine for Human Judgment. Decomposes complex goals into decision trees, surfaces hidden conflicts, and returns control to the human at every inflection point.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
