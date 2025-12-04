
import React, { useState, useMemo } from 'react';
import { Opportunity, Play, Asset } from '../types';
import { getPlayById, getAssets, getPlayById as fetchPlay } from '../services/dataService';
import { 
    ChevronLeft, 
    Share2, 
    MoreHorizontal, 
    CheckCircle2, 
    Circle, 
    AlertTriangle,
    Calendar,
    User,
    ExternalLink,
    Pin,
    MessageSquare, 
    Box,
    Cloud,
    Layout,
    Plus,
    ArrowUpRight
} from 'lucide-react';
import { AssetCard, AssetRow, AssetIcon } from './ui/AssetItem';
import ReactMarkdown from 'react-markdown';

interface OpportunityPlaybookProps {
    opportunity: Opportunity;
    onNavigateBack: () => void;
    onViewPlay: (playId: string) => void;
    onViewAsset: (assetId: string) => void;
}

export const OpportunityPlaybook: React.FC<OpportunityPlaybookProps> = ({ opportunity, onNavigateBack, onViewPlay, onViewAsset }) => {
    // State for local execution
    const [activePlayId, setActivePlayId] = useState<string>(opportunity.opportunity_plays[0]?.play_id);
    // Find the currently active OpportunityPlay
    const activeOppPlay = opportunity.opportunity_plays.find(op => op.play_id === activePlayId);
    
    // Default to current stage of opportunity or first stage of play
    const [activeStageKey, setActiveStageKey] = useState<string>(opportunity.current_stage_key || 'Discovery');

    // Get static Play data for template info
    const playTemplate = getPlayById(activePlayId);
    
    // Get active stage definition
    const activeStageDef = playTemplate?.stages?.find(s => s.key === activeStageKey);
    const activeStageInstance = activeOppPlay?.stage_instances.find(si => si.play_stage_key === activeStageKey);

    // Mock filtering assets for this stage/opp
    const allAssets = getAssets();
    const stageAssets = useMemo(() => {
        return allAssets.filter(a => a.default_stage === activeStageKey || a.tags.some(t => activeOppPlay?.selected_technology_ids.includes(t)));
    }, [activeStageKey, activeOppPlay, allAssets]);

    if (!activeOppPlay || !playTemplate) return <div>Loading Playbook...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-100">
            {/* 1. Header (Global Context Bar) */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 h-16">
                <div className="flex items-center gap-4">
                    <button onClick={onNavigateBack} className="text-slate-400 hover:text-slate-800">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                            <span className="font-semibold uppercase tracking-wider">{opportunity.account_name}</span>
                            <span>&bull;</span>
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase">{opportunity.health}</span>
                        </div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight">{opportunity.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Active Play Selector */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Running Play</span>
                        <select 
                            value={activePlayId}
                            onChange={(e) => setActivePlayId(e.target.value)}
                            className="text-sm font-semibold text-indigo-700 bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-right"
                        >
                            {opportunity.opportunity_plays.map(op => {
                                const p = getPlayById(op.play_id);
                                return <option key={op.play_id} value={op.play_id}>{p?.title}</option>
                            })}
                        </select>
                    </div>

                    {/* Tech Pills */}
                    <div className="flex gap-1">
                        {activeOppPlay.selected_technology_ids.map(tech => (
                            <span key={tech} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium border border-slate-200">
                                {tech}
                            </span>
                        ))}
                    </div>

                    {/* Integrations */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                         <a href="#" className="p-2 text-slate-400 hover:text-[#00A1E0] hover:bg-slate-50 rounded" title="Salesforce">
                             <Cloud size={18} />
                         </a>
                         <a href="#" className="p-2 text-slate-400 hover:text-[#0061D5] hover:bg-slate-50 rounded" title="Box">
                             <Box size={18} />
                         </a>
                    </div>
                    
                    <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                        <Share2 size={16} /> Share
                    </button>
                </div>
            </header>

            {/* 2. Workspace Body (3-Column) */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Left Nav: Plays & Stages */}
                <nav className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
                    <div className="p-4">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Overview</h3>
                            <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">
                                Opportunity Summary
                            </button>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Play Stages</h3>
                            <div className="space-y-0.5">
                                {playTemplate.stages?.map((stage, idx) => {
                                    const isActive = stage.key === activeStageKey;
                                    const instance = activeOppPlay.stage_instances.find(i => i.play_stage_key === stage.key);
                                    const status = instance?.status || 'not_started';
                                    
                                    return (
                                        <button
                                            key={stage.key}
                                            onClick={() => setActiveStageKey(stage.key)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-all group ${
                                                isActive 
                                                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200 font-medium' 
                                                : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                                                    status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                    'bg-slate-100 text-slate-400 border-slate-200'
                                                }`}>
                                                    {status === 'completed' ? <CheckCircle2 size={12} /> : idx + 1}
                                                </div>
                                                <span>{stage.label}</span>
                                            </div>
                                            {status === 'completed' && <CheckCircle2 size={14} className="text-green-500 opacity-50" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Center: Stage Cockpit */}
                <main className="flex-1 overflow-y-auto bg-white">
                    {/* Stage Header */}
                    <div className="px-8 py-6 border-b border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{activeStageDef?.label}</h2>
                                <p className="text-slate-500">{activeStageDef?.objective}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    activeStageInstance?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    activeStageInstance?.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {activeStageInstance?.status.replace('_', ' ')}
                                </span>
                                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Guidance Box */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-900 leading-relaxed">
                            <span className="font-bold text-indigo-700 block mb-1">Guidance:</span>
                            {activeStageDef?.guidance}
                        </div>
                    </div>

                    <div className="px-8 py-6 space-y-8">
                        
                        {/* 1. Checklist */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-slate-400" /> Key Outcomes
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                                {activeStageDef?.checklist_items.map((item, i) => (
                                    <div key={i} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                            defaultChecked={activeStageInstance?.checklist_item_statuses[item] === 'done'}
                                        />
                                        <span className="text-sm text-slate-700">{item}</span>
                                    </div>
                                ))}
                                <div className="p-2">
                                    <button className="text-sm text-slate-500 hover:text-indigo-600 px-2 py-1 rounded flex items-center gap-2">
                                        <Plus size={14} /> Add task
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 2. Assets */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Layout size={16} className="text-slate-400" /> Recommended Assets
                                </h3>
                                <button className="text-xs font-medium text-indigo-600 hover:underline">View All</button>
                            </div>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                {stageAssets.slice(0, 4).map(asset => (
                                    <div 
                                        key={asset.id} 
                                        onClick={() => onViewAsset(asset.id)}
                                        className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4 relative"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 ${
                                                    asset.kind === 'deck' ? 'bg-orange-50 text-orange-600' : 
                                                    asset.kind === 'coderef' ? 'bg-blue-50 text-blue-600' : 
                                                    asset.kind === 'link' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-slate-100 text-slate-600'
                                                 }`}>
                                                    <AssetIcon kind={asset.kind} size={24} />
                                                 </div>
                                                 
                                                 <div>
                                                    <h4 className="font-bold text-slate-900 text-base mb-1 leading-tight group-hover:text-indigo-600">
                                                        {asset.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="font-medium uppercase tracking-wider">{asset.kind}</span>
                                                        <span>&bull;</span>
                                                        <span>{asset.purpose}</span>
                                                    </div>
                                                 </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                                            {asset.description || "No description provided."}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                            <div className="flex flex-wrap gap-2">
                                                {asset.tags.slice(0, 2).map(t => (
                                                    <span key={t} className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                        {t}
                                                    </span>
                                                ))}
                                                {asset.tags.length > 2 && (
                                                     <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-400 text-xs font-medium">+{asset.tags.length - 2}</span>
                                                )}
                                            </div>

                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 bg-indigo-50 p-1.5 rounded-lg">
                                                <ArrowUpRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Notes */}
                        <section>
                             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MessageSquare size={16} className="text-slate-400" /> Stage Notes
                            </h3>
                            <textarea 
                                className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                placeholder={`Capture notes, decisions, and outcomes for the ${activeStageDef?.label} stage...`}
                            ></textarea>
                        </section>

                    </div>
                </main>

                {/* Right Sidebar: Context */}
                <aside className="w-72 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto">
                    
                    {/* Team */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Team</h4>
                        <div className="flex -space-x-2 overflow-hidden mb-2">
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-300 flex items-center justify-center text-xs font-bold">JD</div>
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-300 flex items-center justify-center text-xs font-bold">SJ</div>
                            <button className="h-8 w-8 rounded-full ring-2 ring-white bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Timeline</h4>
                        <div className="space-y-3">
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Stage Start</span>
                                <span className="text-slate-800 font-medium">Oct 12</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Target End</span>
                                <span className="text-slate-800 font-medium">Oct 26</span>
                            </div>
                        </div>
                    </div>

                     {/* Rec Plays */}
                    <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">You might also need</h4>
                         <div className="space-y-3">
                             <div className="bg-white border border-slate-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="text-xs font-bold text-slate-700">Security Audit</span>
                                     <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1 rounded">85%</span>
                                 </div>
                                 <p className="text-xs text-slate-500 line-clamp-2">Standard security review for cloud migrations.</p>
                             </div>
                         </div>
                    </div>

                </aside>
            </div>
        </div>
    );
};
