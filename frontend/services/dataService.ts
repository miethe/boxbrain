

import { Asset, Dictionary, OpportunityInput, Play, Comment, HistoryItem, AssetCollection, Opportunity, OpportunityPlay } from "../types";

const API_BASE = '/api/v2';

// Helper for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }
  return response.json();
}

// --- Core Data Fetching ---

export const getDictionary = async (): Promise<Dictionary> => {
  return fetchApi<Dictionary>('/dictionary');
};

export const getPlays = async (): Promise<Play[]> => {
  return fetchApi<Play[]>('/plays');
};

export const getPlayById = async (id: string): Promise<Play | undefined> => {
  try {
    return await fetchApi<Play>(`/plays/${id}`);
  } catch (e) {
    console.error("Failed to fetch play", e);
    return undefined;
  }
};

export const getAssets = async (): Promise<Asset[]> => {
  return fetchApi<Asset[]>('/assets');
};

export const getAssetById = async (id: string): Promise<Asset | undefined> => {
  // For now, we fetch all and find, or we could add a specific endpoint
  // Optimization: Add /assets/{id} endpoint later
  const assets = await getAssets();
  return assets.find(a => a.id === id);
}

export const getOpportunities = async (): Promise<Opportunity[]> => {
  return fetchApi<Opportunity[]>('/opportunities');
};

export const getOpportunityById = async (id: string): Promise<Opportunity | undefined> => {
  try {
    return await fetchApi<Opportunity>(`/opportunities/${id}`);
  } catch (e) {
    return undefined;
  }
};

// --- Mutations ---

export const createAsset = async (assetData: Partial<Asset>): Promise<Asset> => {
  return fetchApi<Asset>('/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assetData)
  });
};

export const createPlay = async (playData: Partial<Play>): Promise<Play> => {
  return fetchApi<Play>('/plays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playData)
  });
};

