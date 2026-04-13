import React, { useState, useEffect } from 'react';
import { format, parseISO, subDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { fetchDatabase, DatabaseLog } from '@/lib/googleSheets';

export default function Diario() {
  const [logs, setLogs] = useState<DatabaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Create last 6 days including today (like in the reference where it shows a week view sliding)
  const days = Array.from({ length: 6 }).map((_, i) => subDays(new Date(), 5 - i));

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

  const getDayLogs = (day: Date) => {
    return logs.filter(log => {
      try {
        if (!log) return false;
        const rawDate = log.data || log.Data || log.date || log.Timestamp || log.timestamp;
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
  };

  const getSection = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (isNaN(hour)) return 'Mattina';
    if (hour < 12) return 'Mattina';
    if (hour < 18) return 'Pomeriggio';
    return 'Sera';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined text-primary text-4xl animate-pulse" data-icon="healing">healing</span>
          <p className="text-on-surface-variant font-medium">Caricamento diario...</p>
        </div>
      </div>
    );
  }

  const currentDayLogs = getDayLogs(selectedDay);

  const takenCount = logs.filter(log => {
      const status = log.stato || log.Stato || log.status;
      return status === 'taken' || status === 'TAKEN';
  }).length; // Simplified for "questo mese", ideally filter by current month

  const skippedCount = logs.filter(log => {
      const status = log.stato || log.Stato || log.status;
      return status === 'skipped' || status === 'SKIPPED';
  }).length;

  const sections = ['Mattina', 'Pomeriggio', 'Sera'];

  return (
    <div className="px-6 pb-32 pt-4 max-w-2xl mx-auto">
      {/* Header Section */}
      <section className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Diario</h2>
        <p className="text-on-surface-variant text-sm font-medium">Cronologia completa delle tue terapie</p>
      </section>

      {/* Horizontal Date Picker */}
      <section className="mb-10 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 pb-2">
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDay);
            return (
              <div
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                  {format(day, 'EEE', { locale: it })}
                </span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Overview Bento */}
      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col gap-1 border border-outline-variant/10">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Assunzioni</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold">{takenCount}</span>
            <span className="text-xs text-on-surface-variant">totali</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col gap-1 border border-outline-variant/10">
          <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Saltati</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold">{skippedCount}</span>
            <span className="text-xs text-on-surface-variant">totali</span>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-12 relative before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-surface-container">
        {sections.map(sectionName => {
          const sectionLogs = currentDayLogs.filter(log => {
             const time = log.orario || log.Orario || log.time || (log.timestamp ? format(new Date(log.timestamp), 'HH:mm') : '08:00');
             return getSection(time) === sectionName;
          });

          let borderColor = 'border-primary';
          let timeRange = '08:00 - 10:00';
          if (sectionName === 'Pomeriggio') {
            borderColor = 'border-tertiary';
            timeRange = '13:00 - 15:00';
          }
          if (sectionName === 'Sera') {
            borderColor = 'border-surface-container';
            timeRange = '20:00 - 22:00';
          }

          return (
            <div key={sectionName} className={`relative pl-12 ${sectionLogs.length === 0 ? 'opacity-50' : ''}`}>
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border-4 ${borderColor} z-10`}></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{sectionName}</h3>
                <span className="text-xs font-medium text-slate-400">{timeRange}</span>
              </div>

              <div className="space-y-4">
                {sectionLogs.length === 0 ? (
                   <div className="bg-surface-container-low p-6 rounded-3xl border border-dashed border-outline-variant">
                     <div className="flex items-center gap-3 text-on-surface-variant">
                       <span className="material-symbols-outlined" data-icon="bedtime">bedtime</span>
                       <span className="text-sm font-medium">Nessuna assunzione registrata</span>
                     </div>
                   </div>
                ) : (
                  sectionLogs.map((log, i) => {
                    const time = log.orario || log.Orario || log.time || (log.timestamp ? format(new Date(log.timestamp), 'HH:mm') : '--:--');
                    const status = log.stato || log.Stato || log.status;
                    const isTaken = status === 'taken' || status === 'TAKEN';

                    return (
                      <div key={i} className={`bg-surface-container-lowest p-6 rounded-3xl transition-all duration-300 ${isTaken ? 'hover:shadow-xl hover:shadow-blue-900/5' : 'opacity-80'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-lg font-bold text-on-surface leading-tight">{log.nome || log.Nome || log.name || 'Senza nome'}</h4>
                            <p className="text-sm text-on-surface-variant mt-1">Registrato</p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${isTaken ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                            <span className="material-symbols-outlined text-sm" data-icon={isTaken ? "check_circle" : "cancel"} style={{ fontVariationSettings: "'FILL' 1" }}>
                              {isTaken ? "check_circle" : "cancel"}
                            </span>
                            <span className="text-[10px] font-bold uppercase">{isTaken ? 'Preso' : 'Saltato'}</span>
                          </div>
                        </div>
                        {isTaken ? (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400" data-icon="schedule">schedule</span>
                            <span className="text-xs text-slate-400 font-medium italic">Assunto alle {time}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-error font-medium italic">Saltato intenzionalmente</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
