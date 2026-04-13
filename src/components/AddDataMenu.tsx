import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { MedicationForm } from '@/types';
import { addMedication, MedicationData } from '@/lib/googleSheets';

type ModalType = 'NONE' | 'MED' | 'SYMPTOM' | 'MOOD' | 'APP';

interface AddDataMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDataMenu({ isOpen, onClose }: AddDataMenuProps) {
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  const [isSaving, setIsSaving] = useState(false);

  // Form states for new medication
  const [medData, setMedData] = useState({
    nome: '',
    dosaggio: '',
    forma: 'PILL',
    stock_attuale: 20,
    soglia_rifornimento: 5,
    orario_1: '08:00',
    orario_2: '',
    frequenza: 'DAILY' as 'DAILY' | 'ALTERNATE' | 'MONTHLY' | 'WEEKLY',
    giorni_settimana: ''
  });

  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSaveMedication = async () => {
    setIsSaving(true);
    // Creiamo l'oggetto MedicationData rispettando l'interfaccia e la struttura delle colonne
    const newMed: MedicationData = {
      id: `med-${Date.now()}`,
      nome: medData.nome,
      dosaggio: medData.dosaggio,
      forma: medData.forma,
      stock_attuale: medData.stock_attuale,
      soglia: medData.soglia_rifornimento,
      orario_1: medData.orario_1,
      orario_2: medData.orario_2,
      frequenza: medData.frequenza,
      ultima_assunzione: '',
      giorni_settimana: medData.frequenza === 'WEEKLY' ? selectedDays.join(',') : ''
    };
    
    const success = await addMedication(newMed);
    setIsSaving(false);
    if (success) {
      setActiveModal('NONE');
      onClose();
      window.location.reload();
    } else {
      alert("Errore nel salvataggio. Riprova.");
    }
  };

