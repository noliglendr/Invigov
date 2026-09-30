"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface RepsCertsFormProps {
  initialData?: any;
  onNext: () => void;
  onPrevious: () => void;
  onSave: (data: any) => void;
  businessType: string;
}

export function RepsCertsForm({ initialData, onNext, onPrevious, onSave, businessType }: RepsCertsFormProps) {
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState<Record<string, any>>({});

  // Fetch applicable FAR/DFARS clauses
  const { data: clauses, isLoading } = useQuery({
    queryKey: ["far-clauses", businessType],
    queryFn: async () => {
      const res = await api.get(`/workflow/far-clauses/${businessType || "corporation"}`);
      return res.data;
    },
    enabled: !!businessType,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/workflow/step/reps-certs", { responses: data });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      onSave(data);
      toast.success("Representations & Certifications saved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save");
    },
  });

  const handleSaveAndContinue = () => {
    saveMutation.mutate(responses, {
      onSuccess: () => onNext(),
    });
  };

  const handleResponseChange = (clauseId: string, questionId: string, value: boolean) => {
    setResponses((prev) => ({
      ...prev,
      [clauseId]: {
        ...(prev[clauseId] || {}),
        [questionId]: value,
      },
    }));
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>;
  }

  const clauseCount = Object.keys(clauses || {}).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <p className="text-sm font-medium text-amber-900">
          {clauseCount} FAR/DFARS Clauses Required
        </p>
        <p className="text-xs text-amber-700 mt-1">
          {businessType === "sole_proprietor"
            ? "DFARS clauses excluded for sole proprietors."
            : "Includes both FAR and DFARS requirements."}
        </p>
      </div>

      {/* Clauses */}
      <div className="space-y-6">
        {Object.entries(clauses || {}).map(([clauseId, clauseData]: [string, any]) => (
          <div key={clauseId} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">
              {clauseId.replace(/_/g, ".")}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{clauseData.title}</p>

            <div className="mt-4 space-y-3">
              {clauseData.questions.map((question: any) => (
                <div key={question.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                  <p className="text-sm text-gray-700 flex-1 order-1 sm:order-2">{question.question}</p>
                  <div className="flex gap-3 shrink-0 order-2 sm:order-1 mt-0 sm:mt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`${clauseId}_${question.id}`}
                        checked={responses[clauseId]?.[question.id] === true}
                        onChange={() => handleResponseChange(clauseId, question.id, true)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`${clauseId}_${question.id}`}
                        checked={responses[clauseId]?.[question.id] === false}
                        onChange={() => handleResponseChange(clauseId, question.id, false)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleSaveAndContinue} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
