'use client';

import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { DraftRoutineExercise } from '@/types/workout';

interface RoutineBuilderModalProps {
    isOpen: boolean;
    draftExercises: DraftRoutineExercise[];
    setDraftExercises: React.Dispatch<React.SetStateAction<DraftRoutineExercise[]>>;
    authHeaders: (extra?: Record<string, string>) => Record<string, string>;
    onClose: () => void;
    onOpenExercisePicker: () => void;
    onRoutineSaved: () => void;
}

export default function RoutineBuilderModal({
                                                isOpen,
                                                draftExercises,
                                                setDraftExercises,
                                                authHeaders,
                                                onClose,
                                                onOpenExercisePicker,
                                                onRoutineSaved,
                                            }: RoutineBuilderModalProps) {
    const [routineName, setRoutineName] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!routineName.trim() || draftExercises.length === 0) {
            alert('Give your routine a name and add at least one exercise.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/routines', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    name: routineName.trim(),
                    exercises: draftExercises,
                }),
            });
            if (res.ok) {
                setRoutineName('');
                setDraftExercises([]);
                onClose();
                onRoutineSaved();
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Create Routine Template</h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Routine Name (e.g., Push Day, Upper Body)..."
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                    {draftExercises.map((dex, exIdx) => (
                        <div key={dex.id} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-sm text-blue-400">{dex.name}</span>
                                <button
                                    onClick={() =>
                                        setDraftExercises((prev) => prev.filter((item) => item.id !== dex.id))
                                    }
                                    className="text-slate-400 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            {dex.sets.map((st, sIdx) => (
                                <div key={sIdx} className="grid grid-cols-7 gap-2 items-center text-xs">
                                    <span className="col-span-1 text-slate-400 font-bold">#{sIdx + 1}</span>
                                    <input
                                        type="number"
                                        placeholder="Target kg"
                                        value={st.weight}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setDraftExercises((prev) =>
                                                prev.map((item, i) =>
                                                    i === exIdx
                                                        ? {
                                                            ...item,
                                                            sets: item.sets.map((s, si) =>
                                                                si === sIdx ? { ...s, weight: val } : s
                                                            ),
                                                        }
                                                        : item
                                                )
                                            );
                                        }}
                                        className="col-span-3 bg-slate-900 rounded-lg px-2 py-1.5 text-center"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Target reps"
                                        value={st.reps}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setDraftExercises((prev) =>
                                                prev.map((item, i) =>
                                                    i === exIdx
                                                        ? {
                                                            ...item,
                                                            sets: item.sets.map((s, si) =>
                                                                si === sIdx ? { ...s, reps: val } : s
                                                            ),
                                                        }
                                                        : item
                                                )
                                            );
                                        }}
                                        className="col-span-3 bg-slate-900 rounded-lg px-2 py-1.5 text-center"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() =>
                                    setDraftExercises((prev) =>
                                        prev.map((item, i) =>
                                            i === exIdx
                                                ? { ...item, sets: [...item.sets, { weight: '', reps: '10' }] }
                                                : item
                                        )
                                    )
                                }
                                className="w-full bg-slate-800 hover:bg-slate-700 text-xs py-1.5 rounded-lg text-slate-300 font-semibold"
                            >
                                + Add Target Set
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={onOpenExercisePicker}
                        className="w-full border border-dashed border-slate-700 hover:border-blue-500 text-slate-300 py-2.5 rounded-xl text-sm font-semibold"
                    >
                        + Add Exercise to Routine
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm"
                >
                    {saving ? 'Saving...' : 'Save Routine'}
                </button>
            </div>
        </div>
    );
}
