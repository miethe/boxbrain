
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Code, Presentation, FileText, CheckCircle, PenTool, ArrowRight, ChevronLeft, Zap } from 'lucide-react';
import { AssetType, AssetCategory, AssetMetadata, SchemaField, Confidentiality } from '../types';
import { SCHEMAS } from '../constants';
import { api } from '../services/apiClient';
import { Button, Input, Select, TextArea, MultiSelect } from '../components/Common';

type Step = 'category' | 'type' | 'details' | 'success';

export const CreatePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('category');
    const [loading, setLoading] = useState(false);

    const [category, setCategory] = useState<AssetCategory | null>(null);
    const [assetType, setAssetType] = useState<AssetType | null>(null);
    const [formData, setFormData] = useState<Partial<AssetMetadata>>({});
    const [content, setContent] = useState('');
    const [savedId, setSavedId] = useState<string>('');

    const [options, setOptions] = useState<Record<string, string[]>>({});

    // Helper to auto-select type based on URL param (Quick Add)
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam && Object.values(AssetType).includes(typeParam as AssetType)) {
            const t = typeParam as AssetType;
            // Infer category based on type for demo purposes
            const cat = (t === AssetType.CodeRef || t === AssetType.Play) ? AssetCategory.Technical : AssetCategory.Sales;
            setCategory(cat);
            setAssetType(t);
            setStep('details');
        }

        api.getFacets().then(facets => {
            setOptions({
                offering: facets.offering?.map(f => f.value) || [],
                related_technologies: facets.related_technologies?.map(f => f.value) || [],
                tags: facets.tags?.map(f => f.value) || [],
            });
        });
    }, [searchParams]);

    const handleCategorySelect = (cat: AssetCategory) => {
        setCategory(cat);
        setStep('type');
    };

    const handleTypeSelect = (type: AssetType) => {
        setAssetType(type);
        setFormData(prev => ({
            ...prev,
            type: type,
            category: category!,
            confidentiality: Confidentiality.InternalOnly,
            owners: ['current.user@example.com']
        }));
        setStep('details');
    };

    const handleBack = () => {
        if (step === 'type') setStep('category');
        if (step === 'details') setStep('type');
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                content: content // The raw markdown/text body
            } as AssetMetadata;
            const result = await api.save(payload);
            setSavedId(result.id);
            setStep('success');
        } catch (e) {
            console.error(e);
            alert('Failed to save asset');
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field: SchemaField) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = (formData as any)[field.name] || '';
        const handleChange = (v: any) => setFormData(prev => ({ ...prev, [field.name]: v }));

        switch (field.type) {
            case 'text': return <Input key={field.name} label={field.label} required={field.required} value={val} onChange={e => handleChange(e.target.value)} />;
            case 'textarea': return <TextArea key={field.name} label={field.label} required={field.required} value={val} onChange={e => handleChange(e.target.value)} />;
            case 'select': return <Select key={field.name} label={field.label} required={field.required} options={field.options || []} value={val} onChange={e => handleChange(e.target.value)} />;
            case 'creatable-select':
                return <MultiSelect key={field.name} label={field.label} options={options[field.name] || []} value={val} onChange={handleChange} creatable multiple={false} />;
            case 'multiselect':
            case 'tags':
                return <MultiSelect key={field.name} label={field.label} options={options[field.name] || []} value={val} onChange={handleChange} creatable multiple />;
            default: return null;
        }
    };

    const getCommonTypes = (cat: AssetCategory) => {
        if (cat === AssetCategory.Technical) {
            return [
                { type: AssetType.Play, label: 'Play / Solution', desc: 'Technical guide or architecture pattern.', icon: Code },
                { type: AssetType.CodeRef, label: 'Code Reference', desc: 'Link to repo, module, or script.', icon: Zap },
                { type: AssetType.Template, label: 'Tech Template', desc: 'Architecture decision record or runbook.', icon: FileText },
            ];
        } else {
            return [
                { type: AssetType.WinStory, label: 'Win Story', desc: 'Deal summary and metrics.', icon: CheckCircle },
                { type: AssetType.Template, label: 'Sales Template', desc: 'Proposal, SOW, or One-Pager.', icon: Presentation },
            ];
        }
    };

    if (step === 'success') {
        return (
            <div className="max-w-3xl mx-auto p-8 pt-20 text-center animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PenTool className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Asset Created!</h2>
                <p className="text-slate-500 mb-8 text-lg">Your content has been saved and committed to the repository.</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => window.location.reload()}>Create Another</Button>
                    <Button variant="outline" onClick={() => navigate('/find')}>View Assets</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Author New Asset</h1>
                    <p className="text-slate-500 mt-1">Create new content directly in the knowledge base.</p>
                </div>
                {step !== 'category' && (
                    <Button variant="ghost" onClick={handleBack} className="flex items-center text-slate-500">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                )}
            </div>

            {/* STEP 1: Category */}
            {step === 'category' && (
                <div className="flex-1 flex items-center justify-center animate-in slide-in-from-right-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                        <div
                            onClick={() => handleCategorySelect(AssetCategory.Technical)}
                            className="group bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center text-center shadow-sm hover:shadow-md"
                        >
                            <div className="w-20 h-20 bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full flex items-center justify-center mb-6 transition-colors">
                                <Code className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Technical</h2>
                            <p className="text-slate-500">Architectures, Playbooks, Code References, and How-to guides.</p>
                        </div>

                        <div
                            onClick={() => handleCategorySelect(AssetCategory.Sales)}
                            className="group bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center text-center shadow-sm hover:shadow-md"
                        >
                            <div className="w-20 h-20 bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-full flex items-center justify-center mb-6 transition-colors">
                                <Presentation className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sales</h2>
                            <p className="text-slate-500">Win Stories, Pitch Decks, Proposals, and Value Engineering.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: Type Selection */}
            {step === 'type' && category && (
                <div className="flex-1 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">What kind of {category} asset are you creating?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {getCommonTypes(category).map(t => (
                            <div
                                key={t.type}
                                onClick={() => handleTypeSelect(t.type)}
                                className="bg-white border border-slate-200 hover:border-blue-400 p-6 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600 mr-3">
                                        <t.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">{t.label}</h3>
                                </div>
                                <p className="text-sm text-slate-500 flex-1">{t.desc}</p>
                                <div className="mt-4 text-blue-600 text-sm font-medium flex items-center">
                                    Select <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 3: Form & Editor */}
            {step === 'details' && assetType && (
                <div className="animate-in slide-in-from-bottom-4 max-w-4xl mx-auto w-full">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide mr-3">
                                    {assetType.replace('_', ' ')}
                                </span>
                                <span className="font-medium text-slate-700">New Asset Details</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Metadata Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                                    1. Metadata
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {SCHEMAS[assetType].fields.filter(f => f.name !== 'category').map(field => renderField(field))}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                                    2. Content Body
                                </h3>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 px-2">
                                        <span className="text-xs font-bold text-slate-400">MARKDOWN EDITOR</span>
                                    </div>
                                    <textarea
                                        className="w-full h-64 bg-white p-4 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm text-slate-700 leading-relaxed"
                                        placeholder="# Write your content here..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Supports Markdown. For binary files (PDF/PPTX), use the <a href="#/save/import" className="text-blue-600 underline">Import</a> page instead.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                            <Button variant="outline" onClick={handleBack}>Back</Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Saving...' : 'Create Asset'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
