import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-24 text-center sm:py-32 lg:px-8">
      <h1 className="text-5xl text-base font-semibold text-primary-background">404</h1>      
      <h2 className="mt-4 font-bold tracking-tight text-gray-900 sm:text-5xl">
        Page not found
      </h2>
      
      <p className="mt-6 text-base leading-7 text-gray-600 max-w-md">
        Sorry, we couldn’t find the page you’re looking for. It might have been moved or deleted.
      </p>
      
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}