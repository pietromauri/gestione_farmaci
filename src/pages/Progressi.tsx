import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { FileText, Download, TrendingUp, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchDatabase } from '@/lib/googleSheets';

export default function Progressi() {
  const [stats, setStats] = useState({
    adherence: 0,
    totalLogs: 0,
    takenLogs: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const db = await fetchDatabase();
      if (db && db.logs && db.logs.length > 0) {
        const total = db.logs.length;
        const taken = db.logs.filter((l: any) => l.status === 'taken').length;
        const adherence = Math.round((taken / total) * 100);
        
        setStats({
          adherence,
          totalLogs: total,
          takenLogs: taken,
          streak: taken > 0 ? taken : 0 // Semplificato per ora
        });
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  const adherenceData = [
    { name: 'Presi', value: stats.adherence, color: '#ffffff' },
    { name: 'Rimanenti', value: 100 - stats.adherence, color: 'rgba(255,255,255,0.2)' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">I tuoi Progressi</h1>
        <p className="text-slate-500 mt-1">
          {stats.totalLogs > 0 ? 'Stai andando alla grande!' : 'Inizia a registrare le assunzioni per vedere i progressi.'}
        </p>
      </header>

      {/* Overall Adherence Card */}
      <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Aderenza Totale</p>
              <h2 className="text-5xl font-bold mt-1">{stats.adherence}%</h2>
              <div className="flex items-center mt-2 text-blue-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Basata su {stats.totalLogs} eventi</span>
              </div>
            </div>
            <div className="h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adherenceData}
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {adherenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="p-2 bg-green-100 rounded-full mb-2">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-800 uppercase">Presi</span>
            <span className="text-xl font-bold text-green-900">{stats.takenLogs}</span>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="p-2 bg-purple-100 rounded-full mb-2">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-800 uppercase">Totali</span>
            <span className="text-xl font-bold text-purple-900">{stats.totalLogs}</span>
          </CardContent>
        </Card>
      </div>

      {/* History Card */}
      <Card className="border-none shadow-sm bg-slate-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Report Salute</h3>
              <p className="text-sm text-slate-500">I dati vengono salvati automaticamente nel tuo Google Sheet per future analisi.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Button (Placeholder) */}
      <Button disabled className="w-full h-16 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center space-x-3 opacity-50">
        <Download className="h-6 w-6" />
        <div className="text-left">
          <p className="font-bold text-lg leading-tight">Genera Report PDF</p>
          <p className="text-slate-400 text-xs">Funzionalità in arrivo</p>
        </div>
      </Button>
    </div>
  );
}

