import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Download, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FilePreviewProps {
    url: string;
    mimeType?: string;
    filename: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ url, mimeType, filename }) => {
    const [content, setContent] = useState<React.ReactNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            setError(null);

            try {
                if (mimeType?.startsWith('image/')) {
                    setContent(<img src={url} alt={filename} className="max-w-full h-auto rounded shadow" />);
                } else if (mimeType === 'application/pdf') {
                    // PDF handled by react-pdf component in render
                    setContent(null);
                } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setContent(
                        <div
                            className="prose max-w-none bg-white p-4 rounded shadow overflow-auto max-h-[600px]"
                            dangerouslySetInnerHTML={{ __html: result.value }}
                        />
                    );
                } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const html = XLSX.utils.sheet_to_html(worksheet);
                    setContent(
                        <div
                            className="prose max-w-none bg-white p-4 rounded shadow overflow-auto max-h-[600px]"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                } else {
                    setContent(
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded border border-gray-200">
                            <FileText className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-gray-500 mb-4">Preview not available for this file type.</p>
                            <a
                                href={url}
                                download={filename}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </a>
                        </div>
                    );
                }
            } catch (err) {
                console.error("Error loading preview:", err);
                setError("Failed to load preview.");
            } finally {
                setLoading(false);
            }
        };

        if (url) {
            loadContent();
        }
    }, [url, mimeType, filename]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>;
    }

    if (mimeType === 'application/pdf') {
        return (
            <div className="flex flex-col items-center bg-gray-100 p-4 rounded">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="shadow-lg"
                >
                    <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} width={600} />
                </Document>
                {numPages && (
                    <div className="flex items-center gap-4 mt-4">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(p => p - 1)}
                            className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <p>
                            Page {pageNumber} of {numPages}
                        </p>
                        <button
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(p => p + 1)}
                            className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return <div className="w-full">{content}</div>;
};

export default FilePreview;
