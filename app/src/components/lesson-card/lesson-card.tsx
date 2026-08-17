import React from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { Card } from '@els/els-react--card';
// @ts-ignore
import { Pill } from '@els/els-react--pill';
// @ts-ignore
import { Badge } from '@els/els-react--badge';
// @ts-ignore
import { Icon } from '@els/els-react--icon';
import { Lesson } from '../../data/lessons';
import './lesson-card.scss';

const STATUS_LABEL: Record<Lesson['status'], string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    completed: 'Completed',
};

const STATUS_PILL_COLOR: Record<Lesson['status'], string> = {
    'not-started': 'n3',
    'in-progress': 'secondary-background',
    completed: 'confirm-on-dark',
};

const LessonCard = ({ lesson }: { lesson: Lesson }) => {
    const baseClassName = 'lesson-card';

    return (
        <Card className={baseClassName} role="listitem">
            <div className={`${baseClassName}__header`}>
                <h3 className={`${baseClassName}__title`}>{lesson.title}</h3>
                {lesson.origin === 'custom' ? (
                    <Badge content="Custom content" type="subtle" />
                ) : null}
            </div>
            <p className={`${baseClassName}__description`}>
                {lesson.description}
            </p>
            <div className={`${baseClassName}__meta`}>
                <span className={`${baseClassName}__duration`}>
                    {lesson.durationMinutes} min
                </span>
                <Pill
                    pillColor={STATUS_PILL_COLOR[lesson.status]}
                    textColor="text"
                >
                    {STATUS_LABEL[lesson.status]}
                </Pill>
            </div>
            <div className={`${baseClassName}__footer`}>
                <Link
                    to={`/lesson/${lesson.id}`}
                    className={`${baseClassName}__launch-link`}
                >
                    {lesson.status === 'completed'
                        ? 'Review lesson'
                        : 'Launch lesson'}
                    <Icon
                        isDecorative
                        size="xs"
                        sprite={Icon.Sprites.CHEVRON_RIGHT}
                    />
                </Link>
            </div>
        </Card>
    );
};

export default LessonCard;
