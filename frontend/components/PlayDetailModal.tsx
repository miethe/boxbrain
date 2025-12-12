import React, { useState } from 'react';
import { Play, Asset, AssetCollection, Comment, HistoryItem, Dictionary } from '../types';
import {
  getPlayComments,
  getPlayHistory,
  getPlayAssets,
  getPlayCollections,
  getRelatedPlays,
  deletePlay,
  getUsers
} from '../services/dataService';
import {
  MessageSquare,
  Clock,
  Layers,
  Tag,
  Globe,
  Cpu,
  User,
  LayoutGrid,
  List,
  FolderOpen,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { AssetCard, AssetRow } from './ui/AssetItem';

interface PlayDetailModalProps {
  play: Play;
  dictionary: Dictionary;
  onClose: () => void;
  onViewAsset: (assetId: string) => void;
  onEdit?: (play: Play) => void;
}

type TabType = 'overview' | 'assets' | 'history' | 'notes';
type AssetViewType = 'list' | 'grid';
type GroupByType = 'stage' | 'collection' | 'none';

export const PlayDetailModal: React.FC<PlayDetailModalProps> = ({ play, dictionary, onClose, onViewAsset, onEdit }) => {

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Mock data fetching
  const comments = getPlayComments(play.id);
  const history = getPlayHistory(play.id);
  const assets = getPlayAssets(play.id);
  const collections = getPlayCollections(play.id);
  const relatedPlays = getRelatedPlays(play.id);

  const [users, setUsers] = useState<{ id: string, name: string, avatar: string }[]>([]);
  React.useEffect(() => { getUsers().then(setUsers); }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header Actions */}
      <div className="absolute top-4 right-14 flex items-center gap-2 z-10">
        <button
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
          title="Edit"
          onClick={() => onEdit && onEdit(play)}
        >
          <Edit size={20} />
        </button>
        <button
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Delete"
          onClick={async () => {
            if (confirm('Are you sure you want to delete this play?')) {
              try {
                await deletePlay(play.id);
                onClose();
                // Ideally trigger a refresh of the parent list here
                window.location.reload();
              } catch (e: any) {
                // Check if it's the specific 409 error we added in backend
                if (e.message && e.message.includes("Cannot delete Play")) {
                  alert(e.message.replace("API Error 409: ", ""));
                } else {
                  alert('Failed to delete play: ' + (e.message || "Unknown error"));
                }
              }
            }
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Assets <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">{assets.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col lg:flex-row min-h-full">
          {/* Left Main Content */}
          <div className={`flex-1 ${activeTab === 'assets' ? 'p-0' : 'p-6'}`}>
            {activeTab === 'overview' && (
              <OverviewTab
                play={play}
              />
            )}
            {activeTab === 'assets' && (
              <AssetsTab
                assets={assets}
                collections={collections}
                stages={dictionary.stages}
                onViewAsset={onViewAsset}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab history={history} />
            )}
            {activeTab === 'notes' && (
              <NotesTab comments={comments} />
            )}
          </div>

          {/* Right Sidebar - Consistent across most tabs */}
          {activeTab !== 'assets' && (
            <div className="w-full lg:w-96 bg-slate-50 border-l border-slate-200 p-6 space-y-6 overflow-y-auto">
              {/* Metadata Group */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Metadata</h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Offering</dt>
                    <dd className="font-medium text-slate-800">{play.offering}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Sector / Market</dt>
                    <dd className="flex items-center gap-1 text-slate-800">
                      <Layers size={14} className="text-slate-400" /> {play.sector}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 mb-1">Region</dt>
                    <dd className="flex items-center gap-1 text-slate-800">
                      <Globe size={14} className="text-slate-400" /> {play.geo}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sales Stages</h4>
                <div className="flex flex-wrap gap-2">
                  {play.stage_scope.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {play.technologies.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium">
                      <Cpu size={12} /> {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {play.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs">
                      <Tag size={12} /> {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Contacts</h4>
                <div className="space-y-2">
                  {play.owners.map(owner => (
                    <div key={owner} className="flex items-center gap-2 text-sm text-slate-700">
                      <User size={14} className="text-slate-400" />
                      <a href={`mailto:${owner}`} className="hover:text-indigo-600 hover:underline">{owner}</a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attached Team</h4>
                <div className="space-y-2">
                  {(play.default_team_members || []).length > 0 ? (play.default_team_members || []).map(uid => {
                    const u = users.find(user => user.id === uid);
                    return (
                      <div key={uid} className="flex items-center gap-2 text-sm text-slate-700">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {u?.avatar || 'U'}
                        </div>
                        <span>{u?.name || uid}</span>
                      </div>
                    );
                  }) : (
                    <span className="text-xs text-slate-400 italic">No standard team defined.</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Related Plays</h4>
                <div className="space-y-3">
                  {relatedPlays.map(rp => (
                    <div key={rp.id} className="group cursor-pointer">
                      <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{rp.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{rp.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const OverviewTab: React.FC<{ play: Play }> = ({ play }) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
        <p className="text-slate-700 leading-relaxed text-lg">{play.summary}</p>
      </section>

      {play.stages && play.stages.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Stage Standards</h3>
          <div className="grid gap-4">
            {play.stages.map(stage => {
              const hasContent = stage.guidance || (stage.checklist_items && stage.checklist_items.length > 0);
              if (!hasContent) return null;
              return (
                <div key={stage.key} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-sm font-bold text-slate-800">
                    {stage.label || stage.key}
                  </div>
                  <div className="p-4 space-y-4">
                    {stage.guidance && (
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Guidance</h5>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{stage.guidance}</p>
                      </div>
                    )}
                    {stage.checklist_items && stage.checklist_items.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Key Outcomes</h5>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                          {stage.checklist_items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

const NotesTab: React.FC<{ comments: Comment[] }> = ({ comments }) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Public Notes</h3>
        <textarea
          className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          rows={4}
          placeholder="Add notes about this play..."
        />
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Private Notes</h3>
        <textarea
          className="w-full border border-slate-300 bg-slate-50 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          rows={2}
          placeholder="Private notes (visible only to you)..."
        />
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare size={16} /> Comments
        </h3>
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {comment.avatar}
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1 shadow-sm">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-sm text-slate-800">{comment.user}</span>
                  <span className="text-xs text-slate-400">{comment.date}</span>
                </div>
                <p className="text-sm text-slate-600">{comment.text}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const AssetsTab: React.FC<{
  assets: Asset[];
  collections: AssetCollection[];
  stages: string[];
  onViewAsset: (id: string) => void;
}> = ({ assets, collections, stages, onViewAsset }) => {
  const [view, setView] = useState<AssetViewType>('grid');
  const [groupBy, setGroupBy] = useState<GroupByType>('stage');

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded ${view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded ${view === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByType)}
              className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">None</option>
              <option value="stage">Stage</option>
              <option value="collection">Collection</option>
            </select>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Content */}
      <div className={`space-y-6 ${view === 'grid' && groupBy === 'none' ? 'grid grid-cols-3 gap-4 space-y-0' : ''}`}>

        {groupBy === 'none' && (
          view === 'list' ? (
            <div className="space-y-2">
              {assets.map(asset => <AssetRow key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} showGrip />)}
            </div>
          ) : (
            // Already handled by parent grid class, but need fragments
            <>
              {assets.map(asset => <AssetCard key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} />)}
            </>
          )
        )}

        {groupBy === 'stage' && stages.map(stage => {
          const stageAssets = assets.filter(a => a.default_stage === stage);
          if (stageAssets.length === 0) return null;
          return (
            <div key={stage} className={view === 'grid' ? 'col-span-full' : ''}>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div> {stage}
              </h4>
              {view === 'list' ? (
                <div className="space-y-2 pl-4 border-l-2 border-slate-200 ml-1">
                  {stageAssets.map(asset => <AssetRow key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} showGrip />)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-slate-200 ml-1">
                  {stageAssets.map(asset => <AssetCard key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} />)}
                </div>
              )}
            </div>
          );
        })}

        {groupBy === 'collection' && (
          <>
            {collections.map(col => (
              <div key={col.id} className={view === 'grid' ? 'col-span-full' : ''}>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FolderOpen size={14} /> {col.name}
                </h4>
                {/* Filter mock assets for demo */}
                {view === 'list' ? (
                  <div className="space-y-2 pl-4 border-l-2 border-slate-200 ml-1">
                    {assets.slice(0, col.id === 'col1' ? 1 : 2).map(asset => <AssetRow key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} showGrip />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-slate-200 ml-1">
                    {assets.slice(0, col.id === 'col1' ? 1 : 2).map(asset => <AssetCard key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} />)}
                  </div>
                )}
              </div>
            ))}
            {/* Unassigned */}
            <div className={view === 'grid' ? 'col-span-full' : ''}>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-6">Unassigned</h4>
              {view === 'list' ? (
                <div className="space-y-2 pl-4 border-l-2 border-slate-200 ml-1">
                  {assets.slice(2).map(asset => <AssetRow key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} showGrip />)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-slate-200 ml-1">
                  {assets.slice(2).map(asset => <AssetCard key={asset.id} asset={asset} onClick={() => onViewAsset(asset.id)} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const HistoryTab: React.FC<{ history: HistoryItem[] }> = ({ history }) => {
  return (
    <div className="p-6">
      <div className="max-w-3xl">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
          {history.map(item => (
            <div key={item.id} className="relative flex items-start group">
              <div className="absolute left-0 h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-indigo-500 transition-colors z-10">
                <Clock size={16} className="text-slate-400 group-hover:text-indigo-600" />
              </div>
              <div className="pl-14 w-full">
                <div className="text-sm font-medium text-slate-900">
                  {item.user} <span className="text-slate-500 font-normal">{item.action}</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">{item.date}</div>
                {item.details && (
                  <div className="mt-1 p-2 bg-slate-50 rounded text-sm text-slate-600 border border-slate-100">
                    {item.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};