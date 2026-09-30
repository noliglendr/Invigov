"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DeadlineCard } from "@/components/compliance/deadline-card";
import { AddDeadlineDialog } from "@/components/compliance/add-deadline-dialog";
import type { ComplianceDeadline, Entitlement } from "@/types";

interface ComplianceDashboard {
  deadlines: ComplianceDeadline[];
  subscription_renewal_date: string | null;
  completed_count: number;
  total_count: number;
}

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

function useComplianceDashboard(enabled: boolean) {
  return useQuery<ComplianceDashboard>({
    queryKey: ["compliance-dashboard"],
    queryFn: async () => {
      const res = await api.get("/compliance/dashboard");
      return res.data as ComplianceDashboard;
    },
    enabled,
    retry: false,
  });
}

function SubscriptionGate() {
  return (
    <Card className="max-w-md">
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Complete plan required</h3>
          <p className="mt-1.5 text-sm text-gray-500">
            Upgrade to the Complete plan to access compliance monitoring, renewal tracking, and deadline alerts.
          </p>
        </div>
        <Link href="/dashboard/billing">
          <Button>View Plans</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SuspendedBanner({ status }: { status: "expired" | "canceled" }) {
  return (
    <Alert
      variant={status === "expired" ? "warning" : "error"}
      title={status === "expired" ? "Subscription expired" : "Subscription canceled"}
    >
      {status === "expired"
        ? "Your compliance access is suspended. Renew your subscription to restore access."
        : "Your subscription has been canceled. Subscribe again to restore compliance monitoring."}
      {" "}
      <Link href="/dashboard/billing" className="font-medium underline">
        Go to Billing
      </Link>
    </Alert>
  );
}

type FilterType = "all" | "pending" | "completed" | "critical";

export default function CompliancePage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: entitlement, isLoading: entLoading } = useEntitlement();

  // New tier model: compliance requires "complete" tier with active subscription
  // Backward compat: also check legacy compliance_subscription_status
  const hasCompleteTier = entitlement?.subscription_tier === "complete" && entitlement?.subscription_status === "active";
  const legacySubStatus = entitlement?.compliance_subscription_status;
  const hasAccess = hasCompleteTier || legacySubStatus === "active";
  const subStatus = hasCompleteTier ? "active" : legacySubStatus;

  const { data: dashboard, isLoading: dashLoading } = useComplianceDashboard(hasAccess);

  const completeDeadline = useMutation({
    mutationFn: (id: string) =>
      api.post(`/compliance/deadlines/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-dashboard"] });
    },
  });

  const isLoading = entLoading || (hasAccess && dashLoading);

  // Filter deadlines based on selected filter
  const filteredDeadlines = dashboard?.deadlines.filter((deadline) => {
    if (filter === "all") return true;
    if (filter === "pending") return !deadline.is_completed;
    if (filter === "completed") return deadline.is_completed;
    if (filter === "critical") return deadline.urgency === "critical" && !deadline.is_completed;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with illustration */}
      <div className="flex items-center justify-between gap-4 sm:gap-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-4 sm:px-6 py-4 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Renewal deadlines and compliance status monitoring
          </p>
        </div>
        <div className="hidden sm:block shrink-0">
          <Image
            src="/images/compliance-calendar.svg"
            alt="Compliance calendar"
            width={160}
            height={125}
            unoptimized
            className="drop-shadow-sm"
          />
        </div>
      </div>

      {/* Not subscribed */}
      {(subStatus === "inactive" || !subStatus) && <SubscriptionGate />}

      {/* Suspended */}
      {(subStatus === "expired" || subStatus === "canceled") && (
        <SuspendedBanner status={subStatus} />
      )}

      {/* Active */}
      {hasAccess && dashboard && (
        <>
          {/* Summary row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total deadlines</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{dashboard.total_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{dashboard.completed_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {dashboard.total_count - dashboard.completed_count}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Deadlines list */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>Click the checkbox to mark a deadline as complete</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        dashboard.deadlines.some((d) => d.urgency === "critical")
                          ? "error"
                          : dashboard.deadlines.some((d) => d.urgency === "warning")
                          ? "warning"
                          : "success"
                      }
                    >
                      {dashboard.deadlines.filter((d) => !d.is_completed && d.urgency === "critical").length > 0
                        ? `${dashboard.deadlines.filter((d) => !d.is_completed && d.urgency === "critical").length} critical`
                        : "All on track"}
                    </Badge>
                    <AddDeadlineDialog />
                  </div>
                </div>

                {/* Filter buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Filter:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filter === "all" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      All ({dashboard.deadlines.length})
                    </Button>
                    <Button
                      variant={filter === "pending" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("pending")}
                    >
                      Pending ({dashboard.deadlines.filter(d => !d.is_completed).length})
                    </Button>
                    <Button
                      variant={filter === "completed" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("completed")}
                    >
                      Completed ({dashboard.completed_count})
                    </Button>
                    <Button
                      variant={filter === "critical" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("critical")}
                    >
                      Critical ({dashboard.deadlines.filter(d => d.urgency === "critical" && !d.is_completed).length})
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredDeadlines.length === 0 && dashboard.deadlines.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Image
                    src="/images/empty-state.svg"
                    alt="No deadlines"
                    width={200}
                    height={143}
                    unoptimized
                  />
                  <p className="text-sm text-gray-400 text-center">
                    No deadlines yet. They will appear here after your SAM workflow is completed.
                  </p>
                </div>
              )}
              {filteredDeadlines.length === 0 && dashboard.deadlines.length > 0 && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <p className="text-sm text-gray-500 text-center">
                    No deadlines match the selected filter.
                  </p>
                </div>
              )}
              {filteredDeadlines.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  deadline={deadline}
                  onComplete={(id) => completeDeadline.mutate(id)}
                  completing={completeDeadline.isPending}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
