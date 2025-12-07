
import React, { useState, useMemo } from 'react';
import { Asset, Dictionary } from '../types';
import {
  Filter,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  FolderOpen,
  Plus
} from 'lucide-react';
import { AssetCard, AssetRow } from './ui/AssetItem';

interface AssetLibraryProps {
  assets: Asset[];
  dictionary?: Dictionary; // Optional for now if we want to use it for filters
  onViewAsset: (assetId: string) => void;
  onAddAsset?: () => void;
  onEditAsset?: (asset: Asset) => void;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';
type TabType = 'all' | 'technical' | 'gtm';
type GroupBy = 'none' | 'kind' | 'stage' | 'collection';

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, dictionary, onViewAsset, onAddAsset, onEditAsset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date_desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [filters, setFilters] = useState({
    kind: 'All',
    stage: 'All'
  });

  const uniqueKinds = ['All', ...Array.from(new Set(assets.map(a => a.kind)))];
  const uniqueStages = ['All', ...Array.from(new Set(assets.map(a => a.default_stage)))];

  // 1. Filter by Tab (Technical vs GTM vs All)
  const tabFilteredAssets = useMemo(() => {
    if (activeTab === 'all') return assets;

    return assets.filter(asset => {
      const isTechnical =
        asset.tags.includes('Technical') ||
        asset.tags.includes('Architecture') ||
        asset.tags.includes('Compliance') ||
        asset.kind === 'coderef' ||
        asset.kind === 'diagram';

      const isGTM =
        asset.tags.includes('Sales') ||
        asset.tags.includes('Executive') ||
        asset.tags.includes('Pricing') ||
        asset.tags.includes('Market') ||
        asset.tags.includes('Case Study') ||
        asset.kind === 'deck';

      if (activeTab === 'technical') return isTechnical;
      if (activeTab === 'gtm') return isGTM;
      return true;
    });
  }, [assets, activeTab]);

  // 2. Filter by Controls (Search, Dropdowns) & Sort
  const finalFilteredAssets = useMemo(() => {
    return tabFilteredAssets.filter(asset => {
      const matchesSearch = asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesKind = filters.kind === 'All' || asset.kind === filters.kind;
      const matchesStage = filters.stage === 'All' || asset.default_stage === filters.stage;

      return matchesSearch && matchesKind && matchesStage;
    }).sort((a, b) => {
      switch (sortMode) {
        case 'name_asc': return a.title.localeCompare(b.title);
        case 'name_desc': return b.title.localeCompare(a.title);
        case 'date_asc': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'date_desc': default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [tabFilteredAssets, searchTerm, filters, sortMode]);

  // 3. Grouping Logic
  const groupedAssets = useMemo(() => {
    if (groupBy === 'none') return { 'All': finalFilteredAssets };

    return finalFilteredAssets.reduce((acc, asset) => {
      if (groupBy === 'collection') {
        // Assets can be in multiple collections. Duplicate them for the UI grouping.
        const collections = asset.collections && asset.collections.length > 0 ? asset.collections : ['Unassigned'];
        collections.forEach(col => {
          if (!acc[col]) acc[col] = [];
          acc[col].push(asset);
        });
      } else {
        let key = 'Unassigned';
        if (groupBy === 'kind') key = asset.kind;
        if (groupBy === 'stage') key = asset.default_stage;

        if (!acc[key]) acc[key] = [];
        acc[key].push(asset);
      }
      return acc;
    }, {} as Record<string, Asset[]>);
  }, [finalFilteredAssets, groupBy]);

  return (
    <div className="space-y-6">
      {/* Primary Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          All Assets
        </button>
        <button
          onClick={() => setActiveTab('technical')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'technical' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Technical
        </button>
        <button
          onClick={() => setActiveTab('gtm')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'gtm' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          GTM (Sales & Exec)
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search assets..."
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
              <option value="kind">Type</option>
              <option value="stage">Stage</option>
              <option value="collection">Collection</option>
            </select>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
            <Filter size={16} className="text-slate-400" />
            <select
              className="border border-slate-300 rounded-md py-2 px-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white capitalize"
              value={filters.kind}
              onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
            >
              <option value="All">All Types</option>
              {uniqueKinds.filter(k => k !== 'All').map(k => <option key={k} value={k}>{k}</option>)}
            </select>

            <select
              className="border border-slate-300 rounded-md py-2 px-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
            >
              <option value="All">All Stages</option>
              {uniqueStages.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
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
              <option value="date_asc">Oldest</option>
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
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {Object.entries(groupedAssets).map(([group, assetsInGroup]: [string, Asset[]], groupIdx) => (
          <div key={group}>
            {groupBy !== 'none' && (
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                {groupBy === 'collection' && <FolderOpen size={16} />}
                {groupBy === 'stage' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                {group}
                <span className="text-slate-400 font-normal ml-1">({assetsInGroup.length})</span>
              </h3>
            )}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Ghost Card for Add Asset (Only in first group if grouped, or 'All') */}
                {onAddAsset && (groupBy === 'none' || groupIdx === 0) && (
                  <div
                    onClick={onAddAsset}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 mb-3 transition-colors">
                      <Plus size={24} />
                    </div>
                    <span className="font-semibold text-slate-600 group-hover:text-indigo-700">Add New Asset</span>
                  </div>
                )}

                {assetsInGroup.map((asset, idx) => (
                  <AssetCard key={`${asset.id}-${group}-${idx}`} asset={asset} onClick={() => onViewAsset(asset.id)} onEdit={onEditAsset} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Ghost Row for Add Asset */}
                {onAddAsset && (groupBy === 'none' || groupIdx === 0) && (
                  <div
                    onClick={onAddAsset}
                    className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-indigo-400 cursor-pointer group transition-colors"
                  >
                    <div className="w-12 h-12 rounded flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                      <Plus size={20} />
                    </div>
                    <span className="font-semibold text-slate-600 group-hover:text-indigo-700">Add New Asset...</span>
                  </div>
                )}

                {assetsInGroup.map((asset, idx) => (
                  <AssetRow key={`${asset.id}-${group}-${idx}`} asset={asset} onClick={() => onViewAsset(asset.id)} onEdit={onEditAsset} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {finalFilteredAssets.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Filter className="mx-auto mb-2 opacity-50" size={32} />
          <p>No assets found matching your criteria.</p>
          {onAddAsset && (
            <button onClick={onAddAsset} className="mt-4 text-indigo-600 font-medium hover:underline">
              Add your first asset
            </button>
          )}
        </div>
      )}
    </div>
  );
};
