'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DbExercise } from '@/types/workout';

interface ExercisePickerModalProps {
    isOpen: boolean;
    exercises: DbExercise[];
    onClose: () => void;
    onSelectExercise: (exercise: DbExercise) => void;
    onOpenCreateCustom: () => void;
}

export default function ExercisePickerModal({
                                                isOpen,
                                                exercises,
                                                onClose,
                                                onSelectExercise,
                                                onOpenCreateCustom,
                                            }: ExercisePickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredExercises = exercises.filter(
        (ex) =>
            ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-4 space-y-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Select Exercise ({filteredExercises.length})</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenCreateCustom}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                            + Create Custom
                        </button>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Search 50+ exercises or muscles (e.g. Squat, Back, Cable)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                    {filteredExercises.map((ex) => (
                        <button
                            key={ex.id}
                            onClick={() => {
                                setSearchQuery('');
                                onSelectExercise(ex);
                            }}
                            className="w-full text-left bg-slate-800/60 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between transition"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm text-white">{ex.name}</p>
                                    {ex.isCustom && (
                                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                          Custom
                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400">
                                    {ex.primaryMuscle} • {ex.equipment}
                                </p>
                            </div>
                            <Plus className="w-4 h-4 text-blue-400" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
