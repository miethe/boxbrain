import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Layers, Check } from 'lucide-react';
import { addDictionaryOption, updateDictionaryOption, deleteDictionaryOption, mapOfferingTechnology } from '../services/dataService';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { MultiSelect } from './Common';
import { cn } from '../lib/utils';

interface AdminDictionaryTabProps {
    type: string;
    items: string[];
    onRefresh: () => void;
    mapping?: Record<string, string[]>; // For Offering -> Tech mapping
    availableTechs?: string[]; // For Offering -> Tech mapping
    availableOfferings?: string[]; // For Tech -> Offering mapping
    categories?: Record<string, string>; // For Tech -> Category mapping
}

export const AdminDictionaryTab: React.FC<AdminDictionaryTabProps> = ({ type, items, onRefresh, mapping, availableTechs, availableOfferings, categories }) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [selectedOfferings, setSelectedOfferings] = useState<string[]>([]); // For creating new Tech
    const [openAddOffering, setOpenAddOffering] = useState<string | null>(null); // For inline add offering

    const handleAdd = async () => {
        if (!newItem) return;

        if (items.includes(newItem)) {
            alert(`"${newItem}" already exists in ${type}.`);
            setNewItem('');
            return;
        }

        console.log(`Adding ${type}: ${newItem}, category: ${newCategory}`);
        try {
            await addDictionaryOption(type, newItem, newCategory || undefined);

            // If creating technology with selected offerings, map them
            if (type === 'technologies' && selectedOfferings.length > 0) {
                for (const offering of selectedOfferings) {
                    await mapOfferingTechnology(offering, newItem, 'add');
                }
            }

            setNewItem('');
            setNewCategory('');
            setSelectedOfferings([]);
            onRefresh();
        } catch (error: any) {
            console.error("Failed to add item", error);
            if (error.message && error.message.includes("400")) {
                alert("Item already exists or invalid request.");
                onRefresh();
            } else {
                alert("Failed to add item");
            }
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
            <div className="flex gap-2 items-start">
                <input
                    type="text"
                    className="flex-1 border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-10"
                    placeholder={`Add new ${type.slice(0, -1)}...`}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                {type === 'technologies' && (
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            className="w-48 border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-10"
                            placeholder="Category (optional)"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <div className="w-64">
                            <MultiSelect
                                options={availableOfferings || []}
                                value={selectedOfferings}
                                onChange={(val) => setSelectedOfferings(Array.isArray(val) ? val : [val])}
                                multiple
                                placeholder="Link Offerings..."
                            />
                        </div>
                    </div>
                )}
                <Button
                    onClick={handleAdd}
                    disabled={!newItem}
                    className="h-10"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {items.map(item => (
                    <div key={item} className="group p-3 hover:bg-slate-50 transition-colors">
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
                                <Button size="xs" variant="ghost" onClick={() => handleUpdate(item)} className="text-green-600 hover:text-green-800"><Save size={16} /></Button>
                                <Button size="xs" variant="ghost" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></Button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-700">{item}</span>
                                        {type === 'offerings' && (
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => setExpandedItem(expandedItem === item ? null : item)}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <Layers size={12} className="mr-1" />
                                                {mapping?.[item]?.length || 0} Technologies
                                            </Button>
                                        )}
                                        {type === 'technologies' && (
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {mapping?.[item]?.map(off => (
                                                    <span key={off} className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                                        {off}
                                                        <button onClick={() => handleMapTech(off, item, 'remove')} className="hover:text-red-600"><X size={10} /></button>
                                                    </span>
                                                ))}

                                                {/* Inline Add Offering Popover */}
                                                <Popover open={openAddOffering === item} onOpenChange={(open) => setOpenAddOffering(open ? item : null)}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" size="xs" className="h-6 w-6 p-0 rounded-full border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-300">
                                                            <Plus size={10} />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[250px] p-0" align="start">
                                                        <div className="p-1">
                                                            <MultiSelect
                                                                options={availableOfferings?.filter(o => !mapping?.[item]?.includes(o)) || []}
                                                                value={[]}
                                                                onChange={(val) => {
                                                                    const selected = Array.isArray(val) ? val[0] : val;
                                                                    if (selected) {
                                                                        handleMapTech(selected, item, 'add');
                                                                        setOpenAddOffering(null);
                                                                    }
                                                                }}
                                                                multiple={false}
                                                                placeholder="Select offering to add..."
                                                                autoFocus
                                                                className="border-0"
                                                            />
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                                            onClick={() => {
                                                setEditingItem(item);
                                                setEditValue(item);
                                                setEditCategory(categories?.[item] || '');
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-red-600"
                                            onClick={() => handleDelete(item)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Offering -> Tech Mapping UI */}
                                {type === 'offerings' && expandedItem === item && (
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
                                                <Button
                                                    key={tech}
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() => handleMapTech(item, tech, 'add')}
                                                    className="h-6 text-xs"
                                                >
                                                    <Plus size={10} className="mr-1" /> {tech}
                                                </Button>
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
