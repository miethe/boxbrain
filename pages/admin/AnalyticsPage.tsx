import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, Database, GitCommit } from 'lucide-react';

const DATA_BY_TYPE = [
  { name: 'Win Story', value: 45 },
  { name: 'Play', value: 28 },
  { name: 'Template', value: 62 },
  { name: 'Code Ref', value: 15 },
];

const DATA_ACTIVITY = [
  { name: 'Mon', commits: 12 },
  { name: 'Tue', commits: 19 },
  { name: 'Wed', commits: 8 },
  { name: 'Thu', commits: 24 },
  { name: 'Fri', commits: 15 },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#64748b'];

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; sub: string }> = ({ title, value, icon: Icon, sub }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-xs text-slate-400">{sub}</div>
  </div>
);

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base Analytics</h1>
        <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-700">Download Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Assets" value="1,248" icon={Database} sub="+12% from last month" />
        <StatCard title="Contributions" value="86" icon={GitCommit} sub="This week" />
        <StatCard title="Active Users" value="342" icon={Users} sub="Last 30 days" />
        <StatCard title="Storage Used" value="4.2 GB" icon={FileText} sub="Git LFS Objects" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Assets by Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DATA_BY_TYPE}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DATA_BY_TYPE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {DATA_BY_TYPE.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-xs text-slate-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Contribution Activity</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={DATA_ACTIVITY}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} />
                 <Bar dataKey="commits" fill="#2563eb" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};