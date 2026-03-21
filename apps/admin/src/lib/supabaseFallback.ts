type MockResult = {
  data: any;
  error: null | { message: string };
  count?: number;
};

const queryChainMethods = new Set([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'order',
  'limit',
  'range',
  'or',
  'filter',
  'match',
  'contains',
  'overlaps',
  'like',
  'ilike',
  'is',
  'not',
  'cs',
  'cd',
  'textSearch',
]);

function createMockResult(mode: 'many' | 'single' | 'head'): MockResult {
  if (mode === 'head') {
    return { data: null, count: 0, error: null };
  }

  return {
    data: mode === 'single' ? null : [],
    error: null,
    count: 0,
  };
}

function createMockQueryBuilder() {
  let mode: 'many' | 'single' | 'head' = 'many';

  const builder: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (
            onFulfilled?: (value: MockResult) => unknown,
            onRejected?: (reason: unknown) => unknown
          ) => Promise.resolve(createMockResult(mode)).then(onFulfilled, onRejected);
        }

        if (prop === 'catch') {
          return () => builder;
        }

        if (prop === 'finally') {
          return () => builder;
        }

        if (prop === 'single' || prop === 'maybeSingle') {
          mode = 'single';
          return builder;
        }

        if (prop === 'select') {
          return (_columns?: string, options?: { head?: boolean }) => {
            if (options?.head) {
              mode = 'head';
            }
            return builder;
          };
        }

        if (prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'upsert') {
          return () => builder;
        }

        if (typeof prop === 'string' && queryChainMethods.has(prop)) {
          return () => builder;
        }

        return builder;
      },
    }
  );

  return builder;
}

function createMockAuth() {
  return {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: { message: 'Supabase is not configured for this environment.' },
    }),
    signOut: async () => ({
      error: null,
    }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe() {} } },
    }),
  };
}

function createMockStorage() {
  return {
    from: () => ({
      upload: async () => ({
        data: null,
        error: { message: 'Supabase is not configured for this environment.' },
      }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  };
}

export function createMockSupabaseClient() {
  return {
    from: () => createMockQueryBuilder(),
    auth: createMockAuth(),
    storage: createMockStorage(),
  } as any;
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function shouldUseMockSupabase() {
  return !hasSupabaseEnv() && (process.env.GITHUB_ACTIONS === 'true' || process.env.NODE_ENV === 'development');
}
