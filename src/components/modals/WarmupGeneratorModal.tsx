'use client';

import React, { useState, useEffect } from 'react';
import { Flame, X } from 'lucide-react';
import { roundToNearest2Point5 } from '@/utils/calculations';

interface WarmupGeneratorModalProps {
    exerciseId: string | null;
    initialWeight: string;
    onClose: () => void;
    onGenerate: (exerciseId: string, workingWeight: number) => void;
}

export default function WarmupGeneratorModal({
                                                 exerciseId,
                                                 initialWeight,
                                                 onClose,
                                                 onGenerate,
                                             }: WarmupGeneratorModalProps) {
    const [targetWeight, setTargetWeight] = useState(initialWeight);

    useEffect(() => {
        setTargetWeight(initialWeight);
    }, [initialWeight, exerciseId]);

    if (!exerciseId) return null;

    const parsedWeight = parseFloat(targetWeight) || 0;

    const handleConfirm = () => {
        if (parsedWeight <= 0) return;
        onGenerate(exerciseId, parsedWeight);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-400" />
                        Warm-up Set Generator
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-slate-400">
                    Enter your first working set weight. We&apos;ll automatically insert progressive warm-up
                    sets (Empty Bar, 50%, 70%, 85%) rounded to the nearest 2.5 kg.
                </p>

                <div>
                    <label className="text-xs text-slate-400 font-semibold">Working Weight (kg)</label>
                    <input
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                    <p className="font-semibold text-amber-400 mb-1">Preview Warm-up Pyramid:</p>
                    <div className="flex justify-between text-slate-300">
                        <span>Warm-up 1 (Bar)</span>
                        <span className="font-bold">20 kg × 10</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                        <span>Warm-up 2 (50%)</span>
                        <span className="font-bold">{roundToNearest2Point5(parsedWeight * 0.5)} kg × 8</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                        <span>Warm-up 3 (70%)</span>
                        <span className="font-bold">{roundToNearest2Point5(parsedWeight * 0.7)} kg × 5</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                        <span>Warm-up 4 (85%)</span>
                        <span className="font-bold">{roundToNearest2Point5(parsedWeight * 0.85)} kg × 2</span>
                    </div>
                </div>

                <button
                    onClick={handleConfirm}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition"
                >
                    Insert Warm-up Sets
                </button>
            </div>
        </div>
    );
}