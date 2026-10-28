import { SetType } from "@/types/workout";

export const SET_TYPE_Order: SetType[] = ['NORMAL', 'WARMUP', 'DROPSET', 'FAILURE'];

export const MUSCLE_GROUPS = [
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'QUADRICEPS',
    'HAMSTRINGS',
    'GLUTES',
    'CALVES',
    'ABS',
    'FOREARMS',
    'FULL_BODY',
];

export const EQUIPMENT_TYPES = [
    'BARBELL',
    'DUMBBELL',
    'MACHINE',
    'CABLE',
    'BODYWEIGHT',
    'KETTLEBELL',
    'BAND',
    'OTHER',
];

export interface PlateSpec {
    weight: number;
    color: string;
}

export const STANDARD_PLATES: PlateSpec[] = [
    { weight: 25, color: 'bg-red-600 text-white h-24' },
    { weight: 20, color: 'bg-blue-600 text-white h-24' },
    { weight: 15, color: 'bg-amber-400 text-slate-950 h-20' },
    { weight: 10, color: 'bg-emerald-500 text-slate-950 h-16' },
    { weight: 5, color: 'bg-slate-100 text-slate-950 h-14' },
    { weight: 2.5, color: 'bg-slate-700 text-white h-12' },
    { weight: 1.25, color: 'bg-slate-500 text-white h-10' },
];

export const REP_MAX_PERCENTAGES = [
    { pct: 100, estReps: '1 RM' },
    { pct: 95, estReps: '2 RM' },
    { pct: 90, estReps: '4 RM' },
    { pct: 85, estReps: '6 RM' },
    { pct: 80, estReps: '8 RM' },
    { pct: 75, estReps: '10 RM' },
    { pct: 70, estReps: '12 RM' },
    { pct: 65, estReps: '15 RM' },
];