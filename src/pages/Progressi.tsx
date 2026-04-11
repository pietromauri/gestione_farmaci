import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { FileText, Download, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const adherenceData = [
  { name: 'Presi', value: 85, color: '#22c55e' },
  { name: 'Saltati', value: 15, color: '#ef4444' },
];

const weeklyData = [
  { day: 'Lun', aderenza: 90 },
  { day: 'Mar', aderenza: 100 },
  { day: 'Mer', aderenza: 80 },
  { day: 'Gio', aderenza: 95 },
  { day: 'Ven', aderenza: 70 },
  { day: 'Sab', aderenza: 85 },
  { day: 'Dom', aderenza: 90 },
];

export default function Progressi() {
  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">I tuoi Progressi</h1>
        <p className="text-slate-500 mt-1">Stai andando alla grande!</p>
      </header>

      {/* Overall Adherence Card */}
      <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Aderenza Totale</p>
              <h2 className="text-5xl font-bold mt-1">85%</h2>
              <div className="flex items-center mt-2 text-blue-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5% rispetto al mese scorso</span>
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

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Aderenza Settimanale
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }} 
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar 
                dataKey="aderenza" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="p-2 bg-green-100 rounded-full mb-2">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-800 uppercase">Streak</span>
            <span className="text-xl font-bold text-green-900">12 Giorni</span>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="p-2 bg-purple-100 rounded-full mb-2">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-800 uppercase">Task</span>
            <span className="text-xl font-bold text-purple-900">142 Totali</span>
          </CardContent>
        </Card>
      </div>

      {/* Report Button */}
      <Button className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg flex items-center justify-center space-x-3 group">
        <Download className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
        <div className="text-left">
          <p className="font-bold text-lg leading-tight">Genera Report PDF</p>
          <p className="text-slate-400 text-xs">Condividi i dati con il tuo medico</p>
        </div>
      </Button>
    </div>
  );
}

