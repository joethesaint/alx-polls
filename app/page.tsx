import Link from 'next/link';

export default function Home() {
  return (
    <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
      <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
          Create and Share Polls with Ease
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          ALX Polls is a modern, open-source polling platform that makes it simple to create, share, and analyze polls.
        </p>
        <div className="space-x-4">
          <Link href="/auth/register" className="btn btn-primary">
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="btn btn-secondary"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}