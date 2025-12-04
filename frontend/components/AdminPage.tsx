import React, { useState } from 'react';
import { Dictionary } from '../types';
import { AdminDictionaryTab } from './AdminDictionaryTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { GovernanceTab } from './admin/GovernanceTab';
import { SettingsTab } from './admin/SettingsTab';
import { Settings, Database, Tag, Globe, Layers, Cpu, Activity, BarChart2, ShieldAlert, Sliders } from 'lucide-react';

interface AdminPageProps {
    dictionary: Dictionary;
    onRefresh: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ dictionary, onRefresh }) => {
    console.log("AdminPage dictionary:", dictionary);
    const [activeTab, setActiveTab] = useState('offerings');

    const tabs = [
        { id: 'offerings', label: 'Offerings', icon: Layers },
        { id: 'technologies', label: 'Technologies', icon: Cpu },
        { id: 'stages', label: 'Stages', icon: Activity },
        { id: 'sectors', label: 'Sectors', icon: Globe },
        { id: 'geos', label: 'Geos', icon: Globe },
        { id: 'tags', label: 'Tags', icon: Tag },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'governance', label: 'Governance', icon: ShieldAlert },
        { id: 'settings', label: 'Settings', icon: Sliders },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AnalyticsTab />;
            case 'governance':
                return <GovernanceTab />;
            case 'settings':
                return <SettingsTab />;
            default:
                return (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <AdminDictionaryTab
                            type={activeTab}
                            items={(dictionary as any)[activeTab] || []}
                            onRefresh={onRefresh}
                            mapping={
                                activeTab === 'offerings'
                                    ? dictionary.offering_to_technologies
                                    : activeTab === 'technologies'
                                        ? (() => {
                                            const map: Record<string, string[]> = {};
                                            if (dictionary.offering_to_technologies) {
                                                Object.entries(dictionary.offering_to_technologies).forEach(([offering, techs]) => {
                                                    techs.forEach(tech => {
                                                        if (!map[tech]) map[tech] = [];
                                                        map[tech].push(offering);
                                                    });
                                                });
                                            }
                                            return map;
                                        })()
                                        : undefined
                            }
                            availableTechs={activeTab === 'offerings' ? dictionary.technologies : undefined}
                            availableOfferings={activeTab === 'technologies' ? dictionary.offerings : undefined}
                            categories={activeTab === 'technologies' ? dictionary.technology_categories : undefined}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Settings size={20} className="text-slate-400" /> Admin
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                        <p className="text-slate-500">
                            {['analytics', 'governance', 'settings'].includes(activeTab)
                                ? 'View and manage system-wide configurations and insights.'
                                : 'Add, edit, or remove options for this field. Changes will be reflected immediately across the application.'}
                        </p>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
