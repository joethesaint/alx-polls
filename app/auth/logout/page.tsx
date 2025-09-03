"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear dev user session
    localStorage.removeItem("devUser");
    localStorage.removeItem("isDevMode");

    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      router.push("/auth/login");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Logging out...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You have been successfully logged out.
          </p>
        </div>

        <div className="mt-4">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
