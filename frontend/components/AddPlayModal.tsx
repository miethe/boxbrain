import React, { useState, useEffect } from 'react';
import { Dictionary, Play } from '../types';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { createPlay } from '../services/dataService';

interface AddPlayModalProps {
    dictionary: Dictionary;
    onClose: () => void;
    onSave: (play: Play) => void;
}

export const AddPlayModal: React.FC<AddPlayModalProps> = ({ dictionary, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Play>>({
        title: '',
        summary: '',
        offering: '',
        technologies: [],
        stage_scope: [],
        sector: 'Cross-sector',
        geo: 'Americas',
        tags: [],
        owners: []
    });

    const [availableTechs, setAvailableTechs] = useState<string[]>([]);

    useEffect(() => {
        if (formData.offering && dictionary.offering_to_technologies) {
            setAvailableTechs(dictionary.offering_to_technologies[formData.offering] || []);
        } else {
            setAvailableTechs(dictionary.technologies || []);
        }
    }, [formData.offering, dictionary]);

    const handleSave = async () => {
        if (!formData.title || !formData.offering) return;

        try {
            // @ts-ignore - createPlay expects PlayCreate but we are passing Partial<Play> which is close enough for now
            const newPlay = await createPlay(formData);
            onSave(newPlay);
        } catch (error) {
            console.error("Failed to create play", error);
            alert("Failed to create play");
        }
    };

    const toggleSelection = (field: keyof Play, value: string) => {
        setFormData(prev => {
            const current = (prev[field] as string[]) || [];
            return {
                ...prev,
                [field]: current.includes(value)
                    ? current.filter(item => item !== value)
                    : [...current, value]
            };
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                <h2 className="text-xl font-bold text-slate-900">Create New Play</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6 max-w-3xl mx-auto">

                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Core Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Play Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. Cloud Migration Strategy"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Brief description of this play..."
                                rows={3}
                                value={formData.summary || ''}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Classification</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Offering <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.offering || ''}
                                    onChange={(e) => setFormData({ ...formData, offering: e.target.value, technologies: [] })}
                                >
                                    <option value="">Select Offering...</option>
                                    {dictionary.offerings?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.sector || ''}
                                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                >
                                    {dictionary.sectors?.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Geo</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.geo || ''}
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
                                        onClick={() => toggleSelection('technologies', tech)}
                                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${formData.technologies?.includes(tech)
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
                            <label className="block text-sm font-medium text-slate-700 mb-2">Applicable Stages</label>
                            <div className="flex flex-wrap gap-2">
                                {dictionary.stages?.map(stage => (
                                    <button
                                        key={stage}
                                        onClick={() => toggleSelection('stage_scope', stage)}
                                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${formData.stage_scope?.includes(stage)
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                                            }`}
                                    >
                                        {stage}
                                    </button>
                                ))}
                            </div>
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
                    disabled={!formData.title || !formData.offering}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save size={18} /> Create Play
                </button>
            </div>
        </div>
    );
};
