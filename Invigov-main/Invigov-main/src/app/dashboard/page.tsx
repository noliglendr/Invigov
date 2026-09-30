"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Entitlement } from "@/types";

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

function EntitlementStatusCard({ entitlement }: { entitlement: Entitlement }) {
  const tier = entitlement.subscription_tier ?? "free";
  const subStatus = entitlement.subscription_status ?? "active";

  const tierNames: Record<string, string> = {
    free: "Free",
    intelligence: "Intelligence",
    complete: "Complete",
  };

  const tierDescriptions: Record<string, string> = {
    free: "Account setup and plan management",
    intelligence: "AI-powered discovery, alerts, and bid documents",
    complete: "Full platform with SAM.gov compliance automation",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <Badge
            variant={
              subStatus === "active" && tier !== "free"
                ? "success"
                : subStatus === "expired"
                ? "warning"
                : subStatus === "canceled"
                ? "error"
                : subStatus === "pending_checkout"
                ? "info"
                : "neutral"
            }
          >
            {tier === "free" ? "Free Plan" : subStatus === "active" ? "Active" : subStatus === "expired" ? "Past due" : subStatus === "pending_checkout" ? "Processing" : subStatus === "canceled" ? "Canceled" : "Free Plan"}
          </Badge>
        </div>
        <p className="text-sm font-semibold text-gray-900">{tierNames[tier] || "Free"} Plan</p>
        <p className="mt-1 text-xs text-gray-400">{tierDescriptions[tier] || tierDescriptions.free}</p>
        {tier !== "free" && subStatus === "active" && entitlement.subscription_end_at && (
          <p className="mt-2 text-xs text-gray-500">
            Renews on{" "}
            <span className="font-medium text-gray-700">
              {new Date(entitlement.subscription_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </p>
        )}
        {tier !== "free" && (subStatus === "expired" || subStatus === "canceled") && entitlement.subscription_end_at && (
          <p className="mt-2 text-xs text-red-500">
            Expired on{" "}
            <span className="font-medium">
              {new Date(entitlement.subscription_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </p>
        )}
        <div className="mt-4">
          {tier === "free" ? (
            <Link href="/dashboard/billing">
              <Button size="sm" className="w-full">Upgrade Plan</Button>
            </Link>
          ) : subStatus === "pending_checkout" ? (
            <Button size="sm" variant="secondary" className="w-full" disabled>Processing payment...</Button>
          ) : subStatus === "active" ? (
            <Link href="/dashboard/billing">
              <Button size="sm" variant="secondary" className="w-full">Manage Plan</Button>
            </Link>
          ) : (
            <Link href="/dashboard/billing">
              <Button size="sm" className="w-full">Renew Subscription</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const quickLinks = [
  {
    title: "SAM Registration Workflow",
    description: "Complete your 7-step guided federal registration",
    href: "/dashboard/workflow",
    image: "/images/workflow-illustration.svg",
    color: "blue",
    icon: (
      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Compliance Dashboard",
    description: "Track renewal deadlines and compliance status",
    href: "/dashboard/compliance",
    image: "/images/compliance-calendar.svg",
    color: "emerald",
    icon: (
      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Billing & Access",
    description: "Manage your subscription and payment methods",
    href: "/dashboard/billing",
    image: "/images/secure-payment.svg",
    color: "violet",
    icon: (
      <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

const iconBgMap: Record<string, string> = {
  blue: "bg-blue-50",
  emerald: "bg-emerald-50",
  violet: "bg-violet-50",
};

export default function DashboardPage() {
  const { data: entitlement, isLoading, isError } = useEntitlement();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7 shadow-sm">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="dash-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dash-grid)"/>
          </svg>
        </div>
        {/* Glow */}
        <div className="absolute right-0 top-0 w-64 h-full opacity-20">
          <div className="w-full h-full bg-white rounded-full blur-3xl scale-75 translate-x-1/4"/>
        </div>

        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Federal Contract Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Your Federal Contracting<br/>Dashboard
            </h1>
            <p className="mt-2 text-sm text-blue-200 max-w-xs">
              From SAM registration to contract award — manage everything in one place.
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Image
              src="/images/hero-federal.svg"
              alt="Federal building"
              width={200}
              height={150}
              unoptimized
              className="drop-shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Entitlement status */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Access Status
        </h2>
        {isLoading && (
          <div className="h-36 rounded-lg border border-gray-100 bg-white animate-pulse" />
        )}
        {isError && (
          <Card>
            <CardContent className="pt-6 text-sm text-gray-500">
              Unable to load entitlement status. Please refresh the page.
            </CardContent>
          </Card>
        )}
        {entitlement && <EntitlementStatusCard entitlement={entitlement} />}
      </section>

      {/* Quick links with images */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Quick Navigation
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="overflow-hidden hover:shadow-md hover:border-blue-200 transition-all h-full">
                {/* Image preview */}
                <div className="relative h-32 bg-gray-50 overflow-hidden">
                  <Image
                    src={link.image}
                    alt={link.title}
                    fill
                    unoptimized
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <div className={`h-8 w-8 rounded-lg ${iconBgMap[link.color]} flex items-center justify-center mb-2`}>
                    {link.icon}
                  </div>
                  <CardTitle className="text-sm leading-tight">{link.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{link.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
