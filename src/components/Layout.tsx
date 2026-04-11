import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, BookOpen, LineChart, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import AddDataMenu from './AddDataMenu';
import { useNotificationManager } from '@/hooks/useNotificationManager';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Initialize and run the notification manager globally
  useNotificationManager();

  const navItems = [
    { path: '/', label: 'Oggi', icon: CalendarDays },
    { path: '/diario', label: 'Diario', icon: BookOpen },
    { path: '/progressi', label: 'Progressi', icon: LineChart },
    { path: '/profilo', label: 'Profilo', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* FAB - Floating Action Button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <Button
          size="icon"
          onClick={() => setIsAddMenuOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>

      {/* Add Data Menu */}
      <AddDataMenu isOpen={isAddMenuOpen} onClose={() => setIsAddMenuOpen(false)} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

