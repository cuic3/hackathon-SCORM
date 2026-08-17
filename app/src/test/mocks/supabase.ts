import { vi } from 'vitest';

/**
 * A chainable stand-in for a PostgREST query builder. Every chain method
 * returns itself; the object is thenable so `await` (with or without a
 * terminal `.single()`/`.maybeSingle()`) resolves to `result`.
 */
export function createQueryBuilder(result: { data: unknown; error: unknown }) {
    const builder: Record<string, unknown> = {};
    const chainMethods = [
        'select',
        'insert',
        'update',
        'upsert',
        'delete',
        'eq',
        'neq',
        'order',
        'in',
        'match',
        'limit',
    ];
    chainMethods.forEach((method) => {
        builder[method] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (
        onFulfilled?: ((value: typeof result) => unknown) | null,
        onRejected?: ((reason: unknown) => unknown) | null
    ) => Promise.resolve(result).then(onFulfilled, onRejected);
    return builder;
}

export function createAuthMock(overrides: Record<string, unknown> = {}) {
    return {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        ...overrides,
    };
}

export function createStorageMock(overrides: Record<string, unknown> = {}) {
    return {
        from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
        ...overrides,
    };
}

export function createSupabaseMock({
    from,
    auth,
    storage,
}: {
    from?: (table: string) => ReturnType<typeof createQueryBuilder>;
    auth?: Record<string, unknown>;
    storage?: Record<string, unknown>;
} = {}) {
    return {
        from: vi.fn(from ?? (() => createQueryBuilder({ data: null, error: null }))),
        auth: createAuthMock(auth),
        storage: createStorageMock(storage),
    };
}
