import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_EMAIL = 'athlete@hevy-clone.local';

async function getOrCreateDefaultUser() {
    let user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: DEFAULT_USER_EMAIL,
                name: 'Student Athlete',
            },
        });
    }
    return user;
}

// GET: Fetch past completed workouts
export async function GET() {
    try {
        const user = await getOrCreateDefaultUser();
        const workouts = await prisma.workout.findMany({
            where: { userId: user.id },
            orderBy: { startTime: 'desc' },
            include: {
                exercises: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        exercise: true,
                        sets: { orderBy: { setNumber: 'asc' } },
                    },
                },
            },
            take: 30,
        });
        return NextResponse.json(workouts);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
    }
}

// POST: Save a finished workout to Supabase & detect Personal Records (PRs)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { workoutName, startTime, exercises } = body;
        const user = await getOrCreateDefaultUser();

        let totalVolume = 0;
        let totalSets = 0;

        const formattedExercises = [];

        for (let index = 0; index < exercises.length; index++) {
            const ex = exercises[index];
            const completedSets = ex.sets.filter((s: any) => s.isCompleted);
            if (completedSets.length === 0) continue;

            // Look up historical all-time bests for this exercise
            const historicalSets = await prisma.workoutSet.findMany({
                where: {
                    isCompleted: true,
                    workoutExercise: {
                        exerciseId: ex.exerciseId,
                        workout: { userId: user.id },
                    },
                },
                select: { weight: true, estimated1Rm: true },
            });

            let maxHistoricalWeight = historicalSets.reduce(
                (max, s) => Math.max(max, s.weight || 0),
                0
            );
            let maxHistorical1Rm = historicalSets.reduce(
                (max, s) => Math.max(max, s.estimated1Rm || 0),
                0
            );

            const setsData = completedSets.map((s: any, setIdx: number) => {
                const weight = parseFloat(s.weight) || 0;
                const reps = parseInt(s.reps, 10) || 0;
                const rpe = s.rpe ? parseFloat(s.rpe) : null;

                totalVolume += weight * reps;
                totalSets += 1;

                const estimated1Rm =
                    weight > 0 && reps > 0 ? Number((weight * (1 + reps / 30)).toFixed(1)) : null;

                // Check if this set beats the all-time Weight PR or 1RM PR
                let isWeightPr = false;
                let is1RmPr = false;

                if (weight > 0 && weight > maxHistoricalWeight) {
                    isWeightPr = true;
                    maxHistoricalWeight = weight;
                }
                if (estimated1Rm && estimated1Rm > maxHistorical1Rm) {
                    is1RmPr = true;
                    maxHistorical1Rm = estimated1Rm;
                }

                return {
                    setNumber: setIdx + 1,
                    setType: s.setType,
                    weight,
                    reps,
                    rpe,
                    isCompleted: true,
                    estimated1Rm,
                    isWeightPr,
                    is1RmPr,
                };
            });

            formattedExercises.push({
                exerciseId: ex.exerciseId,
                orderIndex: index,
                notes: ex.notes || null,
                restTimerSeconds: ex.restTimerSeconds || 90,
                sets: { create: setsData },
                supersetGroupId: ex.supersetGroupId || null,
            });
        }

        if (formattedExercises.length === 0) {
            return NextResponse.json(
                { error: 'Complete at least one set before finishing the workout.' },
                { status: 400 }
            );
        }

        const savedWorkout = await prisma.workout.create({
            data: {
                userId: user.id,
                name: workoutName || 'Workout Session',
                startTime: new Date(startTime || Date.now()),
                endTime: new Date(),
                totalVolume,
                totalSets,
                exercises: {
                    create: formattedExercises,
                },
            },
        });

        return NextResponse.json(savedWorkout);
    } catch (error) {
        console.error('Error saving workout:', error);
        return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
    }
}

// DELETE: Remove a past workout by ?id=...
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing workout id' }, { status: 400 });

        await prisma.workout.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workout:', error);
        return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
    }
}