import React from 'react';
import { lessons } from '../../data/lessons';
import LessonCard from '../../components/lesson-card/lesson-card';
import './home.scss';

const Home = () => {
    const baseClassName = 'home';
    const elsevierLessons = lessons.filter(
        (lesson) => lesson.origin === 'elsevier'
    );
    const customLessons = lessons.filter(
        (lesson) => lesson.origin === 'custom'
    );

    return (
        <div className={baseClassName}>
            <h1 id="my-content" tabIndex={-1}>
                My learning
            </h1>
            <h2 className={`${baseClassName}__subtitle`}>
                Elsevier and custom content appear together here, with each
                lesson&rsquo;s origin clearly marked.
            </h2>
            <section className={`${baseClassName}__section`}>
                <h2 className={`${baseClassName}__section-title`}>
                    Elsevier lessons
                </h2>
                <div className={`${baseClassName}__cards`} role="list">
                    {elsevierLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                </div>
            </section>
            <section className={`${baseClassName}__section`}>
                <h2 className={`${baseClassName}__section-title`}>
                    Custom lessons
                </h2>
                <div className={`${baseClassName}__cards`} role="list">
                    {customLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
