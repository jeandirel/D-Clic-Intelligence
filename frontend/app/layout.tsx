import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D-Clic Intelligence",
  description: "AI ServiceOps Command Center for Freshservice",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
