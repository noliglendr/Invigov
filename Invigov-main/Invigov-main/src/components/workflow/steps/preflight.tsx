"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface PreflightProps {
  onPrevious: () => void;
  onComplete: () => void;
}

export function Preflight({ onPrevious, onComplete }: PreflightProps) {
  const queryClient = useQueryClient();

  const { data: preflight, isLoading } = useQuery({
    queryKey: ["preflight"],
    queryFn: async () => {
      const res = await api.get("/workflow/preflight");
      return res.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/workflow/complete");
      return res.data;
    },
    onSuccess: () => {
      // Don't invalidate workflow-session as it will return 403 after completion
      queryClient.invalidateQueries({ queryKey: ["entitlement"] });
      toast.success("Workflow completed!");
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Cannot complete workflow");
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>;
  }

  const isReady = preflight?.is_ready;
  const checks = preflight?.checks || [];
  const blockingCount = preflight?.blocking_count || 0;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`border rounded-md p-4 ${isReady ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex gap-3">
          {isReady ? (
            <svg className="h-5 w-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <p className={`text-sm font-medium ${isReady ? "text-green-900" : "text-red-900"}`}>
              {isReady ? "All checks passed!" : `${blockingCount} blocking issue${blockingCount > 1 ? "s" : ""} found`}
            </p>
            <p className={`text-xs mt-1 ${isReady ? "text-green-700" : "text-red-700"}`}>
              {isReady
                ? "Your workflow is complete and ready for submission."
                : "Please resolve all blocking issues before completing the workflow."}
            </p>
          </div>
        </div>
      </div>

      {/* Checks List */}
      <div className="border border-gray-200 rounded-lg divide-y">
        {checks.map((check: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {check.blocking && !check.passed ? (
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="text-sm font-medium text-gray-900 capitalize">
                {check.name?.replace(/_/g, " ") || "Unknown field"}
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${check.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {check.passed ? "OK" : "Missing"}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button
          onClick={() => completeMutation.mutate()}
          disabled={!isReady || completeMutation.isPending}
        >
          {completeMutation.isPending ? "Completing..." : "Complete Workflow"}
        </Button>
      </div>
    </div>
  );
}
