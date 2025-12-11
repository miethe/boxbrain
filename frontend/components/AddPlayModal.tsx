import React, { useState, useEffect, useMemo } from 'react';
import { Dictionary, Play } from '../types';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { createPlay, addDictionaryOption, updatePlay, getUsers } from '../services/dataService';
import { MultiSelect } from './Common';
import { CollapsibleSection } from './ui/CollapsibleSection';

interface AddPlayModalProps {
    dictionary: Dictionary;
    onClose: () => void;
    onSave: (play: Play) => void;
    initialData?: Play;
}

export const AddPlayModal: React.FC<AddPlayModalProps> = ({ dictionary, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Partial<Play>>({
        title: '',
        summary: '',
        offering: '',
        technologies: [],
        stage_scope: [],
        sector: 'Cross-sector',
        geo: 'Americas',
        tags: [],
        owners: [],
        default_team_members: []
    });

    const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
    const [newTechInput, setNewTechInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [users, setUsers] = useState<{ id: string, name: string, avatar: string }[]>([]);

    useEffect(() => {
        getUsers().then(setUsers);
    }, []);

    // Initialize available technologies from dictionary
    useEffect(() => {
        if (dictionary.technologies) {
            setAvailableTechnologies(dictionary.technologies);
        }
    }, [dictionary.technologies]);

    // Pre-fill data if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                summary: initialData.summary || '',
                offering: initialData.offering || '',
                technologies: initialData.technologies || [],
                stage_scope: initialData.stage_scope || [],
                sector: initialData.sector || 'Cross-sector',
                geo: initialData.geo || 'Americas',
                tags: initialData.tags || [],
                owners: initialData.owners || [],
                default_team_members: initialData.default_team_members || [],
                stages: initialData.stages || []
            });
        }
    }, [initialData]);

    const handleSave = async () => {
        if (!formData.title || !formData.offering) return;

        setIsSaving(true);
        try {
            let savedPlay: Play;
            if (initialData) {
                savedPlay = await updatePlay(initialData.id as string, formData);
            } else {
                // @ts-ignore - createPlay expects PlayCreate but we are passing Partial<Play>
                savedPlay = await createPlay(formData);
            }
            onSave(savedPlay);
            onClose();
        } catch (error) {
            console.error("Failed to save play", error);
            alert("Failed to save play");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTechnology = (tech: string) => {
        setFormData(prev => {
            const current = (prev.technologies as string[]) || [];
            return {
                ...prev,
                technologies: current.includes(tech)
                    ? current.filter(item => item !== tech)
                    : [...current, tech]
            };
        });
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

    // Group technologies logic (mirrored from AddAssetModal)
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

    // Sync stages with stage_scope
    useEffect(() => {
        if (!formData.stage_scope) return;

        setFormData(prev => {
            const currentStages = prev.stages || [];
            const newStages: any[] = [];
            let hasChanges = false;

            // Keep existing stages if in scope, add new ones if missing
            prev.stage_scope?.forEach(scope => {
                const existing = currentStages.find(s => s.key === scope);
                if (existing) {
                    newStages.push(existing);
                } else {
                    hasChanges = true;
                    newStages.push({
                        key: scope,
                        label: scope,
                        objective: '',
                        guidance: '',
                        checklist_items: []
                    });
                }
            });

            // Also check if any were removed
            if (currentStages.length !== newStages.length) hasChanges = true;

            if (hasChanges) {
                return { ...prev, stages: newStages };
            }
            return prev;
        });
    }, [formData.stage_scope]); // Depend on the array reference (setFormData creates new array ref)

    const updateStageStandard = (stageKey: string, field: 'guidance' | 'checklist_items', value: any) => {
        setFormData(prev => {
            const currentStages = [...(prev.stages || [])];
            const index = currentStages.findIndex(s => s.key === stageKey);
            if (index >= 0) {
                currentStages[index] = { ...currentStages[index], [field]: value };
            }
            return { ...prev, stages: currentStages };
        });
    };

    const getStageDef = (key: string) => {
        return formData.stages?.find(s => s.key === key) || { key, label: key, objective: '', guidance: '', checklist_items: [] };
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Edit Play' : 'Create New Play'}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                <div className="space-y-6 max-w-3xl mx-auto">

                    {/* Basic Info */}
                    <CollapsibleSection title="Core Information" defaultExpanded={true}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Play Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. Cloud Migration Strategy"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    autoFocus
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
                        </div>
                    </CollapsibleSection>

                    {/* Classification */}
                    <CollapsibleSection title="Classification">
                        <div className="space-y-4">
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
                                <label className="block text-sm font-medium text-slate-700 mb-2">Applicable Stages</label>
                                <div className="flex flex-wrap gap-2">
                                    {dictionary.stages?.map(stage => (
                                        <button
                                            key={stage}
                                            onClick={() => {
                                                setFormData(prev => {
                                                    const current = prev.stage_scope || [];
                                                    return {
                                                        ...prev,
                                                        stage_scope: current.includes(stage)
                                                            ? current.filter(s => s !== stage)
                                                            : [...current, stage]
                                                    };
                                                });
                                            }}
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
                    </CollapsibleSection>

                    {/* Related Technologies */}
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
                                                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${formData.technologies?.includes(tech)
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

                    {/* Standards & Resourcing */}
                    <CollapsibleSection title="Standards & Resourcing">
                        <div className="space-y-6">
                            {/* Standard Team */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-2">Attached Team Members</h4>
                                <p className="text-xs text-slate-500 mb-2">These members will be automatically added to the opportunity team.</p>
                                <div className="border border-slate-200 rounded-md p-3 bg-white">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(formData.default_team_members || []).map(userId => {
                                            const u = users.find(user => user.id === userId);
                                            return (
                                                <span key={userId} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                                                    {u?.name || userId}
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, default_team_members: prev.default_team_members?.filter(id => id !== userId) }))}
                                                        className="hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                        {(!formData.default_team_members || formData.default_team_members.length === 0) && <span className="text-xs text-slate-400">No team members selected.</span>}
                                    </div>
                                    <select
                                        className="w-full border border-slate-300 rounded text-sm p-1.5"
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                default_team_members: prev.default_team_members?.includes(val) ? prev.default_team_members : [...(prev.default_team_members || []), val]
                                            }));
                                            e.target.value = '';
                                        }}
                                    >
                                        <option value="">Add team member...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Stage Standards */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-2">Stage Standards</h4>
                                <p className="text-xs text-slate-500 mb-4">Define guidance and key outcomes for each applicable stage.</p>

                                <div className="space-y-6">
                                    {(formData.stage_scope || []).map(stageKey => {
                                        const stageData = getStageDef(stageKey);
                                        return (
                                            <div key={stageKey} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-sm text-slate-700 flex justify-between items-center">
                                                    {stageKey}
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {/* Guidance */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Guidance</label>
                                                        <textarea
                                                            placeholder={`Guidance for ${stageKey}...`}
                                                            className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            rows={2}
                                                            value={stageData.guidance || ''}
                                                            onChange={(e) => updateStageStandard(stageKey, 'guidance', e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Outcomes */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Key Outcomes / Tasks</label>
                                                        <div className="space-y-2">
                                                            {(stageData.checklist_items || []).map((item, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                    <div className="flex-1 text-sm bg-slate-50 p-2 rounded border border-slate-100">{item}</div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newItems = stageData.checklist_items.filter((_, i) => i !== idx);
                                                                            updateStageStandard(stageKey, 'checklist_items', newItems);
                                                                        }}
                                                                        className="text-slate-400 hover:text-red-500"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add new task..."
                                                                    className="flex-1 text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const val = (e.currentTarget.value || '').trim();
                                                                            if (val) {
                                                                                const newItems = [...(stageData.checklist_items || []), val];
                                                                                updateStageStandard(stageKey, 'checklist_items', newItems);
                                                                                e.currentTarget.value = '';
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!formData.stage_scope || formData.stage_scope.length === 0) && (
                                        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                            Select "Applicable Stages" in Classification above to configure detailed standards.
                                        </div>
                                    )}
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
                    disabled={!formData.title || !formData.offering || isSaving}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save size={18} /> {isSaving ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Play')}
                </button>
            </div>
        </div>
    );
};
