import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 text-center noise-overlay"
      style={{ background: 'var(--cream)' }}
    >
      <h1
        className="leading-none mb-4 animate-fade-in"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '6rem', fontWeight: 700, color: 'var(--ember)' }}
      >
        404
      </h1>
      <h2
        className="font-medium mb-3 animate-fade-in-up"
        style={{ fontSize: 'var(--text-xl)', color: 'var(--ink)', animationDelay: '100ms' }}
      >
        Page Not Found
      </h2>
      <p
        className="mb-8 max-w-md animate-fade-in-up"
        style={{ fontSize: 'var(--text-base)', color: 'var(--stone)', animationDelay: '200ms' }}
      >
        The route you are seeking does not exist in the console.
      </p>
      <Link
        href="/dashboard"
        className="btn-primary animate-fade-in-up"
        style={{ animationDelay: '300ms' }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
