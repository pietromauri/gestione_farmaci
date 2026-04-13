import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import AddDataMenu from './AddDataMenu';
import { useNotificationManager } from '@/hooks/useNotificationManager';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  
  // Attiva il gestore delle notifiche in background a livello globale
  useNotificationManager();

  const navItems = [
    { path: '/', label: 'Oggi', icon: 'today', fill: true },
    { path: '/diario', label: 'Diario', icon: 'event_note', fill: false },
    { path: '/progressi', label: 'Progressi', icon: 'query_stats', fill: false },
    { path: '/profilo', label: 'Profilo', icon: 'person', fill: false },
  ];

  return (
    <div className="flex flex-col min-h-screen font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* TopAppBar Shell */}
      {/* Note: The header might be part of individual pages in the design, but let's see if we should add it here. */}
      {/* Looking at the reference, the TopAppBar seems consistent. Let's add it if it's not in the page. */}
      {/* Wait, Oggi.tsx currently has its own header. I will add the global header here and we can remove it from pages if needed, but the design shows different headers per page (TopAppBar vs Hero).
          Actually, Screen 1 (Diario) has a TopAppBar and a Page Header.
          Screen 2 has a TopAppBar "Aggiungi Farmaco"
          Screen 3 (Oggi) has a TopAppBar "Medicare" and a Page Header.
          So TopAppBar is global!
      */}
      <header className="bg-surface bright flex justify-between items-center px-6 h-16 w-full fixed top-0 z-40 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl" data-icon="healing">healing</span>
          <h1 className="text-xl font-bold text-primary font-headline tracking-tight">Medicare</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200">
            <span className="material-symbols-outlined text-outline" data-icon="search">search</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 relative">
            <span className="material-symbols-outlined text-outline" data-icon="notifications">notifications</span>
            {/* Optional dot for notifications */}
            {/* <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full"></span> */}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 pb-32 max-w-2xl mx-auto px-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* FAB - Floating Action Button */}
      {/* Screen 3 shows the FAB floating on the right side */}
      <button
        onClick={() => setIsAddMenuOpen(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-3xl" data-icon="add">add</span>
      </button>

      {/* Add Data Menu */}
      <AddDataMenu isOpen={isAddMenuOpen} onClose={() => setIsAddMenuOpen(false)} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-8px_32px_rgba(11,28,48,0.06)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-5 py-2 scale-95 duration-150 ease-in-out ${
                isActive
                  ? 'bg-surface-container-highest text-primary rounded-2xl'
                  : 'text-outline hover:opacity-80'
              }`}
            >
              <span
                className="material-symbols-outlined mb-1"
                data-icon={item.icon}
                style={isActive && item.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-xs font-label font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
