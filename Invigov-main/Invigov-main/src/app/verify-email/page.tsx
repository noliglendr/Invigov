"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type VerifyStatus = "verifying" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerifyStatus>(token ? "verifying" : "no-token");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const res = await api.post(`/auth/verify-email?token=${token}`);

        if (cancelled) return;

        // Save tokens
        localStorage.setItem("access_token", res.data.access_token);
        document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;

        setStatus("success");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as { response?: { data?: { detail?: string } } };
        setErrorMessage(e.response?.data?.detail ?? "Verification failed. Please try again.");
        setStatus("error");
      }
    };

    verify();

    return () => { cancelled = true; };
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 mb-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="INVIGOV" width={32} height={32} unoptimized />
          <span className="text-lg font-bold text-gray-900">INVIGOV</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {status === "verifying" && (
            <>
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-8 w-8 text-blue-600 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
              <p className="text-sm text-gray-500">Please wait while we confirm your email address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-sm text-gray-500 mb-6">
                Your account is now active. Redirecting to your dashboard...
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
              <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
              <div className="flex flex-col gap-3">
                <Link href="/login">
                  <Button className="w-full">Go to Sign In</Button>
                </Link>
              </div>
            </>
          )}

          {status === "no-token" && (
            <>
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
              <p className="text-sm text-gray-500 mb-6">
                This verification link is invalid or missing. Please check your email for the correct link.
              </p>
              <Link href="/login">
                <Button>Go to Sign In</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
