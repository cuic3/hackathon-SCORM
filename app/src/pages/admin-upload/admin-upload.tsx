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
    const [sourceInstitution, setSourceInstitution] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    const resetUploadForm = () => {
        setSelectedFile(null);
        setManifest(null);
        setTitle('');
        setDescription('');
        setDurationMinutes('');
        setSourceInstitution('');
        setParseError(null);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setSuccessMessage(null);
        setUploadError(null);
        resetUploadForm();
        if (!file) return;

        setSelectedFile(file);
        try {
            const { manifest: parsed } = await loadScormPackage(file);
            setManifest(parsed);
            setTitle(parsed.title ?? file.name.replace(/\.zip$/i, ''));
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
                    source_institution: sourceInstitution.trim() || null,
                    package_id: packageId,
                    launch_path: manifest.launchPath,
                    manifest_title: manifest.title,
                    uploaded_by: profile.id,
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
                detail: {
                    filename: selectedFile.name,
                    manifestTitle: manifest.title,
                    launchPath: manifest.launchPath,
                },
            });

            setSuccessMessage(`"${title}" is now available to learners.`);
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
                        <label className={`${baseClassName}__field`}>
                            <span>Source institution (optional)</span>
                            <input
                                type="text"
                                placeholder="e.g. Johns Hopkins Hospital"
                                value={sourceInstitution}
                                onChange={(event) => setSourceInstitution(event.target.value)}
                            />
                        </label>
                        {uploadError ? (
                            <p className={`${baseClassName}__error`} role="alert">
                                {uploadError}
                            </p>
                        ) : null}
                        <Button type="primary" htmlType="submit" disabled={uploading}>
                            {uploading ? 'Uploading…' : 'Upload lesson'}
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
                        {lessons.map((lesson) => (
                            <li key={lesson.id} className={`${baseClassName}__list__item`}>
                                <Card className={`${baseClassName}__list__card`}>
                                    <div className={`${baseClassName}__list__header`}>
                                        <h3>{lesson.title}</h3>
                                        {lesson.is_active ? (
                                            <Badge content="Active" type="subtle" />
                                        ) : (
                                            <Badge content="Deactivated" type="subtle" />
                                        )}
                                    </div>
                                    <p className={`${baseClassName}__list__source`}>
                                        Source: {lesson.source_institution ?? 'Unknown'}
                                    </p>
                                    {lesson.description ? <p>{lesson.description}</p> : null}
                                    {lesson.is_active ? (
                                        <Button
                                            type="secondary"
                                            onClick={() => handleDeactivate(lesson)}
                                        >
                                            Deactivate
                                        </Button>
                                    ) : null}
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default AdminUpload;
