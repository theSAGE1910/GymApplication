import {PrismaClient, ExerciseCategory, EquipmentType, MuscleGroup} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.exercise.count()
    if (count > 0) {
        console.log(`Database already has ${count} exercises. Skipping seed.`);
        return;
    }

    const defaultExercises = [
        { name: 'Barbell Bench Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS] },
        { name: 'Incline Dumbbell Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS] },
        { name: 'Barbell Back Squat', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS] },
        { name: 'Romanian Deadlift (Barbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.BACK] },
        { name: 'Lat Pulldown (Cable)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
        { name: 'Pull Up', category: ExerciseCategory.BODYWEIGHT_REPS, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
        { name: 'Overhead Press (Barbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.TRICEPS] },
        { name: 'Dumbbell Lateral Raise', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [] },
        { name: 'Barbell Curl', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS] },
        { name: 'Tricep Rope Pushdown', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [] },
    ];

    console.log('Seeding default exercises...');
    await prisma.exercise.createMany({ data: defaultExercises });
    console.log('Seed completed! Added 10 exercises.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });