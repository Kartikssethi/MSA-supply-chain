import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const RootLayout = () => {
  return (
    <div className="flex h-screen bg-[#fafaf8] font-sans overflow-hidden text-slate-800 selection:bg-emerald-500/20">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full w-full relative">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};