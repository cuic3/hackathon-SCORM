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
import { toDisplayStatus } from '../../types/domain';
import type { CompletionStatus, LessonWithCompletion } from '../../types/domain';
import './lesson-card.scss';

const STATUS_LABEL: Record<'not-started' | 'in-progress' | 'completed', string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    completed: 'Completed',
};

const STATUS_PILL_COLOR: Record<'not-started' | 'in-progress' | 'completed', string> = {
    'not-started': 'n3',
    'in-progress': 'secondary-background',
    completed: 'confirm-on-dark',
};

const LessonCard = ({ lesson, completion }: LessonWithCompletion) => {
    const baseClassName = 'lesson-card';
    const displayStatus = toDisplayStatus(completion?.status as CompletionStatus | undefined);

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
                {lesson.duration_minutes ? (
                    <span className={`${baseClassName}__duration`}>
                        {lesson.duration_minutes} min
                    </span>
                ) : null}
                <Pill
                    pillColor={STATUS_PILL_COLOR[displayStatus]}
                    textColor="text"
                >
                    {STATUS_LABEL[displayStatus]}
                </Pill>
            </div>
            <div className={`${baseClassName}__footer`}>
                <Link
                    to={`/lesson/${lesson.id}`}
                    className={`${baseClassName}__launch-link`}
                >
                    {displayStatus === 'completed' ? 'Review lesson' : 'Launch lesson'}
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
