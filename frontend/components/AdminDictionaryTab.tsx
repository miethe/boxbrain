import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Layers, Cpu } from 'lucide-react';
import { addDictionaryOption, updateDictionaryOption, deleteDictionaryOption, mapOfferingTechnology } from '../services/dataService';

interface AdminDictionaryTabProps {
    type: string;
    items: string[];
    onRefresh: () => void;
    mapping?: Record<string, string[]>; // For Offering -> Tech mapping
    availableTechs?: string[]; // For Offering -> Tech mapping
    categories?: Record<string, string>; // For Tech -> Category mapping
}

export const AdminDictionaryTab: React.FC<AdminDictionaryTabProps> = ({ type, items, onRefresh, mapping, availableTechs, categories }) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [expandedOffering, setExpandedOffering] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newItem) return;
        console.log(`Adding ${type}: ${newItem}, category: ${newCategory}`);
        try {
            await addDictionaryOption(type, newItem, newCategory || undefined);
            setNewItem('');
            setNewCategory('');
            onRefresh();
        } catch (error) {
            console.error("Failed to add item", error);
            alert("Failed to add item");
        }
    };

    const handleUpdate = async (oldValue: string) => {
        if (!editValue || (editValue === oldValue && editCategory === (categories?.[oldValue] || ''))) {
            setEditingItem(null);
            return;
        }
        console.log(`Updating ${type}: ${oldValue} -> ${editValue}, category: ${editCategory}`);
        try {
            await updateDictionaryOption(type, oldValue, editValue, editCategory || undefined);
            setEditingItem(null);
            onRefresh();
        } catch (error) {
            console.error("Failed to update item", error);
            alert("Failed to update item");
        }
    };

    const handleDelete = async (value: string) => {
        if (!confirm(`Are you sure you want to delete "${value}"?`)) return;
        try {
            await deleteDictionaryOption(type, value);
            onRefresh();
        } catch (error) {
            console.error("Failed to delete item", error);
            alert("Failed to delete item");
        }
    };

    const handleMapTech = async (offering: string, tech: string, action: 'add' | 'remove') => {
        try {
            await mapOfferingTechnology(offering, tech, action);
            onRefresh();
        } catch (error) {
            console.error("Failed to map technology", error);
            alert("Failed to map technology");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder={`Add new ${type.slice(0, -1)}...`}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                {type === 'technologies' && (
                    <input
                        type="text"
                        className="w-48 border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Category (optional)"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                )}
                <button
                    onClick={handleAdd}
                    disabled={!newItem}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={16} /> Add
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {items.map(item => (
                    <div key={item} className="p-3 hover:bg-slate-50 transition-colors">
                        {editingItem === item ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="flex-1 border border-slate-300 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    autoFocus
                                />
                                {type === 'technologies' && (
                                    <input
                                        type="text"
                                        className="w-32 border border-slate-300 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Category"
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                    />
                                )}
                                <button onClick={() => handleUpdate(item)} className="text-green-600 hover:text-green-800 p-1"><Save size={16} /></button>
                                <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-700">{item}</span>
                                        {type === 'offerings' && (
                                            <button
                                                onClick={() => setExpandedOffering(expandedOffering === item ? null : item)}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                <Layers size={12} />
                                                {mapping?.[item]?.length || 0} Technologies
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setEditValue(item);
                                                setEditCategory(categories?.[item] || '');
                                            }}
                                            className="text-slate-400 hover:text-indigo-600 p-1"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="text-slate-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Offering -> Tech Mapping UI */}
                                {type === 'offerings' && expandedOffering === item && (
                                    <div className="mt-3 pl-4 border-l-2 border-indigo-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Mapped Technologies</div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {mapping?.[item]?.map(tech => (
                                                <span key={tech} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs border border-indigo-100">
                                                    {tech}
                                                    <button
                                                        onClick={() => handleMapTech(item, tech, 'remove')}
                                                        className="hover:text-red-500"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ))}
                                            {(!mapping?.[item] || mapping[item].length === 0) && (
                                                <span className="text-xs text-slate-400 italic">No technologies mapped yet.</span>
                                            )}
                                        </div>

                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Available Technologies</div>
                                        <div className="flex flex-wrap gap-2">
                                            {availableTechs?.filter(t => !mapping?.[item]?.includes(t)).map(tech => (
                                                <button
                                                    key={tech}
                                                    onClick={() => handleMapTech(item, tech, 'add')}
                                                    className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 text-xs hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                                >
                                                    <Plus size={10} /> {tech}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
