import { Asset, AssetMetadata, InboxItem, Facets } from '../types';

const API_BASE = 'http://localhost:8000/api';

export const api = {
    search: async (query: string, filters: Partial<AssetMetadata> = {}): Promise<Asset[]> => {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (filters.category) params.append('category', filters.category);

        const res = await fetch(`${API_BASE}/assets?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch assets');
        return res.json();
    },

    save: async (asset: AssetMetadata): Promise<AssetMetadata> => {
        const res = await fetch(`${API_BASE}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(asset),
        });
        if (!res.ok) throw new Error('Failed to save asset');
        return res.json();
    },

    extractMetadata: async (file: File): Promise<Partial<AssetMetadata>> => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/extract`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to extract metadata');
        return res.json();
    },

    getInbox: async (): Promise<InboxItem[]> => {
        const res = await fetch(`${API_BASE}/inbox`);
        if (!res.ok) throw new Error('Failed to fetch inbox');
        return res.json();
    },

    getFacets: async (): Promise<Facets> => {
        const res = await fetch(`${API_BASE}/facets`);
        if (!res.ok) throw new Error('Failed to fetch facets');
        return res.json();
    },

    processInboxItem: async (id: string): Promise<void> => {
        // Mock for now, or implement endpoint
        console.log('Processed inbox item', id);
        return Promise.resolve();
    },

    updateAssetNote: async (id: string, note: any): Promise<void> => {
        // Mock for now
        console.log('Updated note', id, note);
        return Promise.resolve();
    },

    addAssetComment: async (id: string, content: string): Promise<any> => {
        // Mock for now
        return {
            id: Math.random().toString(),
            author: 'Current User',
            content,
            timestamp: new Date().toISOString()
        };
    },

    bulkSave: async (assets: AssetMetadata[]): Promise<Asset[]> => {
        // Loop for now, or implement bulk endpoint
        const results = [];
        for (const asset of assets) {
            results.push(await api.save(asset));
        }
        return results;
    },

    getStaleAssets: async (): Promise<Asset[]> => {
        // Mock for now
        return [];
    },

    verifyAsset: async (id: string): Promise<void> => {
        // Mock for now
        console.log('Verified asset', id);
        return Promise.resolve();
    }
};
