import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Memorai - AI That Remembers You",
  description: "An AI assistant with persistent memory that evolves with you",
  keywords: ["AI", "chatbot", "memory", "personalized", "assistant"],
  authors: [{ name: "Memorai Team" }],
  openGraph: {
    title: "Memorai - AI That Remembers You",
    description: "An AI assistant with persistent memory that evolves with you",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#030305] text-[#f4f4f5]`}>
        {children}
      </body>
    </html>
  );
}
