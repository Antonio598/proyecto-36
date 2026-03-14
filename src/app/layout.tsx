import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import ChatbotWidget from "@/components/ChatbotWidget";
import AuthGuard from "@/components/AuthGuard";

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
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </body>
    </html>
  );
}

/** Inner shell that shows sidebar + chatbot only on authenticated pages */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShellClient>{children}</AppShellClient>
  );
}

// We need a client component to read pathname
import AppShellClient from "@/components/AppShellClient";
