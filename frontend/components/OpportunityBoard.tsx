import React, { useState, useMemo } from 'react';
import { Opportunity } from '../types';
import { Search, Filter, Plus, LayoutGrid, List, ArrowUpDown, Briefcase, Activity } from 'lucide-react';

interface OpportunityBoardProps {
    opportunities: Opportunity[];
    onSelectOpportunity: (id: string) => void;
    onAddOpportunity: () => void;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name_asc' | 'name_desc' | 'date_desc';
type GroupBy = 'none' | 'stage';

export const OpportunityBoard: React.FC<OpportunityBoardProps> = ({ opportunities, onSelectOpportunity, onAddOpportunity }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortMode, setSortMode] = useState<SortMode>('date_desc');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [filterStage, setFilterStage] = useState('All');

    const filteredOpps = useMemo(() => {
        return opportunities.filter(opp => {
            const matchesSearch = opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                opp.account_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStage = filterStage === 'All' || opp.sales_stage === filterStage;
            return matchesSearch && matchesStage;
        }).sort((a, b) => {
            switch (sortMode) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'date_desc': return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
                default: return 0;
            }
        });
    }, [opportunities, searchTerm, filterStage, sortMode]);

    const groupedOpps = useMemo(() => {
        if (groupBy === 'none') return { 'All': filteredOpps };

        return filteredOpps.reduce((acc, opp) => {
            const key = opp.sales_stage || 'Unassigned';
            if (!acc[key]) acc[key] = [];
            acc[key].push(opp);
            return acc;
        }, {} as Record<string, Opportunity[]>);
    }, [filteredOpps, groupBy]);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search opportunities..."
                        className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Group By */}
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
                        <span className="text-sm font-medium text-slate-600">Group:</span>
                        <select
                            className="border border-slate-300 rounded-md py-2 px-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                        >
                            <option value="none">None</option>
                            <option value="stage">Stage</option>
                        </select>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="border border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                        >
                            <option value="All">All Stages</option>
                            <option value="Discovery">Discovery</option>
                            <option value="Qualification">Qualification</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed Won">Closed Won</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2 mr-2">
                        <ArrowUpDown size={16} className="text-slate-400" />
                        <select
                            className="border border-slate-300 rounded-md py-2 px-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as SortMode)}
                        >
                            <option value="date_desc">Newest</option>
                            <option value="name_asc">A-Z</option>
                            <option value="name_desc">Z-A</option>
                        </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button
                        onClick={onAddOpportunity}
                        className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Plus size={16} /> New Opportunity
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
                {Object.entries(groupedOpps).map(([group, oppsInGroup], groupIdx) => (
                    <div key={group}>
                        {groupBy !== 'none' && (
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                {groupBy === 'stage' && <Activity size={16} />}
                                {group}
                                <span className="text-slate-400 font-normal ml-1">({oppsInGroup.length})</span>
                            </h3>
                        )}

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Ghost Card for Add Opportunity */}
                                {(groupBy === 'none' || groupIdx === 0) && (
                                    <div
                                        onClick={onAddOpportunity}
                                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 mb-3 transition-colors">
                                            <Plus size={24} />
                                        </div>
                                        <span className="font-semibold text-slate-600 group-hover:text-indigo-700">Create New Opportunity</span>
                                    </div>
                                )}

                                {oppsInGroup.map(opp => (
                                    <div
                                        key={opp.id}
                                        onClick={() => onSelectOpportunity(opp.id)}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{opp.account_name}</h3>
                                                    <p className="text-xs text-slate-500">{opp.name}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${opp.health === 'green' ? 'bg-green-100 text-green-700' :
                                                    opp.health === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {opp.health}
                                            </span>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                                            <span className="text-slate-600 font-medium">{opp.sales_stage}</span>
                                            <span className="text-slate-400">{new Date(opp.updated_at || '').toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Ghost Row for Add Opportunity */}
                                {(groupBy === 'none' || groupIdx === 0) && (
                                    <div
                                        onClick={onAddOpportunity}
                                        className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-indigo-400 cursor-pointer group transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                            <Plus size={20} />
                                        </div>
                                        <span className="font-semibold text-slate-600 group-hover:text-indigo-700">Create New Opportunity...</span>
                                    </div>
                                )}

                                {oppsInGroup.map(opp => (
                                    <div
                                        key={opp.id}
                                        onClick={() => onSelectOpportunity(opp.id)}
                                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{opp.account_name}</h3>
                                                <p className="text-sm text-slate-500">{opp.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                                {opp.sales_stage}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${opp.health === 'green' ? 'bg-green-100 text-green-700' :
                                                    opp.health === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {opp.health}
                                            </span>
                                            <span className="text-sm text-slate-400 w-24 text-right">
                                                {new Date(opp.updated_at || '').toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
