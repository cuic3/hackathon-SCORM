import React from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { Card } from '@els/els-react--card';
// @ts-ignore
import { Badge } from '@els/els-react--badge';
// @ts-ignore
import { Icon } from '@els/els-react--icon';
import { toDisplayStatus } from '../../types/domain';
import type { CompletionStatus, LessonWithCompletion } from '../../types/domain';
import { formatScoreCell, getScorePercent } from '../../utils/format-score';
import './lesson-card.scss';

const PASSING_SCORE_PERCENT = 70;

const STATUS_LABEL: Record<'not-started' | 'in-progress' | 'completed' | 'failed', string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    completed: 'Completed',
    failed: 'Failed',
};

const LessonCard = ({ lesson, completion }: LessonWithCompletion) => {
    const baseClassName = 'lesson-card';
    const displayStatus = toDisplayStatus(completion?.status as CompletionStatus | undefined);
    const scoreText =
        displayStatus === 'completed'
            ? formatScoreCell(
                  completion?.status as CompletionStatus | undefined,
                  completion?.score_raw ?? null,
                  completion?.score_min ?? null,
                  completion?.score_max ?? null,
                  { audience: 'learner' }
              )
            : null;
    const isFailed =
        displayStatus === 'completed' &&
        completion?.score_raw != null &&
        getScorePercent(completion.score_raw, completion.score_min ?? null, completion.score_max ?? null) <
            PASSING_SCORE_PERCENT;
    const cardStatus = isFailed ? 'failed' : displayStatus;

    return (
        <Card className={baseClassName} role="listitem">
            <div className={`${baseClassName}__header`}>
                <h3 className={`${baseClassName}__title`}>{lesson.title}</h3>
                <div className={`${baseClassName}__header-meta`}>
                    {lesson.origin === 'custom' ? (
                        <Badge content="Custom content" type="subtle" />
                    ) : null}
                    {lesson.duration_minutes ? (
                        <span className={`${baseClassName}__duration`}>
                            {lesson.duration_minutes} min
                        </span>
                    ) : null}
                </div>
            </div>
            <p className={`${baseClassName}__description`}>
                {lesson.description}
            </p>
            <div className={`${baseClassName}__footer`}>
                <div className={`${baseClassName}__status-group`}>
                    <span
                        className={`${baseClassName}__status-pill ${baseClassName}__status-pill--${cardStatus}`}
                    >
                        {STATUS_LABEL[cardStatus]}
                    </span>
                    {scoreText ? (
                        <span className={`${baseClassName}__score-pill`}>{scoreText}</span>
                    ) : null}
                </div>
                <Link
                    to={`/lesson/${lesson.id}`}
                    className={`${baseClassName}__launch-link`}
                >
                    {isFailed ? 'Retake lesson' : displayStatus === 'completed' ? 'Review lesson' : 'Launch lesson'}
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
