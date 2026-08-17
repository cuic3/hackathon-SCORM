import type { Tables } from './supabase';

export type Role = 'admin' | 'learner' | 'educator';
export type LessonOrigin = 'elsevier' | 'custom';
export type CompletionStatus =
    | 'not-started'
    | 'incomplete'
    | 'completed'
    | 'passed'
    | 'failed';

export type Profile = Tables<'profiles'>;
export type Lesson = Tables<'lessons'>;
export type LessonCompletion = Tables<'lesson_completions'>;

/** A lesson merged with the current learner's completion row, if one exists. */
export interface LessonWithCompletion {
    lesson: Lesson;
    completion: LessonCompletion | null;
}

/** Collapses the 5-value SCORM-flavored status into the 3 states the UI displays. */
export function toDisplayStatus(
    status: CompletionStatus | null | undefined
): 'not-started' | 'in-progress' | 'completed' {
    if (!status || status === 'not-started') return 'not-started';
    if (status === 'incomplete') return 'in-progress';
    return 'completed';
}
