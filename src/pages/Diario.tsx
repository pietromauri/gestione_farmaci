import React, { useState, useEffect } from 'react';
import { format, parseISO, subDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pill, Activity, Smile, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { fetchDatabase, DatabaseLog } from '@/lib/googleSheets';

export default function Diario() {
  const [logs, setLogs] = useState<DatabaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i));

  useEffect(() => {
    const loadLogs = async () => {
      const db = await fetchDatabase();
      if (db && db.logs) {
        setLogs(db.logs);
      }
      setLoading(false);
    };
    loadLogs();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Diario</h1>
        <p className="text-slate-500 mt-1">La tua cronologia della salute</p>
      </header>

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Caricamento diario...</div>
        ) : (
          days.map((day, dayIdx) => {
            const dayLogs = logs.filter(log => {
              try {
                if (!log) return false;
                // Gestisce sia date ISO che date semplici yyyy-MM-dd
                // Priorità alla colonna 'Data' o 'date', altrimenti usa 'Timestamp' o 'timestamp'
                const rawDate = log.Data || log.date || log.Timestamp || log.timestamp;
                if (!rawDate) return false;
                
                const logDate = typeof rawDate === 'string' && rawDate.includes('-') 
                  ? parseISO(rawDate) 
                  : new Date(rawDate);
                  
                return !isNaN(logDate.getTime()) && isSameDay(logDate, day);
              } catch (e) {
                console.error("Errore parsing data log:", e, log);
                return false;
              }
            });

            return (
              <div key={dayIdx} className="space-y-3">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2 z-10">
                  {format(day, "EEEE d MMMM", { locale: it })}
                </h2>
                
                <div className="space-y-3">
                  {dayLogs.length === 0 ? (
                    <p className="text-xs text-slate-300 italic px-2">Nessuna attività registrata.</p>
                  ) : (
                    dayLogs.map((log, i) => {
                      const time = log.Orario || log.time || (log.timestamp ? format(new Date(log.timestamp), 'HH:mm') : '--:--');
                      const status = log.Stato || log.status;
                      const isTaken = status === 'taken' || status === 'TAKEN';
                      
                      return (
                        <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-full ${isTaken ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Pill className={`h-5 w-5 ${isTaken ? 'text-green-600' : 'text-red-600'}`} />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900">{log.Nome || log.name || 'Senza nome'}</h3>
                                <p className="text-xs text-slate-500">
                                  {isTaken ? 'Preso' : 'Saltato'} alle {time}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

