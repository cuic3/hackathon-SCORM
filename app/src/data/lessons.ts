export interface Lesson {
    id: string;
    title: string;
    origin: 'elsevier' | 'custom';
    status: 'not-started' | 'in-progress' | 'completed';
    description: string;
    durationMinutes: number;
    score: number | null;
}

export const lessons: Lesson[] = [
    {
        id: 'hand-hygiene-basics',
        title: 'Hand Hygiene Basics',
        origin: 'elsevier',
        status: 'completed',
        description:
            'Core infection-control practices every clinical staff member should follow.',
        durationMinutes: 15,
        score: 100,
    },
    {
        id: 'sepsis-recognition',
        title: 'Early Recognition of Sepsis',
        origin: 'elsevier',
        status: 'in-progress',
        description: 'Identify early warning signs of sepsis in adult patients.',
        durationMinutes: 25,
        score: null,
    },
    {
        id: 'medication-safety',
        title: 'Medication Safety Fundamentals',
        origin: 'elsevier',
        status: 'not-started',
        description:
            'Reduce medication errors through standardized safety checks.',
        durationMinutes: 20,
        score: null,
    },
    {
        id: 'basic-run-time-calls',
        title: 'Basic Run-Time Calls (SCORM 1.2)',
        origin: 'custom',
        status: 'not-started',
        description:
            'Uploaded by Riverside Health — a SCORM 1.2 sample package demonstrating runtime completion and scoring.',
        durationMinutes: 10,
        score: null,
    },
    {
        id: 'custom-onboarding',
        title: 'Riverside Health Onboarding',
        origin: 'custom',
        status: 'completed',
        description: 'Uploaded by Riverside Health — organization-specific onboarding training.',
        durationMinutes: 30,
        score: 92,
    },
];
