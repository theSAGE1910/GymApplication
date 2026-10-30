import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from '@/lib/auth';
import { ExerciseCategory, EquipmentType, MuscleGroup } from '@prisma/client';

export async function GET(req: Request) {
    try {
        const user = await getAuthenticatedUser(req);
        const exercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { isCustom: false },
                    { userId: user.id },
                ],
            },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(exercises);
    } catch (error) {
        console.error('Failed to fetch exercises:', error);
        return NextResponse.json({ error: 'Failed to load exercises' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json();
        const { name, primaryMuscle, equipment, category } = body;

        if (!name || !primaryMuscle || !equipment) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newExercise = await prisma.exercise.create({
            data: {
                name: name.trim(),
                primaryMuscle: primaryMuscle as MuscleGroup,
                equipment: equipment as EquipmentType,
                category: (category as ExerciseCategory) || ExerciseCategory.WEIGHT_REPS,
                isCustom: true,
                userId: user.id,
            },
        });

        return NextResponse.json(newExercise);
    } catch (error) {
        console.error('Failed to create custom exercise:', error);
        return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
    }
}