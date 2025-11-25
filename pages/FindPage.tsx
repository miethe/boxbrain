
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search as SearchIcon, Filter, X, Download, FileText, LayoutGrid,
  List as ListIcon, Code, Presentation, ChevronDown, ChevronUp,
  ArrowUpDown, Check, Calendar, User, ExternalLink, Briefcase, Star,
  Copy, Flag, MessageSquarePlus, Terminal, Layers, Lock, Globe, Send, Save
} from 'lucide-react';
import { api } from '../services/apiClient';
import { Asset, AssetMetadata, AssetCategory, Artifact, AssetType, Note, Comment } from '../types';
import { Badge, Button } from '../components/Common';
import FilePreview from '../components/FilePreview';

interface FacetItem {
  value: string;
  count: number;
}

type SortOption = 'relevance' | 'newest' | 'oldest' | 'az';

export const FindPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [facets, setFacets] = useState<Record<string, FacetItem[]> | null>(null);
  const [filters, setFilters] = useState<Partial<Record<keyof AssetMetadata, string>>>({});

  // Preview State
  const [previewFile, setPreviewFile] = useState<{ url: string; mimeType?: string; filename: string } | null>(null);

  // New Filters
  const [dateFilter, setDateFilter] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);

  // New Layout/Sort State
  const [activeTab, setActiveTab] = useState<AssetCategory>(AssetCategory.Technical);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Briefcase / Collections State
  const [briefcase, setBriefcase] = useState<Set<string>>(new Set());
  const [showBriefcaseOnly, setShowBriefcaseOnly] = useState(false);

  // Notes & Comments State
  const [noteContent, setNoteContent] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [savingNote, setSavingNote] = useState(false);

  // Collapsible Sections State
  const [refineOpen, setRefineOpen] = useState(true);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the sidebar portal target
    const el = document.getElementById('sidebar-refine-portal');
    setPortalTarget(el);
  }, []);

  // Sync Notes/Comments when Asset Selected
  useEffect(() => {
    if (selectedAsset) {
      setNoteContent(selectedAsset.notes?.content || '');
      setIsPrivateNote(selectedAsset.notes?.isPrivate ?? true);
      setComments(selectedAsset.comments || []);
    }
  }, [selectedAsset]);

  const performSearch = async () => {
    setLoading(true);
    // Apply tab filter implicitly
    const activeFilters = { ...filters, category: activeTab };
    let data = await api.search(query, activeFilters);

    // Filter by Briefcase if active
    if (showBriefcaseOnly) {
      data = data.filter(asset => briefcase.has(asset.id));
    }

    // Client-side filtering for "Date" and "File Type" (Mock logic)
    if (dateFilter) {
      const now = new Date();
      data = data.filter(asset => {
        const assetDate = new Date(asset.created_at);
        const diffDays = (now.getTime() - assetDate.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === '24h') return diffDays <= 1;
        if (dateFilter === '7d') return diffDays <= 7;
        if (dateFilter === '30d') return diffDays <= 30;
        if (dateFilter === 'year') return diffDays <= 365;
        return true;
      });
    }

    if (fileTypeFilter.length > 0) {
      // Simple mapping based on type or artifacts
      data = data.filter(asset => {
        const typeMap: Record<string, string> = {
          'win_story': 'deck',
          'play': 'video',
          'code_ref': 'code',
          'template': 'doc'
        };
        // Check if asset type maps to selected file types, or if artifacts match
        const assetMainType = typeMap[asset.type] || 'doc';
        if (fileTypeFilter.includes(assetMainType)) return true;
        if (asset.artifacts?.some(a => fileTypeFilter.includes(a.kind))) return true;
        return false;
      });
    }

    // Client-side Sorting
    data.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      return 0; // Relevance is default order from mockApi
    });

    setResults(data);
    setLoading(false);
  };

  useEffect(() => {
    performSearch();
    api.getFacets().then((data) => setFacets(data as Record<string, FacetItem[]>));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab, dateFilter, fileTypeFilter, sortBy, showBriefcaseOnly]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') performSearch();
  };

  const toggleFilter = (key: keyof AssetMetadata, value: string) => {
    setFilters(prev => {
      const next = { ...prev };
      if (next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const toggleFileType = (type: string) => {
    setFileTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleBriefcaseItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBriefcase(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveNote = async () => {
    if (!selectedAsset) return;
    setSavingNote(true);
    const note: Note = {
      content: noteContent,
      isPrivate: isPrivateNote,
      updatedAt: new Date().toISOString()
    };
    await api.updateAssetNote(selectedAsset.id, note);
    setSavingNote(false);
    // Update local result to reflect change if we re-open
    const updated = { ...selectedAsset, notes: note };
    setSelectedAsset(updated);
  };

  const handlePostComment = async () => {
    if (!selectedAsset || !commentInput.trim()) return;
    const newComment = await api.addAssetComment(selectedAsset.id, commentInput);
    setComments([...comments, newComment]);
    setCommentInput('');
  };

  // --------------------------------------------------------------------------
  // Smart Actions Logic
  // --------------------------------------------------------------------------
  const copySmartContent = () => {
    if (!selectedAsset) return;

    let textToCopy = '';
    if (selectedAsset.category === AssetCategory.Sales) {
      // Email Blurb Format
      textToCopy = `Hi Team,\n\nI found a relevant asset for our discussion:\n\n**${selectedAsset.title}**\n${selectedAsset.summary}\n\nLink: https://gitkb.internal/assets/${selectedAsset.id}\n\nBest,`;
      alert("Copied Email Blurb to Clipboard!");
    } else {
      // Tech Format
      if (selectedAsset.type === AssetType.CodeRef) {
        textToCopy = `git clone git@github.com:org/${selectedAsset.title.toLowerCase().replace(/ /g, '-')}.git`;
        alert("Copied Clone Command to Clipboard!");
      } else {
        textToCopy = `[${selectedAsset.title}](https://gitkb.internal/assets/${selectedAsset.id})`;
        alert("Copied Markdown Link to Clipboard!");
      }
    }
    navigator.clipboard.writeText(textToCopy);
  };

  const TabButton = ({ cat, icon: Icon }: { cat: AssetCategory, icon: React.ElementType }) => (
    <button
      onClick={() => { setActiveTab(cat); setShowBriefcaseOnly(false); }}
      className={`flex items-center px-6 py-3 border-b-2 text-sm font-medium transition-colors
        ${activeTab === cat && !showBriefcaseOnly
          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {cat.charAt(0).toUpperCase() + cat.slice(1)} Assets
    </button>
  );

  // Render the Filter sidebar content
  const SidebarContent = (
    <div className="p-4 text-sm">
      <div className="mb-2">
        <button
          onClick={() => setRefineOpen(!refineOpen)}
          className="flex items-center justify-between w-full text-slate-800 font-bold uppercase tracking-wider text-xs mb-4 hover:text-blue-600 transition-colors"
        >
          <span className="flex items-center"><Filter className="w-3 h-3 mr-2" /> Refine Results</span>
          {refineOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {refineOpen && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* Date Filter */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Date Modified
              </h3>
              <select
                className="w-full bg-white border border-slate-300 text-slate-700 rounded px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">Any time</option>
                <option value="24h">Past 24 hours</option>
                <option value="7d">Past week</option>
                <option value="30d">Past month</option>
                <option value="year">Past year</option>
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center">
                <FileText className="w-3 h-3 mr-1" /> File Type
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'deck', label: 'Presentation' },
                  { id: 'doc', label: 'Document' },
                  { id: 'code', label: 'Code' },
                  { id: 'video', label: 'Video' }
                ].map((type) => (
                  <label key={type.id} className="flex items-center text-slate-700 cursor-pointer hover:text-blue-600">
                    <input
                      type="checkbox"
                      checked={fileTypeFilter.includes(type.id)}
                      onChange={() => toggleFileType(type.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2 w-4 h-4"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Facets */}
            {facets && Object.entries(facets).map(([key, items]) => (
              <div key={key}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{key}</h3>
                <div className="space-y-1.5">
                  {(items as FacetItem[]).map((item) => (
                    <label key={item.value} className="flex items-center text-slate-700 cursor-pointer hover:text-blue-600">
                      <input
                        type="checkbox"
                        checked={filters[key as keyof AssetMetadata] === item.value}
                        onChange={() => toggleFilter(key as keyof AssetMetadata, item.value)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2 w-4 h-4"
                      />
                      <span className="flex-1 truncate">{item.value}</span>
                      <span className="text-xs text-slate-400 ml-1">({item.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setPreviewFile(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center overflow-hidden">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{previewFile.filename}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <a
                  href={previewFile.url}
                  download={previewFile.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - File Preview */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex items-center justify-center">
              <FilePreview url={previewFile.url} mimeType={previewFile.mimeType} filename={previewFile.filename} />
            </div>
          </div>
        </div>
      )}

      {/* Portal: Inject Filter Sidebar */}
      {portalTarget && createPortal(SidebarContent, portalTarget)}

      {/* Top Tab Bar */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TabButton cat={AssetCategory.Technical} icon={Code} />
          <TabButton cat={AssetCategory.Sales} icon={Presentation} />
        </div>
        <button
          onClick={() => setShowBriefcaseOnly(!showBriefcaseOnly)}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors mr-2 my-2
            ${showBriefcaseOnly
              ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          My Briefcase
          {briefcase.size > 0 && (
            <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{briefcase.size}</span>
          )}
        </button>
      </div>

      <div className="flex-1 flex min-h-0 relative">

        {/* Main Results Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {/* Search & Toolbar */}
          <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="relative flex-1 max-w-2xl">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={showBriefcaseOnly ? "Search in Briefcase..." : `Search ${activeTab} assets...`}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2 text-slate-500" />
                    Sort
                    <ChevronDown className="w-3 h-3 ml-2 text-slate-400" />
                  </button>
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-40 text-sm">
                        {[
                          { id: 'relevance', label: 'Relevance' },
                          { id: 'newest', label: 'Newest' },
                          { id: 'oldest', label: 'Oldest' },
                          { id: 'az', label: 'Title A-Z' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            className="flex items-center w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700"
                            onClick={() => { setSortBy(opt.id as SortOption); setShowSortMenu(false); }}
                          >
                            {sortBy === opt.id && <Check className="w-3 h-3 mr-2 text-blue-600" />}
                            <span className={sortBy === opt.id ? 'ml-0' : 'ml-5'}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* View Toggles */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Chips */}
            {(Object.keys(filters).length > 0 || dateFilter || fileTypeFilter.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, val]) => (
                  <span key={`${key}-${val}`} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    {key}: {val}
                    <button onClick={() => toggleFilter(key as keyof AssetMetadata, val as string)} className="ml-1.5 hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {dateFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    Date: {dateFilter}
                    <button onClick={() => setDateFilter('')} className="ml-1.5 hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {fileTypeFilter.map(ft => (
                  <span key={`ft-${ft}`} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    Type: {ft}
                    <button onClick={() => toggleFileType(ft)} className="ml-1.5 hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button onClick={() => { setFilters({}); setDateFilter(''); setFileTypeFilter([]); }} className="text-xs text-slate-500 hover:text-slate-900 underline ml-2">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-sm font-semibold text-slate-500">
                {loading ? 'Searching...' : `${results.length} results`}
                {showBriefcaseOnly && " in Briefcase"}
              </h2>
            </div>

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex flex-col relative
                      ${selectedAsset?.id === asset.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200'}`}
                  >
                    <button
                      onClick={(e) => toggleBriefcaseItem(e, asset.id)}
                      className={`absolute top-3 right-3 p-1.5 rounded-full z-10 transition-colors
                         ${briefcase.has(asset.id)
                          ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                          : 'bg-transparent text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}
                      title={briefcase.has(asset.id) ? "Remove from Briefcase" : "Add to Briefcase"}
                    >
                      <Star className={`w-4 h-4 ${briefcase.has(asset.id) ? 'fill-current' : ''}`} />
                    </button>

                    <div className="flex justify-between items-start mb-2 pr-8">
                      <Badge color={asset.type === 'win_story' ? 'green' : asset.type === 'play' ? 'blue' : 'gray'}>
                        {asset.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {asset.confidentiality === 'internal-only' && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-2">INT</span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 leading-snug mb-2 line-clamp-2">{asset.title}</h3>
                    <p className="text-slate-500 text-xs mb-3 line-clamp-3 flex-1">{asset.summary}</p>

                    {/* Related Technologies Chips */}
                    {asset.related_technologies && asset.related_technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {asset.related_technologies.slice(0, 3).map(tech => (
                          <span key={tech} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">
                            {tech}
                          </span>
                        ))}
                        {asset.related_technologies.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100">
                            +{asset.related_technologies.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 text-xs text-slate-400">
                      <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {asset.author || 'Unknown'}</span>
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="w-10 px-3 py-3"></th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {results.map(asset => (
                        <tr
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className={`cursor-pointer hover:bg-slate-50 ${selectedAsset?.id === asset.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-3 py-4 text-center">
                            <button
                              onClick={(e) => toggleBriefcaseItem(e, asset.id)}
                              className={`transition-colors
                                  ${briefcase.has(asset.id)
                                  ? 'text-indigo-600'
                                  : 'text-slate-300 hover:text-slate-500'}`}
                            >
                              <Star className={`w-4 h-4 ${briefcase.has(asset.id) ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-slate-900 line-clamp-1">{asset.title}</div>
                                <div className="text-xs text-slate-500 line-clamp-1">{asset.summary}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color={asset.type === 'win_story' ? 'green' : asset.type === 'play' ? 'blue' : 'gray'}>
                              {asset.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {asset.author}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(asset.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="text-center py-20">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium">No results found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters, tab, or briefcase.</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Pane (Slide-over) */}
        {selectedAsset && (
          <div className="w-[400px] bg-white border-l border-slate-200 flex-shrink-0 overflow-y-auto shadow-xl absolute right-0 inset-y-0 z-30 md:relative flex flex-col">
            <div className="p-6 flex-1">
              {/* Action Bar for Selected Asset */}
              <div className="flex items-center justify-between mb-6">
                <Badge color="blue">{selectedAsset.type}</Badge>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => toggleBriefcaseItem(e, selectedAsset.id)}
                    className={`p-2 rounded-full transition-colors ${briefcase.has(selectedAsset.id) ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                    title="Toggle Briefcase"
                  >
                    <Star className={`w-5 h-5 ${briefcase.has(selectedAsset.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={() => setSelectedAsset(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h1 className="text-xl font-bold text-slate-900 mb-2">{selectedAsset.title}</h1>

              <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
                <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {selectedAsset.author}</span>
                <span>•</span>
                <span>Verified {selectedAsset.last_verified}</span>
              </div>

              {/* Context-Aware Smart Action Button */}
              <div className="mb-6">
                <Button
                  onClick={copySmartContent}
                  className="w-full flex items-center justify-center py-2.5 shadow-sm"
                  variant="secondary"
                >
                  {selectedAsset.category === AssetCategory.Sales ? (
                    <>
                      <MessageSquarePlus className="w-4 h-4 mr-2" />
                      Copy Email Blurb
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4 mr-2" />
                      {selectedAsset.type === AssetType.CodeRef ? 'Copy Clone Command' : 'Copy Reference'}
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <span className="block text-slate-400 text-xs">Category</span>
                      <span className="font-medium text-slate-700 capitalize">{selectedAsset.category}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs">Region</span>
                      <span className="font-medium text-slate-700">{selectedAsset.region}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs">Stage</span>
                      <span className="font-medium text-slate-700 capitalize">{selectedAsset.stage}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs">Confidentiality</span>
                      <span className={`font-medium ${selectedAsset.confidentiality === 'internal-only' ? 'text-amber-600' : 'text-green-600'}`}>
                        {selectedAsset.confidentiality}
                      </span>
                    </div>
                  </div>

                  {selectedAsset.related_technologies && selectedAsset.related_technologies.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="block text-slate-400 text-xs mb-2">Related Technologies</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedAsset.related_technologies.map(tech => (
                          <span key={tech} className="text-xs px-2 py-1 bg-white text-slate-600 rounded border border-slate-200">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedAsset.summary}</p>
                </div>

                {selectedAsset.metrics && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAsset.metrics.map((m, i) => (
                        <div key={i} className="bg-blue-50 p-3 rounded border border-blue-100">
                          <div className="text-2xl font-bold text-blue-600">{m.value}</div>
                          <div className="text-xs text-blue-800 font-medium">{m.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Artifacts & Files</h3>
                  <div className="space-y-2">
                    {/* Main File */}
                    {selectedAsset.url && (
                      <div
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group"
                        onClick={() => setPreviewFile({
                          url: selectedAsset.url!,
                          mimeType: selectedAsset.mime_type,
                          filename: selectedAsset.title // Using title as filename for now
                        })}
                      >
                        <div className="flex items-center min-w-0">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">Main Asset File</div>
                            <div className="text-xs text-slate-500">Click to preview</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                      </div>
                    )}

                    {selectedAsset.artifacts?.map((art, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewArtifact(art)}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded hover:border-blue-400 hover:shadow-sm transition-all group cursor-pointer"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 mr-3">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{art.name}</div>
                            <div className="text-xs text-slate-400 uppercase">{art.kind}</div>
                          </div>
                        </div>
                        {/* Stop propagation on download button */}
                        <a
                          href={art.uri}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">My Notes</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPrivateNote(!isPrivateNote)}
                        className={`text-xs flex items-center px-2 py-1 rounded transition-colors ${isPrivateNote ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {isPrivateNote ? <Lock className="w-3 h-3 mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
                        {isPrivateNote ? 'Private' : 'Public'}
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="text-xs flex items-center px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                        disabled={savingNote}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {savingNote ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                    placeholder="Add personal notes, reminders, or implementation details..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    Last updated: {selectedAsset.notes?.updatedAt ? new Date(selectedAsset.notes.updatedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Comments ({comments.length})</h3>

                  <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-1">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                          {comment.author.charAt(0)}
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                            <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-2 italic">No comments yet.</p>
                    )}
                  </div>

                  <div className="flex gap-2 items-end">
                    <textarea
                      className="flex-1 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] resize-none"
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={!commentInput.trim()}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Governance Action */}
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <button className="flex items-center text-xs text-slate-400 hover:text-red-600 transition-colors">
                    <Flag className="w-3 h-3 mr-1" />
                    Report issue or suggest edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
