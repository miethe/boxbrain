import React, { useState, useEffect } from 'react';
import { Person } from '../../types';
import { getPeople, createPerson, updatePerson, deletePerson } from '../../services/dataService';
import { Button } from '../ui/button';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { MultiSelect } from '../Common';

interface PeopleTabProps {
    availableTechnologies: string[];
}

export const PeopleTab: React.FC<PeopleTabProps> = ({ availableTechnologies }) => {
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);

    // Create State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('');
    const [newTechnologies, setNewTechnologies] = useState<string[]>([]);

    // Edit State
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editTechnologies, setEditTechnologies] = useState<string[]>([]);

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const data = await getPeople();
            setPeople(data);
        } catch (error) {
            console.error("Failed to fetch people", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeople();
    }, []);

    const handleAdd = async () => {
        if (!newName || !newEmail) {
            alert("Name and Email are required");
            return;
        }
        try {
            await createPerson({
                name: newName,
                email: newEmail,
                role: newRole,
                technologies: newTechnologies
            });
            setNewName('');
            setNewEmail('');
            setNewRole('');
            setNewTechnologies([]);
            fetchPeople();
        } catch (error: any) {
            alert(error.message || "Failed to add person");
        }
    };

    const handleUpdate = async () => {
        if (!editingPerson) return;
        try {
            await updatePerson(editingPerson.id, {
                name: editName,
                email: editEmail,
                role: editRole,
                technologies: editTechnologies
            });
            setEditingPerson(null);
            fetchPeople();
        } catch (error: any) {
            alert(error.message || "Failed to update person");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this person?")) return;
        try {
            await deletePerson(id);
            fetchPeople();
        } catch (error) {
            console.error(error);
            alert("Failed to delete person");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-medium text-slate-900">Add New Team Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Name"
                        className="border border-slate-300 rounded-md p-2 text-sm"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className="border border-slate-300 rounded-md p-2 text-sm"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Role (e.g. Sales Lead)"
                        className="border border-slate-300 rounded-md p-2 text-sm"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                    />
                    <div className="min-w-[200px]">
                        <MultiSelect
                            options={availableTechnologies}
                            value={newTechnologies}
                            onChange={(val) => setNewTechnologies(Array.isArray(val) ? val : [val])}
                            multiple
                            placeholder="Technologies..."
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleAdd} disabled={!newName || !newEmail}>
                        <Plus size={16} className="mr-2" /> Add Member
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {people.map(person => (
                    <div key={person.id} className="p-4 hover:bg-slate-50 transition-colors">
                        {editingPerson?.id === person.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                                <input
                                    type="text"
                                    className="border border-slate-300 rounded-md p-2 text-sm"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                <input
                                    type="email"
                                    className="border border-slate-300 rounded-md p-2 text-sm"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="border border-slate-300 rounded-md p-2 text-sm"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                />
                                <div className="min-w-[200px] flex gap-2">
                                    <div className="flex-1">
                                        <MultiSelect
                                            options={availableTechnologies}
                                            value={editTechnologies}
                                            onChange={(val) => setEditTechnologies(Array.isArray(val) ? val : [val])}
                                            multiple
                                            placeholder="Technologies..."
                                        />
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-green-600" onClick={handleUpdate}><Save size={16} /></Button>
                                    <Button size="icon" variant="ghost" className="text-slate-400" onClick={() => setEditingPerson(null)}><X size={16} /></Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                            {person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{person.name}</div>
                                            <div className="text-xs text-slate-500">{person.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        {person.role || <span className="text-slate-400 italic">No role</span>}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex flex-wrap gap-1">
                                            {person.technologies.map(t => (
                                                <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                                    {t}
                                                </span>
                                            ))}
                                            {person.technologies.length === 0 && <span className="text-xs text-slate-400 italic">No linked technologies</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-indigo-600"
                                        onClick={() => {
                                            setEditingPerson(person);
                                            setEditName(person.name);
                                            setEditEmail(person.email);
                                            setEditRole(person.role || '');
                                            setEditTechnologies(person.technologies);
                                        }}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-600"
                                        onClick={() => handleDelete(person.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {people.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500 italic">
                        No team members found. Add one above.
                    </div>
                )}
            </div>
        </div>
    );
};
