export type SetType = 'WARMUP' | 'NORMAL' | 'DROPSET' | 'FAILURE';

export interface DbExercise {
    id: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    category?: string;
    isCustom?: boolean;
}

// --- Active Workout Store Types ---
export interface ActiveSet {
    id: string;
    setNumber: number;
    setType: SetType;
    weight: string;
    reps: string;
    rpe: string;
    previousText?: string;
    isCompleted: boolean;
}

export interface ActiveWorkoutExercise {
    id: string;
    exerciseId: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    notes: string;
    supersetGroupId: number | null;
    restTimerSeconds: number;
    sets: ActiveSet[];
}

export interface PreviousSetSummary {
    weight: number | null;
    reps: number | null;
}

// --- Routine Template Types ---
export interface RoutineSetTemplate {
    id: string;
    setNumber: number;
    setType: SetType;
    targetWeight: number | null;
    targetReps: number | null;
}

export interface RoutineExerciseTemplate {
    id: string;
    exerciseId: string;
    orderIndex: number;
    supersetGroupId: number | null;
    restTimerSeconds: number | null;
    notes: string | null;
    exercise: DbExercise;
    sets: RoutineSetTemplate[];
}

export interface Routine {
    id: string;
    name: string;
    notes: string | null;
    exercises: RoutineExerciseTemplate[];
}

// --- Draft Routine (UI Builder) ---
export interface DraftRoutineExercise {
    id: string;
    exerciseId: string;
    name: string;
    sets: { weight: string; reps: string }[];
}

// --- Historical Workout Log Types ---
export interface LoggedSet {
    id: string;
    setNumber: number;
    setType: SetType;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    estimated1Rm: number | null;
    isCompleted: boolean;
    isWeightPr: boolean;
    isVolumePr: boolean;
    is1RmPr: boolean;
}

export interface LoggedWorkoutExercise {
    id: string;
    exerciseId: string;
    orderIndex: number;
    supersetGroupId: number | null;
    restTimerSeconds: number | null;
    notes: string | null;
    exercise: DbExercise;
    sets: LoggedSet[];
}

export interface WorkoutLog {
    id: string;
    name: string;
    startTime: string;
    endTime: string | null;
    totalVolume: number;
    totalSets: number;
    exercises: LoggedWorkoutExercise[];
}