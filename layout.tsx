import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OkulProvider } from "@/context/okul-context";
import { Providers } from "@/components/Providers";
import AppShell from "@/components/app-shell";
import { ReduxProvider} from "@/lib/redux/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Okul Ders Programı",
  description: "Okul ders programı oluşturun ve yönetin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full flex flex-col overflow-hidden">
        <ReduxProvider>
        <OkulProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </OkulProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
