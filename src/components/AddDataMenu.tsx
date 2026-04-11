import React, { useState } from 'react';
import { Plus, Pill, Activity, Smile, Calendar, X } from 'lucide-react';
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
import { addMedication } from '@/lib/googleSheets';

interface AddDataMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDataMenu({ isOpen, onClose }: AddDataMenuProps) {
  const [activeModal, setActiveModal] = useState<'NONE' | 'MED' | 'SYMPTOM' | 'MOOD' | 'APP'>('NONE');
  const [isSaving, setIsSaving] = useState(false);

  // Form states for new medication
  const [medData, setMedData] = useState({
    nome: '',
    dosaggio: '',
    forma: 'PILL',
    stock_attuale: 20,
    soglia_rifornimento: 5,
    orario_1: '08:00',
    orario_2: ''
  });

  const handleSaveMedication = async () => {
    setIsSaving(true);
    const success = await addMedication({
      id: `med-${Date.now()}`,
      ...medData
    });
    setIsSaving(false);
    if (success) {
      setActiveModal('NONE');
      onClose();
      window.location.reload();
    } else {
      alert("Errore nel salvataggio. Riprova.");
    }
  };

  const menuItems = [
    { id: 'MED', label: 'Farmaco', icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'SYMPTOM', label: 'Sintomo', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'MOOD', label: 'Umore', icon: Smile, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'APP', label: 'Appuntamento', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const handleItemClick = (id: string) => {
    setActiveModal(id as any);
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
                    <item.icon className={`h-8 w-8 ${item.color}`} />
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuovo Farmaco</DialogTitle>
            <DialogDescription>Inserisci i dettagli del medicinale.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Farmaco</Label>
              <Input 
                id="name" 
                placeholder="es. Aspirina" 
                value={medData.nome}
                onChange={(e) => setMedData({ ...medData, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosaggio</Label>
                <Input 
                  id="dosage" 
                  placeholder="es. 100mg" 
                  value={medData.dosaggio}
                  onChange={(e) => setMedData({ ...medData, dosaggio: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="form">Forma</Label>
                <Select 
                  value={medData.forma} 
                  onValueChange={(val) => setMedData({ ...medData, forma: val })}
                >
                  <SelectTrigger id="form">
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PILL">Pillola</SelectItem>
                    <SelectItem value="DROPS">Gocce</SelectItem>
                    <SelectItem value="INJECTION">Iniezione</SelectItem>
                    <SelectItem value="OTHER">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="time1">Orario 1</Label>
                <Input 
                  id="time1" 
                  type="time" 
                  value={medData.orario_1}
                  onChange={(e) => setMedData({ ...medData, orario_1: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time2">Orario 2 (Opz)</Label>
                <Input 
                  id="time2" 
                  type="time" 
                  value={medData.orario_2}
                  onChange={(e) => setMedData({ ...medData, orario_2: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Scorta Attuale</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={medData.stock_attuale}
                  onChange={(e) => setMedData({ ...medData, stock_attuale: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="threshold">Soglia Avviso</Label>
                <Input 
                  id="threshold" 
                  type="number" 
                  value={medData.soglia_rifornimento}
                  onChange={(e) => setMedData({ ...medData, soglia_rifornimento: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setActiveModal('NONE')}>Annulla</Button>
            <Button 
              disabled={isSaving || !medData.nome}
              onClick={handleSaveMedication} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </Button>
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
