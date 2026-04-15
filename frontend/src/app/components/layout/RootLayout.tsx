import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickCommandPalette } from './QuickCommandPalette';

export const RootLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#fafaf8] font-sans overflow-hidden text-slate-800 selection:bg-emerald-500/20">
      <Sidebar className="hidden md:flex" />

      {isMobileSidebarOpen && (
        <>
          <button
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <Sidebar
            className="fixed inset-y-0 left-0 z-50 md:hidden"
            onNavigate={() => setIsMobileSidebarOpen(false)}
          />
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full w-full relative">
        <Header
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full z-0">
          <Outlet />
        </main>
      </div>

      <QuickCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />
    </div>
  );
};