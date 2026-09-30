"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { SubscriptionTier } from "@/types";

type PaymentStatus = "processing" | "completed" | "failed" | "timeout";

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  intelligence: "Intelligence",
  complete: "Complete",
};

const TIER_PRICES: Record<SubscriptionTier, string> = {
  free: "$0",
  intelligence: "$199.00/month",
  complete: "$279.00/month",
};

interface EntitlementResponse {
  id: string;
  email: string;
  role: string;
  workspace_id: string;
  entitlement: {
    subscription_tier: SubscriptionTier;
    subscription_status: string;
  };
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const tier = (searchParams.get("tier") ?? "intelligence") as SubscriptionTier;

  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const MAX_POLLING_TIME = 10000; // 10 seconds
  const POLLING_INTERVAL = 1000; // 1 second

  // Poll entitlement status
  const { refetch } = useQuery<EntitlementResponse>({
    queryKey: ["entitlement-check"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    enabled: false, // Manual refetch
    retry: false,
  });

  useEffect(() => {
    if (!sessionId) {
      router.push("/dashboard/billing");
      return;
    }

    // Start polling
    const startTime = Date.now();
    const pollInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      setTimeElapsed(elapsed);
      setPollingAttempts((prev) => prev + 1);

      // Refetch entitlement status
      const result = await refetch();

      if (result.data) {
        const { entitlement: ent } = result.data;

        // Check if webhook processed successfully
        if (
          ent.subscription_tier === tier &&
          ent.subscription_status === "active"
        ) {
          setStatus("completed");
          clearInterval(pollInterval);
          return;
        }
      }

      // Timeout after 10 seconds
      if (elapsed >= MAX_POLLING_TIME) {
        setStatus("timeout");
        clearInterval(pollInterval);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [sessionId, tier, refetch, router]);

  const tierLabel = TIER_LABELS[tier] ?? tier;

  const backLink = (
    <Link
      href="/dashboard/billing"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to billing
    </Link>
  );

  // Render processing state
  if (status === "processing") {
    return (
      <div className="max-w-4xl mx-auto">
        {backLink}
        <Card>
          <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-blue-600 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Processing your payment...</h1>
            <p className="text-gray-600 mb-6">
              We're confirming your {tierLabel} plan payment with Stripe. This usually takes just a few seconds.
            </p>
            <div className="text-sm text-gray-500">
              <p>Polling attempt: {pollingAttempts}</p>
              <p>Time elapsed: {(timeElapsed / 1000).toFixed(1)}s</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render completed state
  if (status === "completed") {
    return (
      <div className="max-w-4xl mx-auto">
        {backLink}
        <Card>
          <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment successful!</h1>
            <p className="text-gray-600 mb-8">
              Your {tierLabel} plan is now active. You have full access to all {tierLabel}-tier features.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Confirmation</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900">
                    {tierLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">
                    {TIER_PRICES[tier] ?? tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard">
                <Button size="lg">Go to dashboard</Button>
              </Link>
              <Link href="/dashboard/billing">
                <Button size="lg" variant="secondary">
                  View billing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render timeout state
  if (status === "timeout") {
    return (
      <div className="max-w-4xl mx-auto">
        {backLink}
        <Card>
          <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Processing is taking longer than expected</h1>
            <p className="text-gray-600 mb-8">
              Your payment was successful, but we're still confirming your {tierLabel} plan activation with Stripe.
              This can take a few minutes. Please check your dashboard or refresh this page.
            </p>

            <Alert variant="info" title="Don't worry!" className="mb-8 text-left">
              Your payment has been received by Stripe. Your {tierLabel} plan will be activated automatically within a few minutes.
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => window.location.reload()}>
                Refresh page
              </Button>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render failed state
  return (
    <div className="max-w-4xl mx-auto">
      {backLink}
      <Card>
        <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center">
          <div className="mb-6">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-600 mb-8">
            We couldn't confirm your payment. Please contact support if you were charged.
          </p>
          <Link href="/dashboard/billing">
            <Button size="lg">Return to billing</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-blue-600 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Loading...</h1>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
