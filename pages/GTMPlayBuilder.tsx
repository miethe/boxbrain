import React, { useState, useEffect } from 'react';
import { Layers, Plus, Save, ArrowRight } from 'lucide-react';
import { Button, Input, TextArea, Select, MultiSelect } from '../components/Common';
import { api } from '../services/apiClient';
import { GTMPlay, Asset } from '../types';

export const GTMPlayBuilder: React.FC = () => {
    const [plays, setPlays] = useState<GTMPlay[]>([]);
    const [view, setView] = useState<'list' | 'create'>('list');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<GTMPlay>>({});
    const [options, setOptions] = useState<{ offerings: string[], industries: string[], regions: string[] }>({
        offerings: [],
        industries: ['ENERGY', 'TELCO', 'FINANCE', 'HEALTH', 'RETAIL', 'X-SECTOR'],
        regions: ['AMER', 'EMEA', 'APAC', 'GLOBAL']
    });

    useEffect(() => {
        fetchPlays();
        api.getFacets().then(facets => {
            setOptions(prev => ({
                ...prev,
                offerings: facets.offering?.map(f => f.value) || []
            }));
        });
    }, []);

    const fetchPlays = async () => {
        setLoading(true);
        try {
            const data = await api.getPlays();
            setPlays(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title) return;
        setLoading(true);
        try {
            await api.createPlay(formData);
            await fetchPlays();
            setView('list');
            setFormData({});
        } catch (e) {
            console.error(e);
            alert('Failed to create play');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <Layers className="w-8 h-8 text-blue-600 mr-3" />
                        GTM Play Builder
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Define standard plays to guide sellers and delivery teams.
                    </p>
                </div>
                {view === 'list' ? (
                    <Button onClick={() => setView('create')} className="flex items-center">
                        <Plus className="w-4 h-4 mr-2" /> New Play
                    </Button>
                ) : (
                    <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
                )}
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plays.map(play => (
                        <div key={play.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{play.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">{play.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {play.offering && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">{play.offering}</span>}
                                {play.industry && <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">{play.industry}</span>}
                                {play.region && <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">{play.region}</span>}
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-2">Associated Assets</div>
                                {play.assets && play.assets.length > 0 ? (
                                    <div className="space-y-1">
                                        {play.assets.slice(0, 3).map(asset => (
                                            <div key={asset.id} className="text-sm text-slate-600 truncate flex items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2" />
                                                {asset.title}
                                            </div>
                                        ))}
                                        {play.assets.length > 3 && (
                                            <div className="text-xs text-slate-400 pl-3.5">+{play.assets.length - 3} more</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 italic">No assets linked yet.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'create' && (
                <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Define New Play</h2>

                    <div className="space-y-6">
                        <Input
                            label="Play Title"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <TextArea
                            label="Description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Target Industry"
                                options={options.industries}
                                value={formData.industry || ''}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            />

                            <Select
                                label="Target Region"
                                options={options.regions}
                                value={formData.region || ''}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Offering</label>
                            <Select
                                options={options.offerings}
                                value={formData.offering || ''}
                                onChange={(e) => setFormData({ ...formData, offering: e.target.value })}
                            />
                            <p className="text-xs text-slate-500 mt-1">This helps match the play to opportunities in the Deal Guide.</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={loading || !formData.title}>
                                {loading ? 'Saving...' : 'Create Play'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
