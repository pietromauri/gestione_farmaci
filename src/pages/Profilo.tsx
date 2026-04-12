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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica {editingMed?.nome}</DialogTitle>
          </DialogHeader>
          {editingMed && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-dosage">Dosaggio</Label>
                <Input 
                  id="edit-dosage" 
                  value={editingMed.dosaggio}
                  onChange={(e) => setEditingMed({ ...editingMed, dosaggio: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-freq">Frequenza</Label>
                  <Select 
                    value={editingMed.frequenza} 
                    onValueChange={(val) => setEditingMed({ ...editingMed, frequenza: val as any })}
                  >
                    <SelectTrigger id="edit-freq">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Ogni giorno</SelectItem>
                      <SelectItem value="WEEKLY">Giorni specifici</SelectItem>
                      <SelectItem value="ALTERNATE">Giorni alterni</SelectItem>
                      <SelectItem value="MONTHLY">Una volta al mese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Scorta Attuale</Label>
                  <Input 
                    id="edit-stock" 
                    type="number" 
                    value={editingMed.stock_attuale}
                    onChange={(e) => setEditingMed({ ...editingMed, stock_attuale: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {editingMed.frequenza === 'WEEKLY' && (
                <div className="grid gap-2 border-t pt-4">
                  <Label>Giorni della settimana</Label>
                  <div className="flex justify-between gap-1">
                    {[
                      { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'M' },
                      { id: 4, label: 'G' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 7, label: 'D' },
                    ].map((day) => {
                      const isSelected = editingMed.giorni_settimana ? String(editingMed.giorni_settimana).replace(/\./g, ',').split(',').map(Number).includes(day.id) : false;
                      return (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`h-8 w-8 rounded-full text-[10px] font-bold transition-all ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-time1">Orario 1</Label>
                  <Input 
                    id="edit-time1" 
                    type="time" 
                    value={editingMed.orario_1}
                    onChange={(e) => setEditingMed({ ...editingMed, orario_1: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-time2">Orario 2</Label>
                  <Input 
                    id="edit-time2" 
                    type="time" 
                    value={editingMed.orario_2}
                    onChange={(e) => setEditingMed({ ...editingMed, orario_2: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMed(null)}>Annulla</Button>
            <Button disabled={isSaving} onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </DialogFooter>
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
