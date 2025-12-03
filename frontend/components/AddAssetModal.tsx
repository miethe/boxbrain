
import React, { useState } from 'react';
import { Dictionary, Asset } from '../types';
import { Upload, Link as LinkIcon, FileText, X, Maximize2, Tag, Plus } from 'lucide-react';
import { createAsset, addDictionaryOption } from '../services/dataService';
import { MultiSelect } from './Common';

interface AddAssetModalProps {
    dictionary: Dictionary;
    onClose: () => void;
    onSave: (asset: Asset) => void;
    onAdvancedMode: () => void;
}

type ContentType = 'file' | 'link' | 'capture';

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ dictionary, onClose, onSave, onAdvancedMode }) => {
    const [contentType, setContentType] = useState<ContentType>('file');
    const [formData, setFormData] = useState<Partial<Asset>>({
        title: '',
        description: '',
        kind: 'deck',
        purpose: 'General',
        default_stage: 'Discovery',
        technologies: [],
        tags: [],
        offerings: []
    });

    const [linkUrl, setLinkUrl] = useState('');
    const [captureText, setCaptureText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSave = async () => {
        let uri = '';
        if (contentType === 'link') uri = linkUrl;
        if (contentType === 'capture') uri = 'internal:capture'; // Mock
        if (contentType === 'file' && file) uri = `s3://uploads/${file.name}`;

        const newAsset = await createAsset({
            ...formData,
            uri,
            description: contentType === 'capture' ? captureText : formData.description,
            kind: contentType === 'link' ? 'link' : (contentType === 'capture' ? 'doc' : formData.kind)
        });
        onSave(newAsset);
    };

    const toggleTechnology = (tech: string) => {
        setFormData(prev => {
            const current = prev.technologies || [];
            return {
                ...prev,
                technologies: current.includes(tech) ? current.filter(t => t !== tech) : [...current, tech]
            };
        });
    };

    const handleAddTechnology = async (newTech: string) => {
        if (!newTech) return;
        // Optimistically add to list
        if (!dictionary.technologies.includes(newTech)) {
            dictionary.technologies.push(newTech);
            // In a real app, we'd want to re-fetch dictionary or update context, 
            // but for now we'll just rely on the local mutation and backend call
            try {
                await addDictionaryOption('technologies', newTech, 'Uncategorized');
            } catch (e) {
                console.error("Failed to add technology", e);
            }
        }
        toggleTechnology(newTech);
    };

    // Group technologies
    const groupedTechnologies = React.useMemo(() => {
        const groups: Record<string, string[]> = {};
        const uncategorized: string[] = [];

        (dictionary.technologies || []).forEach(tech => {
            const cat = dictionary.technology_categories?.[tech];
            if (cat) {
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(tech);
            } else {
                uncategorized.push(tech);
            }
        });

        // Sort categories
        const sortedGroups = Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as Record<string, string[]>);

        if (uncategorized.length > 0) {
            sortedGroups['Other / Uncategorized'] = uncategorized;
        }

        return sortedGroups;
    }, [dictionary.technologies, dictionary.technology_categories]);

    const [newTechInput, setNewTechInput] = useState('');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                <h2 className="text-xl font-bold text-slate-900">Add New Asset</h2>
                <div className="flex items-center gap-2">
                    <button onClick={onAdvancedMode} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-2 rounded hover:bg-indigo-50 transition-colors">
                        <Maximize2 size={16} /> Advanced Add
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* 1. Core Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Basic Info</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. Retail Cloud Architecture v2"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Briefly describe this asset..."
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* 2. Metadata */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Classification</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.kind}
                                    onChange={(e) => setFormData({ ...formData, kind: e.target.value as any })}
                                >
                                    <option value="deck">Deck / Presentation</option>
                                    <option value="doc">Document</option>
                                    <option value="guide">Guide</option>
                                    <option value="coderef">Code / Repo</option>
                                    <option value="diagram">Diagram</option>
                                    <option value="video">Video</option>
                                    <option value="link">External Link</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. Sales Enablement"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Default Stage</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    value={formData.default_stage}
                                    onChange={(e) => setFormData({ ...formData, default_stage: e.target.value })}
                                >
                                    {dictionary.stages?.map(s => <option key={s} value={s}>{s}</option>) || <option>Loading...</option>}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Related Technologies</label>
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
                                {dictionary.technologies?.length === 0 && <p className="text-sm text-slate-500">No technologies found.</p>}

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
                        </div>

                        {/* Related Offerings */}
                        <div>
                            <MultiSelect
                                label="Related Offerings"
                                options={dictionary.offerings || []}
                                value={formData.offerings || []}
                                onChange={(val) => setFormData({ ...formData, offerings: Array.isArray(val) ? val : [val] })}
                                multiple
                                placeholder="Select related offerings..."
                            />
                        </div>
                    </div>

                    {/* 3. Content Source (Mutually Exclusive) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Content Source</h3>

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setContentType('file')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${contentType === 'file' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <Upload size={20} /> Upload File
                            </button>
                            <button
                                onClick={() => setContentType('link')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${contentType === 'link' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <LinkIcon size={20} /> URL / Link
                            </button>
                            <button
                                onClick={() => setContentType('capture')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${contentType === 'capture' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <FileText size={20} /> Capture Text
                            </button>
                        </div>

                        <div className="min-h-[150px]">
                            {contentType === 'file' && (
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <Upload className="mx-auto text-slate-400 mb-3" size={32} />
                                    <div className="text-sm text-slate-600 font-medium">
                                        {file ? file.name : "Drag and drop or click to upload"}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">PPTX, PDF, DOCX, PNG (Max 50MB)</div>
                                </div>
                            )}

                            {contentType === 'link' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Asset URL</label>
                                    <input
                                        type="url"
                                        className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="https://"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Link to external resources like SharePoint, Box, GitHub, or public websites.
                                    </p>
                                </div>
                            )}

                            {contentType === 'capture' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content Body (Rich Text)</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[150px]"
                                        placeholder="Start typing your capture..."
                                        value={captureText}
                                        onChange={(e) => setCaptureText(e.target.value)}
                                    />
                                </div>
                            )}
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
                    disabled={!formData.title}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Create Asset
                </button>
            </div>
        </div>
    );
};
