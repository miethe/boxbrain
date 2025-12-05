import React, { useState, useEffect, useMemo } from 'react';
import { Dictionary, OpportunityInput } from '../types';
import { X, Save, Briefcase, Plus } from 'lucide-react';
import { createOpportunity, addDictionaryOption } from '../services/dataService';
import { MultiSelect } from './Common';
import { CollapsibleSection } from './ui/CollapsibleSection';

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
    const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
    const [newTechInput, setNewTechInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize available technologies from dictionary
    useEffect(() => {
        if (dictionary.technologies) {
            setAvailableTechnologies(dictionary.technologies);
        }
    }, [dictionary.technologies]);

    const handleSave = async () => {
        if (!accountName || !formData.offering) return;

        setIsSaving(true);
        try {
            const newOpp = await createOpportunity({
                ...formData,
                name: `${formData.offering} for ${accountName}`,
                account_name: accountName
            });
            onSave(newOpp);
            onClose();
        } catch (error) {
            console.error("Failed to create opportunity", error);
            alert("Failed to create opportunity");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTechnology = (tech: string) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.includes(tech)
                ? prev.technologies.filter(t => t !== tech)
                : [...prev.technologies, tech]
        }));
    };

    const handleAddTechnology = async (newTech: string) => {
        if (!newTech) return;
        if (!availableTechnologies.includes(newTech)) {
            setAvailableTechnologies(prev => [...prev, newTech]);
            try {
                await addDictionaryOption('technologies', newTech, 'Uncategorized');
            } catch (e) {
                console.error("Failed to add technology", e);
            }
        }
        toggleTechnology(newTech);
    };

    const handleAddTag = async (newTag: string) => {
        if (!newTag) return;
        if (!dictionary.tags?.includes(newTag)) {
            try {
                await addDictionaryOption('tags', newTag);
                if (dictionary.tags) dictionary.tags.push(newTag);
            } catch (e) {
                console.error("Failed to add tag", e);
            }
        }

        setFormData(prev => {
            const current = prev.tags || [];
            return {
                ...prev,
                tags: current.includes(newTag) ? current : [...current, newTag]
            };
        });
    };

    // Group technologies logic
    const groupedTechnologies = useMemo(() => {
        const groups: Record<string, string[]> = {};
        const relevantTechs = new Set<string>();
        const suggestedGroupKey = "Suggested for Selected Offerings";

        // Handle comma-separated offerings
        const selectedOfferings = formData.offering ? formData.offering.split(',') : [];

        if (selectedOfferings.length > 0 && dictionary.offering_to_technologies) {
            selectedOfferings.forEach(offering => {
                const techs = dictionary.offering_to_technologies?.[offering.trim()];
                if (techs) techs.forEach(t => relevantTechs.add(t));
            });
        }

        availableTechnologies.forEach(tech => {
            if (relevantTechs.has(tech)) {
                if (!groups[suggestedGroupKey]) groups[suggestedGroupKey] = [];
                groups[suggestedGroupKey].push(tech);
            } else {
                let cat = dictionary.technology_categories?.[tech];
                if (!cat || cat === 'Other' || cat === 'Other / Uncategorized') {
                    cat = 'Uncategorized';
                }
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(tech);
            }
        });

        const sortedGroups: Record<string, string[]> = {};
        if (groups[suggestedGroupKey]) {
            sortedGroups[suggestedGroupKey] = groups[suggestedGroupKey];
            delete groups[suggestedGroupKey];
        }
        Object.keys(groups).sort().forEach(key => {
            if (key !== 'Uncategorized') sortedGroups[key] = groups[key];
        });
        if (groups['Uncategorized']) {
            sortedGroups['Uncategorized'] = groups['Uncategorized'];
        }

        return sortedGroups;
    }, [availableTechnologies, dictionary.technology_categories, formData.offering, dictionary.offering_to_technologies]);

    return (
        <div className="flex flex-col h-full bg-slate-50 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white flex-shrink-0">
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

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                <div className="space-y-6 max-w-3xl mx-auto">

                    <CollapsibleSection title="Deal Info" defaultExpanded={true}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. Acme Corp"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <MultiSelect
                                        label="Offering"
                                        options={dictionary.offerings || []}
                                        value={formData.offering ? formData.offering.split(',') : []}
                                        onChange={(val) => {
                                            const newVal = Array.isArray(val) ? val.join(',') : val;
                                            setFormData({ ...formData, offering: newVal });
                                        }}
                                        multiple
                                        placeholder="Select offerings..."
                                    />
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
                                <MultiSelect
                                    label="Tags"
                                    options={dictionary.tags || []}
                                    value={formData.tags || []}
                                    onChange={(val) => setFormData({ ...formData, tags: Array.isArray(val) ? val : [val] })}
                                    onCreate={handleAddTag}
                                    multiple
                                    creatable
                                    placeholder="Select or create tags..."
                                />
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
                    </CollapsibleSection>

                    <CollapsibleSection title="Related Technologies">
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border border-slate-100 rounded-lg p-3 bg-slate-50">
                            {Object.entries(groupedTechnologies).map(([category, techs]) => (
                                <div key={category}>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 sticky top-0 bg-slate-50 py-1">{category}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {techs.map(tech => (
                                            <button
                                                key={tech}
                                                onClick={() => toggleTechnology(tech)}
                                                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${formData.technologies.includes(tech)
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400'
                                                    }`}
                                            >
                                                {tech}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(groupedTechnologies).length === 0 && <p className="text-sm text-slate-500">No relevant technologies found for selected offerings.</p>}

                            {/* Inline Add */}
                            <div className="pt-2 border-t border-slate-200 mt-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Add new technology..."
                                        value={newTechInput}
                                        onChange={(e) => setNewTechInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTechnology(newTechInput);
                                                setNewTechInput('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            handleAddTechnology(newTechInput);
                                            setNewTechInput('');
                                        }}
                                        disabled={!newTechInput}
                                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-300 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 flex-shrink-0">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!accountName || !formData.offering || isSaving}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save size={18} /> {isSaving ? 'Creating...' : 'Create Opportunity'}
                </button>
            </div>
        </div>
    );
};
