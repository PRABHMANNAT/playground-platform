import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Playground · Product validation workspace",
  description: "Inspect evidence. Test assumptions. Build with confidence.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
