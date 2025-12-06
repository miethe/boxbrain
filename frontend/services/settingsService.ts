
interface SettingItem {
    key: string;
    value: string;
    description?: string;
}

const API_BASE_URL = '/api'; // Vite proxy handles this

export const getSettings = async (): Promise<SettingItem[]> => {
    const response = await fetch(`${API_BASE_URL}/settings/`);
    if (!response.ok) {
        throw new Error('Failed to fetch settings');
    }
    return response.json();
};

export const updateSettings = async (settings: Record<string, string>): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE_URL}/settings/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
    });
    if (!response.ok) {
        throw new Error('Failed to update settings');
    }
    return response.json();
};

export const verifyS3 = async (config: { bucket: string; region: string; access_key: string; secret_key: string }) => {
    const response = await fetch(`${API_BASE_URL}/settings/verify-s3`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Verification failed');
    }
    return response.json();
};
