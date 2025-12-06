
import React, { useState, useEffect } from 'react';
import { Save, Server, Shield, Cloud, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { Button, Input } from '../Common';
import { getSettings, updateSettings, verifyS3 } from '../../services/settingsService';

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (val: boolean) => void; label?: string }> = ({ enabled, onChange, label }) => (
    <div className="flex items-center cursor-pointer" onClick={() => onChange(!enabled)}>
        <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all ${enabled ? 'translate-x-full border-white' : ''}`}></div>
        </div>
        {label && <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
    </div>
);

export const SettingsTab: React.FC = () => {
    const [s3Enabled, setS3Enabled] = useState(false);
    const [s3Config, setS3Config] = useState({
        bucket: '',
        region: 'us-east-1',
        accessKey: '',
        secretKey: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getSettings();
                const provider = settings.find(s => s.key === 'storage_provider')?.value;
                if (provider === 's3') setS3Enabled(true);

                setS3Config({
                    bucket: settings.find(s => s.key === 'storage_s3_bucket')?.value || '',
                    region: settings.find(s => s.key === 'storage_s3_region')?.value || 'us-east-1',
                    accessKey: settings.find(s => s.key === 'storage_s3_access_key')?.value || '',
                    secretKey: settings.find(s => s.key === 'storage_s3_secret_key')?.value || ''
                });
            } catch (e) {
                console.error("Failed to load settings", e);
                setMessage({ type: 'error', text: "Failed to load current settings." });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleVerifyConnection = async () => {
        setIsVerifying(true);
        setMessage(null);
        try {
            await verifyS3({
                bucket: s3Config.bucket,
                region: s3Config.region,
                access_key: s3Config.accessKey,
                secret_key: s3Config.secretKey
            });
            setMessage({ type: 'success', text: "Connection successful! S3 credentials are valid." });
        } catch (e: any) {
            console.error("Verification failed", e);
            setMessage({ type: 'error', text: `Connection failed: ${e.message}` });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        // Optional: Verify on save if S3 is enabled
        if (s3Enabled) {
            try {
                await verifyS3({
                    bucket: s3Config.bucket,
                    region: s3Config.region,
                    access_key: s3Config.accessKey,
                    secret_key: s3Config.secretKey
                });
            } catch (e: any) {
                setMessage({ type: 'error', text: `Cannot save invalid S3 config: ${e.message}` });
                setIsSaving(false);
                return;
            }
        }

        try {
            const settingsToUpdate = {
                'storage_provider': s3Enabled ? 's3' : 'local',
                'storage_s3_bucket': s3Config.bucket,
                'storage_s3_region': s3Config.region,
                'storage_s3_access_key': s3Config.accessKey,
                'storage_s3_secret_key': s3Config.secretKey
            };

            await updateSettings(settingsToUpdate);
            setMessage({ type: 'success', text: "Configuration saved successfully." });
        } catch (e) {
            console.error("Failed to save settings", e);
            setMessage({ type: 'error', text: "Failed to save settings. Check server logs." });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            {message && (
                <div className={`p-4 rounded-md flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                        message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                    {message.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                    {message.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <div className="text-sm font-medium pt-0.5">{message.text}</div>
                    <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-70 hover:opacity-100">×</button>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Storage Configuration</h3>
                        <p className="text-sm text-slate-500">Configure where your digital assets are stored.</p>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                            <div className="font-medium text-slate-900">Enable S3 Storage</div>
                            <p className="text-xs text-slate-500 mt-1">Use AWS S3 or compatible object storage instead of local disk.</p>
                        </div>
                        <ToggleSwitch enabled={s3Enabled} onChange={setS3Enabled} />
                    </div>

                    {/* S3 Configuration Form */}
                    {s3Enabled && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <Server size={16} className="text-slate-400" />
                                <h4 className="font-semibold text-slate-900 text-sm">S3 Connection Details</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Input
                                    label="Bucket Name"
                                    placeholder="e.g. my-app-assets"
                                    value={s3Config.bucket}
                                    onChange={(e) => setS3Config({ ...s3Config, bucket: e.target.value })}
                                />
                                <Input
                                    label="Region"
                                    placeholder="e.g. us-east-1"
                                    value={s3Config.region}
                                    onChange={(e) => setS3Config({ ...s3Config, region: e.target.value })}
                                />
                                <Input
                                    label="Access Key ID"
                                    placeholder="AKIA..."
                                    className="font-mono"
                                    value={s3Config.accessKey}
                                    onChange={(e) => setS3Config({ ...s3Config, accessKey: e.target.value })}
                                />
                                <Input
                                    label="Secret Access Key"
                                    type="password"
                                    placeholder="wJalr..."
                                    className="font-mono"
                                    value={s3Config.secretKey}
                                    onChange={(e) => setS3Config({ ...s3Config, secretKey: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleVerifyConnection}
                                    disabled={isVerifying || !s3Config.bucket || !s3Config.accessKey}
                                    className="flex items-center gap-2 text-xs h-9"
                                >
                                    {isVerifying ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-500 border-t-transparent" /> : <Wifi size={14} />}
                                    Test Connection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6"
                    >
                        <Save size={18} />
                        {isSaving ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </div>

            {/* API Keys (Existing) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm opacity-60 pointer-events-none">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">API Access</h3>
                        <p className="text-sm text-slate-500">Manage keys for external integrations.</p>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 italic">This section is currently read-only.</p>
                </div>
            </div>
        </div>
    );
};
