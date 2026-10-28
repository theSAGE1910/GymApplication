import { STANDARD_PLATES, PlateSpec } from "@/constants/gym";

/**
 * Formats seconds into M:SS (e.g., 90 -> "1:30")
 */
export function formatDuration(sec: number): string {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
}

/**
 * Rounds a weight to the nearest loadable 2.5kg increment (minimum 20kg bar)
 */
export function roundToNearest2Point5(weight: number, minWeight = 20): number {
    return Math.max(minWeight, Math.round(weight / 2.5) * 2.5);
}

/**
 * Epley 1RM formula: weight * (1 + reps / 30)
 */
export function calculateEstimated1Rm(weight: number, reps: number): number {
    if (weight <= 0 || reps <= 0) return 0;
    if (reps === 1) return weight;
    return Number((weight * (1 + reps / 30)).toFixed(1));
}

/**
 * Generates progressive warm-up stages for a given working weight
 */
export function buildWarmupStages(workingWeight: number): { weight: number; reps: number }[] {
    const stages: { weight: number; reps: number }[] = [];
    if (workingWeight > 25) {
        stages.push({ weight: 20, reps: 10 }); // Empty bar
    }
    if (workingWeight >= 40) {
        stages.push({ weight: roundToNearest2Point5(workingWeight * 0.5), reps: 8 });
        stages.push({ weight: roundToNearest2Point5(workingWeight * 0.7), reps: 5 });
        stages.push({ weight: roundToNearest2Point5(workingWeight * 0.85), reps: 2 });
    } else {
        stages.push({
            weight: roundToNearest2Point5(workingWeight * 0.6, 5),
            reps: 8,
        });
    }
    return stages;
}

/**
 * Calculates the plates needed on ONE side of the barbell
 */
export function calculatePlatesPerSide(targetTotal: number, barbellWeight: number): PlateSpec[] {
    const platesPerSide: PlateSpec[] = [];
    if (targetTotal <= barbellWeight) return platesPerSide;
    let remainingOneSide = (targetTotal - barbellWeight) / 2;

    for (const plate of STANDARD_PLATES) {
        while (remainingOneSide >= plate.weight - 0.001) {
            platesPerSide.push(plate);
            remainingOneSide = Number((remainingOneSide - plate.weight).toFixed(2));
        }
    }
    return platesPerSide;
}
