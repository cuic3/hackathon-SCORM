import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../utils/auth-context';
import LessonCard from '../../components/lesson-card/lesson-card';
import type { LessonWithCompletion } from '../../types/domain';
import './home.scss';

const Home = () => {
    const baseClassName = 'home';
    const { profile } = useAuth();
    const [lessons, setLessons] = useState<LessonWithCompletion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;

        let isMounted = true;
        const load = async () => {
            setLoading(true);
            const [{ data: lessonRows }, { data: completionRows }] = await Promise.all([
                supabase
                    .from('lessons')
                    .select('*')
                    .eq('is_active', true)
                    .order('title'),
                supabase
                    .from('lesson_completions')
                    .select('*')
                    .eq('learner_id', profile.id),
            ]);

            if (!isMounted) return;
            const completionByLessonId = new Map(
                (completionRows ?? []).map((row) => [row.lesson_id, row])
            );
            setLessons(
                (lessonRows ?? []).map((lesson) => ({
                    lesson,
                    completion: completionByLessonId.get(lesson.id) ?? null,
                }))
            );
            setLoading(false);
        };

        void load();
        return () => {
            isMounted = false;
        };
    }, [profile]);

    const elsevierLessons = lessons.filter((item) => item.lesson.origin === 'elsevier');
    const customLessons = lessons.filter((item) => item.lesson.origin === 'custom');

    return (
        <div className={baseClassName}>
            <h1 id="my-content" tabIndex={-1}>
                My learning
            </h1>
            <h2 className={`${baseClassName}__subtitle`}>
                Elsevier and custom content appear together here, with each
                lesson&rsquo;s origin clearly marked.
            </h2>

            {loading ? (
                <p>Loading…</p>
            ) : (
                <>
                    <section className={`${baseClassName}__section`}>
                        <h2 className={`${baseClassName}__section-title`}>
                            Elsevier lessons
                        </h2>
                        <div className={`${baseClassName}__cards`} role="list">
                            {elsevierLessons.map((item) => (
                                <LessonCard key={item.lesson.id} {...item} />
                            ))}
                        </div>
                    </section>
                    <section className={`${baseClassName}__section`}>
                        <h2 className={`${baseClassName}__section-title`}>
                            Custom lessons
                        </h2>
                        <div className={`${baseClassName}__cards`} role="list">
                            {customLessons.length === 0 ? (
                                <p>No custom lessons available yet.</p>
                            ) : (
                                customLessons.map((item) => (
                                    <LessonCard key={item.lesson.id} {...item} />
                                ))
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default Home;
