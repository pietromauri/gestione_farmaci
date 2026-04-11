import React from 'react';
import { User, Settings, Package, Bell, Shield, LogOut, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockMedications } from '@/lib/mockData';
import { GoogleLogin } from '@/components/GoogleLogin';
import { fetchDatabase, MedicationData } from '@/lib/googleSheets';
import { requestNotificationPermission } from '@/lib/notifications';

export default function Profilo() {
  const [meds, setMeds] = React.useState<MedicationData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notificationStatus, setNotificationStatus] = React.useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  React.useEffect(() => {
    const loadData = async () => {
      const db = await fetchDatabase();
      if (db && db.medicinals && db.medicinals.length > 0) {
        setMeds(db.medicinals);
      } else {
        // Fallback ai mock per mantenere la UI popolata se il foglio è vuoto
        setMeds(mockMedications.map(m => ({
          id: m.id,
          nome: m.name,
          dosaggio: m.dosage,
          forma: m.form,
          stock_attuale: m.currentStock || 0,
          soglia_rifornimento: m.refillThreshold || 0
        })));
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleNotificationRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationStatus('granted');
    } else {
      setNotificationStatus('denied');
    }
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
            <Card key={med.id} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${med.stock_attuale <= med.soglia_rifornimento ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <Package className={`h-5 w-5 ${med.stock_attuale <= med.soglia_rifornimento ? 'text-red-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{med.nome}</h3>
                    <p className="text-xs text-slate-500">{med.stock_attuale} {med.forma === 'PILL' ? 'pillole' : 'dosi'} rimaste</p>
                  </div>
                </div>
                {med.stock_attuale <= med.soglia_rifornimento && (
                  <div className="flex items-center text-red-600 text-[10px] font-bold uppercase bg-red-50 px-2 py-1 rounded">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Rifornire
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Settings Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Impostazioni</h2>
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            <button 
              onClick={handleNotificationRequest}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Bell className={`h-5 w-5 ${notificationStatus === 'granted' ? 'text-green-600' : 'text-purple-600'}`} />
                <span className="font-medium text-slate-700">Notifiche e Promemoria</span>
              </div>
              <div className="flex items-center">
                {notificationStatus === 'granted' && <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />}
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </div>
            </button>
            {[
              { icon: Shield, label: 'Privacy e Sicurezza', color: 'text-green-600' },
              { icon: Settings, label: 'Preferenze App', color: 'text-slate-600' },
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
