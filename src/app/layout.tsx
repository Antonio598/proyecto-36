import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Modern sans-serif typical of SaaS
import "./globals.css";
import { Sidebar } from "@/components/Sidebar"; // Adjusted to use relative/alias
import ChatbotWidget from "@/components/ChatbotWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Medical Dashboard",
  description: "Advanced API-First Patient and Appointment Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-gray-50 h-full">
      <body
        className={`${inter.className} h-full antialiased font-sans text-slate-800`}
      >
        <div className="flex h-screen w-full bg-gray-50">
          {/* Sidebar Area */}
          <div className="hidden md:flex flex-col z-10 w-64 bg-white border-r border-gray-200">
             <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto w-full p-6 lg:p-10">
              <div className="mx-auto max-w-7xl h-full">
                {children}
              </div>
            </main>
          </div>
          <ChatbotWidget />
        </div>
      </body>
    </html>
  );
}
