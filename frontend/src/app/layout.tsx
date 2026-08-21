import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className="dark">
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
