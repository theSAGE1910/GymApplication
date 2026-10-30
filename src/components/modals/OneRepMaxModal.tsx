'use client';

import React, { useState } from 'react';
import { Zap, X } from "lucide-react";
import { REP_MAX_PERCENTAGES} from "@/constants/gym";
import { calculateEstimated1Rm} from "@/utils/calculations";

interface OneRepMaxModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OneRepMaxModal({ isOpen, onClose }: OneRepMaxModalProps) {
    const [calcWeight, setCalcWeight] = useState('80');
    const [calcReps, setCalcReps] = useState('5');

    if (!isOpen) return null;

    const parsedWeight = parseFloat(calcWeight) || 0;
    const parsedReps = parseInt(calcReps, 10) || 0;
    const calculated1Rm = calculateEstimated1Rm(parsedWeight, parsedReps);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        1RM & Rep-Max Calculator
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Weight Lifted (kg)</label>
                        <input
                            type="number"
                            value={calcWeight}
                            onChange={(e) => setCalcWeight(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Reps Performed</label>
                        <input
                            type="number"
                            value={calcReps}
                            onChange={(e) => setCalcReps(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600/20 to-amber-500/20 border border-amber-500/40 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                        Estimated One-Rep Max (1RM)
                    </p>
                    <p className="text-3xl font-extrabold text-amber-400 mt-1">{calculated1Rm} kg</p>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 text-[11px] font-bold text-slate-400 px-3 pb-1 border-b border-slate-800">
                        <span>% OF 1RM</span>
                        <span className="text-center">EST. REPS</span>
                        <span className="text-right">TARGET WEIGHT</span>
                    </div>
                    {REP_MAX_PERCENTAGES.map((row) => {
                        const targetWt =
                            calculated1Rm > 0 ? Number(((calculated1Rm * row.pct) / 100).toFixed(1)) : 0;
                        return (
                            <div
                                key={row.pct}
                                className="grid grid-cols-3 items-center text-xs bg-slate-950/60 px-3 py-2 rounded-lg"
                            >
                                <span className="font-bold text-blue-400">{row.pct}%</span>
                                <span className="text-center text-slate-300">{row.estReps}</span>
                                <span className="text-right font-bold text-white">{targetWt} kg</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}