'use client';

import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { calculatePlatesPerSide } from '@/utils/calculations';

interface PlateCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlateCalculatorModal({ isOpen, onClose }: PlateCalculatorModalProps) {
    const [plateCalcWeight, setPlateCalcWeight] = useState('100');
    const [barWeight, setBarWeight] = useState(20);

    if (!isOpen) return null;

    const platesNeeded = calculatePlatesPerSide(parseFloat(plateCalcWeight) || 0, barWeight);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-400" />
                        Barbell Plate Calculator
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Total Weight (kg)</label>
                        <input
                            type="number"
                            value={plateCalcWeight}
                            onChange={(e) => setPlateCalcWeight(e.target.value)}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-semibold">Barbell Weight</label>
                        <select
                            value={barWeight}
                            onChange={(e) => setBarWeight(Number(e.target.value))}
                            className="w-full mt-1 bg-slate-800 rounded-xl px-3.5 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={20}>20 kg (Olympic)</option>
                            <option value={15}>15 kg (Women&apos;s)</option>
                            <option value={10}>10 kg (EZ Curl)</option>
                        </select>
                    </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-slate-400 text-center font-semibold">
                        Load on <span className="text-blue-400 underline">EACH SIDE</span> of the bar:
                    </p>

                    <div className="flex items-center justify-center min-h-[110px] gap-1 py-2">
                        <div className="w-10 h-3 bg-slate-500 rounded-l" />
                        <div className="w-3 h-10 bg-slate-400 rounded-sm" />

                        {platesNeeded.length === 0 ? (
                            <span className="text-xs text-slate-500 pl-3">Just the empty bar!</span>
                        ) : (
                            platesNeeded.map((p, idx) => (
                                <div
                                    key={idx}
                                    className={`${p.color} px-2 rounded flex items-center justify-center font-bold text-xs shadow-md`}
                                >
                                    {p.weight}
                                </div>
                            ))
                        )}
                    </div>

                    {platesNeeded.length > 0 && (
                        <div className="text-center text-xs text-slate-300 font-semibold pt-1 border-t border-slate-800">
                            Per side: {platesNeeded.map((p) => `${p.weight}kg`).join(' + ')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}