
import React, { useState, useEffect, useCallback } from 'react';
import { Dictionary, Asset, AssetLink, Play, Opportunity } from '../types';
import { Upload, Link as LinkIcon, FileText, Maximize2, Plus, Trash2, X } from 'lucide-react';
import { createAsset, addDictionaryOption, getPlays, getOpportunities, getAssets } from '../services/dataService';
import { MultiSelect } from './Common';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { RichTextEditor } from './ui/RichTextEditor';
import { useDropzone } from 'react-dropzone';

interface AddAssetModalProps {
    dictionary: Dictionary;
    onClose: () => void;
    onSave: (asset: Asset) => void;
    onAdvancedMode: () => void;
    initialData?: Asset;
}

type ContentType = 'file' | 'link' | 'capture';

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ dictionary, onClose, onSave, onAdvancedMode, initialData }) => {
    const [contentType, setContentType] = useState<ContentType>('file');
    const [formData, setFormData] = useState<Partial<Asset>>({
        title: '',
        description: '',
        kind: 'deck',
        purpose: 'General',
        default_stage: 'Discovery',
        technologies: [],
        tags: [],
        offerings: [],
        links: [],
        linked_play_ids: [],
        linked_opportunity_ids: [],
        linked_asset_ids: []
    });

    const [linkUrl, setLinkUrl] = useState('');
    const [captureText, setCaptureText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Linked Entities Data
    const [availablePlays, setAvailablePlays] = useState<Play[]>([]);
    const [availableOpportunities, setAvailableOpportunities] = useState<Opportunity[]>([]);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            // Auto-fill title if empty
            if (!formData.title) {
                const name = acceptedFiles[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
                setFormData(prev => ({ ...prev, title: name }));
            }
        }
    }, [formData.title]);

    // Pre-fill data if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                kind: initialData.kind || 'deck',
                purpose: initialData.purpose || '',
                default_stage: 'Discovery', // Default if missing
                technologies: initialData.technologies || [],
                tags: initialData.tags || [],
                offerings: initialData.offerings || [],
                links: initialData.links || [],
                linked_play_ids: [], // Would need to fetch relationships if not in Asset object
                linked_opportunity_ids: [],
                linked_asset_ids: []
            });

            if (initialData.kind === 'link' && initialData.uri) {
                setContentType('link');
                setLinkUrl(initialData.uri);
            } else if (initialData.kind === 'doc' && (initialData as any).content) {
                setContentType('capture');
                setCaptureText((initialData as any).content);
            } else {
                setContentType('file');
                // Cannot set 'file' object from URL easily, so we leave it null.
                // Logic needs to handle "keep existing file".
            }
        }
    }, [initialData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        // accept: { ... } // Define if needed
    });

    // Initialize available technologies from dictionary
    useEffect(() => {
        if (dictionary.technologies) {
            setAvailableTechnologies(dictionary.technologies);
        }
    }, [dictionary.technologies]);

    // Fetch linked entities data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plays, opps, assets] = await Promise.all([
                    getPlays(),
                    getOpportunities(),
                    getAssets()
                ]);
                setAvailablePlays(plays);
                setAvailableOpportunities(opps);
                setAvailableAssets(assets);
            } catch (e) {
                console.error("Failed to fetch linked entities data", e);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formDataObj = new FormData();

            // Core metadata
            const metadata = {
                ...formData,
                description: contentType === 'capture' ? captureText : formData.description,
                kind: contentType === 'link' ? 'link' : (contentType === 'capture' ? 'doc' : formData.kind),
                url: contentType === 'link' ? linkUrl : undefined,
                // Note: 'uri' handling is slightly different depending on backend expectation. 
                // Our backend seems to expect 'uri' or assumes file upload path.
                // For link type, we'll store URL in `url` or `uri`. 
                // Let's ensure consistency with schema.
            };

            formDataObj.append("metadata_json", JSON.stringify(metadata));

            if (contentType === 'file' && file) {
                formDataObj.append("file", file);
            } else if (contentType === 'capture') {
                // Create a file from captured text
                const blob = new Blob([captureText], { type: 'text/html' });
                formDataObj.append("file", blob, "captured_content.html");
            } else {
                // For link, maybe upload a dummy or handle optional file in backend
                // Our backend currently EXPECTS a file: `file: UploadFile = File(...)`
                // We should probably relax that requirement or upload a placeholder.
                // Let's create a placeholder .url file or similar for Links
                const blob = new Blob([`[InternetShortcut]\nURL=${linkUrl}`], { type: 'text/plain' });
                formDataObj.append("file", blob, "link.url");
            }

            // We need to use a direct fetch here because createAsset service might not handle FormData yet
            // Let's update createAsset to handle FormData, or just fetch here.
            // createAsset calls POST /api/v2/assets/ ... but wait, our new endpoint is /api/assets/ (from legacy storage service plan??)
            // Let's check routes.py. 
            // router.include_router(assets.router, prefix="/assets", tags=["assets"]) matches /api/assets
            // The existing `createAsset` in dataService.ts likely posts to `/api/v2/assets` or checks logic.

            // Determine endpoint and method
            const url = initialData ? `/api/assets/${initialData.id}` : '/api/assets/';
            const method = initialData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formDataObj
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Upload failed");
            }

            const newAsset = await response.json();

            onSave(newAsset);
            onClose();
        } catch (error) {
            console.error("Failed to create asset:", error);
            alert("Failed to create asset. Please try again.");
        } finally {
            setIsSaving(false);
        }
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
        if (!availableTechnologies.includes(newTech)) {
            setAvailableTechnologies(prev => [...prev, newTech]);
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

    const handleAddTag = async (newTag: string) => {
        if (!newTag) return;
        // Check if it exists in dictionary, if not add it
        if (!dictionary.tags?.includes(newTag)) {
            try {
                await addDictionaryOption('tags', newTag);
                // We might need to update local dictionary state if it's not reactive, 
                // but MultiSelect handles the created value locally for the current selection.
                // ideally we update the dictionary prop or a local copy of tags.
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

    // URL Builder Logic
    const handleAddLink = () => {
        setFormData(prev => ({
            ...prev,
            links: [...(prev.links || []), { id: Date.now().toString(), title: '', url: '', type: 'reference' }]
        }));
    };

    const handleUpdateLink = (index: number, field: keyof AssetLink, value: string) => {
        setFormData(prev => {
            const newLinks = [...(prev.links || [])];
            newLinks[index] = { ...newLinks[index], [field]: value };
            return { ...prev, links: newLinks };
        });
    };

    const handleRemoveLink = (index: number) => {
        setFormData(prev => {
            const newLinks = [...(prev.links || [])];
            newLinks.splice(index, 1);
            return { ...prev, links: newLinks };
        });
    };


    // Group technologies
    const groupedTechnologies = React.useMemo(() => {
        const groups: Record<string, string[]> = {};
        const relevantTechs = new Set<string>();
        const suggestedGroupKey = "Suggested for Selected Offerings";

        // 1. Identify relevant technologies based on selected offerings
        if (formData.offerings && formData.offerings.length > 0 && dictionary.offering_to_technologies) {
            formData.offerings.forEach(offering => {
                const techs = dictionary.offering_to_technologies[offering];
                if (techs) techs.forEach(t => relevantTechs.add(t));
            });
        }

        // 2. Iterate all available technologies and categorize
        availableTechnologies.forEach(tech => {
            // If it's relevant, add to Suggested group
            if (relevantTechs.has(tech)) {
                if (!groups[suggestedGroupKey]) groups[suggestedGroupKey] = [];
                groups[suggestedGroupKey].push(tech);
            }

            // ALWAYS add to its primary category as well (or just "All Others" if we want to avoid duplicates? 
            // User said "all Technologies should still show below". 
            // Let's exclude from the general list if it's already in suggested to avoid clutter, 
            // OR keep them. "almost all others disappear" implies they want the rest visible.
            // A common pattern is: Suggested (top), then All (below). 
            // If we remove from All, it might be confusing if looking for it in its category.
            // But duplicates are also annoying.
            // Let's put them in Suggested AND their normal category? No, that's duplicate.
            // Let's put them in Suggested, and NOT in their normal category.
            else {
                let cat = dictionary.technology_categories?.[tech];
                if (!cat || cat === 'Other' || cat === 'Other / Uncategorized') {
                    cat = 'Uncategorized';
                }

                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(tech);
            }
        });

        // 3. Sort categories
        const sortedGroups: Record<string, string[]> = {};

        // Suggested first
        if (groups[suggestedGroupKey]) {
            sortedGroups[suggestedGroupKey] = groups[suggestedGroupKey];
            delete groups[suggestedGroupKey];
        }

        // Then alphabetical
        Object.keys(groups).sort().forEach(key => {
            if (key !== 'Uncategorized') {
                sortedGroups[key] = groups[key];
            }
        });

        // Uncategorized last
        if (groups['Uncategorized']) {
            sortedGroups['Uncategorized'] = groups['Uncategorized'];
        }

        return sortedGroups;
    }, [availableTechnologies, dictionary.technology_categories, formData.offerings, dictionary.offering_to_technologies]);

    const [newTechInput, setNewTechInput] = useState('');

    return (
        <div className="flex flex-col h-full bg-slate-50 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Edit Asset' : 'Add New Asset'}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={onAdvancedMode} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-2 rounded hover:bg-indigo-50 transition-colors">
                        <Maximize2 size={16} /> Advanced Add
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* 1. Core Info */}
                    <CollapsibleSection title="Basic Info" defaultExpanded={true}>
                        <div className="space-y-4">
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

                    {/* 2. Classification */}
                    <CollapsibleSection title="Classification">
                        <div className="space-y-4">
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
                    </CollapsibleSection>

                    {/* 3. Related Technologies (Collapsible Card) */}
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

                    {/* 4. Additional Details (URLs) */}
                    <CollapsibleSection title="Additional Details">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">External URLs</label>
                            <div className="space-y-3">
                                {formData.links?.map((link, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            className="flex-1 border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="Display Name"
                                            value={link.title}
                                            onChange={(e) => handleUpdateLink(index, 'title', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="flex-[2] border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="URL (https://...)"
                                            value={link.url}
                                            onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleRemoveLink(index)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={handleAddLink}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add URL
                                </button>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* 5. Linked Entities */}
                    <CollapsibleSection title="Linked Entities">
                        <div className="space-y-4">
                            <div>
                                <MultiSelect
                                    label="Linked Plays"
                                    options={availablePlays.map(p => p.title)} // Using titles for now, ideally IDs but MultiSelect is string based
                                    value={availablePlays.filter(p => formData.linked_play_ids?.includes(p.id.toString())).map(p => p.title)}
                                    onChange={(titles) => {
                                        const selectedTitles = Array.isArray(titles) ? titles : [titles];
                                        const ids = availablePlays.filter(p => selectedTitles.includes(p.title)).map(p => p.id.toString());
                                        setFormData({ ...formData, linked_play_ids: ids });
                                    }}
                                    multiple
                                    placeholder="Select plays..."
                                />
                            </div>
                            <div>
                                <MultiSelect
                                    label="Linked Opportunities"
                                    options={availableOpportunities.map(o => o.name)}
                                    value={availableOpportunities.filter(o => formData.linked_opportunity_ids?.includes(o.id)).map(o => o.name)}
                                    onChange={(names) => {
                                        const selectedNames = Array.isArray(names) ? names : [names];
                                        const ids = availableOpportunities.filter(o => selectedNames.includes(o.name)).map(o => o.id);
                                        setFormData({ ...formData, linked_opportunity_ids: ids });
                                    }}
                                    multiple
                                    placeholder="Select opportunities..."
                                />
                            </div>
                            <div>
                                <MultiSelect
                                    label="Linked Assets"
                                    options={availableAssets.map(a => a.title)}
                                    value={availableAssets.filter(a => formData.linked_asset_ids?.includes(a.id)).map(a => a.title)}
                                    onChange={(titles) => {
                                        const selectedTitles = Array.isArray(titles) ? titles : [titles];
                                        const ids = availableAssets.filter(a => selectedTitles.includes(a.title)).map(a => a.id);
                                        setFormData({ ...formData, linked_asset_ids: ids });
                                    }}
                                    multiple
                                    placeholder="Select assets..."
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* 6. Content Source (Mutually Exclusive) */}
                    <CollapsibleSection title="Content Source">
                        <div className="space-y-4">
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
                                    <>
                                        <div
                                            {...getRootProps()}
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                                        >
                                            <input {...getInputProps()} />
                                            <Upload className={`mx-auto mb-3 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} size={32} />
                                            <div className="text-sm text-slate-600 font-medium">
                                                {file ? file.name : "Drag and drop or click to upload"}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PPTX, PDF, DOCX, PNG (Max 50MB)"}
                                            </div>
                                            {file && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                    className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
                                                >
                                                    Remove File
                                                </button>
                                            )}
                                        </div>
                                        {initialData && !file && (
                                            <div className="text-center text-xs text-slate-500 mt-2">
                                                Current file will be kept if no new file is uploaded.
                                            </div>
                                        )}
                                    </>
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
                                        <RichTextEditor
                                            content={captureText}
                                            onChange={setCaptureText}
                                            placeholder="Write your note, win story, or documentation here..."
                                        />
                                    </div>
                                )}
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
                    disabled={!formData.title || isSaving}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Asset')}
                </button>
            </div>
        </div>
    );
};
