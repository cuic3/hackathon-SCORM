import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LessonCard from './lesson-card';
import type { Lesson, LessonCompletion } from '../../types/domain';

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
    return {
        id: 'lesson-1',
        title: 'Hand Hygiene Basics',
        description: 'Learn the fundamentals.',
        origin: 'elsevier',
        duration_minutes: 15,
        is_active: true,
        organization_id: 'org-1',
        package_id: null,
        launch_path: null,
        manifest_title: null,
        uploaded_by: null,
        created_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    } as Lesson;
}

function makeCompletion(overrides: Partial<LessonCompletion> = {}): LessonCompletion {
    return {
        id: 'completion-1',
        learner_id: 'learner-1',
        lesson_id: 'lesson-1',
        lesson_title_snapshot: 'Hand Hygiene Basics',
        lesson_origin_snapshot: 'elsevier',
        status: 'incomplete',
        score_raw: null,
        score_min: null,
        score_max: null,
        lesson_location: null,
        exit_mode: null,
        session_time: null,
        first_launched_at: '2026-01-01T00:00:00.000Z',
        completed_at: null,
        last_updated_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    } as LessonCompletion;
}

function renderCard(lesson: Lesson, completion: LessonCompletion | null) {
    return render(
        <MemoryRouter>
            <LessonCard lesson={lesson} completion={completion} />
        </MemoryRouter>
    );
}

describe('LessonCard', () => {
    it('renders the title and description', () => {
        renderCard(makeLesson(), null);
        expect(screen.getByText('Hand Hygiene Basics')).toBeInTheDocument();
        expect(screen.getByText('Learn the fundamentals.')).toBeInTheDocument();
    });

    it('shows the duration when present', () => {
        renderCard(makeLesson({ duration_minutes: 20 }), null);
        expect(screen.getByText('20 min')).toBeInTheDocument();
    });

    it('omits the duration when null', () => {
        renderCard(makeLesson({ duration_minutes: null }), null);
        expect(screen.queryByText(/min$/)).not.toBeInTheDocument();
    });

    it('shows a "Custom content" badge for custom-origin lessons', () => {
        renderCard(makeLesson({ origin: 'custom' }), null);
        expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('does not show a badge for elsevier-origin lessons', () => {
        renderCard(makeLesson({ origin: 'elsevier' }), null);
        expect(screen.queryByText('Custom content')).not.toBeInTheDocument();
    });

    it('shows "Not started" and "Launch lesson" when there is no completion row', () => {
        renderCard(makeLesson(), null);
        expect(screen.getByText('Not started')).toBeInTheDocument();
        expect(screen.getByText('Launch lesson')).toBeInTheDocument();
    });

    it('shows "In progress" and "Launch lesson" for an incomplete completion', () => {
        renderCard(makeLesson(), makeCompletion({ status: 'incomplete' }));
        expect(screen.getByText('In progress')).toBeInTheDocument();
        expect(screen.getByText('Launch lesson')).toBeInTheDocument();
    });

    it('shows "Completed" and "Review lesson" once finished', () => {
        renderCard(makeLesson(), makeCompletion({ status: 'completed' }));
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Review lesson')).toBeInTheDocument();
    });

    it('treats "passed" and "failed" completions as "Completed"', () => {
        const { unmount } = renderCard(makeLesson(), makeCompletion({ status: 'passed' }));
        expect(screen.getByText('Completed')).toBeInTheDocument();
        unmount();

        renderCard(makeLesson({ id: 'lesson-2' }), makeCompletion({ status: 'failed' }));
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('links to the lesson detail route', () => {
        renderCard(makeLesson({ id: 'lesson-42' }), null);
        expect(screen.getByRole('link', { name: /Launch lesson/ })).toHaveAttribute(
            'href',
            '/lesson/lesson-42'
        );
    });
});
