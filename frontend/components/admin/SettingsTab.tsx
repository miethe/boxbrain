import React from 'react';
import { Settings, GitBranch, Cloud, Shield } from 'lucide-react';
import { Button, Input } from '../Common';

export const SettingsTab: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                    <Settings className="w-6 h-6 mr-3 text-slate-600" />
                    System Settings
                </h1>
                <p className="text-slate-500 mt-1">Configure git connection, storage, and access control.</p>
            </div>

            <div className="space-y-8">

                {/* Git Config */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mr-3">
                            <GitBranch className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Git Repository</h2>
                            <p className="text-xs text-slate-500">Connection details for the system of record.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Repository URL" defaultValue="git@github.com:acme-corp/knowledge-base.git" />
                        <Input label="Branch" defaultValue="main" />
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Service Account SSH Key</label>
                            <textarea className="w-full border border-slate-300 rounded-md p-2 text-xs font-mono h-24 bg-slate-50" placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
                        </div>
                    </div>
                </section>

                {/* Storage Config */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                            <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Artifact Storage</h2>
                            <p className="text-xs text-slate-500">Where large files (PDFs, Videos) are stored.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 flex gap-4 mb-2">
                            <label className="flex items-center p-3 border border-blue-500 bg-blue-50 rounded-lg cursor-pointer">
                                <input type="radio" name="storage" defaultChecked className="mr-2" />
                                <span className="text-sm font-bold text-blue-700">S3 / MinIO</span>
                            </label>
                            <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                <input type="radio" name="storage" className="mr-2" />
                                <span className="text-sm font-bold text-slate-700">Git LFS</span>
                            </label>
                        </div>
                        <Input label="S3 Bucket" defaultValue="kb-artifacts-prod" />
                        <Input label="Region" defaultValue="us-east-1" />
                    </div>
                </section>

                {/* API Keys */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg mr-3">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">API Access</h2>
                            <p className="text-xs text-slate-500">Manage keys for external integrations (Slack, CI/CD).</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div>
                                <div className="text-sm font-bold text-slate-800">Slack Bot Integration</div>
                                <div className="text-xs text-slate-500">Last used: 2 hours ago</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border">sk_live_...9s8d</code>
                                <Button variant="outline" className="text-xs py-1 h-auto">Revoke</Button>
                            </div>
                        </div>
                        <Button variant="secondary" className="w-full mt-2 border-dashed">
                            Generate New Key
                        </Button>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <Button variant="primary" className="px-8">Save Configuration</Button>
                </div>

            </div>
        </div>
    );
};
