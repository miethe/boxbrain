import React, { useState, useEffect } from 'react';
import { StageNote } from '../types';
import { getNotes, createNote, deleteNote, updateNote } from '../services/dataService';
import { Lock, Globe, Trash2, Edit2, Send, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StageNoteStreamProps {
    stageInstanceId: string;
    users: { id: string; name: string; avatar: string }[];
    currentUser?: { id: string; name: string; avatar: string }; // In real app, from auth context
}

export const StageNoteStream: React.FC<StageNoteStreamProps> = ({ stageInstanceId, users, currentUser }) => {
    const [notes, setNotes] = useState<StageNote[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Mock current user if not provided (for dev)
    const effectiveUser = currentUser || { id: 'u1', name: 'John Doe', avatar: 'JD' };

    useEffect(() => {
        if (stageInstanceId) {
            loadNotes();
        }
    }, [stageInstanceId]);

    const loadNotes = async () => {
        try {
            const fetched = await getNotes(stageInstanceId);
            setNotes(fetched);
        } catch (e) {
            console.error("Failed to load notes", e);
        }
    };

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) return;
        try {
            const note = await createNote({
                stage_instance_id: stageInstanceId,
                content: newNoteContent,
                is_private: isPrivate,
                author_id: effectiveUser.id
            });
            setNotes([note, ...notes]);
            setNewNoteContent('');
        } catch (e) {
            console.error("Failed to create note", e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteNote(id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (e) {
            console.error("Failed to delete note", e);
        }
    };

    const startEdit = (note: StageNote) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
        setIsPrivate(note.is_private);
    };

    const handleUpdate = async () => {
        if (!editingNoteId) return;
        try {
            const updated = await updateNote(editingNoteId, {
                content: editContent,
                is_private: isPrivate, // Using current state for simplicity
            });
            setNotes(notes.map(n => n.id === editingNoteId ? updated : n));
            setEditingNoteId(null);
            setEditContent('');
        } catch (e) {
            console.error("Failed to update note", e);
        }
    };

    const getUser = (id?: string) => users.find(u => u.id === id) || { name: 'Unknown', avatar: '?' };

    return (
        <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            {/* Input Area */}
            <div className="p-3 bg-white border-b border-slate-200">
                <textarea
                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none min-h-[80px]"
                    placeholder="Add a note..."
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                />
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPrivate(!isPrivate)}
                            className={`text-xs flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${isPrivate ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title={isPrivate ? "Private Note" : "Public Note"}
                        >
                            {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                            {isPrivate ? 'Private' : 'Public'}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {newNoteContent.trim() && (
                            <button
                                onClick={() => setNewNoteContent('')}
                                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleAddNote}
                            disabled={!newNoteContent.trim()}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-xs font-medium flex items-center gap-1"
                        >
                            <Send size={12} /> Save Note
                        </button>
                    </div>
                </div>
            </div>

            {/* Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notes.length === 0 && (
                    <div className="text-center text-slate-400 text-sm italic py-4">No notes yet.</div>
                )}
                {notes.map(note => {
                    const author = getUser(note.author_id);
                    const isEditing = editingNoteId === note.id;

                    if (isEditing) {
                        return (
                            <div key={note.id} className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                                <textarea
                                    className="w-full text-sm p-2 border border-slate-200 rounded mb-2"
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingNoteId(null)} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>
                                    <button onClick={handleUpdate} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={note.id} className={`group flex gap-3 ${note.is_private ? 'opacity-90' : ''}`}>
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600" title={author.name}>
                                {author.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{author.name}</span>
                                        <span className="text-xs text-slate-400">{note.created_at ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true }) : 'Just now'}</span>
                                        {note.is_private && <Lock size={10} className="text-amber-500" />}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        <button onClick={() => startEdit(note)} className="p-1 text-slate-400 hover:text-indigo-600 rounded"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(note.id)} className="p-1 text-slate-400 hover:text-red-600 rounded"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                                <div className={`text-sm text-slate-700 mt-1 whitespace-pre-wrap ${note.is_private ? 'bg-amber-50 p-2 rounded border border-amber-100' : ''}`}>
                                    {note.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
