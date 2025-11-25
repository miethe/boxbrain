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

    save: async (asset: AssetMetadata, file?: File | Blob): Promise<AssetMetadata> => {
        const formData = new FormData();

        // Handle file: explicit file > content blob > error
        if (file) {
            formData.append('file', file);
        } else if (asset.content) {
            const blob = new Blob([asset.content], { type: 'text/markdown' });
            formData.append('file', blob, 'content.md');
        } else {
            // If no file and no content, we can't create an asset in the current backend model
            // But maybe we are just updating metadata?
            // For now, let's assume we need a file for creation.
            // If this is an update, the backend might handle it differently (PUT vs POST).
            // The current POST endpoint requires a file.
            throw new Error('File or content is required to create an asset');
        }

        formData.append('metadata_json', JSON.stringify(asset));

        const res = await fetch(`${API_BASE}/assets`, {
            method: 'POST',
            // Content-Type header must be undefined for FormData to set boundary
            body: formData,
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to save asset: ${err}`);
        }
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
    },

    // GTM Plays
    getPlays: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/plays`);
        if (!res.ok) throw new Error('Failed to fetch plays');
        return res.json();
    },

    createPlay: async (play: any): Promise<any> => {
        const res = await fetch(`${API_BASE}/plays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(play),
        });
        if (!res.ok) throw new Error('Failed to create play');
        return res.json();
    },

    matchPlays: async (filters: { offering?: string[], industry?: string, region?: string }): Promise<any[]> => {
        const params = new URLSearchParams();
        if (filters.industry) params.append('industry', filters.industry);
        if (filters.region) params.append('region', filters.region);
        if (filters.offering) {
            filters.offering.forEach(o => params.append('offering', o));
        }

        const res = await fetch(`${API_BASE}/plays/match?${params.toString()}`, {
            method: 'POST', // Changed to POST to match backend implementation if needed, or keep GET if params are enough. Backend defined as POST /match
        });
        if (!res.ok) throw new Error('Failed to match plays');
        return res.json();
    }
};
