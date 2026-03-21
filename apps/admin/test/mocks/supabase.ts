import { vi } from 'vitest';

// Mock for @/lib/supabaseAdmin
export const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null,
          count: 0,
        })),
        single: vi.fn(() => ({ data: null, error: null })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(() => ({ error: null })),
        delete: vi.fn(() => ({ error: null })),
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => ({ data: [], error: null })),
      })),
      limit: vi.fn(() => ({ data: [], error: null })),
    })),
  })),
};

// Helper to create a mock response
export function createMockResponse(data: any, error: any = null) {
  return { data, error };
}

// Helper to build a mock Supabase row
export function mockRow<T>(overrides: Partial<T> = {}): T {
  return {
    id: 'mock-id-123',
    slug: 'mock-slug',
    is_active: true,
    is_veg: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as unknown as T;
}
