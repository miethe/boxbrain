import React, { useState } from 'react';
import { Asset, Play, Comment, HistoryItem, Dictionary } from '../types';
import {
    getAssetComments,
    getAssetHistory,
    getRelatedAssets,
    getAssetLinkedPlays,
    deleteAsset
} from '../services/dataService';
import {
    MessageSquare,
    Clock,
    Download,
    Tag,
    User,
    Edit,
    Trash2,
    Plus,
    Calendar,
    Layers,
    Cpu,
    Eye,
    ExternalLink,
    Link as LinkIcon
} from 'lucide-react';
import { AssetIcon } from './ui/AssetItem';

interface AssetDetailModalProps {
    asset: Asset;
    dictionary: Dictionary;
    onClose: () => void;
    onViewPlay: (playId: string) => void;
}

type TabType = 'overview' | 'content' | 'history' | 'notes';

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, dictionary, onClose, onViewPlay }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Mock data
    const comments = getAssetComments(asset.id);
    const history = getAssetHistory(asset.id);
    const relatedAssets = getRelatedAssets(asset.id);
    const linkedPlays = getAssetLinkedPlays(asset.id);

    const isLinkType = asset.kind === 'link';
    const hasPreviewLink = asset.links?.find(l => l.type === 'preview');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header Actions */}
            <div className="absolute top-4 right-14 flex items-center gap-2">
                <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors" title="Add to Collection">
                    <Plus size={20} />
                </button>
                <button
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="Edit"
                    onClick={() => alert("Edit functionality coming soon")} // Wired up Edit button
                >
                    <Edit size={20} />
                </button>
                <button
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                    onClick={async () => { // Wired up Delete button
                        if (confirm('Are you sure you want to delete this asset?')) {
                            try {
                                await deleteAsset(asset.id);
                                onClose();
                                window.location.reload();
                            } catch (e) {
                                alert('Failed to delete asset');
                            }
                        }
                    }}
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-2">
                {(['overview', 'content', 'history', 'notes'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py - 4 px - 4 text - sm font - medium border - b - 2 transition - colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'} `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                <div className="flex flex-col lg:flex-row min-h-full">

                    {/* Main Content Area */}
                    <div className="flex-1 p-6 space-y-8">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                asset={asset}
                                linkedPlays={linkedPlays}
                                relatedAssets={relatedAssets}
                                onViewPlay={onViewPlay}
                            />
                        )}
                        {activeTab === 'content' && <ContentTab asset={asset} />}
                        {activeTab === 'history' && <HistoryTab history={history} />}
                        {activeTab === 'notes' && <NotesTab comments={comments} />}
                    </div>

                    {/* Right Sidebar - Consistent across tabs except maybe content full view */}
                    {activeTab !== 'content' && (
                        <div className="w-full lg:w-80 bg-slate-50 border-l border-slate-200 p-6 space-y-6 overflow-y-auto">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Metadata</h4>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-xs text-slate-500 mb-1">Kind</dt>
                                        <dd className="flex items-center gap-2 font-medium text-slate-800 capitalize">
                                            <AssetIcon kind={asset.kind} size={16} /> {asset.kind}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500 mb-1">Purpose</dt>
                                        <dd className="font-medium text-slate-800">{asset.purpose}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500 mb-1">Default Stage</dt>
                                        <dd className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                            {asset.default_stage}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500 mb-1">Created</dt>
                                        <dd className="flex items-center gap-1 text-slate-800 text-sm">
                                            <Calendar size={14} className="text-slate-400" /> {asset.created_at}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500 mb-1">Last Updated</dt>
                                        <dd className="flex items-center gap-1 text-slate-800 text-sm">
                                            <Clock size={14} className="text-slate-400" /> {asset.updated_at}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {asset.tags.map(t => (
                                        <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs">
                                            <Tag size={12} /> {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Owners</h4>
                                <div className="space-y-2">
                                    {asset.owners.map(owner => (
                                        <div key={owner} className="flex items-center gap-2 text-sm text-slate-700">
                                            <User size={14} className="text-slate-400" />
                                            <a href={`mailto:${owner} `} className="hover:text-indigo-600 hover:underline">{owner}</a>
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

const OverviewTab: React.FC<{
    asset: Asset;
    linkedPlays: Play[];
    relatedAssets: Asset[];
    onViewPlay: (id: string) => void;
}> = ({ asset, linkedPlays, relatedAssets, onViewPlay }) => {
    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-700 leading-relaxed text-lg">{asset.description || "No description provided."}</p>
            </section>

            {/* Links Section */}
            {(asset.links && asset.links.length > 0) && (
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Related Links</h3>
                    <div className="space-y-2">
                        {asset.links.map(link => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors group"
                            >
                                <div className="bg-slate-100 p-2 rounded text-slate-500 group-hover:text-indigo-600">
                                    <ExternalLink size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-600">{link.title}</div>
                                    <div className="text-xs text-slate-500">{link.url}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Linked Plays</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {linkedPlays.map(play => (
                        <div key={play.id} onClick={() => onViewPlay(play.id)} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md cursor-pointer transition-all group">
                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 mb-1">{play.title}</h4>
                            <div className="flex gap-2 mb-2">
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{play.offering}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Infer Offerings/Tech from Linked Plays for MVP */}
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Related Offerings</h3>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(linkedPlays.map(p => p.offering))).map(off => (
                            <span key={off} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                <Layers size={12} /> {off}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Related Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(linkedPlays.flatMap(p => p.technologies))).slice(0, 5).map(tech => (
                            <span key={tech} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                                <Cpu size={12} /> {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Related Assets</h3>
                <div className="space-y-2">
                    {relatedAssets.map(ra => (
                        <div key={ra.id} className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200">
                            <AssetIcon kind={ra.kind} size={16} />
                            <span className="text-sm text-slate-700 font-medium">{ra.title}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

const ContentTab: React.FC<{ asset: Asset }> = ({ asset }) => {
    const isLink = asset.kind === 'link';
    const previewLink = asset.links?.find(l => l.type === 'preview')?.url;

    // Simplistic Logic: If it is a link or has a preview link, try to iframe it or show link button
    // In real app, would use doc viewer based on mime type.

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800">{asset.title}</h3>
                    <p className="text-xs text-slate-500">{asset.uri}</p>
                </div>
                <a
                    href={isLink ? asset.uri : '#'}
                    target={isLink ? "_blank" : undefined}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                    {isLink ? <ExternalLink size={16} /> : <Download size={16} />}
                    {isLink ? 'Open Link' : 'Download'}
                </a>
            </div>

            {/* Preview Pane */}
            <div className="flex-1 bg-slate-200 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
                {previewLink ? (
                    <iframe src={previewLink} className="w-full h-full border-none" title="Preview" />
                ) : (
                    <div className="text-center">
                        <Eye size={48} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-500 font-medium">Preview Unavailable</p>
                        <p className="text-sm text-slate-400">
                            {isLink ? "External links cannot be previewed here." : `Preview generation for ${asset.kind} is simulated.`}
                        </p>
                        {isLink && (
                            <a href={asset.uri} target="_blank" rel="noreferrer" className="mt-4 inline-block text-indigo-600 underline">
                                Open in new tab
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoryTab: React.FC<{ history: HistoryItem[] }> = ({ history }) => {
    return (
        <div className="p-0">
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

const NotesTab: React.FC<{ comments: Comment[] }> = ({ comments }) => {
    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Public Notes</h3>
                <textarea
                    className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    rows={4}
                    placeholder="Add public notes about this asset..."
                />
            </section>
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
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
};