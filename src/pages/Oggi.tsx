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
import { logMedication } from '@/lib/googleSheets';

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
  const [tasks, setTasks] = useState<Task[]>(() => {
    const today = new Date();
    const dayTasks: Task[] = [];

    // Add Medications from schedules
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

    // Add Appointments
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

    return dayTasks.sort((a, b) => a.time.localeCompare(b.time));
  });

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


