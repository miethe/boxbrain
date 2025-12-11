import React, { useState, useMemo } from 'react';
import { Play } from '../types';
import { Search, Plus, X, Filter } from 'lucide-react';
import { AssetIcon } from './ui/AssetItem';

interface BrowsePlayCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    plays: Play[];
    onAddPlay: (playId: string) => void;
    currentPlayIds: string[];
}

export const BrowsePlayCatalogModal: React.FC<BrowsePlayCatalogModalProps> = ({ isOpen, onClose, plays, onAddPlay, currentPlayIds }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOffering, setFilterOffering] = useState('All');

    const filteredPlays = useMemo(() => {
        return plays.filter(play => {
            const matchesSearch = play.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                play.summary?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOffering = filterOffering === 'All' || play.offering === filterOffering;
            return matchesSearch && matchesOffering;
        });
    }, [plays, searchTerm, filterOffering]);

    const offerings = useMemo(() => Array.from(new Set(plays.map(p => p.offering).filter(Boolean))), [plays]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Browse Play Catalog</h2>
                        <p className="text-sm text-slate-500">Add plays to your opportunity</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex gap-4 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search plays..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <select
                        className="text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={filterOffering}
                        onChange={e => setFilterOffering(e.target.value)}
                    >
                        <option value="All">All Offerings</option>
                        {offerings.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 bg-slate-100 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPlays.map(play => {
                            const isAdded = currentPlayIds.includes(String(play.id));
                            return (
                                <div key={play.id} className={`bg-white border rounded-xl p-4 transition-all relative group shadow-sm hover:shadow-md ${isAdded ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                            {play.offering}
                                        </span>
                                        {play.matchScore && (
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                {play.matchScore}%
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug pr-8">{play.title}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">{play.summary}</p>

                                    <div className="flex flex-wrap gap-1">
                                        {play.technologies?.slice(0, 2).map(t => (
                                            <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Add Button */}
                                    <button
                                        onClick={() => !isAdded && onAddPlay(String(play.id))}
                                        disabled={isAdded}
                                        className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded
                                                ? 'bg-indigo-100 text-indigo-600 cursor-default'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-sm'
                                            }`}
                                        title={isAdded ? "Already added" : "Add Play"}
                                    >
                                        {isAdded ? <CheckMark /> : <Plus size={16} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {filteredPlays.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <p>No plays found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

const CheckMark = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
