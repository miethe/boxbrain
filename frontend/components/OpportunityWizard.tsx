import React, { useState } from 'react';
import { Dictionary, OpportunityInput, Play, Opportunity } from '../types';
import { generateOpportunityAnalysis } from '../services/geminiService';
import { matchPlays } from '../services/dataService';
import { Loader2, Sparkles, Target, CheckCircle2, ChevronRight, BarChart2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OpportunityWizardProps {
    dictionary: Dictionary;
    plays: Play[];
    onViewPlay: (playId: string) => void;
    onSave: (opp: Opportunity) => void;
}

export const OpportunityWizard: React.FC<OpportunityWizardProps> = ({ dictionary, plays, onViewPlay, onSave }) => {
    const [step, setStep] = useState<'form' | 'analyzing' | 'results'>('form');
    const [formData, setFormData] = useState<OpportunityInput>({
        sector: '',
        offering: '',
        stage: 'Discovery',
        technologies: [],
        geo: 'Americas',
        tags: [],
        notes: '',
        account_name: ''
    });
    const [analysis, setAnalysis] = useState<string>('');
    const [matchedPlays, setMatchedPlays] = useState<Play[]>([]);
    const [selectedPlayIds, setSelectedPlayIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAnalyze = async () => {
        setStep('analyzing');
        // Run Gemini Analysis
        const geminiResult = await generateOpportunityAnalysis(formData);
        // Run Logic Matching
        const matches = matchPlays(formData, plays);

        setAnalysis(geminiResult);
        setMatchedPlays(matches);
        // Auto-select plays with high match score (> 80)
        const highMatchIds = matches.filter(p => (p.matchScore || 0) > 80).map(p => p.id);
        setSelectedPlayIds(highMatchIds);
        setStep('results');
    };

    const handleSaveOpportunity = async () => {
        setIsSaving(true);
        try {
            // Create the opportunity via API
            // Note: In a real app we'd import createOpportunity from dataService, 
            // but for now we'll assume the parent component handles the actual API call 
            // or we'll add the API call here. 
            // Given the prompt says "After clicking Save, it should take all the info... create the Opportunity entity...",
            // I will implement the API call here or assume onSave does it. 
            // But wait, onSave usually just updates state. Let's look at App.tsx. 
            // App.tsx has handleSaveNewOpp which calls getOpportunities. 
            // So we need to call the API here first.

            // We need to import createOpportunity. Let's add it to imports first.
            const { createOpportunity } = await import('../services/dataService');

            const newOpp = await createOpportunity({
                ...formData,
                plays: selectedPlayIds
            });

            onSave(newOpp);
        } catch (error) {
            console.error("Failed to save opportunity", error);
            alert("Failed to save opportunity. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const togglePlaySelection = (playId: string) => {
        setSelectedPlayIds(prev =>
            prev.includes(playId)
                ? prev.filter(id => id !== playId)
                : [...prev, playId]
        );
    };

    const toggleTechnology = (tech: string) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.includes(tech)
                ? prev.technologies.filter(t => t !== tech)
                : [...prev.technologies, tech]
        }));
    };

    const availableTechs = React.useMemo(() => {
        const allTechs = dictionary.technologies || [];
        if (!formData.offering) return allTechs;

        const associatedTechs = dictionary.offering_to_technologies?.[formData.offering] || [];
        const otherTechs = allTechs.filter(t => !associatedTechs.includes(t));

        return [...associatedTechs, ...otherTechs];
    }, [dictionary, formData.offering]);

    if (step === 'form') {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                        <Sparkles size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Analyze My Opportunity</h2>
                    <p className="text-slate-500 mt-2">Provide a few details, and we'll generate a custom Play Outline and find the best assets.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-6">

                        {/* Account Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Account Name</label>
                            <input
                                type="text"
                                className="w-full rounded-md border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. Acme Corp"
                                value={formData.account_name || ''}
                                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                            />
                        </div>

                        {/* Sector & Offering */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Sector / Market</label>
                                <select
                                    className="w-full rounded-md border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.sector}
                                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                >
                                    <option value="">Select Sector...</option>
                                    {dictionary.sectors?.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Offering</label>
                                <select
                                    className="w-full rounded-md border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.offering}
                                    onChange={(e) => setFormData({ ...formData, offering: e.target.value, technologies: [] })}
                                >
                                    <option value="">Select Offering...</option>
                                    {dictionary.offerings?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Stage & Geo */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Current Stage</label>
                                <select
                                    className="w-full rounded-md border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                >
                                    {dictionary.stages?.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Geography</label>
                                <select
                                    className="w-full rounded-md border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.geo}
                                    onChange={(e) => setFormData({ ...formData, geo: e.target.value })}
                                >
                                    {dictionary.geos?.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Technologies */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Technologies Involved</label>
                            <div className="flex flex-wrap gap-2">
                                {availableTechs.map(tech => (
                                    <button
                                        key={tech}
                                        onClick={() => toggleTechnology(tech)}
                                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${formData.technologies.includes(tech)
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400'
                                            }`}
                                    >
                                        {tech}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Additional Context / Notes</label>
                            <textarea
                                className="w-full rounded-md border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24"
                                placeholder="e.g. Client is focused on cost reduction, migrating from on-prem datacenter..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={!formData.sector && !formData.offering && !formData.account_name}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-md font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Sparkles size={18} />
                            Generate Guide
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'analyzing') {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-slate-800">Analyzing Opportunity...</h3>
                <p className="text-slate-500 mt-2">Consulting the Knowledge Base and generating strategy.</p>
            </div>
        );
    }

    // RESULTS VIEW
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Column: Analysis */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Target className="text-indigo-600" />
                            Generated Play Outline
                        </h2>
                        <button onClick={() => setStep('form')} className="text-sm text-indigo-600 hover:underline">
                            Edit Inputs
                        </button>
                    </div>
                    <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Right Column: Matched Plays */}
            <div className="lg:col-span-1 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <CheckCircle2 className="text-green-600" />
                        Recommended Plays
                    </h3>

                    {matchedPlays.length === 0 ? (
                        <div className="p-6 bg-white rounded-lg border border-slate-200 text-center text-slate-500">
                            No plays found with high relevance. Try adjusting your inputs.
                        </div>
                    ) : (
                        <div className="space-y-4 pb-20">
                            {matchedPlays.map(play => {
                                const isSelected = selectedPlayIds.includes(play.id);
                                return (
                                    <div key={play.id} className={`bg-white rounded-lg border shadow-sm transition-all p-4 group relative ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${(play.matchScore || 0) > 80 ? 'bg-green-100 text-green-700' :
                                                (play.matchScore || 0) > 50 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {(play.matchScore || 0)}% Match
                                            </span>
                                            <button
                                                onClick={() => togglePlaySelection(play.id)}
                                                className={`p-1 rounded-full transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                title={isSelected ? "Remove from Opportunity" : "Add to Opportunity"}
                                            >
                                                {isSelected ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors pr-8">
                                            {play.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                            {play.summary}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{play.offering}</span>
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{play.sector}</span>
                                        </div>
                                        <button
                                            onClick={() => onViewPlay(play.id)}
                                            className="w-full flex items-center justify-center gap-1 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded font-medium transition-colors"
                                        >
                                            Open Play <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-lg flex justify-between items-center z-50">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-900">{selectedPlayIds.length}</span> plays selected
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setStep('form')}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium"
                    >
                        Back to Edit
                    </button>
                    <button
                        onClick={handleSaveOpportunity}
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        Save Opportunity
                    </button>
                </div>
            </div>
        </div>
    );
};
