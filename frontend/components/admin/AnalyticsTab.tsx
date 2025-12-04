import React from 'react';
import { Users, FileText, Database, GitCommit, ArrowUp, ArrowRight } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; sub: string }> = ({ title, value, icon: Icon, sub }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
        <div className="text-xs text-slate-400 flex items-center">
            <ArrowUp className="w-3 h-3 mr-1 text-green-500" />
            {sub}
        </div>
    </div>
);

// Simple CSS Bar Chart Component
const SimpleBarChart = () => {
    const data = [
        { label: 'Mon', value: 30, height: 'h-12' },
        { label: 'Tue', value: 45, height: 'h-20' },
        { label: 'Wed', value: 25, height: 'h-10' },
        { label: 'Thu', value: 60, height: 'h-24' },
        { label: 'Fri', value: 40, height: 'h-16' },
        { label: 'Sat', value: 20, height: 'h-8' },
        { label: 'Sun', value: 10, height: 'h-4' },
    ];

    return (
        <div className="flex items-end justify-between h-40 pt-4 gap-2">
            {data.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-2 flex-1">
                    <div className={`w-full bg-blue-100 rounded-t-md relative group ${d.height} transition-all hover:bg-blue-200`}>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded">
                            {d.value}
                        </div>
                        <div className={`absolute bottom-0 left-0 right-0 bg-blue-600 rounded-t-md transition-all`} style={{ height: `${d.value}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

// Simple CSS Pie Chart Representation
const SimplePieStats = () => {
    const data = [
        { label: 'Win Story', value: 45, color: 'bg-blue-500', width: 'w-[45%]' },
        { label: 'Play', value: 25, color: 'bg-emerald-500', width: 'w-[25%]' },
        { label: 'Template', value: 20, color: 'bg-amber-500', width: 'w-[20%]' },
        { label: 'Code Ref', value: 10, color: 'bg-slate-500', width: 'w-[10%]' },
    ];

    return (
        <div className="flex flex-col justify-center h-full">
            <div className="flex w-full h-6 rounded-full overflow-hidden mb-6">
                {data.map(d => (
                    <div key={d.label} className={`${d.color} ${d.width} h-full`} />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {data.map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-slate-600">
                            <div className={`w-3 h-3 rounded-full mr-2 ${d.color}`} />
                            {d.label}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{d.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AnalyticsTab: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Knowledge Base Analytics</h1>
                <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-700 flex items-center">
                    Download Report <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Assets" value="1,248" icon={Database} sub="12% vs last month" />
                <StatCard title="Contributions" value="86" icon={GitCommit} sub="24% vs last week" />
                <StatCard title="Active Users" value="342" icon={Users} sub="5% vs last month" />
                <StatCard title="Storage Used" value="4.2 GB" icon={FileText} sub="Stable" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Assets by Type</h3>
                    <div className="h-48">
                        <SimplePieStats />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Contribution Activity</h3>
                    <div className="h-48">
                        <SimpleBarChart />
                    </div>
                </div>
            </div>
        </div>
    );
};
