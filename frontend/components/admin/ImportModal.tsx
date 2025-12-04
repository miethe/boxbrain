import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { importDictionaryItems } from '../../services/dataService';
import { cn } from '../../lib/utils';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, type: initialType, onSuccess }) => {
    const [type, setType] = useState(initialType);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ added: number; total: number; errors: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset type when modal opens with a new initialType
    React.useEffect(() => {
        if (isOpen) {
            setType(initialType);
            setFile(null);
            setResult(null);
            setError(null);
        }
    }, [isOpen, initialType]);

    if (!isOpen) return null;

    const importTypes = [
        { id: 'offerings', label: 'Offerings' },
        { id: 'technologies', label: 'Technologies' },
        { id: 'stages', label: 'Stages' },
        { id: 'sectors', label: 'Sectors' },
        { id: 'geos', label: 'Geos' },
        { id: 'tags', label: 'Tags' },
    ];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validExtensions = ['.json', '.yaml', '.yml', '.csv'];
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validExtensions.includes(extension)) {
            setError('Invalid file type. Please upload JSON, YAML, or CSV.');
            return;
        }

        setFile(file);
        setError(null);
        setResult(null);
    };

    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const response = await importDictionaryItems(type, file);
            setResult({
                added: response.added,
                total: response.total_processed,
                errors: response.errors
            });
            if (response.added > 0) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to import file');
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        let content = '';
        let filename = `template_${type}`;
        let mimeType = 'text/plain';

        // Default to CSV for simplicity in templates, but maybe offer JSON?
        // Let's do CSV as it's easiest for non-technical users
        if (type === 'technologies') {
            content = 'value,category\nExample Tech,Example Category';
            filename += '.csv';
            mimeType = 'text/csv';
        } else {
            content = 'value\nExample Item';
            filename += '.csv';
            mimeType = 'text/csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">Import Data</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!result ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Import Type</label>
                                <select
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    {importTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                    isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400",
                                    file ? "bg-slate-50" : ""
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".json,.yaml,.yml,.csv"
                                    onChange={handleFileSelect}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center gap-2 text-slate-700">
                                        <FileText size={32} className="text-indigo-600" />
                                        <span className="font-medium">{file.name}</span>
                                        <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Upload size={32} className="text-slate-400" />
                                        <p className="font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs">JSON, YAML, or CSV</p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-slate-500 gap-2">
                                    <Download size={14} /> Template
                                </Button>
                                <Button onClick={handleImport} disabled={!file || isUploading}>
                                    {isUploading ? 'Importing...' : 'Import'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                    <Check size={24} />
                                </div>
                                <h4 className="text-lg font-medium text-slate-900">Import Complete</h4>
                                <p className="text-slate-500">
                                    Successfully added <span className="font-bold text-slate-900">{result.added}</span> items to {importTypes.find(t => t.id === type)?.label}.
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Processed {result.total} items total.
                                </p>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-100 rounded-md p-3 max-h-32 overflow-y-auto">
                                    <p className="text-xs font-bold text-amber-800 mb-1">Errors ({result.errors.length})</p>
                                    <ul className="text-xs text-amber-700 space-y-1">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Button className="w-full" onClick={onClose}>Done</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
