import React from 'react';
import { format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pill, Activity, Smile, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { mockLogs, mockMedications } from '@/lib/mockData';

export default function Diario() {
  const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i));

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Diario</h1>
        <p className="text-slate-500 mt-1">La tua cronologia della salute</p>
      </header>

      <div className="space-y-8">
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2 z-10">
              {format(day, "EEEE d MMMM", { locale: it })}
            </h2>
            
            <div className="space-y-3">
              {/* Mocking some logs for each day */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Pill className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Aspirina</h3>
                      <p className="text-xs text-slate-500">Preso alle 08:12</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Smile className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Umore: Felice</h3>
                      <p className="text-xs text-slate-500">Registrato alle 10:30</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-yellow-500 transition-colors" />
                </CardContent>
              </Card>

              {dayIdx % 2 === 1 && (
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Pressione: 120/80</h3>
                        <p className="text-xs text-slate-500">Registrato alle 18:00</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

