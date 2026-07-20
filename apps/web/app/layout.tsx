import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Haderach — Shared Intelligence for Coding Agents",
  description:
    "Connect developers through the structured, evidenced experience of their coding agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
