"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { StepIndicator, WORKFLOW_STEPS } from "@/components/workflow/step-indicator";
import { BusinessInfoForm } from "@/components/workflow/steps/business-info-form";
import { NaicsCodesForm } from "@/components/workflow/steps/naics-codes-form";
import { BankingInfoForm } from "@/components/workflow/steps/banking-info-form";
import { RepsCertsForm } from "@/components/workflow/steps/reps-certs-form";
import { DocumentReview } from "@/components/workflow/steps/document-review";
import { Preflight } from "@/components/workflow/steps/preflight";
import { Complete } from "@/components/workflow/steps/complete";
import type { WorkflowSession, Entitlement } from "@/types";

function useWorkflowSession(enabled: boolean = true) {
  return useQuery<WorkflowSession | null>({
    queryKey: ["workflow-session"],
    queryFn: async () => {
      try {
        const res = await api.get("/workflow/session");
        return res.data as WorkflowSession;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
    enabled,
  });
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

function PaymentGate() {
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
            Upgrade to the Complete plan to access the SAM.gov registration workflow.
          </p>
        </div>
        <Link href="/dashboard/billing">
          <Button>View Plans</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function WorkflowComplete() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Workflow complete</h3>
            <p className="mt-1.5 text-sm text-gray-500">
              Your SAM.gov registration is complete. Your documents are ready to download.
            </p>
          </div>
          <Alert variant="info">
            Workflow editing is locked after completion. Your documents and data remain accessible in read-only mode.
          </Alert>
        </CardContent>
      </Card>
      {/* SOW §6: Users may view generated documents after completion */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <Complete />
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkflowPage() {
  const { data: entitlement, isLoading: entLoading } = useEntitlement();

  // New tier model: SAM workflow requires "complete" tier with active subscription
  // Backward compat: also check legacy sam_onboarding_status
  const hasCompleteTier = entitlement?.subscription_tier === "complete" && entitlement?.subscription_status === "active";
  const legacySamStatus = entitlement?.sam_onboarding_status;
  const hasAccess = hasCompleteTier || legacySamStatus === "active" || legacySamStatus === "completed";
  const isCompleted = legacySamStatus === "completed";
  const shouldFetchSession = hasAccess;
  const { data: session, isLoading: sessLoading, refetch } = useWorkflowSession(shouldFetchSession);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const isLoading = entLoading || (shouldFetchSession && sessLoading);

  // Sync current step with session data
  useEffect(() => {
    if (session?.current_step) {
      const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === session.current_step);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [session?.current_step]);

  const handleNext = () => {
    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      refetch();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSave = (data: any) => {
    refetch();
  };

  const handleComplete = async () => {
    await refetch();
    // After workflow completion, navigate to the complete step
    const completeIndex = WORKFLOW_STEPS.findIndex((s) => s.key === "complete");
    if (completeIndex !== -1) {
      setCurrentStepIndex(completeIndex);
    }
  };

  const currentStep = WORKFLOW_STEPS[currentStepIndex];
  const businessType = session?.step_data?.business_info?.business_type || "corporation";

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-white border border-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with illustration */}
      <div className="flex items-center justify-between gap-4 sm:gap-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-4 sm:px-6 py-4 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SAM.gov Registration Workflow</h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete your 7-step guided federal registration
          </p>
        </div>
        <div className="hidden sm:block shrink-0">
          <Image
            src="/images/workflow-illustration.svg"
            alt="SAM workflow steps"
            width={180}
            height={135}
            unoptimized
            className="drop-shadow-sm"
          />
        </div>
      </div>

      {!hasAccess && <PaymentGate />}

      {hasAccess && isCompleted && <WorkflowComplete />}

      {hasAccess && !isCompleted && session && (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar: step progress */}
          <div className="w-full md:w-52 shrink-0">
            <Card>
              <CardContent className="py-5 px-4">
                <StepIndicator
                  currentStep={currentStep.key}
                  completedSteps={session?.completed_steps || []}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main: current step card */}
          <div className="flex-1 min-w-0 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{currentStep.label}</CardTitle>
                    <CardDescription>{currentStep.description}</CardDescription>
                  </div>
                  <Badge variant="info">
                    Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Render appropriate form based on current step */}
                {currentStep.key === "business_info" && (
                  <BusinessInfoForm
                    initialData={session?.step_data?.business_info}
                    onNext={handleNext}
                    onSave={handleSave}
                  />
                )}

                {currentStep.key === "naics_codes" && (
                  <NaicsCodesForm
                    initialData={session?.step_data?.naics_codes}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSave={handleSave}
                  />
                )}

                {currentStep.key === "banking_info" && (
                  <BankingInfoForm
                    initialData={session?.step_data?.banking_info}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSave={handleSave}
                  />
                )}

                {currentStep.key === "reps_certs" && (
                  <RepsCertsForm
                    initialData={session?.step_data?.reps_certs}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSave={handleSave}
                    businessType={businessType}
                  />
                )}

                {currentStep.key === "document_review" && (
                  <DocumentReview
                    sessionData={session}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                  />
                )}

                {currentStep.key === "preflight" && (
                  <Preflight onPrevious={handlePrevious} onComplete={handleComplete} />
                )}

                {currentStep.key === "complete" && <Complete />}
              </CardContent>
            </Card>

            {/* Save/resume notice */}
            <p className="text-xs text-gray-400">
              Your progress is automatically saved. You can close this page and resume later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
