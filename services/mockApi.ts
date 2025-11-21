
import { Asset, AssetMetadata, InboxItem, AssetType, Note, Comment } from '../types';
import { MOCK_ASSETS } from '../constants';

let assets = [...MOCK_ASSETS];

// Initialize mock comments/notes if needed
assets = assets.map(a => ({
  ...a,
  comments: a.comments || [],
  notes: a.notes || { content: '', isPrivate: true, updatedAt: new Date().toISOString() }
}));

interface FacetItem {
  value: string;
  count: number;
}

export const api = {
  search: async (query: string, filters: any): Promise<Asset[]> => {
    await new Promise(r => setTimeout(r, 300));
    let results = assets.filter(a => 
      a.title.toLowerCase().includes(query.toLowerCase()) || 
      a.summary.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filters.category) {
      results = results.filter(a => a.category === filters.category);
    }
    // Basic mock filtering implementation
    return results;
  },

  getFacets: async (): Promise<Record<string, FacetItem[]>> => {
    await new Promise(r => setTimeout(r, 100));
    const counts: Record<string, Record<string, number>> = {
        offering: {},
        related_technologies: {},
        tags: {}
    };
    
    assets.forEach(a => {
        if(a.offering) counts.offering[a.offering] = (counts.offering[a.offering] || 0) + 1;
        a.related_technologies?.forEach(t => counts.related_technologies[t] = (counts.related_technologies[t] || 0) + 1);
        a.tags?.forEach(t => counts.tags[t] = (counts.tags[t] || 0) + 1);
    });

    return {
      offering: Object.entries(counts.offering).map(([v, c]) => ({value: v, count: c})),
      related_technologies: Object.entries(counts.related_technologies).map(([v, c]) => ({value: v, count: c})),
      tags: Object.entries(counts.tags).map(([v, c]) => ({value: v, count: c}))
    };
  },

  getInbox: async (): Promise<InboxItem[]> => {
    return [
      {
        id: '1', source: 'slack', sender: 'Sarah Jenkins', timestamp: '10:30 AM', content: 'Here is the updated deck for the Acme corp meeting.',
        suggestedMetadata: { title: 'Acme Corp Deck', type: AssetType.WinStory }
      },
      {
        id: '2', source: 'email', sender: 'DevOps Team', timestamp: 'Yesterday', content: 'FW: Terraform modules for EKS hardening.',
        suggestedMetadata: { title: 'EKS Hardening Modules', type: AssetType.CodeRef }
      }
    ];
  },

  processInboxItem: async (id: string) => { 
    // Mock processing
    await new Promise(r => setTimeout(r, 500));
  },

  extractMetadata: async (file: File): Promise<Partial<AssetMetadata>> => {
     await new Promise(r => setTimeout(r, 800));
     return { 
       title: file.name.split('.')[0].replace(/-/g, ' '),
       summary: `Automatically extracted content from ${file.name}`
     };
  },

  save: async (data: AssetMetadata): Promise<Asset> => {
    await new Promise(r => setTimeout(r, 800));
    const newAsset = { 
      ...data, 
      id: Math.random().toString(36).substr(2, 9), 
      created_at: new Date().toISOString(),
      path: `uploads/${new Date().getFullYear()}/${data.title?.toLowerCase().replace(/ /g, '-')}.yaml`,
      commit_sha: Math.random().toString(16).substr(2, 7),
      comments: [],
      notes: { content: '', isPrivate: true, updatedAt: new Date().toISOString() }
    } as Asset;
    assets.unshift(newAsset);
    return newAsset;
  },

  bulkSave: async (items: AssetMetadata[]): Promise<Asset[]> => {
     await new Promise(r => setTimeout(r, 1500));
     const newAssets = items.map(i => ({ 
       ...i, 
       id: Math.random().toString(36).substr(2, 9), 
       created_at: new Date().toISOString(),
       path: `bulk/${i.title?.toLowerCase().replace(/ /g, '-')}.yaml`,
       commit_sha: Math.random().toString(16).substr(2, 7),
       comments: [],
       notes: { content: '', isPrivate: true, updatedAt: new Date().toISOString() }
     } as Asset));
     assets.unshift(...newAssets);
     return newAssets;
  },

  getStaleAssets: async (): Promise<Asset[]> => {
    return assets.slice(0, 2); // Mocking some stale assets
  },

  verifyAsset: async (id: string) => { 
    const asset = assets.find(a => a.id === id);
    if (asset) {
      asset.last_verified = new Date().toISOString().split('T')[0];
    }
  },
  
  // Notes & Comments
  updateAssetNote: async (id: string, note: Note) => {
    const asset = assets.find(a => a.id === id);
    if (asset) {
      asset.notes = note;
    }
  },

  addAssetComment: async (id: string, content: string): Promise<Comment> => {
    const asset = assets.find(a => a.id === id);
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      author: 'John Doe',
      content,
      timestamp: 'Just now'
    };
    if (asset) {
      if (!asset.comments) asset.comments = [];
      asset.comments.push(newComment);
    }
    return newComment;
  },

  // Mock Schema Management
  getSchemas: async () => { return []; }, // Implemented in UI currently via constants
  updateSchema: async () => { return; }
};
