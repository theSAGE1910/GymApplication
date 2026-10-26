import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const exercises = await prisma.exercise.findMany({
            orderBy: {name: 'asc'},
        });
        return NextResponse.json(exercises);
    } catch (error) {
        console.error('Failed to fetch exercises:', error);
        return NextResponse.json({ error: 'Failed to load exercises' }, { status: 500 });
    }
}