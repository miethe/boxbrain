import React, { useState, useMemo } from 'react';
import { Play, Dictionary } from '../types';
import { Search, Filter, Plus, LayoutGrid, List, ArrowUpDown, FolderOpen, Cpu } from 'lucide-react';
import { createOpportunity } from '../services/dataService';

interface PlayCatalogProps {
    plays: Play[];
    dictionary: Dictionary;
    onViewPlay: (playId: string) => void;
    onAddToOpportunity: (oppId: string) => void; // Navigates to new opp
    onAddPlay: () => void;
}

type GroupBy = 'none' | 'offering' | 'sector' | 'stage';
type ViewMode = 'grid' | 'list';
type SortMode = 'title_asc' | 'title_desc' | 'match_score';

export const PlayCatalog: React.FC<PlayCatalogProps> = ({ plays, dictionary, onViewPlay, onAddToOpportunity, onAddPlay }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortMode, setSortMode] = useState<SortMode>('title_asc');
    const [filters, setFilters] = useState({
        offering: 'All',
        sector: 'All',
        stage: 'All'
    });

    const [createOppModalPlay, setCreateOppModalPlay] = useState<Play | null>(null);
    const [newOppName, setNewOppName] = useState('');
    const [newAccountName, setNewAccountName] = useState('');

    const filteredPlays = useMemo(() => {
        return plays.filter(play => {
            const matchesSearch = play.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                play.summary?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOffering = filters.offering === 'All' || play.offering === filters.offering;
            const matchesSector = filters.sector === 'All' || play.sector === filters.sector || play.sector === 'Cross-sector';
            const matchesStage = filters.stage === 'All' || play.stage_scope?.includes(filters.stage);

            return matchesSearch && matchesOffering && matchesSector && matchesStage;
        }).sort((a, b) => {
            switch (sortMode) {
                case 'title_asc': return a.title.localeCompare(b.title);
                case 'title_desc': return b.title.localeCompare(a.title);
                case 'match_score': return (b.matchScore || 0) - (a.matchScore || 0);
                default: return 0;
            }
        });
    }, [plays, searchTerm, filters, sortMode]);

    const groupedPlays = useMemo(() => {
        if (groupBy === 'none') return { 'All': filteredPlays };

        return filteredPlays.reduce((acc, play) => {
            let key = 'Unassigned';
            if (groupBy === 'offering') key = play.offering || 'Unassigned';
            if (groupBy === 'sector') key = play.sector || 'Unassigned';
            if (groupBy === 'stage') {
                key = play.stage_scope?.[0] || 'Unassigned';
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(play);
            return acc;
        }, {} as Record<string, Play[]>);
    }, [filteredPlays, groupBy]);

    const handleStartCreateOpp = (e: React.MouseEvent, play: Play) => {
        e.stopPropagation();
        setCreateOppModalPlay(play);
        setNewOppName(`${play.title} Opportunity`);
    };

    const confirmCreateOpp = async () => {
        if (createOppModalPlay && newOppName && newAccountName) {
            const newOpp = await createOpportunity(newOppName, newAccountName, createOppModalPlay.id as string);
            setCreateOppModalPlay(null);
            setNewOppName('');
            setNewAccountName('');
            onAddToOpportunity(newOpp.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search plays by title or summary..."
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
                            <option value="offering">Offering</option>
                            <option value="sector">Sector</option>
                            <option value="stage">Stage</option>
                        </select>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="border border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            value={filters.offering}
                            onChange={(e) => setFilters({ ...filters, offering: e.target.value })}
                        >
                            <option value="All">All Offerings</option>
                            {dictionary.offerings?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>

                        <select
                            className="border border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            value={filters.sector}
                            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                        >
                            <option value="All">All Sectors</option>
                            {dictionary.sectors?.map(s => <option key={s} value={s}>{s}</option>)}
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
                            <option value="title_asc">A-Z</option>
                            <option value="title_desc">Z-A</option>
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
                        onClick={onAddPlay}
                        className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Plus size={16} /> Add Play
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
                {Object.entries(groupedPlays).map(([group, playsInGroup], groupIdx) => (
                    <div key={group}>
                        {groupBy !== 'none' && (
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                {groupBy === 'offering' && <FolderOpen size={16} />}
                                {group}
                                <span className="text-slate-400 font-normal ml-1">({playsInGroup.length})</span>
                            </h3>
                        )}

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Ghost Card for Add Play */}
                                {(groupBy === 'none' || groupIdx === 0) && (
                                    <div
                                        onClick={onAddPlay}
                                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 mb-3 transition-colors">
                                            <Plus size={24} />
                                        </div>
                                        <span className="font-semibold text-slate-600 group-hover:text-indigo-700">Create New Play</span>
                                    </div>
                                )}

                                {playsInGroup.map(play => (
                                    <div
                                        key={play.id}
                                        onClick={() => onViewPlay(play.id as string)}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col"
                                    >
                                        <div className="p-5 flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wide">
                                                    {play.offering}
                                                </span>
                                                {play.matchScore && (
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                        {play.matchScore}% Match
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{play.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-3 mb-4">{play.summary}</p>

                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {play.technologies?.slice(0, 3).map(tech => (
                                                    <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {play.technologies?.length > 3 && (
                                                    <span className="text-xs text-slate-400 px-1">+{play.technologies.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-medium">
                                                {play.stages?.length || 0} Stages
                                            </span>
                                            <button
                                                onClick={(e) => handleStartCreateOpp(e, play)}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                            >
                                                Start Opportunity
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Ghost Row for Add Play */}
                                {(groupBy === 'none' || groupIdx === 0) && (
                                    <div
                                        onClick={onAddPlay}
                                        className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-indigo-400 cursor-pointer group transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                            <Plus size={20} />
                                        </div>
                                        <span className="font-semibold text-slate-600 group-hover:text-indigo-700">Create New Play...</span>
                                    </div>
                                )}

                                {playsInGroup.map(play => (
                                    <div
                                        key={play.id}
                                        onClick={() => onViewPlay(play.id as string)}
                                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-slate-900">{play.title}</h3>
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wide">
                                                    {play.offering}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-1">{play.summary}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex gap-1">
                                                {play.technologies?.slice(0, 2).map(tech => (
                                                    <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                onClick={(e) => handleStartCreateOpp(e, play)}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                                            >
                                                Start Opportunity
                                            </button>
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
