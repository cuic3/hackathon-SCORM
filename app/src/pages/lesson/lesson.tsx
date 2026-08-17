import React, { useEffect, useState } from 'react';
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
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../utils/auth-context';
import { ScormApiAdapter } from '../../utils/scorm-api-adapter';
import { formatScoreCell } from '../../utils/format-score';
import { toDisplayStatus } from '../../types/domain';
import type {
    CompletionStatus,
    Lesson as LessonRow,
    LessonCompletion,
    LessonOrigin,
} from '../../types/domain';
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

declare global {
    interface Window {
        API?: ScormApiAdapter;
    }
}

interface LessonState {
    lesson: LessonRow;
    completion: LessonCompletion | null;
}

const Lesson = () => {
    const baseClassName = 'lesson';
    const { lessonId } = useParams<{ lessonId: string }>();
    const { profile } = useAuth();

    const [state, setState] = useState<LessonState | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [ready, setReady] = useState(false);

    // Fetches lesson + completion TOGETHER and commits them in a single
    // setState — never as two separate updates — so the adapter-creation
    // effect below can never observe a lesson without its matching
    // completion (the race the plan calls out).
    const fetchLessonState = async (): Promise<LessonState | null> => {
        if (!profile) return null;
        const [{ data: lessonRow }, { data: completionRow }] = await Promise.all([
            supabase.from('lessons').select('*').eq('id', lessonId).single(),
            supabase
                .from('lesson_completions')
                .select('*')
                .eq('learner_id', profile.id)
                .eq('lesson_id', lessonId)
                .maybeSingle(),
        ]);
        if (!lessonRow) return null;
        return { lesson: lessonRow, completion: completionRow ?? null };
    };

    useEffect(() => {
        setReady(false);
        setNotFound(false);
        setState(null);
        if (!profile) return;

        let cancelled = false;
        void fetchLessonState().then((result) => {
            if (cancelled) return;
            if (!result) {
                setNotFound(true);
                return;
            }
            setState(result);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId, profile?.id]);

    // Re-fetches only the completion row (e.g. after the learner finishes a
    // lesson) — deliberately does NOT touch `lesson`, so it never re-triggers
    // the adapter-creation effect below or disturbs a still-live iframe/adapter.
    const refreshCompletion = async () => {
        if (!profile) return;
        const { data } = await supabase
            .from('lesson_completions')
            .select('*')
            .eq('learner_id', profile.id)
            .eq('lesson_id', lessonId)
            .maybeSingle();
        setState((prev) => (prev ? { ...prev, completion: data ?? null } : prev));
    };

    // Any lesson with real package content: assign window.API, THEN render the
    // iframe — and only recreate the adapter when the lesson's content itself
    // changes, never when `completion` is refreshed afterwards (that would
    // tear down a still-live adapter's pending debounced write out from under
    // the running iframe).
    const lessonId_ = state?.lesson.id;
    const lessonPackageId = state?.lesson.package_id;
    const lessonLaunchPath = state?.lesson.launch_path;
    const hasPlayableContent = Boolean(lessonPackageId && lessonLaunchPath);
    useEffect(() => {
        if (!state || !hasPlayableContent || !profile) {
            setReady(state != null);
            return;
        }

        let disposed = false;
        let adapter: ScormApiAdapter | null = null;
        const { lesson, completion } = state;

        const setup = async () => {
            const { data } = await supabase.auth.getSession();
            const accessToken = data.session?.access_token ?? '';
            if (disposed) return;

            adapter = new ScormApiAdapter({
                learnerId: profile.id,
                lessonId: lesson.id,
                lessonTitleSnapshot: lesson.title,
                lessonOriginSnapshot: lesson.origin as LessonOrigin,
                accessToken,
                seed: completion
                    ? {
                          status: completion.status as CompletionStatus,
                          scoreRaw: completion.score_raw,
                          scoreMin: completion.score_min,
                          scoreMax: completion.score_max,
                          lessonLocation: completion.lesson_location,
                          firstLaunchedAt: completion.first_launched_at,
                          completedAt: completion.completed_at,
                      }
                    : null,
            });
            window.API = adapter;
            setReady(true);
        };

        void setup();

        return () => {
            disposed = true;
            adapter?.dispose();
            delete window.API;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId_, lessonPackageId, lessonLaunchPath, profile?.id]);

    // Live score/status refresh: while a SCO is running in the iframe, poll
    // the completion row so "Your progress" reflects LMSSetValue writes as
    // they land, without the learner needing to click "Refresh status".
    useEffect(() => {
        if (!hasPlayableContent || !ready) return;
        const interval = setInterval(() => {
            void refreshCompletion();
        }, 2000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId_, hasPlayableContent, ready]);

    if (notFound) {
        return (
            <div className={baseClassName}>
                <p>Lesson not found.</p>
                <Link to="/">Back to My learning</Link>
            </div>
        );
    }

    if (!state) {
        return <p>Loading…</p>;
    }

    const { lesson, completion } = state;
    const displayStatus = toDisplayStatus(completion?.status as CompletionStatus | null);
    const scoreText = formatScoreCell(
        (completion?.status as CompletionStatus | null) ?? null,
        completion?.score_raw ?? null,
        completion?.score_min ?? null,
        completion?.score_max ?? null
    );

    return (
        <div className={baseClassName}>
            <Link to="/" className={`${baseClassName}__back-link`}>
                <Icon isDecorative size="xs" sprite={Icon.Sprites.CHEVRON_LEFT} />
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
            <p className={`${baseClassName}__description`}>{lesson.description}</p>

            {hasPlayableContent ? (
                <Card className={`${baseClassName}__player`}>
                    {ready && lesson.package_id && lesson.launch_path ? (
                        <iframe
                            title={lesson.title}
                            className={`${baseClassName}__player__frame`}
                            src={`/content/${lesson.package_id}/${lesson.launch_path}`}
                        />
                    ) : (
                        <div className={`${baseClassName}__player__placeholder`}>
                            <p>Preparing lesson…</p>
                        </div>
                    )}
                </Card>
            ) : (
                <Card className={`${baseClassName}__player`}>
                    <div className={`${baseClassName}__player__placeholder`}>
                        <Icon isDecorative size="l" sprite={Icon.Sprites.PLAY_SOLID} />
                        <p>This lesson doesn&rsquo;t have content available yet.</p>
                    </div>
                </Card>
            )}

            <Card className={`${baseClassName}__progress`}>
                <h2 className={`${baseClassName}__progress__title`}>
                    Your progress
                </h2>
                <dl className={`${baseClassName}__progress__list`}>
                    <div className={`${baseClassName}__progress__row`}>
                        <dt>Status</dt>
                        <dd>
                            <Pill
                                pillColor={STATUS_PILL_COLOR[displayStatus]}
                                textColor="text"
                            >
                                {STATUS_LABEL[displayStatus]}
                            </Pill>
                        </dd>
                    </div>
                    <div className={`${baseClassName}__progress__row`}>
                        <dt>Score</dt>
                        <dd>{scoreText}</dd>
                    </div>
                </dl>
                {hasPlayableContent ? (
                    <Button type="tertiary" onClick={() => refreshCompletion()}>
                        Refresh status
                    </Button>
                ) : null}
            </Card>
        </div>
    );
};

export default Lesson;
