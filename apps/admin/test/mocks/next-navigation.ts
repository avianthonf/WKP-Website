import { vi } from 'vitest';

// Mock useRouter
export const mockRouter = {
  push: vi.fn(() => Promise.resolve(true)),
  replace: vi.fn(() => Promise.resolve(true)),
  refresh: vi.fn(() => Promise.resolve(true)),
  back: vi.fn(() => Promise.resolve(true)),
  forward: vi.fn(() => Promise.resolve(true)),
  prefetch: vi.fn(() => Promise.resolve(true)),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/dashboard/toppings',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock createSupabaseServer for client components that need it
vi.mock('@/lib/supabaseServer', () => ({
  createSupabaseServer: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  })),
}));

// Mock revalidatePath and revalidateTag (used in server actions)
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
