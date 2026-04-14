import React, { useState } from 'react';
import { format, parseISO, isSameDay, addHours, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockMedications, mockSchedules, mockAppointments } from '@/lib/mockData';
import { Medication, Schedule, Appointment } from '@/types';
import { logMedication, fetchDatabase } from '@/lib/googleSheets';
import { useNotificationManager } from '@/hooks/useNotificationManager';

type TaskType = 'MEDICATION' | 'APPOINTMENT' | 'MEASUREMENT';

interface Task {
  id: string;
  type: TaskType;
  time: string;
  title: string;
  subtitle?: string;
  status?: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'SNOOZED';
  medication?: Medication;
  appointment?: Appointment;
  originalTime?: string;
}

export default function Oggi() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      const db = await fetchDatabase();
      const today = new Date();
      const dayTasks: Task[] = [];

      if (db && db.medicinals && db.medicinals.length > 0) {
        const profile = localStorage.getItem('user_profile');
        let currentUserId = 'anonymous';
        if (profile) {
          try {
            const user = JSON.parse(profile);
            currentUserId = user.email || 'anonymous';
          } catch (e) {
            // ignore
          }
        }

        db.medicinals.forEach(med => {
          // Filtra per frequenza
          const dayOfMonth = today.getDate();
          const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
          // Convertiamo 0 (Dom) in 7 per nostra convenienza se vogliamo Lun=1 (ISO style)
          const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

          let shouldShow = false;
          const frequency = (med.frequenza || 'DAILY').toUpperCase().trim();

          if (frequency === 'DAILY') {
            shouldShow = true;
          } else if (frequency === 'ALTERNATE') {
            shouldShow = dayOfMonth % 2 === 0;
          } else if (frequency === 'MONTHLY') {
            shouldShow = dayOfMonth === 1;
          } else if (frequency === 'WEEKLY') {
            if (med.parsed_giorni_settimana && Array.isArray(med.parsed_giorni_settimana)) {
              shouldShow = med.parsed_giorni_settimana.includes(adjustedDayOfWeek);
            } else if (med.giorni_settimana !== undefined && med.giorni_settimana !== '') {
              // Robust parsing: convert 6.7 to 6,7 then remove non-digits/commas
              const daysStr = String(med.giorni_settimana).replace(/\./g, ',').replace(/[^\d,]/g, '');
              const allowedDays = daysStr.split(',').map(d => parseInt(d, 10)).filter(d => !isNaN(d));
              shouldShow = allowedDays.includes(adjustedDayOfWeek);
            }
          }

          if (shouldShow) {
            const todayStr = format(today, 'yyyy-MM-dd');
            
            // Funzione per determinare lo stato iniziale basandosi sui log
            const getInitialStatus = (time: string) => {
              if (!db.logs || !Array.isArray(db.logs)) return 'PENDING';
              
              const todayStr = format(today, 'yyyy-MM-dd');
              
              const logEntry = db.logs.find(l => {
                // Dopo la normalizzazione in googleSheets.ts, le chiavi sono lowercase
                const logName = (l.nome || l.Nome || l.name || '').toString().trim();
                let logTime = (l.orario || l.Orario || l.time || '').toString().trim();
                const logDate = (l.data || l.Data || l.date || '').toString();
                const medNomePulito = (med.nome || '').trim();

                // Normalizza orario se Google Sheets lo restituisce in ISO (1899-12...) o con i secondi (08:00:00)
                if (logTime.includes('T')) {
                  try {
                    const tDate = new Date(logTime);
                    if (!isNaN(tDate.getTime())) {
                      logTime = format(tDate, 'HH:mm');
                    }
                  } catch(e) {}
                } else if (logTime.includes(':')) {
                  // Prendi i primi 'HH:mm' e ingnora i secondi
                  const parts = logTime.split(':');
                  if (parts.length >= 2) {
                    logTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                  }
                }

                // Normalizza data: gestisce stringhe in vari formati o stringhe ISO compensate (es 22:00Z che è 00:00 in Italia)
                let isDateMatch = false;
                const todayIt = format(today, 'dd/MM/yyyy');
                const todayIt2 = format(today, 'd/M/yyyy');
                
                if (logDate.includes(todayStr) || logDate.includes(todayIt) || logDate.includes(todayIt2)) {
                  isDateMatch = true;
                } else {
                  try {
                    const parsed = new Date(logDate);
                    if (!isNaN(parsed.getTime())) {
                       isDateMatch = isSameDay(parsed, today); 
                    }
                  } catch (e) {}
                }

                return (
                  logName.toLowerCase() === medNomePulito.toLowerCase() && 
                  logTime === time && 
                  isDateMatch
                );

              });

              if (logEntry) {
                const status = (logEntry.stato || logEntry.Stato || logEntry.status || '').toLowerCase();
                return status === 'taken' ? 'TAKEN' : 'SKIPPED';
              }
              return 'PENDING';
            };

            if (med.orario_1) {
              dayTasks.push({
                id: `task-${med.id}-1`,
                type: 'MEDICATION',
                time: med.orario_1,
                title: med.nome,
                subtitle: med.dosaggio,
                status: getInitialStatus(med.orario_1) as any,
                medication: {
                  id: med.id,
                  userId: currentUserId,
                  name: med.nome,
                  dosage: med.dosaggio,
                  form: (med.forma || 'PILL') as any,
                  currentStock: med.stock_attuale,
                  refillThreshold: med.soglia
                }
              });
            }
            if (med.orario_2) {
              dayTasks.push({
                id: `task-${med.id}-2`,
                type: 'MEDICATION',
                time: med.orario_2,
                title: med.nome,
                subtitle: med.dosaggio,
                status: getInitialStatus(med.orario_2) as any,
                medication: {
                  id: med.id,
                  userId: currentUserId,
                  name: med.nome,
                  dosage: med.dosaggio,
                  form: (med.forma || 'PILL') as any,
                  currentStock: med.stock_attuale,
                  refillThreshold: med.soglia
                }
              });
            }
          }
        });
      } else {
        mockSchedules.forEach(schedule => {
          const med = mockMedications.find(m => m.id === schedule.medicationId);
          if (med) {
            dayTasks.push({
              id: `task-${schedule.id}`,
              type: 'MEDICATION',
              time: schedule.time,
              title: med.name,
              subtitle: med.dosage,
              status: 'PENDING',
              medication: med
            });
          }
        });
      }

      mockAppointments.forEach(app => {
        if (isSameDay(parseISO(app.dateTime), today)) {
          dayTasks.push({
            id: `app-${app.id}`,
            type: 'APPOINTMENT',
            time: format(parseISO(app.dateTime), 'HH:mm'),
            title: app.title,
            subtitle: app.doctorName,
            appointment: app
          });
        }
      });

      setTasks(dayTasks.sort((a, b) => a.time.localeCompare(b.time)));
      setLoading(false);
    };
    loadData();
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [note, setNote] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'TAKEN' | 'SKIPPED' | 'SNOOZED' | null>(null);
  
  // Snooze states
  const [customSnoozeDate, setCustomSnoozeDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customSnoozeTime, setCustomSnoozeTime] = useState(format(new Date(), 'HH:mm'));

  const handleAction = (taskId: string, action: 'TAKEN' | 'SKIPPED') => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Registra immediatamente senza chiedere note
      if (task.type === 'MEDICATION') {
        logMedication({
          name: task.title,
          dosage: task.subtitle || '',
          time: task.time,
          status: action === 'TAKEN' ? 'taken' : 'missed',
          date: format(new Date(), 'yyyy-MM-dd')
        });
      }

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: action } : t
      ));
    }
  };

  const handleSnoozeClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsSnoozeDialogOpen(true);
    }
  };

  const confirmAction = () => {
    if (selectedTask && pendingAction) {
      // Invia il log a Google Sheets in background
      if (selectedTask.type === 'MEDICATION') {
        logMedication({
          name: selectedTask.title,
          dosage: selectedTask.subtitle || '',
          time: selectedTask.time,
          status: pendingAction === 'TAKEN' ? 'taken' : 'missed',
          date: format(new Date(), 'yyyy-MM-dd')
        });
      }

      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id ? { ...t, status: pendingAction } : t
      ));
      setIsNoteDialogOpen(false);
      setNote('');
      setSelectedTask(null);
      setPendingAction(null);
    }
  };

  const applySnooze = (hours?: number, days?: number) => {
    if (!selectedTask) return;

    let newTime: string;
    let isStillToday = true;

    if (hours !== undefined || days !== undefined) {
      const now = new Date();
      let snoozeDate = now;
      if (hours) snoozeDate = addHours(now, hours);
      if (days) snoozeDate = addDays(now, days);
      
      newTime = format(snoozeDate, 'HH:mm');
      isStillToday = isSameDay(snoozeDate, now);
    } else {
      // Custom date/time
      const combined = parseISO(`${customSnoozeDate}T${customSnoozeTime}`);
      newTime = format(combined, 'HH:mm');
      isStillToday = isSameDay(combined, new Date());
    }

    if (isStillToday) {
      setTasks(prev => {
        const updated = prev.map(t => 
          t.id === selectedTask.id 
            ? { ...t, time: newTime, status: 'PENDING' as const, originalTime: t.time } 
            : t
        );
        return updated.sort((a, b) => a.time.localeCompare(b.time));
      });
    } else {
      // If it's not today anymore, we just mark it as snoozed/removed from today's list
      setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
    }

    setIsSnoozeDialogOpen(false);
    setSelectedTask(null);
  };

  const todayStr = format(new Date(), "EEEE d MMMM", { locale: it });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>healing</span>
          <p className="text-slate-500 font-medium">Caricamento programma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <section className="mb-10 px-6 pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-on-surface-variant font-medium tracking-wide uppercase text-[0.6875rem]">{todayStr}</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-4">Buongiorno.</h2>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-xl text-on-primary shadow-lg shadow-primary/10 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-90 mb-1">Aderenza alla terapia</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold leading-none">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status && t.status !== 'PENDING').length / tasks.length) * 100) : 100}%</span>
              <span className="text-sm mb-1 opacity-80">completato</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status && t.status !== 'PENDING').length / tasks.length) * 100) : 100}%` }}></div>
            </div>
            <p className="text-xs mt-3 opacity-80">
              {tasks.length - tasks.filter(t => t.status && t.status !== 'PENDING').length === 0
                ? 'Hai completato tutti i farmaci di oggi.'
                : `Ti mancano ${tasks.length - tasks.filter(t => t.status && t.status !== 'PENDING').length} farmaci per completare la giornata.`}
            </p>
          </div>
          {/* Decorative element */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </section>

      <div className="px-6 space-y-10">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-outline text-5xl mb-4" data-icon="calendar_today">calendar_today</span>
            <p className="text-on-surface-variant">Nessun impegno per oggi.</p>
          </div>
        ) : (
          ['Mattino', 'Pomeriggio', 'Sera'].map(sectionName => {
            const sectionTasks = tasks.filter(t => {
              const hour = parseInt(t.time.split(':')[0]);
              if (sectionName === 'Mattino') return hour < 12;
              if (sectionName === 'Pomeriggio') return hour >= 12 && hour < 18;
              if (sectionName === 'Sera') return hour >= 18;
              return false;
            });

            if (sectionTasks.length === 0) return null;

            let icon = 'light_mode';
            if (sectionName === 'Pomeriggio') icon = 'sunny';
            if (sectionName === 'Sera') icon = 'bedtime';

            return (
              <section key={sectionName}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary" data-icon={icon}>{icon}</span>
                  <h3 className="text-lg font-bold tracking-tight">{sectionName}</h3>
                  <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
                </div>
                <div className="space-y-4">
                  {sectionTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-surface-container-lowest p-5 rounded-xl flex flex-col md:flex-row md:items-center gap-4 group transition-colors duration-200 border border-transparent hover:border-primary/10 ${task.status === 'TAKEN' ? 'bg-secondary-container/10' : task.status === 'SKIPPED' ? 'bg-error-container/10 shadow-sm opacity-60' : 'shadow-sm'}`}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          task.status === 'TAKEN' ? 'bg-secondary-container text-on-secondary-container' :
                          task.status === 'SKIPPED' ? 'bg-error-container text-on-error-container' :
                          'bg-surface-container-high text-primary'
                        }`}>
                          {task.status === 'TAKEN' ? (
                            <span className="material-symbols-outlined" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          ) : task.status === 'SKIPPED' ? (
                            <span className="material-symbols-outlined" data-icon="cancel" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                          ) : (
                            <span className="material-symbols-outlined" data-icon={task.type === 'MEDICATION' ? "pill" : "calendar_today"}>{task.type === 'MEDICATION' ? "pill" : "calendar_today"}</span>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-base font-semibold leading-tight mb-1">{task.title}</h4>
                          <p className="text-sm text-on-surface-variant font-medium">{task.time} • {task.subtitle}</p>
                        </div>

                        {task.status && task.status !== 'PENDING' ? (
                          <div className={`hidden md:block font-semibold text-xs py-1 px-3 rounded-full ${
                            task.status === 'TAKEN' ? 'text-on-secondary-container bg-secondary-container' : 'text-on-error-container bg-error-container'
                          }`}>
                            {task.status === 'TAKEN' ? 'PRESO' : 'SALTATO'}
                          </div>
                        ) : (
                          <div className="hidden md:flex gap-2">
                             <button onClick={() => handleAction(task.id, 'TAKEN')} className="bg-surface-container-highest text-primary text-xs font-bold py-2 px-4 rounded-full hover:bg-primary hover:text-white transition-all">
                                SEGNA ASSUNTO
                             </button>
                             <button onClick={() => handleAction(task.id, 'SKIPPED')} className="bg-surface-container-highest text-error text-xs font-bold py-2 px-4 rounded-full hover:bg-error hover:text-white transition-all">
                                SALTA
                             </button>
                          </div>
                        )}
                      </div>

                      {/* Mobile actions */}
                      {(!task.status || task.status === 'PENDING') && (
                        <div className="flex md:hidden gap-2 w-full mt-2">
                          <button onClick={() => handleAction(task.id, 'TAKEN')} className="flex-1 bg-surface-container-highest text-primary text-xs font-bold py-2 px-4 rounded-full hover:bg-primary hover:text-white transition-all text-center">
                            SEGNA ASSUNTO
                          </button>
                          <button onClick={() => handleAction(task.id, 'SKIPPED')} className="flex-1 bg-surface-container-highest text-error text-xs font-bold py-2 px-4 rounded-full hover:bg-error hover:text-white transition-all text-center">
                            SALTA
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Bento Style Tip Card */}
      <section className="mt-12 px-6">
        <div className="bg-surface-container-low p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-surface-container-highest text-primary text-[0.6875rem] font-bold rounded-full uppercase tracking-wider">Consiglio medico</span>
            <h5 className="text-lg font-bold leading-tight">Idratazione costante</h5>
            <p className="text-sm text-on-surface-variant leading-relaxed">Ricorda di bere almeno un bicchiere d'acqua pieno ad ogni assunzione per facilitare l'assorbimento.</p>
          </div>
          <div className="relative h-32 w-full rounded-xl overflow-hidden shadow-inner bg-surface">
            <img alt="Glass of water" className="w-full h-full object-cover" src="./water_glass.png" />
          </div>
        </div>
      </section>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi una nota (opzionale)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Es: Preso a stomaco vuoto, Nausea..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNoteDialogOpen(false)}>Annulla</Button>
            <Button onClick={confirmAction} className="bg-blue-600 hover:bg-blue-700">Conferma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze Dialog */}
      <Dialog open={isSnoozeDialogOpen} onOpenChange={setIsSnoozeDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Posticipa {selectedTask?.title}</DialogTitle>
            <DialogDescription>Scegli quando vuoi ricevere il prossimo promemoria.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-3 py-4">
            <Button variant="outline" className="flex flex-col h-20 rounded-2xl border-slate-200 hover:border-blue-500 hover:bg-blue-50" onClick={() => applySnooze(1)}>
              <span className="text-lg font-bold">1h</span>
              <span className="text-[10px] text-slate-500 uppercase">Ritardo</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-20 rounded-2xl border-slate-200 hover:border-blue-500 hover:bg-blue-50" onClick={() => applySnooze(2)}>
              <span className="text-lg font-bold">2h</span>
              <span className="text-[10px] text-slate-500 uppercase">Ritardo</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-20 rounded-2xl border-slate-200 hover:border-blue-500 hover:bg-blue-50" onClick={() => applySnooze(undefined, 1)}>
              <span className="text-lg font-bold">1g</span>
              <span className="text-[10px] text-slate-500 uppercase">Domani</span>
            </Button>
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-bold text-slate-700">Oppure specifica data e ora:</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="snooze-date" className="text-[10px] uppercase text-slate-400">Giorno</Label>
                <Input 
                  id="snooze-date" 
                  type="date" 
                  value={customSnoozeDate} 
                  onChange={(e) => setCustomSnoozeDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="snooze-time" className="text-[10px] uppercase text-slate-400">Ora</Label>
                <Input 
                  id="snooze-time" 
                  type="time" 
                  value={customSnoozeTime} 
                  onChange={(e) => setCustomSnoozeTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold" onClick={() => applySnooze()}>
              Conferma Personalizzato
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


