import { PrismaClient, ExerciseCategory, EquipmentType, MuscleGroup } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_EXERCISES = [
    // CHEST
    { name: 'Barbell Bench Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS] },
    { name: 'Incline Dumbbell Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS] },
    { name: 'Incline Barbell Bench Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS] },
    { name: 'Flat Dumbbell Bench Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS] },
    { name: 'Cable Chest Fly', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS] },
    { name: 'Pec Deck / Machine Fly', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS] },
    { name: 'Machine Chest Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS] },
    { name: 'Chest Dip', category: ExerciseCategory.BODYWEIGHT_REPS, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS] },
    { name: 'Push Up', category: ExerciseCategory.BODYWEIGHT_REPS, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS, MuscleGroup.ABS] },

    // BACK
    { name: 'Conventional Deadlift (Barbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES, MuscleGroup.FOREARMS] },
    { name: 'Barbell Bent Over Row', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS] },
    { name: 'Lat Pulldown (Cable)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
    { name: 'Pull Up', category: ExerciseCategory.BODYWEIGHT_REPS, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS] },
    { name: 'Chin Up', category: ExerciseCategory.BODYWEIGHT_REPS, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
    { name: 'Seated Cable Row', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
    { name: 'Single-Arm Dumbbell Row', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS] },
    { name: 'Chest-Supported T-Bar Row', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
    { name: 'Straight-Arm Cable Pulldown', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.TRICEPS] },

    // SHOULDERS
    { name: 'Overhead Press (Barbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.TRICEPS] },
    { name: 'Seated Dumbbell Shoulder Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.TRICEPS] },
    { name: 'Dumbbell Lateral Raise', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [] },
    { name: 'Cable Lateral Raise', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [] },
    { name: 'Face Pull (Cable)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.BACK] },
    { name: 'Reverse Pec Deck (Rear Delt)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.BACK] },
    { name: 'Dumbbell Shrug', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.FOREARMS] },

    // QUADRICEPS
    { name: 'Barbell Back Squat', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS] },
    { name: 'Barbell Front Squat', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.ABS] },
    { name: 'Leg Press (Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS] },
    { name: 'Hack Squat (Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES] },
    { name: 'Bulgarian Split Squat (Dumbbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS] },
    { name: 'Leg Extension (Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [] },
    { name: 'Dumbbell Walking Lunge', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS] },

    // HAMSTRINGS & GLUTES
    { name: 'Romanian Deadlift (Barbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.BACK] },
    { name: 'Romanian Deadlift (Dumbbell)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [MuscleGroup.GLUTES] },
    { name: 'Seated Leg Curl (Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [] },
    { name: 'Lying Leg Curl (Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [] },
    { name: 'Barbell Hip Thrust', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.GLUTES, secondaryMuscles: [MuscleGroup.HAMSTRINGS] },
    { name: 'Cable Pull Through', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.GLUTES, secondaryMuscles: [MuscleGroup.HAMSTRINGS] },

    // BICEPS & FOREARMS
    { name: 'Barbell Curl', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS] },
    { name: 'Incline Dumbbell Curl', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS] },
    { name: 'Dumbbell Hammer Curl', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.DUMBBELL, primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS] },
    { name: 'Preacher Curl (EZ Bar / Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [] },
    { name: 'Bayesian Cable Curl', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [] },

    // TRICEPS
    { name: 'Tricep Rope Pushdown', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [] },
    { name: 'Overhead Cable Tricep Extension', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [] },
    { name: 'EZ-Bar Skullcrusher', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [] },
    { name: 'Close-Grip Barbell Bench Press', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.BARBELL, primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [MuscleGroup.CHEST, MuscleGroup.SHOULDERS] },

    // CALVES & ABS
    { name: 'Standing Calf Raise (Machine)', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.CALVES, secondaryMuscles: [] },
    { name: 'Seated Calf Raise', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.MACHINE, primaryMuscle: MuscleGroup.CALVES, secondaryMuscles: [] },
    { name: 'Hanging Leg Raise', category: ExerciseCategory.BODYWEIGHT_REPS, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [] },
    { name: 'Cable Rope Crunch', category: ExerciseCategory.WEIGHT_REPS, equipment: EquipmentType.CABLE, primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [] },
    { name: 'Plank', category: ExerciseCategory.DURATION, equipment: EquipmentType.BODYWEIGHT, primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [] },
];

async function main() {
    const existing = await prisma.exercise.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

    const toInsert = ALL_EXERCISES.filter((ex) => !existingNames.has(ex.name.toLowerCase()));

    if (toInsert.length === 0) {
        console.log(`All ${ALL_EXERCISES.length} default exercises are already present!`);
        return;
    }

    console.log(`Inserting ${toInsert.length} new exercises...`);
    await prisma.exercise.createMany({ data: toInsert });
    console.log(`✅ Seed completed! Total library size: ${existing.length + toInsert.length} exercises.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });