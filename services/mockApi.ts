import { Asset, AssetMetadata, InboxItem, AssetType } from '../types';
import { MOCK_ASSETS } from '../constants';

let assets = [...MOCK_ASSETS];

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
    return {
      offering: [
        {value: 'OpenShift', count: 10}, 
        {value: 'Ansible', count: 5},
        {value: 'RHOV', count: 3},
        {value: 'Automation', count: 4},
        {value: 'Cloud', count: 12}
      ],
      related_technologies: [
        {value: 'Kubernetes', count: 8},
        {value: 'Terraform', count: 6},
        {value: 'AWS', count: 15},
        {value: 'Azure', count: 4}
      ],
      tags: [
        {value: 'Cloud', count: 12},
        {value: 'Security', count: 5},
        {value: 'Finance', count: 3}
      ]
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
      commit_sha: Math.random().toString(16).substr(2, 7)
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
       commit_sha: Math.random().toString(16).substr(2, 7)
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
  }
};
