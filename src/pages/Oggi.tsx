import React, { useState } from 'react';
import { format, parseISO, isSameDay, addHours, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, X, Clock, Pill, Calendar, Activity, MessageSquare, BellRing } from 'lucide-react';
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
          // Convertiamo 0 (Dom) in 7 per nostra convenienza se vogliamo Lun=1
          const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

          let shouldShow = false;

          if (!med.frequenza || med.frequenza === 'DAILY') {
            shouldShow = true;
          } else if (med.frequenza === 'ALTERNATE') {
            shouldShow = dayOfMonth % 2 === 0;
          } else if (med.frequenza === 'MONTHLY') {
            shouldShow = dayOfMonth === 1;
          } else if (med.frequenza === 'WEEKLY') {
            if (med.giorni_settimana) {
              // FIX: Forza a stringa per evitare crash se è un numero (es. "1")
              const daysStr = String(med.giorni_settimana);
              const allowedDays = daysStr.split(',').map(d => parseInt(d.trim()));
              shouldShow = allowedDays.includes(adjustedDayOfWeek);
            } else {
              shouldShow = false;
            }
          }

          if (shouldShow) {
            const todayStr = format(today, 'yyyy-MM-dd');
            
            // Funzione per determinare lo stato iniziale basandosi sui log
            const getInitialStatus = (time: string) => {
              if (!db.logs) return 'PENDING';
              const logEntry = db.logs.find(l => {
                const logName = l.Nome || l.name;
                const logTime = l.Orario || l.time;
                const logDate = l.Data || l.date;
                const logStatus = l.Stato || l.status;

                return (
                  logName === med.nome && 
                  logTime === time && 
                  (String(logDate).includes(todayStr))
                );
              });

              if (logEntry) {
                const status = logEntry.Stato || logEntry.status;
                return status === 'taken' || status === 'TAKEN' ? 'TAKEN' : 'SKIPPED';
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
      setSelectedTask(task);
      setPendingAction(action);
      setIsNoteDialogOpen(true);
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
          <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
          <p className="text-slate-500 font-medium">Caricamento programma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-8">
      <header className="p-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{todayStr}</h1>
        <p className="text-slate-500 mt-1">Ecco il tuo programma per oggi</p>
      </header>

      <div className="p-4 space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nessun impegno per oggi.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={`overflow-hidden border-l-4 ${
              task.status === 'TAKEN' ? 'border-l-green-500 bg-green-50/30' : 
              task.status === 'SKIPPED' ? 'border-l-red-500 bg-red-50/30' : 
              task.originalTime ? 'border-l-amber-500 bg-amber-50/20' :
              'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {task.type === 'MEDICATION' ? (
                        <Pill className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Calendar className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{task.time}</span>
                        {task.originalTime && (
                          <span className="text-[10px] text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded">
                            Posticipato (era {task.originalTime})
                          </span>
                        )}
                        <span className="text-xs text-slate-400">•</span>
                        <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{task.subtitle}</p>
                    </div>
                  </div>
                  
                  {task.status && task.status !== 'PENDING' ? (
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.status === 'TAKEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {task.status === 'TAKEN' ? 'Preso' : 'Saltato'}
                    </div>
                  ) : null}
                </div>

                {task.type === 'MEDICATION' && (!task.status || task.status === 'PENDING') && (
                  <div className="mt-4 flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleAction(task.id, 'TAKEN')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-bold rounded-xl"
                      >
                        <Check className="mr-2 h-6 w-6" /> Preso
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleAction(task.id, 'SKIPPED')}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-12 text-lg font-bold rounded-xl"
                      >
                        <X className="mr-2 h-6 w-6" /> Salta
                      </Button>
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={() => handleSnoozeClick(task.id)}
                      className="w-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-10 font-semibold rounded-xl"
                    >
                      <BellRing className="mr-2 h-4 w-4" /> Posticipa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

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


