"use client";

import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import type { Entitlement, SubscriptionTier } from "@/types";

function useEntitlement() {
  return useQuery<Entitlement>({
    queryKey: ["entitlement"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.entitlement as Entitlement;
    },
    retry: false,
  });
}

const CHECK_ICON = (
  <svg className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

interface TierConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  popular: boolean;
  features: string[];
}

const TIERS: TierConfig[] = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    description: "Get started with your federal compliance journey",
    popular: false,
    features: [
      "Account & workspace setup",
      "Entitlement status tracking",
      "Access to billing & plan management",
    ],
  },
  {
    tier: "intelligence",
    name: "Intelligence",
    price: 199,
    priceLabel: "$199",
    description: "Compliance monitoring with automated renewal alerts",
    popular: true,
    features: [
      "Everything in Free, plus:",
      "Compliance deadline dashboard",
      "Multi-channel renewal alerts (30d/14d/7d/1d)",
      "Custom deadline tracking",
      "Email notifications via Resend",
    ],
  },
  {
    tier: "complete",
    name: "Complete",
    price: 279,
    priceLabel: "$279",
    description: "Full SAM.gov registration, document generation, and compliance suite",
    popular: false,
    features: [
      "Everything in Intelligence, plus:",
      "7-step SAM.gov registration workflow",
      "Auto-generated compliance documents (3 PDFs)",
      "AES-256 encrypted data storage",
      "Save & resume workflow progress",
      "Unified compliance dashboard",
    ],
  },
];

const TIER_ORDER: SubscriptionTier[] = ["free", "intelligence", "complete"];

function isUpgrade(current: SubscriptionTier, target: SubscriptionTier): boolean {
  return TIER_ORDER.indexOf(target) > TIER_ORDER.indexOf(current);
}

function PlanCard({
  config,
  currentTier,
  subscriptionStatus,
}: {
  config: TierConfig;
  currentTier: SubscriptionTier;
  subscriptionStatus: string;
}) {
  const { error: toastError } = useToast();
  const isCurrent = currentTier === config.tier;
  const canUpgrade = isUpgrade(currentTier, config.tier);

  const checkout = useMutation({
    mutationFn: () => api.post(`/payments/checkout/${config.tier}`),
    onSuccess: (res) => {
      window.location.href = res.data.checkout_url;
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      toastError(
        e.response?.data?.detail ?? "Unable to start checkout. Please try again.",
        "Checkout failed"
      );
    },
  });

  return (
    <Card
      className={`flex flex-col ${
        config.popular
          ? "border-2 border-blue-500 shadow-md relative"
          : ""
      }`}
    >
      {config.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="info" className="shadow-sm">
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{config.name}</CardTitle>
          {isCurrent && (
            <Badge variant="success">Current Plan</Badge>
          )}
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <span className="text-3xl font-bold text-gray-900">{config.priceLabel}</span>
          {config.price > 0 && (
            <span className="ml-1 text-sm text-gray-500">/ month</span>
          )}
        </div>
        <ul className="space-y-1.5 text-sm text-gray-600">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              {CHECK_ICON}
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent && subscriptionStatus === "active" && (
          <Button variant="secondary" disabled className="w-full">
            Current plan
          </Button>
        )}
        {isCurrent && subscriptionStatus === "pending_checkout" && (
          <Button variant="secondary" disabled className="w-full">
            Processing payment...
          </Button>
        )}
        {isCurrent && subscriptionStatus !== "active" && subscriptionStatus !== "pending_checkout" && config.tier === "free" && (
          <Button variant="secondary" disabled className="w-full">
            Current plan
          </Button>
        )}
        {isCurrent && subscriptionStatus !== "active" && subscriptionStatus !== "pending_checkout" && config.tier !== "free" && (
          <Button
            variant="danger"
            onClick={() => checkout.mutate()}
            loading={checkout.isPending}
            className="w-full"
          >
            Renew subscription
          </Button>
        )}
        {!isCurrent && canUpgrade && (
          <Button
            onClick={() => checkout.mutate()}
            loading={checkout.isPending}
            className="w-full"
          >
            Upgrade to {config.name}
          </Button>
        )}
        {!isCurrent && !canUpgrade && (
          <Button variant="secondary" disabled className="w-full">
            {config.tier === "free" ? "Included" : config.name}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function BillingPage() {
  const { data: entitlement, isLoading, isError } = useEntitlement();

  const currentTier = entitlement?.subscription_tier ?? "free";
  const subscriptionStatus = entitlement?.subscription_status ?? "inactive";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header with illustration */}
      <div className="flex items-center justify-between gap-4 sm:gap-6 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 px-4 sm:px-6 py-4 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billing &amp; Access</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose the plan that fits your government contracting needs
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white border border-violet-100 px-3 py-1 shadow-sm">
              <svg className="h-3.5 w-3.5 text-violet-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-medium text-violet-700">Secured by Stripe</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white border border-violet-100 px-3 py-1 shadow-sm">
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-medium text-emerald-700">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:block shrink-0">
          <Image
            src="/images/secure-payment.svg"
            alt="Secure payment"
            width={160}
            height={120}
            unoptimized
            className="drop-shadow-sm"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-96 rounded-lg border border-gray-200 bg-white animate-pulse" />
          <div className="h-96 rounded-lg border border-gray-200 bg-white animate-pulse" />
          <div className="h-96 rounded-lg border border-gray-200 bg-white animate-pulse" />
        </div>
      )}

      {isError && (
        <Alert variant="error">Unable to load billing information. Please refresh.</Alert>
      )}

      {entitlement && (
        <>
          {subscriptionStatus === "active" && currentTier !== "free" && entitlement.subscription_end_at && (
            <Alert variant="info">
              Your {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} plan renews on{" "}
              <strong>
                {new Date(entitlement.subscription_end_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </strong>.
            </Alert>
          )}
          {(subscriptionStatus === "expired" || subscriptionStatus === "canceled") && (
            <Alert variant="warning">
              Your {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} subscription is{" "}
              {subscriptionStatus}. Renew or upgrade to restore access.
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((config) => (
              <PlanCard
                key={config.tier}
                config={config}
                currentTier={currentTier}
                subscriptionStatus={subscriptionStatus}
              />
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-gray-400">
        Payments are processed securely by Stripe. Access changes take effect immediately after payment confirmation.
      </p>
    </div>
  );
}
