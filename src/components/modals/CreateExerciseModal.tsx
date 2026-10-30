'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/constants/gym';
import { DbExercise } from '@/types/workout';

interface CreateExerciseModalProps {
    isOpen: boolean;
    authHeaders: (extra?: Record<string, string>) => Record<string, string>;
    onClose: () => void;
    onCreated: (exercise: DbExercise) => void;
}

export default function CreateExerciseModal({
                                                isOpen,
                                                authHeaders,
                                                onClose,
                                                onCreated,
                                            }: CreateExerciseModalProps) {
    const [name, setName] = useState('');
    const [primaryMuscle, setPrimaryMuscle] = useState<string>(MUSCLE_GROUPS[0]);
    const [equipment, setEquipment] = useState<string>(EQUIPMENT_TYPES[0]);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim() || saving) return;
        setSaving(true);
        try {
            const res = await fetch('/api/exercises', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    name: name.trim(),
                    primaryMuscle,
                    equipment,
                }),
            });
            if (res.ok) {
                const created: DbExercise = await res.json();
                setName('');
                onClose();
                onCreated(created);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Create Custom Exercise</h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Exercise Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Pendulum Squat"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Primary Muscle Group</label>
                        <select
                            value={primaryMuscle}
                            onChange={(e) => setPrimaryMuscle(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {MUSCLE_GROUPS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Equipment</label>
                        <select
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {EQUIPMENT_TYPES.map((eq) => (
                                <option key={eq} value={eq}>
                                    {eq}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm"
                >
                    {saving ? 'Saving...' : 'Save Exercise'}
                </button>
            </div>
        </div>
    );
}
