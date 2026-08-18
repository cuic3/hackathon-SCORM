import { describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn().mockReturnValue({ mocked: true });
vi.mock('@supabase/supabase-js', () => ({
    createClient: createClientMock,
}));

describe('supabase client', () => {
    it('creates the client from the Vite env vars', async () => {
        const { supabase, supabaseUrl, supabaseAnonKey } = await import('./supabase');

        expect(supabaseUrl).toBe(import.meta.env.VITE_SUPABASE_URL);
        expect(supabaseAnonKey).toBe(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        expect(createClientMock).toHaveBeenCalledWith(supabaseUrl, supabaseAnonKey);
        expect(supabase).toEqual({ mocked: true });
    });
});
