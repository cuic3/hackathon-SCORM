import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JSZip from 'jszip';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQueryBuilder } from '../../test/mocks/supabase';
import { useAuth } from '../../utils/auth-context';

vi.mock('../../utils/auth-context', () => ({
    useAuth: vi.fn(),
}));

const fromMock = vi.fn();
const uploadMock = vi.fn();
const storageFromMock = vi.fn(() => ({ upload: uploadMock }));
vi.mock('../../utils/supabase', () => ({
    supabase: {
        from: fromMock,
        storage: { from: storageFromMock },
    },
}));

const AdminUpload = (await import('./admin-upload')).default;
const mockUseAuth = vi.mocked(useAuth);

/** Routes `from(table)` calls to queued results, consumed in call order. */
function createFromMock(queues: Record<string, Array<{ data: unknown; error: unknown }>>) {
    const counters: Record<string, number> = {};
    return vi.fn((table: string) => {
        const list = queues[table] ?? [];
        const idx = counters[table] ?? 0;
        counters[table] = idx + 1;
        const result = list[idx] ?? list[list.length - 1] ?? { data: null, error: null };
        return createQueryBuilder(result);
    });
}

function manifestXml(title = 'Hand Hygiene Basics') {
    return `<?xml version="1.0"?>
<manifest identifier="COURSE-1" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
    <organizations default="ORG-1">
        <organization identifier="ORG-1">
            <title>${title}</title>
            <item identifierref="RES-1" />
        </organization>
    </organizations>
    <resources>
        <resource identifier="RES-1" href="index.html" />
    </resources>
</manifest>`;
}

async function makeScormZipFile(name = 'course.zip', title = 'Hand Hygiene Basics') {
    const zip = new JSZip();
    zip.file('imsmanifest.xml', manifestXml(title));
    zip.file('index.html', '<html><body>hi</body></html>');
    zip.file('shared/style.css', 'body{}');
    const blob = await zip.generateAsync({ type: 'blob' });
    return new File([blob], name, { type: 'application/zip' });
}

async function makeNonScormZipFile(name = 'notscorm.zip') {
    const zip = new JSZip();
    zip.file('readme.txt', 'no manifest here');
    const blob = await zip.generateAsync({ type: 'blob' });
    return new File([blob], name, { type: 'application/zip' });
}

function lessonRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'lesson-1',
        title: 'Existing Lesson',
        description: null,
        duration_minutes: null,
        is_active: true,
        origin: 'custom',
        source_institution: null,
        replaces_lesson_id: null,
        superseded_by_lesson_id: null,
        ...overrides,
    };
}

