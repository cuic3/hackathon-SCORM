import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
// @ts-ignore
import { Card } from '@els/els-react--card';
// @ts-ignore
import { Button } from '@els/els-react--button';
// @ts-ignore
import { Badge } from '@els/els-react--badge';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../utils/auth-context';
import { mimeTypeFor } from '../../utils/mime-types';
import { loadScormPackage, type ParsedManifest } from '../../utils/scorm-manifest';
import type { Lesson } from '../../types/domain';
import './admin-upload.scss';

const UPLOAD_CONCURRENCY = 5;

async function uploadZipEntries(zip: JSZip, packageId: string): Promise<void> {
    const entries = Object.entries(zip.files).filter(([, entry]) => !entry.dir);
    let index = 0;

    async function worker() {
        while (index < entries.length) {
            const current = index++;
            const [relativePath, entry] = entries[current];
            const blob = await entry.async('blob');
            const { error } = await supabase.storage
                .from('content')
                .upload(`${packageId}/${relativePath}`, blob, {
                    contentType: mimeTypeFor(relativePath),
                    upsert: false,
                });
            if (error) throw new Error(`Failed to upload ${relativePath}: ${error.message}`);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, entries.length) }, worker)
    );
}

const AdminUpload = () => {
    const baseClassName = 'admin-upload';
    const { profile } = useAuth();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(true);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [manifest, setManifest] = useState<ParsedManifest | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Set while re-uploading content to replace an existing custom lesson
    // (US-4.1 "re-uploaded" case). The upload form is reused for this — see
    // startReplace/cancelReplace and the branch in handleUpload.
    const [replacingLesson, setReplacingLesson] = useState<Lesson | null>(null);

    // Metadata-only edit (title/description/duration) — never touches
    // package_id/launch_path. Content changes always go through "Replace
    // content" so a new lessons row (and audit trail) is created instead of
    // silently mutating what a recorded completion's snapshot points back to.
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDurationMinutes, setEditDurationMinutes] = useState('');
    const [editError, setEditError] = useState<string | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    const loadLessons = async () => {
        setLoadingLessons(true);
        const { data } = await supabase
            .from('lessons')
            .select('*')
            .eq('origin', 'custom')
            .order('created_at', { ascending: false });
        setLessons(data ?? []);
        setLoadingLessons(false);
    };

    useEffect(() => {
        void loadLessons();
    }, []);

    // Looks up lineage titles (replaces_lesson_id / superseded_by_lesson_id)
    // against the already-loaded custom lesson list rather than a separate
    // query — every custom lesson a replace/supersede link can point to is
    // already in `lessons`.
    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    const resetUploadForm = () => {
        setSelectedFile(null);
        setManifest(null);
        setTitle('');
        setDescription('');
        setDurationMinutes('');
        setParseError(null);
    };

    const startReplace = (lesson: Lesson) => {
        setReplacingLesson(lesson);
        setSuccessMessage(null);
        setUploadError(null);
        resetUploadForm();
        setTitle(lesson.title);
        setDescription(lesson.description ?? '');
        setDurationMinutes(
            lesson.duration_minutes != null ? String(lesson.duration_minutes) : ''
        );
    };

    const cancelReplace = () => {
        setReplacingLesson(null);
        setUploadError(null);
        resetUploadForm();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setSuccessMessage(null);
        setUploadError(null);
        resetUploadForm();
        if (replacingLesson) {
            // Carry over the existing lesson's metadata by default — a
            // content refresh usually keeps the same title/description; the
            // admin can still edit before submitting.
            setTitle(replacingLesson.title);
            setDescription(replacingLesson.description ?? '');
            setDurationMinutes(
                replacingLesson.duration_minutes != null
                    ? String(replacingLesson.duration_minutes)
                    : ''
            );
        }
        if (!file) return;

        setSelectedFile(file);
        try {
            const { manifest: parsed } = await loadScormPackage(file);
            setManifest(parsed);
            if (!replacingLesson) {
                setTitle(parsed.title ?? file.name.replace(/\.zip$/i, ''));
            }
        } catch (error) {
            setParseError(error instanceof Error ? error.message : String(error));
            setSelectedFile(null);
        }
    };

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile || !manifest || !profile) return;

        setUploading(true);
        setUploadError(null);
        try {
            const zip = await JSZip.loadAsync(await selectedFile.arrayBuffer());
            const packageId = crypto.randomUUID();

            await uploadZipEntries(zip, packageId);

            const { data: lessonRow, error: insertError } = await supabase
                .from('lessons')
                .insert({
                    organization_id: profile.organization_id,
                    origin: 'custom',
                    title,
                    description: description || null,
                    duration_minutes: durationMinutes ? Number(durationMinutes) : null,
                    package_id: packageId,
                    launch_path: manifest.launchPath,
                    manifest_title: manifest.title,
                    uploaded_by: profile.id,
                    replaces_lesson_id: replacingLesson?.id ?? null,
                })
                .select('*')
                .single();

            if (insertError || !lessonRow) {
                throw new Error(insertError?.message ?? 'Failed to save the lesson record.');
            }

            await supabase.from('content_audit_log').insert({
                actor_id: profile.id,
                action: 'upload',
                lesson_id: lessonRow.id,
                previous_lesson_id: replacingLesson?.id ?? null,
                detail: {
                    filename: selectedFile.name,
                    manifestTitle: manifest.title,
                    launchPath: manifest.launchPath,
                    ...(replacingLesson ? { replacesLessonId: replacingLesson.id } : {}),
                },
            });

            if (replacingLesson) {
                // The old row's content is never mutated — it's marked
                // inactive and linked forward. lesson_completions rows still
                // point at the old lesson_id and keep their own snapshot
                // fields, so history for it is untouched (US-4.1).
                await supabase
                    .from('lessons')
                    .update({ is_active: false, superseded_by_lesson_id: lessonRow.id })
                    .eq('id', replacingLesson.id);

                await supabase.from('content_audit_log').insert({
                    actor_id: profile.id,
                    action: 'deactivate',
                    lesson_id: replacingLesson.id,
                    detail: { reason: 'superseded', supersededBy: lessonRow.id },
                });

                setSuccessMessage(
                    `"${title}" replaces "${replacingLesson.title}" and is now available to learners.`
                );
                setReplacingLesson(null);
            } else {
                setSuccessMessage(`"${title}" is now available to learners.`);
            }

            resetUploadForm();
            await loadLessons();
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : String(error));
        } finally {
            setUploading(false);
        }
    };

    const handleDeactivate = async (lesson: Lesson) => {
        if (!profile) return;
        await supabase
            .from('lessons')
            .update({ is_active: false })
            .eq('id', lesson.id);
        await supabase.from('content_audit_log').insert({
            actor_id: profile.id,
            action: 'deactivate',
            lesson_id: lesson.id,
        });
        await loadLessons();
    };

    const handleReactivate = async (lesson: Lesson) => {
        if (!profile) return;
        await supabase
            .from('lessons')
            .update({ is_active: true })
            .eq('id', lesson.id);
        await supabase.from('content_audit_log').insert({
            actor_id: profile.id,
            action: 'reactivate',
            lesson_id: lesson.id,
        });
        await loadLessons();
    };

    const startEdit = (lesson: Lesson) => {
        setEditingLessonId(lesson.id);
        setEditTitle(lesson.title);
        setEditDescription(lesson.description ?? '');
        setEditDurationMinutes(
            lesson.duration_minutes != null ? String(lesson.duration_minutes) : ''
        );
        setEditError(null);
    };

    const cancelEdit = () => {
        setEditingLessonId(null);
        setEditError(null);
    };

    const handleSaveEdit = async (event: React.FormEvent, lesson: Lesson) => {
        event.preventDefault();
        if (!profile) return;

        setEditSaving(true);
        setEditError(null);
        try {
            const before = {
                title: lesson.title,
                description: lesson.description,
                duration_minutes: lesson.duration_minutes,
            };
            const after = {
                title: editTitle,
                description: editDescription || null,
                duration_minutes: editDurationMinutes ? Number(editDurationMinutes) : null,
            };

            const { error } = await supabase
                .from('lessons')
                .update({ ...after, updated_at: new Date().toISOString() })
                .eq('id', lesson.id);
            if (error) throw new Error(error.message);

            await supabase.from('content_audit_log').insert({
                actor_id: profile.id,
                action: 'edit',
                lesson_id: lesson.id,
                detail: { before, after },
            });

            setEditingLessonId(null);
            await loadLessons();
        } catch (error) {
            setEditError(error instanceof Error ? error.message : String(error));
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className={baseClassName}>
            <h1 id="my-content" tabIndex={-1}>
                Upload custom content
            </h1>
            <p className={`${baseClassName}__subtitle`}>
                Upload a SCORM 1.2 package (.zip). It must contain
                imsmanifest.xml at its root.
            </p>

            <Card className={`${baseClassName}__form-card`}>
                {replacingLesson ? (
                    <p className={`${baseClassName}__replace-banner`} role="status">
                        Replacing content for &ldquo;{replacingLesson.title}&rdquo;.{' '}
                        <button
                            type="button"
                            className={`${baseClassName}__replace-cancel`}
                            onClick={cancelReplace}
                        >
                            Cancel
                        </button>
                    </p>
                ) : null}

                <label className={`${baseClassName}__file-input`}>
                    <span>SCORM package (.zip)</span>
                    <input type="file" accept=".zip" onChange={handleFileChange} />
                </label>

                {parseError ? (
                    <p className={`${baseClassName}__error`} role="alert">
                        {parseError}
                    </p>
                ) : null}

                {manifest && selectedFile ? (
                    <form
                        className={`${baseClassName}__details-form`}
                        onSubmit={handleUpload}
                    >
                        <label className={`${baseClassName}__field`}>
                            <span>Title</span>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                        </label>
                        <label className={`${baseClassName}__field`}>
                            <span>Description</span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </label>
                        <label className={`${baseClassName}__field`}>
                            <span>Duration (minutes)</span>
                            <input
                                type="number"
                                min={0}
                                value={durationMinutes}
                                onChange={(event) => setDurationMinutes(event.target.value)}
                            />
                        </label>
                        {uploadError ? (
                            <p className={`${baseClassName}__error`} role="alert">
                                {uploadError}
                            </p>
                        ) : null}
                        <Button type="primary" htmlType="submit" disabled={uploading}>
                            {uploading
                                ? replacingLesson
                                    ? 'Replacing…'
                                    : 'Uploading…'
                                : replacingLesson
                                  ? 'Replace content'
                                  : 'Upload lesson'}
                        </Button>
                    </form>
                ) : null}

                {successMessage ? (
                    <p className={`${baseClassName}__success`} role="status">
                        {successMessage}
                    </p>
                ) : null}
            </Card>

            <section className={`${baseClassName}__list`}>
                <h2>Custom lessons</h2>
                {loadingLessons ? (
                    <p>Loading…</p>
                ) : lessons.length === 0 ? (
                    <p>No custom lessons uploaded yet.</p>
                ) : (
                    <ul className={`${baseClassName}__list__items`}>
                        {lessons.map((lesson) => {
                            const replaces = lesson.replaces_lesson_id
                                ? lessonById.get(lesson.replaces_lesson_id)
                                : null;
                            const supersededBy = lesson.superseded_by_lesson_id
                                ? lessonById.get(lesson.superseded_by_lesson_id)
                                : null;

                            return (
                                <li key={lesson.id} className={`${baseClassName}__list__item`}>
                                    <Card className={`${baseClassName}__list__card`}>
                                        {editingLessonId === lesson.id ? (
                                            <form
                                                className={`${baseClassName}__details-form`}
                                                onSubmit={(event) => handleSaveEdit(event, lesson)}
                                            >
                                                <label className={`${baseClassName}__field`}>
                                                    <span>Title</span>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={editTitle}
                                                        onChange={(event) =>
                                                            setEditTitle(event.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className={`${baseClassName}__field`}>
                                                    <span>Description</span>
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(event) =>
                                                            setEditDescription(event.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className={`${baseClassName}__field`}>
                                                    <span>Duration (minutes)</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={editDurationMinutes}
                                                        onChange={(event) =>
                                                            setEditDurationMinutes(event.target.value)
                                                        }
                                                    />
                                                </label>
                                                {editError ? (
                                                    <p className={`${baseClassName}__error`} role="alert">
                                                        {editError}
                                                    </p>
                                                ) : null}
                                                <div className={`${baseClassName}__list__actions`}>
                                                    <Button
                                                        type="primary"
                                                        htmlType="submit"
                                                        disabled={editSaving}
                                                    >
                                                        {editSaving ? 'Saving…' : 'Save'}
                                                    </Button>
                                                    <Button
                                                        type="tertiary"
                                                        htmlType="button"
                                                        onClick={cancelEdit}
                                                        disabled={editSaving}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className={`${baseClassName}__list__header`}>
                                                    <h3>{lesson.title}</h3>
                                                    {lesson.is_active ? (
                                                        <Badge content="Active" type="subtle" />
                                                    ) : (
                                                        <Badge content="Deactivated" type="subtle" />
                                                    )}
                                                </div>
                                                {lesson.description ? <p>{lesson.description}</p> : null}
                                                {replaces ? (
                                                    <p className={`${baseClassName}__list__lineage`}>
                                                        Replaces: {replaces.title}
                                                    </p>
                                                ) : null}
                                                {supersededBy ? (
                                                    <p className={`${baseClassName}__list__lineage`}>
                                                        Replaced by: {supersededBy.title}
                                                    </p>
                                                ) : null}
                                                <div className={`${baseClassName}__list__actions`}>
                                                    <Button
                                                        type="tertiary"
                                                        onClick={() => startEdit(lesson)}
                                                    >
                                                        Edit details
                                                    </Button>
                                                    {lesson.is_active ? (
                                                        <>
                                                            <Button
                                                                type="secondary"
                                                                onClick={() => startReplace(lesson)}
                                                            >
                                                                Replace content
                                                            </Button>
                                                            <Button
                                                                type="secondary"
                                                                onClick={() => handleDeactivate(lesson)}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        </>
                                                    ) : supersededBy ? null : (
                                                        <Button
                                                            type="secondary"
                                                            onClick={() => handleReactivate(lesson)}
                                                        >
                                                            Reactivate
                                                        </Button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </Card>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default AdminUpload;
