import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;

  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isRootPage = request.nextUrl.pathname === '/';

  const isDev = process.env.NODE_ENV === 'development';
  const autoLogin = process.env.NEXT_PUBLIC_ENABLE_AUTO_LOGIN === 'true';

  // 4. If path starts with /dashboard
  if (isDashboardPage) {
    // Bypass if dev mode and auto-login is enabled
    if (isDev && autoLogin) {
      // Allow through
    } else {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (user.email !== adminEmail) {
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
      }
    }
  }

  // 5. If path is exactly / → redirect to /dashboard
  if (isRootPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 6. If path is /login and user is admin → redirect to /dashboard
  if (isLoginPage && user && user.email === adminEmail) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
