import React from 'react';
import { Link, useParams } from 'react-router-dom';
// @ts-ignore
import { Card } from '@els/els-react--card';
// @ts-ignore
import { Badge } from '@els/els-react--badge';
// @ts-ignore
import { Pill } from '@els/els-react--pill';
// @ts-ignore
import { Button } from '@els/els-react--button';
// @ts-ignore
import { Icon } from '@els/els-react--icon';
import { lessons } from '../../data/lessons';
import './lesson.scss';

const STATUS_LABEL: Record<string, string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    completed: 'Completed',
};

const STATUS_PILL_COLOR: Record<string, string> = {
    'not-started': 'n3',
    'in-progress': 'secondary-background',
    completed: 'confirm-on-dark',
};

const Lesson = () => {
    const baseClassName = 'lesson';
    const { lessonId } = useParams<{ lessonId: string }>();
    const lesson = lessons.find((item) => item.id === lessonId);

    if (!lesson) {
        return (
            <div className={baseClassName}>
                <p>Lesson not found.</p>
                <Link to="/">Back to My learning</Link>
            </div>
        );
    }

    return (
        <div className={baseClassName}>
            <Link to="/" className={`${baseClassName}__back-link`}>
                <Icon
                    isDecorative
                    size="xs"
                    sprite={Icon.Sprites.CHEVRON_LEFT}
                />
                Back to My learning
            </Link>

            <div className={`${baseClassName}__header`}>
                <h1 id="my-content" tabIndex={-1}>
                    {lesson.title}
                </h1>
                {lesson.origin === 'custom' ? (
                    <Badge content="Custom content" type="subtle" />
                ) : null}
            </div>
            <p className={`${baseClassName}__description`}>
                {lesson.description}
            </p>

            <Card className={`${baseClassName}__player`}>
                <div className={`${baseClassName}__player__placeholder`}>
                    <Icon
                        isDecorative
                        size="l"
                        sprite={Icon.Sprites.PLAY_SOLID}
                    />
                    <p>SCORM player will launch here</p>
                    <Button type="primary" onClick={() => {}}>
                        Launch lesson
                    </Button>
                </div>
            </Card>

            <Card className={`${baseClassName}__progress`}>
                <h2 className={`${baseClassName}__progress__title`}>
                    Your progress
                </h2>
                <dl className={`${baseClassName}__progress__list`}>
                    <div className={`${baseClassName}__progress__row`}>
                        <dt>Status</dt>
                        <dd>
                            <Pill
                                pillColor={STATUS_PILL_COLOR[lesson.status]}
                                textColor="text"
                            >
                                {STATUS_LABEL[lesson.status]}
                            </Pill>
                        </dd>
                    </div>
                    <div className={`${baseClassName}__progress__row`}>
                        <dt>Score</dt>
                        <dd>
                            {lesson.score !== null
                                ? `${lesson.score}%`
                                : 'Not yet reported'}
                        </dd>
                    </div>
                </dl>
            </Card>
        </div>
    );
};

export default Lesson;
