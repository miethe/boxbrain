import React, { useState } from 'react';
import { Dictionary, Asset } from '../types';
import { Upload, Link as LinkIcon, FileText, ChevronLeft, Save, AlertCircle, Plus } from 'lucide-react';
import { createAsset, addDictionaryOption } from '../services/dataService';
import { MultiSelect } from './Common';

interface AddAssetScreenProps {
    dictionary: Dictionary;
    onSave: (asset: Asset) => void;
    onCancel: () => void;
}

type ContentType = 'file' | 'link' | 'capture';

export const AddAssetScreen: React.FC<AddAssetScreenProps> = ({ dictionary, onSave, onCancel }) => {
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
        if (!dictionary.technologies.includes(newTech)) {
            dictionary.technologies.push(newTech);
            try {
                await addDictionaryOption('technologies', newTech, 'Uncategorized');
            } catch (e) {
                console.error("Failed to add technology", e);
            }
        }
        toggleTechnology(newTech);
    };

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
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">Advanced Asset Creation</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.title}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} /> Save Asset
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Metadata */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Asset Metadata
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Asset Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

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
                                    {dictionary.stages.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                            Context
                        </h3>
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
                </div>

                {/* Right Column: Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[600px] flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Asset Content</h3>

                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={() => setContentType('file')}
                                className={`flex-1 py-4 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${contentType === 'file' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <Upload size={24} />
                                <span className="font-semibold">Upload File</span>
                            </button>
                            <button
                                onClick={() => setContentType('link')}
                                className={`flex-1 py-4 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${contentType === 'link' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <LinkIcon size={24} />
                                <span className="font-semibold">External Link</span>
                            </button>
                            <button
                                onClick={() => setContentType('capture')}
                                className={`flex-1 py-4 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${contentType === 'capture' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <FileText size={24} />
                                <span className="font-semibold">Capture Text</span>
                            </button>
                        </div>

                        <div className="flex-1">
                            {contentType === 'file' && (
                                <div className="h-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <Upload className="text-indigo-600" size={32} />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-700 mb-1">
                                        {file ? file.name : "Drop your file here"}
                                    </h4>
                                    <p className="text-slate-500">or click to browse from your computer</p>
                                    <p className="text-xs text-slate-400 mt-4">Supported formats: PPTX, PDF, DOCX, PNG, JPG (Max 50MB)</p>
                                </div>
                            )}

                            {contentType === 'link' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Destination URL</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                            <input
                                                type="url"
                                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                placeholder="https://example.com/resource"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold mb-1">Pro Tip</p>
                                            <p>Use direct links to SharePoint documents or GitHub files to enable better previews within the app.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {contentType === 'capture' && (
                                <div className="h-full flex flex-col">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Content Body</label>
                                    <textarea
                                        className="flex-1 w-full border border-slate-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-mono"
                                        placeholder="# Enter markdown content here..."
                                        value={captureText}
                                        onChange={(e) => setCaptureText(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Add a detailed description for this asset..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
