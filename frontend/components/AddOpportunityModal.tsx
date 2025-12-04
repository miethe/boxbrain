import React, { useState } from 'react';
import { Dictionary, OpportunityInput } from '../types';
import { X, Save, Briefcase } from 'lucide-react';
import { createOpportunity } from '../services/dataService';

interface AddOpportunityModalProps {
    dictionary: Dictionary;
    onClose: () => void;
    onSave: (opp: any) => void;
}

export const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({ dictionary, onClose, onSave }) => {
    const [formData, setFormData] = useState<OpportunityInput>({
        sector: '',
        offering: '',
        stage: 'Discovery',
        technologies: [],
        geo: 'Americas',
        tags: [],
        notes: ''
    });

    const [accountName, setAccountName] = useState('');
    const [availableTechs, setAvailableTechs] = useState<string[]>([]);

    React.useEffect(() => {
        if (formData.offering && dictionary.offering_to_technologies) {
            setAvailableTechs(dictionary.offering_to_technologies[formData.offering] || []);
        } else {
            setAvailableTechs(dictionary.technologies || []);
        }
    }, [formData.offering, dictionary]);

    const handleSave = async () => {
        if (!accountName || !formData.offering) return;

        try {
            // We need to adapt the input to what the backend expects or update the service
            // The current createOpportunity service might need updating or we create a new one
            // For now, let's assume we update the service to accept this full object
            const newOpp = await createOpportunity(
                `${formData.offering} for ${accountName}`,
                accountName,
                undefined, // playId is optional initially
                formData
            );
            onSave(newOpp);
        } catch (error) {
            console.error("Failed to create opportunity", error);
            alert("Failed to create opportunity");
        }
    };

    const toggleTech = (tech: string) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.includes(tech)
                ? prev.technologies.filter(t => t !== tech)
                : [...prev.technologies, tech]
        }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                        <Briefcase size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">New Opportunity</h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6 max-w-3xl mx-auto">

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Deal Info</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. Acme Corp"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Offering <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.offering}
                                    onChange={(e) => setFormData({ ...formData, offering: e.target.value, technologies: [] })}
                                >
                                    <option value="">Select Offering...</option>
                                    {dictionary.offerings?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sales Stage</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                >
                                    {dictionary.stages?.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.sector}
                                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                >
                                    <option value="">Select Sector...</option>
                                    {dictionary.sectors?.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Geo</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.geo}
                                    onChange={(e) => setFormData({ ...formData, geo: e.target.value })}
                                >
                                    {dictionary.geos?.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Technologies</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-md border border-slate-200 min-h-[60px]">
                                {availableTechs.length > 0 ? availableTechs.map(tech => (
                                    <button
                                        key={tech}
                                        onClick={() => toggleTech(tech)}
                                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${formData.technologies.includes(tech)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400'
                                            }`}
                                    >
                                        {tech}
                                    </button>
                                )) : <span className="text-slate-400 text-sm italic">Select an offering to see technologies</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Problem Statement</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Describe the customer problem..."
                                rows={4}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!accountName || !formData.offering}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save size={18} /> Create Opportunity
                </button>
            </div>
        </div>
    );
};