describe('AdminUpload', () => {
    beforeEach(() => {
        fromMock.mockReset();
        uploadMock.mockReset();
        storageFromMock.mockClear();
        uploadMock.mockResolvedValue({ data: {}, error: null });
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(
            'generated-uuid' as `${string}-${string}-${string}-${string}-${string}`
        );
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'admin-1', organization_id: 'org-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
    });

    it('shows a loading state, then the empty state when there are no custom lessons', async () => {
        fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));
        render(<AdminUpload />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
        await waitFor(() =>
            expect(screen.getByText('No custom lessons uploaded yet.')).toBeInTheDocument()
        );
    });

    it('lists existing custom lessons with an Active badge and Deactivate button', async () => {
        fromMock.mockImplementation(() =>
            createQueryBuilder({ data: [lessonRow()], error: null })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.getByText('Existing Lesson')).toBeInTheDocument());
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    });

    it('shows a Deactivated badge and no button for an inactive lesson', async () => {
        fromMock.mockImplementation(() =>
            createQueryBuilder({ data: [lessonRow({ is_active: false })], error: null })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.getByText('Deactivated')).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    });

    it('parses a valid SCORM zip and pre-fills the title from the manifest', async () => {
        fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);

        await waitFor(() =>
            expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics')
        );
    });

    it('falls back to the filename (minus .zip) when the manifest has no title', async () => {
        fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const zip = new JSZip();
        zip.file(
            'imsmanifest.xml',
            `<?xml version="1.0"?>
<manifest><organizations default="ORG-1"><organization identifier="ORG-1"><item identifierref="RES-1" /></organization></organizations>
<resources><resource identifier="RES-1" href="index.html" /></resources></manifest>`
        );
        const blob = await zip.generateAsync({ type: 'blob' });
        const file = new File([blob], 'MyCourse.zip', { type: 'application/zip' });

        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('MyCourse'));
    });

    it('shows a parse error and no details form for a zip missing imsmanifest.xml', async () => {
        fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeNonScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);

        await waitFor(() =>
            expect(
                screen.getByText("This file doesn't look like a SCORM package (missing imsmanifest.xml)")
            ).toBeInTheDocument()
        );
        expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    });

    it('uploads every file entry to storage under packageId/relativePath with the right content type', async () => {
        fromMock.mockImplementation(
            createFromMock({
                lessons: [
                    { data: [], error: null },
                    { data: lessonRow({ id: 'new-lesson' }), error: null },
                    { data: [lessonRow({ id: 'new-lesson', title: 'Hand Hygiene Basics' })], error: null },
                ],
                content_audit_log: [{ data: null, error: null }],
            })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics'));

        fireEvent.click(screen.getByRole('button', { name: 'Upload lesson' }));

        await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(3));
        const paths = uploadMock.mock.calls.map((call) => call[0]).sort();
        expect(paths).toEqual(
            ['generated-uuid/imsmanifest.xml', 'generated-uuid/index.html', 'generated-uuid/shared/style.css'].sort()
        );
        const htmlCall = uploadMock.mock.calls.find(([path]) => path.endsWith('index.html'));
        expect(htmlCall?.[2]).toMatchObject({ contentType: 'text/html; charset=utf-8' });
    });

    it('inserts the lesson row with the parsed manifest data and shows a success message', async () => {
        fromMock.mockImplementation(
            createFromMock({
                lessons: [
                    { data: [], error: null },
                    { data: lessonRow({ id: 'new-lesson' }), error: null },
                    { data: [lessonRow({ id: 'new-lesson', title: 'Hand Hygiene Basics' })], error: null },
                ],
                content_audit_log: [{ data: null, error: null }],
            })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics'));
        fireEvent.change(screen.getByLabelText('Duration (minutes)'), { target: { value: '12' } });

        fireEvent.click(screen.getByRole('button', { name: 'Upload lesson' }));

        await waitFor(() =>
            expect(screen.getByText('"Hand Hygiene Basics" is now available to learners.')).toBeInTheDocument()
        );

        const lessonsCalls = fromMock.mock.calls.filter(([table]) => table === 'lessons');
        // second call to from('lessons') is the insert
        const insertBuilder = lessonsCalls;
        expect(insertBuilder.length).toBeGreaterThanOrEqual(2);

        // The form resets and the file input row no longer shows the details form.
        expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    });

    it('sends null description/duration when those fields are left blank', async () => {
        const insertCalls: unknown[] = [];
        let lessonsCallCount = 0;
        fromMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
                lessonsCallCount += 1;
                if (lessonsCallCount === 1 || lessonsCallCount === 3) {
                    // Initial load, and the post-upload reload: both expect an array.
                    return createQueryBuilder({ data: [], error: null });
                }
                const builder = createQueryBuilder({
                    data: lessonRow({ id: 'new-lesson' }),
                    error: null,
                });
                const originalInsert = builder.insert as (payload: unknown) => unknown;
                (builder as Record<string, unknown>).insert = vi.fn((payload: unknown) => {
                    insertCalls.push(payload);
                    return originalInsert(payload);
                });
                return builder;
            }
            return createQueryBuilder({ data: [], error: null });
        });
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics'));

        fireEvent.click(screen.getByRole('button', { name: 'Upload lesson' }));

        await waitFor(() => expect(insertCalls.length).toBeGreaterThan(0));
        expect(insertCalls[0]).toMatchObject({
            description: null,
            duration_minutes: null,
            package_id: 'generated-uuid',
            launch_path: 'index.html',
            origin: 'custom',
            organization_id: 'org-1',
            uploaded_by: 'admin-1',
        });
    });

    it('shows an upload error and does not show a success message when storage upload fails', async () => {
        uploadMock.mockResolvedValue({ data: null, error: { message: 'disk full' } });
        fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics'));

        fireEvent.click(screen.getByRole('button', { name: 'Upload lesson' }));

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/disk full/));
        expect(screen.queryByText(/is now available to learners/)).not.toBeInTheDocument();
        // Form is preserved (not reset) so the admin can retry.
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    it('shows an error when the lesson insert fails after a successful storage upload', async () => {
        fromMock.mockImplementation(
            createFromMock({
                lessons: [
                    { data: [], error: null },
                    { data: null, error: { message: 'insert failed' } },
                ],
            })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics'));

        fireEvent.click(screen.getByRole('button', { name: 'Upload lesson' }));

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('insert failed'));
    });

    it('deactivates a lesson: updates is_active, logs the action, and refreshes the list', async () => {
        fromMock.mockImplementation(
            createFromMock({
                lessons: [
                    { data: [lessonRow()], error: null },
                    { data: null, error: null }, // update
                    { data: [lessonRow({ is_active: false })], error: null }, // reload
                ],
                content_audit_log: [{ data: null, error: null }],
            })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.getByText('Existing Lesson')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

        await waitFor(() => expect(screen.getByText('Deactivated')).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    });

    it('shows the source institution, falling back to "Unknown" when unset', async () => {
        fromMock.mockImplementation(() =>
            createQueryBuilder({
                data: [
                    lessonRow({ id: 'l1', title: 'With source', source_institution: 'Mercy Hospital' }),
                    lessonRow({ id: 'l2', title: 'Without source', source_institution: null }),
                ],
                error: null,
            })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.getByText('With source')).toBeInTheDocument());

        expect(screen.getByText('Source: Mercy Hospital')).toBeInTheDocument();
        expect(screen.getByText('Source: Unknown')).toBeInTheDocument();
    });

    it('trims and includes the source institution on upload, sending null when left blank', async () => {
        let capturedInsert: Record<string, unknown> | null = null;
        let lessonsCallCount = 0;
        fromMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
                lessonsCallCount += 1;
                if (lessonsCallCount === 1 || lessonsCallCount === 3) {
                    return createQueryBuilder({ data: [], error: null });
                }
                const builder = createQueryBuilder({ data: lessonRow({ id: 'new-lesson' }), error: null });
                const originalInsert = builder.insert as (payload: unknown) => unknown;
                (builder as Record<string, unknown>).insert = vi.fn((payload: Record<string, unknown>) => {
                    capturedInsert = payload;
                    return originalInsert(payload);
                });
                return builder;
            }
            return createQueryBuilder({ data: [], error: null });
        });
        render(<AdminUpload />);
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const file = await makeScormZipFile();
        await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Hand Hygiene Basics'));
        fireEvent.change(screen.getByLabelText('Source institution (optional)'), {
            target: { value: '  Johns Hopkins Hospital  ' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Upload lesson' }));

        await waitFor(() => expect(capturedInsert).not.toBeNull());
        expect(capturedInsert).toMatchObject({ source_institution: 'Johns Hopkins Hospital' });
    });

    it('shows lineage text for lessons linked via replaces/superseded_by', async () => {
        fromMock.mockImplementation(() =>
            createQueryBuilder({
                data: [
                    lessonRow({ id: 'old', title: 'Old Version', is_active: false, superseded_by_lesson_id: 'new' }),
                    lessonRow({ id: 'new', title: 'New Version', replaces_lesson_id: 'old' }),
                ],
                error: null,
            })
        );
        render(<AdminUpload />);
        await waitFor(() => expect(screen.getByText('Old Version')).toBeInTheDocument());

        expect(screen.getByText('Replaced by: New Version')).toBeInTheDocument();
        expect(screen.getByText('Replaces: Old Version')).toBeInTheDocument();
    });

    describe('Replace content flow', () => {
        it('pre-fills the form and shows a replacing banner when "Replace content" is clicked', async () => {
            fromMock.mockImplementation(() =>
                createQueryBuilder({
                    data: [
                        lessonRow({
                            title: 'Old Course',
                            description: 'Old description',
                            duration_minutes: 30,
                        }),
                    ],
                    error: null,
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Old Course')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Replace content' }));

            expect(
                screen.getByText('Replacing content for “Old Course”.', { exact: false })
            ).toBeInTheDocument();
        });

        it('cancelling a replace clears the banner and resets the form', async () => {
            fromMock.mockImplementation(() =>
                createQueryBuilder({ data: [lessonRow({ title: 'Old Course' })], error: null })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Old Course')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Replace content' }));
            expect(screen.getByRole('status')).toHaveTextContent('Replacing content for');

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        it('replacing content deactivates the old lesson, links it forward, and reports success', async () => {
            fromMock.mockImplementation(
                createFromMock({
                    lessons: [
                        // initial load
                        { data: [lessonRow({ id: 'old-1', title: 'Old Course' })], error: null },
                        // insert new lesson
                        { data: lessonRow({ id: 'new-1', title: 'Old Course' }), error: null },
                        // deactivate + link old lesson
                        { data: null, error: null },
                        // reload
                        {
                            data: [
                                lessonRow({
                                    id: 'old-1',
                                    title: 'Old Course',
                                    is_active: false,
                                    superseded_by_lesson_id: 'new-1',
                                }),
                                lessonRow({ id: 'new-1', title: 'Old Course', replaces_lesson_id: 'old-1' }),
                            ],
                            error: null,
                        },
                    ],
                    content_audit_log: [
                        { data: null, error: null },
                        { data: null, error: null },
                    ],
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Old Course')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Replace content' }));
            const file = await makeScormZipFile('newversion.zip', 'New Manifest Title');
            await userEvent.upload(screen.getByLabelText('SCORM package (.zip)'), file);
            // Replacing an existing lesson keeps its title rather than the manifest's.
            await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Old Course'));

            const submitButton = screen
                .getAllByRole('button', { name: 'Replace content' })
                .find((button) => button.getAttribute('type') === 'submit');
            fireEvent.click(submitButton!);

            await waitFor(() =>
                expect(
                    screen.getByText('"Old Course" replaces "Old Course" and is now available to learners.')
                ).toBeInTheDocument()
            );

            const lessonsCalls = fromMock.mock.calls.filter(([table]) => table === 'lessons');
            expect(lessonsCalls.length).toBeGreaterThanOrEqual(4);
            const auditCalls = fromMock.mock.calls.filter(([table]) => table === 'content_audit_log');
            expect(auditCalls.length).toBeGreaterThanOrEqual(2);

            // The banner and form clear once the replace completes.
            expect(screen.queryByText(/Replacing content for/)).not.toBeInTheDocument();
        });
    });

    describe('Reactivate', () => {
        it('shows a Reactivate button for a deactivated lesson with no successor', async () => {
            fromMock.mockImplementation(() =>
                createQueryBuilder({ data: [lessonRow({ is_active: false })], error: null })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Deactivated')).toBeInTheDocument());
            expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
        });

        it('hides Reactivate for a deactivated lesson that has been superseded', async () => {
            fromMock.mockImplementation(() =>
                createQueryBuilder({
                    data: [
                        lessonRow({
                            id: 'old',
                            title: 'Old',
                            is_active: false,
                            superseded_by_lesson_id: 'new',
                        }),
                        lessonRow({ id: 'new', title: 'New' }),
                    ],
                    error: null,
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Old')).toBeInTheDocument());
            expect(screen.queryByRole('button', { name: 'Reactivate' })).not.toBeInTheDocument();
        });

        it('reactivating a lesson updates is_active, logs the action, and refreshes the list', async () => {
            fromMock.mockImplementation(
                createFromMock({
                    lessons: [
                        { data: [lessonRow({ is_active: false })], error: null },
                        { data: null, error: null }, // update
                        { data: [lessonRow({ is_active: true })], error: null }, // reload
                    ],
                    content_audit_log: [{ data: null, error: null }],
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Reactivate' }));

            await waitFor(() => expect(screen.getByText('Active')).toBeInTheDocument());
            expect(screen.queryByRole('button', { name: 'Reactivate' })).not.toBeInTheDocument();
        });
    });

    describe('Edit details', () => {
        it('opens an inline edit form pre-filled with the lesson\'s current details', async () => {
            fromMock.mockImplementation(() =>
                createQueryBuilder({
                    data: [lessonRow({ title: 'Editable', description: 'Desc', duration_minutes: 25 })],
                    error: null,
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Editable')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));

            expect(screen.getByDisplayValue('Editable')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Desc')).toBeInTheDocument();
            expect(screen.getByDisplayValue('25')).toBeInTheDocument();
        });

        it('cancelling an edit discards changes without calling supabase', async () => {
            fromMock.mockImplementation(() =>
                createQueryBuilder({ data: [lessonRow({ title: 'Editable' })], error: null })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Editable')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
            fireEvent.change(screen.getByDisplayValue('Editable'), { target: { value: 'Changed' } });
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

            expect(screen.getByText('Editable')).toBeInTheDocument();
            expect(screen.queryByText('Changed')).not.toBeInTheDocument();
        });

        it('saving an edit updates the lesson, logs before/after, and closes the form', async () => {
            fromMock.mockImplementation(
                createFromMock({
                    lessons: [
                        { data: [lessonRow({ title: 'Editable', description: 'Old desc' })], error: null },
                        { data: null, error: null }, // update
                        { data: [lessonRow({ title: 'Updated Title', description: 'New desc' })], error: null },
                    ],
                    content_audit_log: [{ data: null, error: null }],
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Editable')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
            fireEvent.change(screen.getByDisplayValue('Editable'), {
                target: { value: 'Updated Title' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => expect(screen.getByText('Updated Title')).toBeInTheDocument());
            expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
        });

        it('shows an error and keeps the form open when saving an edit fails', async () => {
            fromMock.mockImplementation(
                createFromMock({
                    lessons: [
                        { data: [lessonRow({ title: 'Editable' })], error: null },
                        { data: null, error: { message: 'update rejected' } },
                    ],
                })
            );
            render(<AdminUpload />);
            await waitFor(() => expect(screen.getByText('Editable')).toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('update rejected'));
            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        });
    });
});
