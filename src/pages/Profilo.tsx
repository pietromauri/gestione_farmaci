import React from 'react';
import { Package, Bell, Shield, LogOut, ChevronRight, AlertCircle, CheckCircle2, Edit3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockMedications } from '@/lib/mockData';
import { GoogleLogin } from '@/components/GoogleLogin';
import { fetchDatabase, MedicationData, updateMedication } from '@/lib/googleSheets';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { sendTestNotification } from '@/lib/notifications';

export default function Profilo() {
  const { permission, requestPermission } = useNotificationManager();
  const [meds, setMeds] = React.useState<MedicationData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingMed, setEditingMed] = React.useState<MedicationData | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadData = async () => {
    setLoading(true);
    const db = await fetchDatabase();
    if (db && db.medicinals && db.medicinals.length > 0) {
      setMeds(db.medicinals);
    } else {
      setMeds(mockMedications.map(m => ({
        id: m.id,
        nome: m.name,
        dosaggio: m.dosage,
        forma: m.form,
        stock_attuale: m.currentStock || 0,
        soglia: m.refillThreshold || 0
      })));
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleSaveEdit = async () => {
    if (!editingMed) return;
    setIsSaving(true);
    const success = await updateMedication(editingMed);
    setIsSaving(false);
    if (success) {
      setEditingMed(null);
      loadData();
    } else {
      alert("Errore nell'aggiornamento.");
    }
  };

  const handleNotificationToggle = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    } else {
      sendTestNotification();
    }
  };

  const toggleDay = (day: number) => {
    if (!editingMed) return;
    const currentDays = editingMed.giorni_settimana ? String(editingMed.giorni_settimana).replace(/\./g, ',').split(',').map(Number).filter(Boolean) : [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    setEditingMed({ ...editingMed, giorni_settimana: newDays.join(',') });
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Account</h1>
        <GoogleLogin />
      </header>

      {/* Inventory Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Le tue Scorte</h2>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4 text-slate-400 text-xs animate-pulse">Caricamento scorte...</div>
          ) : meds.map((med) => (
            <Card key={med.id} className="border-none shadow-sm group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${med.stock_attuale <= (med.soglia || 0) ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <Package className={`h-5 w-5 ${med.stock_attuale <= (med.soglia || 0) ? 'text-red-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{med.nome}</h3>
                    <p className="text-xs text-slate-500">{med.stock_attuale} {med.forma === 'PILL' ? 'pillole' : 'dosi'} rimaste</p>
                    <p className="text-[10px] text-slate-400">{med.frequenza} {med.frequenza === 'WEEKLY' ? `(${med.giorni_settimana})` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {med.stock_attuale <= (med.soglia || 0) && (
                    <div className="flex items-center text-red-600 text-[10px] font-bold uppercase bg-red-50 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Rifornire
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    onClick={() => setEditingMed(med)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Edit Medication Dialog */}
      <Dialog open={!!editingMed} onOpenChange={(open) => !open && setEditingMed(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-surface-container-lowest rounded-t-[2.5rem] sm:rounded-[2.5rem] border-none shadow-[0_-8px_32px_rgba(11,28,48,0.06)] h-[813px] sm:h-auto flex flex-col" showCloseButton={false}>
          {editingMed && (
            <>
              {/* Header */}
              <header className="flex justify-between items-center px-8 h-20 w-full shrink-0">
                <DialogTitle className="text-xl font-bold text-primary tracking-tight font-headline">Modifica Farmaco</DialogTitle>
                <button onClick={() => setEditingMed(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-colors duration-200">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-8 pb-32 no-scrollbar">
                <div className="space-y-8">
                  {/* Hero Visual / Context */}
                  <div className="flex items-center gap-6 p-4 rounded-3xl bg-surface-container-low">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>pill</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary tracking-wider uppercase">Medicinale</p>
                      <h2 className="text-lg font-bold text-on-surface leading-tight">{editingMed.nome}</h2>
                    </div>
                  </div>

                  {/* Dosage & Supply Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-outline px-1">Dosaggio</label>
                      <div className="relative">
                        <input
                          className="w-full h-14 px-4 bg-surface-container-low border-none rounded-2xl text-on-surface font-medium focus:ring-2 focus:ring-primary transition-all"
                          type="text"
                          value={editingMed.dosaggio}
                          onChange={(e) => setEditingMed({ ...editingMed, dosaggio: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-outline px-1">Scorta Attuale</label>
                      <div className="relative">
                        <input
                          className="w-full h-14 px-4 bg-surface-container-low border-none rounded-2xl text-on-surface font-medium focus:ring-2 focus:ring-primary transition-all"
                          type="number"
                          value={editingMed.stock_attuale}
                          onChange={(e) => setEditingMed({ ...editingMed, stock_attuale: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Frequency Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-outline px-1">Frequenza</label>
                    <div className="relative group">
                      <select
                        className="w-full h-14 px-4 pr-10 bg-surface-container-low border-none rounded-2xl text-on-surface font-medium appearance-none focus:ring-2 focus:ring-primary transition-all"
                        value={editingMed.frequenza}
                        onChange={(e) => setEditingMed({ ...editingMed, frequenza: e.target.value as any })}
                      >
                        <option value="DAILY">Giornaliero</option>
                        <option value="WEEKLY">Settimanale</option>
                        <option value="ALTERNATE">Giorni alterni</option>
                        <option value="MONTHLY">Una volta al mese</option>
                        <option value="PRN">Al bisogno</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  </div>

                  {/* Week Day Selector */}
                  {editingMed.frequenza === 'WEEKLY' && (
                    <div className="space-y-4">
                      <label className="block text-xs font-semibold text-outline px-1">Giorni della settimana</label>
                      <div className="flex justify-between items-center">
                        {[
                          { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'M' },
                          { id: 4, label: 'G' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 7, label: 'D' },
                        ].map((day) => {
                          const isSelected = editingMed.giorni_settimana ? String(editingMed.giorni_settimana).replace(/\./g, ',').split(',').map(Number).includes(day.id) : false;
                          return (
                            <button
                              key={day.id}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleDay(day.id);
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                                isSelected
                                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
                              }`}
                              type="button"
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Time Pickers */}
                  <div className="space-y-4 pt-4">
                    <label className="block text-xs font-semibold text-outline px-1">Orari di assunzione</label>
                    <div className="space-y-3">
                      {/* Time Row 1 */}
                      <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-3xl group hover:bg-surface-container transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">schedule</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Orario 1</p>
                          <input
                            className="bg-transparent border-none p-0 text-on-surface font-bold text-lg focus:ring-0 w-full"
                            type="time"
                            value={editingMed.orario_1}
                            onChange={(e) => setEditingMed({ ...editingMed, orario_1: e.target.value })}
                          />
                        </div>
                        <button className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" type="button" onClick={() => setEditingMed({ ...editingMed, orario_1: '' })}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>

                      {/* Time Row 2 */}
                      <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-3xl group hover:bg-surface-container transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">schedule</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Orario 2</p>
                          <input
                            className="bg-transparent border-none p-0 text-on-surface font-bold text-lg focus:ring-0 w-full"
                            type="time"
                            value={editingMed.orario_2 || ''}
                            onChange={(e) => setEditingMed({ ...editingMed, orario_2: e.target.value })}
                          />
                        </div>
                        <button className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" type="button" onClick={() => setEditingMed({ ...editingMed, orario_2: '' })}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer Actions */}
              <footer className="p-6 bg-white/80 backdrop-blur-xl border-t border-outline-variant/10 flex flex-col gap-3 fixed bottom-0 left-0 right-0 sm:absolute shadow-[0_-12px_40px_rgba(0,0,0,0.03)]">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-xl shadow-primary/20 hover:scale-[0.98] transition-transform flex items-center justify-center"
                >
                  {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
                <button
                  onClick={() => setEditingMed(null)}
                  className="w-full h-14 rounded-2xl bg-surface-container-highest text-primary font-bold hover:bg-surface-variant transition-colors flex items-center justify-center"
                >
                  Annulla
                </button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Impostazioni</h2>
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            <button 
              onClick={handleNotificationToggle}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Bell className={`h-5 w-5 ${permission === 'granted' ? 'text-green-600' : 'text-purple-600'}`} />
                <span className="font-medium text-slate-700">Notifiche e Promemoria</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${permission === 'granted' ? 'text-green-600' : 'text-slate-400'}`}>
                  {permission === 'granted' ? 'Attive (Test)' : (permission === 'denied' ? 'Bloccate' : 'Disattivate')}
                </span>
                {permission === 'granted' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </div>
            </button>
            
            {[
              { icon: Shield, label: 'Privacy e Sicurezza', color: 'text-green-600' },
            ].map((item, i) => (
              <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </button>
            ))}
          </div>
        </Card>
      </section>

      <Button variant="outline" className="w-full border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 rounded-xl">
        <LogOut className="h-5 w-5 mr-2" />
        Esci dall'account
      </Button>
    </div>
  );
}
