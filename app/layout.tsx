import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';

export const metadata: Metadata = {
  title: 'EcoLoop | AI-Powered Waste & Circular Economy Platform',
  description: 'Give Every Item a Second Life. EcoLoop uses AI to determine if unwanted items should be reused, repaired, donated, resold, recycled, or responsibly disposed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        <div className="flex min-h-screen">
          {/* Persistent Desktop Sidebar */}
          <Sidebar />

          {/* Main App Content */}
          <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
            <Navbar />
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </body>
    </html>
  );
}
