import React, { useState, useEffect } from 'react';
import { CheckCircle, Archive, RefreshCw, Clock, ShieldAlert } from 'lucide-react';
import { Asset } from '../../types';
import { Button } from '../Common';
// We need to add these to dataService first, but I'll import them assuming they will exist or use any for now to avoid errors if I haven't updated dataService yet.
// Actually, I should update dataService first or just cast to any for the import to work if I do it in parallel.
// I'll use a local interface or just assume the service will be updated.
import { getStaleAssets, verifyAsset } from '../../services/dataService';

export const GovernanceTab: React.FC = () => {
    const [staleAssets, setStaleAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStale = async () => {
        setLoading(true);
        // @ts-ignore - implementing in dataService next
        const data = await getStaleAssets();
        setStaleAssets(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchStale();
    }, []);

    const handleVerify = async (id: string) => {
        // @ts-ignore
        await verifyAsset(id);
        setStaleAssets(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                    <ShieldAlert className="w-8 h-8 text-blue-600 mr-3" />
                    Content Governance
                </h1>
                <p className="text-slate-500 mt-1">Review stale, flagged, or expiring content to maintain repository trust.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                    <h3 className="text-amber-800 font-bold mb-1">Stale Content</h3>
                    <div className="text-3xl font-bold text-amber-900 mb-2">{staleAssets.length}</div>
                    <p className="text-xs text-amber-700">Assets not verified in &gt; 6 months</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                    <h3 className="text-red-800 font-bold mb-1">User Flags</h3>
                    <div className="text-3xl font-bold text-red-900 mb-2">2</div>
                    <p className="text-xs text-red-700">Reported for inaccuracy</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <h3 className="text-blue-800 font-bold mb-1">Health Score</h3>
                    <div className="text-3xl font-bold text-blue-900 mb-2">94%</div>
                    <p className="text-xs text-blue-700">Verified & fresh content</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-slate-500" /> Review Queue
                    </h2>
                    <button onClick={fetchStale} className="text-slate-500 hover:text-blue-600 p-1">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {staleAssets.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-900">All Caught Up!</h3>
                        <p className="text-slate-500">No stale content found.</p>
                    </div>
                )}

                <div className="divide-y divide-slate-100">
                    {staleAssets.map(asset => (
                        <div key={asset.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-600`}>
                                        {asset.kind}
                                    </span>
                                    <h3 className="font-bold text-slate-900 text-sm">{asset.title}</h3>
                                </div>
                                <div className="flex items-center text-xs text-slate-500 gap-4 mb-2">
                                    {/* Asset type in new frontend doesn't have owners or last_verified yet, using mocks or optional chaining */}
                                    <span>Owner: {(asset as any).owners?.[0] || 'Unknown'}</span>
                                    <span className="text-red-500 font-medium">Verified: {(asset as any).last_verified || 'Never'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="text-xs py-1.5 h-auto" onClick={() => handleVerify(asset.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1.5 text-green-600" /> Verify
                                </Button>
                                <Button variant="outline" className="text-xs py-1.5 h-auto hover:bg-red-50 hover:text-red-600">
                                    <Archive className="w-3 h-3 mr-1.5" /> Archive
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