export const createOpportunity = async (name: string, account: string, primaryPlayId?: string, inputData?: OpportunityInput): Promise<Opportunity> => {
  // If inputData is provided, use it to construct the payload for the backend
  if (inputData) {
    return fetchApi<Opportunity>('/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });
  }

  // Fallback for legacy calls (if any) or quick create
  // We construct a minimal OpportunityInput
  const payload: OpportunityInput = {
    offering: "Unknown",
    stage: "Qualification",
    technologies: [],
    geo: "Americas",
    tags: [],
    notes: `Created via quick add: ${name}`,
    sector: "Unknown"
  };

  return fetchApi<Opportunity>('/opportunities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

// --- Admin API ---

export const addDictionaryOption = async (type: string, value: string, category?: string): Promise<any> => {
  let url = `/admin/dictionary/${type}?value=${encodeURIComponent(value)}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  return fetchApi(url, {
    method: 'POST'
  });
};

export const updateDictionaryOption = async (type: string, oldValue: string, newValue: string, category?: string): Promise<any> => {
  let url = `/admin/dictionary/${type}/${encodeURIComponent(oldValue)}?new_value=${encodeURIComponent(newValue)}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  return fetchApi(url, {
    method: 'PUT'
  });
};

export const deleteDictionaryOption = async (type: string, value: string): Promise<any> => {
  return fetchApi(`/admin/dictionary/${type}/${encodeURIComponent(value)}`, {
    method: 'DELETE'
  });
};

export const mapOfferingTechnology = async (offering: string, technology: string, action: 'add' | 'remove') => {
  const response = await fetch(`${API_BASE}/admin/dictionary/mapping/offering-technology?offering=${encodeURIComponent(offering)}&technology=${encodeURIComponent(technology)}&action=${action}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to map offering technology');
  }
  return response.json();
};

export const importDictionaryItems = async (type: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/admin/import/${type}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to import items');
  }
  return response.json();
};

// --- Logic ---

// Simple weighted matching algorithm - Client side for now, can move to backend
export const matchPlays = (input: OpportunityInput, allPlays: Play[]): Play[] => {
  const weights = {
    offering: 0.35,
    technologies: 0.25,
    stage: 0.15,
    sector: 0.10,
    geo: 0.05,
    tags: 0.10
  };

  const scoredPlays = allPlays.map(play => {
    let score = 0;

    // Offering Match (Exact)
    if (play.offering === input.offering) score += weights.offering;

    // Technologies Match (Jaccard Index)
    const techIntersection = play.technologies.filter(t => input.technologies.includes(t));
    const techUnion = new Set([...play.technologies, ...input.technologies]);
    if (techUnion.size > 0) {
      score += (techIntersection.length / techUnion.size) * weights.technologies;
    }

    // Stage Match (Included in scope)
    if (play.stage_scope?.includes(input.stage) || play.stage_scope?.includes('All')) {
      score += weights.stage;
    }

    // Sector Match (Exact or Cross-sector)
    if (play.sector === input.sector || play.sector === 'Cross-sector') {
      score += weights.sector;
    }

    // Geo Match (Exact or Global - assuming Americas is default if not specified)
    if (play.geo === input.geo) {
      score += weights.geo;
    }

    // Tags Match (Overlap count normalized somewhat, simple overlap here)
    const tagIntersection = play.tags.filter(t => input.tags.includes(t));
    if (tagIntersection.length > 0) {
      score += weights.tags * (Math.min(tagIntersection.length, 3) / 3); // Cap boost at 3 matches
    }

    return { ...play, matchScore: Math.round(score * 100) };
  });

  // Return sorted by score descending, filtering out very low matches
  return scoredPlays.filter(p => (p.matchScore || 0) > 10).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
};

// --- Mock Data Generators for Detail View (Keep as mocks for now) ---

export const getPlayComments = (playId: string): Comment[] => {
  return [
    { id: 'c1', user: 'Sarah J.', avatar: 'SJ', text: 'Used this for the ACME Corp deal, worked great but the pricing slide needs updating.', date: '2 days ago' },
    { id: 'c2', user: 'Mike T.', avatar: 'MT', text: 'Does this cover the new v2.0 features?', date: '1 week ago' },
  ];
};

export const getPlayHistory = (playId: string): HistoryItem[] => {
  return [
    { id: 'h1', user: 'Alice', action: 'Updated Asset', date: '2023-10-15', details: 'Updated Architecture Diagram v1.2' },
    { id: 'h2', user: 'Bob', action: 'Viewed', date: '2023-10-14' },
    { id: 'h3', user: 'System', action: 'Created', date: '2023-09-01' },
  ];
};

export const getRelatedPlays = (playId: string): Play[] => {
  return []; // Needs context of all plays
};

export const getPlayAssets = (playId: string): Asset[] => {
  return []; // Needs fetch
};

export const getPlayCollections = (playId: string): AssetCollection[] => {
  return [
    { id: 'col1', name: 'Discovery Kit', asset_ids: ['asset-101'] },
    { id: 'col2', name: 'Technical Deep Dive', asset_ids: ['asset-102'] },
  ];
};

export const getAssetComments = (assetId: string): Comment[] => {
  return [
    { id: 'ac1', user: 'David K.', avatar: 'DK', text: 'This file is corrupted in the slide 3 master.', date: '1 day ago' }
  ];
};

export const getAssetHistory = (assetId: string): HistoryItem[] => {
  return [
    { id: 'ah1', user: 'Alice', action: 'Uploaded new version', date: '2023-10-10', details: 'v2.0 with new branding' },
    { id: 'ah2', user: 'System', action: 'Created', date: '2023-01-10' }
  ];
};

export const getRelatedAssets = (assetId: string): Asset[] => {
  return [];
};

export const getAssetLinkedPlays = (assetId: string): Play[] => {
  return [];
};

// --- Governance / Admin Mocks ---

export const getStaleAssets = async (): Promise<Asset[]> => {
  // Mock data for now
  return [
    {
      id: 'stale-1',
      title: 'Q1 Sales Deck 2023',
      kind: 'deck',
      offering: 'Cloud',
      technologies: ['Kubernetes'],
      stage_scope: ['Discovery'],
      sector: 'Tech',
      geo: 'Americas',
      tags: ['legacy'],
      uri: 'mock://stale-1',
      description: 'Old sales deck',
      owners: ['Alice'],
      last_verified: '2023-01-15',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    } as any
  ];
};

export const verifyAsset = async (id: string): Promise<void> => {
  console.log(`Verified asset ${id}`);
  return Promise.resolve();
};