  const menuItems: { id: ModalType; label: string; icon: string; color: string; bg: string }[] = [
    { id: 'MED', label: 'Farmaco', icon: 'pill', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'SYMPTOM', label: 'Sintomo', icon: 'activity_zone', color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'MOOD', label: 'Umore', icon: 'mood', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'APP', label: 'Appuntamento', icon: 'event', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const handleItemClick = (id: ModalType) => {
    setActiveModal(id);
  };

  const closeAll = () => {
    setActiveModal('NONE');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && activeModal === 'NONE'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-t-3xl sm:rounded-3xl">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold">Cosa vuoi aggiungere?</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all hover:shadow-md group"
                >
                  <div className={`p-4 rounded-full ${item.bg} mb-3 group-hover:scale-110 transition-transform`}>
                    <span className={`material-symbols-outlined text-3xl ${item.color}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{item.icon}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Medication Modal */}
      <Dialog open={activeModal === 'MED'} onOpenChange={() => setActiveModal('NONE')}>
        <DialogContent className="sm:max-w-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] p-0 rounded-none sm:rounded-[2.5rem] flex flex-col bg-surface border-none shadow-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <header className="bg-surface bright flex justify-between items-center px-6 h-16 w-full sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveModal('NONE')} className="flex items-center">
                  <span className="material-symbols-outlined text-primary text-2xl" data-icon="close">close</span>
                </button>
                <h1 className="text-xl font-bold text-primary font-headline tracking-tight">Aggiungi Farmaco</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-outline" data-icon="help_outline">help_outline</span>
              </div>
            </header>

            <main className="px-6 py-8 max-w-2xl mx-auto space-y-10">
              <section className="space-y-2">
                <p className="text-sm font-medium text-primary tracking-wide uppercase">Passo 1 di 3</p>
                <h2 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">Cosa stai assumendo?</h2>
                <p className="text-on-surface-variant leading-relaxed">Inserisci i dettagli del farmaco per impostare il tuo piano terapeutico.</p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full space-y-3">
                  <label className="block text-sm font-semibold text-on-surface px-1">Nome del farmaco</label>
                  <div className="relative">
                    <input
                      className="w-full h-14 px-5 bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl transition-all outline-none text-lg"
                      placeholder="Esempio: Tachipirina"
                      type="text"
                      value={medData.nome}
                      onChange={(e) => setMedData({ ...medData, nome: e.target.value })}
                    />
                    <span className="material-symbols-outlined absolute right-4 top-4 text-outline" data-icon="medication">medication</span>
                  </div>
                </div>

                <div className="col-span-full space-y-3">
                  <label className="block text-sm font-semibold text-on-surface px-1">Forma farmaceutica</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'PILL', icon: 'pill', label: 'Pillole' },
                      { id: 'DROPS', icon: 'opacity', label: 'Gocce' },
                      { id: 'INJECTION', icon: 'vaccines', label: 'Iniezioni' },
                      { id: 'INHALER', icon: 'air', label: 'Inalatore' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setMedData({ ...medData, forma: f.id as any })}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all ${
                          medData.forma === f.id
                            ? 'bg-surface-container-lowest border-2 border-primary'
                            : 'bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-3xl ${medData.forma === f.id ? 'text-primary' : 'text-on-surface-variant'}`} data-icon={f.icon}>{f.icon}</span>
                        <span className={`text-xs ${medData.forma === f.id ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-full space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface px-1">Frequenza</label>
                    <div className="bg-surface-container-low p-1 rounded-2xl flex">
                      <button
                        onClick={() => setMedData({ ...medData, frequenza: 'DAILY' })}
                        className={`flex-1 py-3 text-sm rounded-xl transition-all ${medData.frequenza === 'DAILY' ? 'font-bold bg-white text-primary shadow-sm' : 'font-medium text-on-surface-variant'}`}
                      >
                        Ogni giorno
                      </button>
                      <button
                        onClick={() => setMedData({ ...medData, frequenza: 'WEEKLY' })}
                        className={`flex-1 py-3 text-sm rounded-xl transition-all ${medData.frequenza === 'WEEKLY' ? 'font-bold bg-white text-primary shadow-sm' : 'font-medium text-on-surface-variant'}`}
                      >
                        Cicli specifici
                      </button>
                    </div>
                  </div>

                  {medData.frequenza === 'WEEKLY' && (
                    <div className="grid gap-2 pt-2">
                      <Label className="px-1 text-sm font-semibold text-on-surface">Giorni della settimana</Label>
                      <div className="flex justify-between gap-1">
                        {[
                          { id: 1, label: 'L' },
                          { id: 2, label: 'M' },
                          { id: 3, label: 'M' },
                          { id: 4, label: 'G' },
                          { id: 5, label: 'V' },
                          { id: 6, label: 'S' },
                          { id: 7, label: 'D' },
                        ].map((day) => (
                          <button
                            key={day.id}
                            onClick={() => toggleDay(day.id)}
                            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full text-xs font-bold transition-all ${
                              selectedDays.includes(day.id)
                                ? 'bg-primary text-on-primary shadow-md'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface px-1">Orari e dosaggio</label>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface-container-lowest rounded-2xl group transition-all gap-4">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary" data-icon="schedule">schedule</span>
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="time"
                              value={medData.orario_1}
                              onChange={(e) => setMedData({ ...medData, orario_1: e.target.value })}
                              className="bg-transparent font-bold text-lg outline-none w-24"
                            />
                            <input
                              type="text"
                              placeholder="Dosaggio (es. 1 Pillola)"
                              value={medData.dosaggio}
                              onChange={(e) => setMedData({ ...medData, dosaggio: e.target.value })}
                              className="bg-transparent text-sm text-on-surface-variant outline-none flex-1"
                            />
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors cursor-pointer self-end sm:self-auto" data-icon="edit">edit</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface-container-lowest rounded-2xl group transition-all gap-4">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary" data-icon="schedule">schedule</span>
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="time"
                              value={medData.orario_2}
                              onChange={(e) => setMedData({ ...medData, orario_2: e.target.value })}
                              className="bg-transparent font-bold text-lg outline-none w-24"
                            />
                            <span className="text-sm text-on-surface-variant self-center">Opzionale</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-on-surface px-1">Scorta Attuale</label>
                      <input
                        type="number"
                        value={medData.stock_attuale || ''}
                        onChange={(e) => setMedData({ ...medData, stock_attuale: parseInt(e.target.value) || 0 })}
                        className="w-full h-14 px-5 bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-on-surface px-1">Soglia Avviso</label>
                      <input
                        type="number"
                        value={medData.soglia_rifornimento || ''}
                        onChange={(e) => setMedData({ ...medData, soglia_rifornimento: parseInt(e.target.value) || 0 })}
                        className="w-full h-14 px-5 bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-high p-6 rounded-[2rem] flex items-center gap-5 border border-white/50 mb-8">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl" data-icon="notifications_active">notifications_active</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Notifiche intelligenti</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Ti ricorderemo di prendere il farmaco e ti avviseremo quando le scorte stanno per finire.</p>
                </div>
              </section>
            </main>
          </div>

          <div className="w-full px-6 pb-6 pt-4 bg-gradient-to-t from-surface via-surface to-transparent z-10">
            <button
              disabled={isSaving || !medData.nome}
              onClick={handleSaveMedication}
              className={`w-full h-16 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                isSaving || !medData.nome
                  ? 'bg-surface-container-highest text-outline cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-primary-container text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <span>{isSaving ? 'Salvataggio...' : 'Conferma e Continua'}</span>
              <span className="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mood Modal */}
      <Dialog open={activeModal === 'MOOD'} onOpenChange={() => setActiveModal('NONE')}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Come ti senti?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-around py-8">
            {['😢', '😕', '😐', '🙂', '😄'].map((emoji, index) => (
              <button
                key={index}
                onClick={closeAll}
                className="text-4xl hover:scale-125 transition-transform p-2"
              >
                {emoji}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Placeholder for others */}
      <Dialog open={activeModal === 'SYMPTOM' || activeModal === 'APP'} onOpenChange={() => setActiveModal('NONE')}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi {activeModal === 'SYMPTOM' ? 'Sintomo' : 'Appuntamento'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-500">Funzionalità in fase di sviluppo...</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setActiveModal('NONE')}>Chiudi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
