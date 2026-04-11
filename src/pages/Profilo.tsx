import React from 'react';
import { User, Settings, Package, Bell, Shield, LogOut, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockMedications } from '@/lib/mockData';

export default function Profilo() {
  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <header className="flex items-center space-x-4 mb-6">
        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md">
          <User className="h-10 w-10 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laura G.</h1>
          <p className="text-slate-500 text-sm">laurage.13@gmail.com</p>
          <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-bold uppercase tracking-wider">Modifica Profilo</Button>
        </div>
      </header>

      {/* Inventory Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Le tue Scorte</h2>
        <div className="space-y-3">
          {mockMedications.map((med) => (
            <Card key={med.id} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${med.currentStock && med.refillThreshold && med.currentStock <= med.refillThreshold ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <Package className={`h-5 w-5 ${med.currentStock && med.refillThreshold && med.currentStock <= med.refillThreshold ? 'text-red-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{med.name}</h3>
                    <p className="text-xs text-slate-500">{med.currentStock} {med.form === 'PILL' ? 'pillole' : 'dosi'} rimaste</p>
                  </div>
                </div>
                {med.currentStock && med.refillThreshold && med.currentStock <= med.refillThreshold && (
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
            {[
              { icon: Bell, label: 'Notifiche e Promemoria', color: 'text-purple-600' },
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

