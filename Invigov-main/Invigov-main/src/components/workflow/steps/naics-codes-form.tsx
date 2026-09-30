"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useAutoSave } from "@/hooks/useAutoSave";

const naicsCodesSchema = z.object({
  naics_codes: z.array(z.object({ value: z.string().regex(/^\d{6}$/, "NAICS code must be 6 digits") })).min(1, "At least one NAICS code required").max(5, "Maximum 5 NAICS codes"),
  primary_naics: z.string().regex(/^\d{6}$/, "Primary NAICS must be 6 digits"),
  annual_receipts_avg: z.number().optional(),
  total_employees: z.number().optional(),
}).refine((data) => data.naics_codes.some(code => code.value === data.primary_naics), {
  message: "Primary NAICS must be in your NAICS codes list",
  path: ["primary_naics"],
});

type NaicsCodesFormData = z.infer<typeof naicsCodesSchema>;

// API format for naics_codes data (what comes from backend)
interface NaicsCodesApiData {
  naics_codes: string[];
  primary_naics: string;
  annual_receipts_avg?: number;
  total_employees?: number;
}

interface NaicsCodesFormProps {
  initialData?: Partial<NaicsCodesApiData>;
  onNext: () => void;
  onPrevious: () => void;
  onSave: (data: any) => void;
}

export function NaicsCodesForm({ initialData, onNext, onPrevious, onSave }: NaicsCodesFormProps) {
  const queryClient = useQueryClient();

  // Transform initialData from API format (string[]) to form format (object[])
  const transformedInitialData = initialData ? {
    ...initialData,
    naics_codes: initialData.naics_codes
      ? (initialData.naics_codes as any).map((code: string) => ({ value: code }))
      : [{ value: "" }],
  } : { naics_codes: [{ value: "" }] };

  const form = useForm<NaicsCodesFormData>({
    resolver: zodResolver(naicsCodesSchema),
    defaultValues: transformedInitialData,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "naics_codes",
  });

  const saveMutation = useMutation({
    mutationFn: async (data: NaicsCodesFormData) => {
      // Transform to API format
      const apiData = {
        ...data,
        naics_codes: data.naics_codes.map(code => code.value),
      };
      const res = await api.post("/workflow/step/naics-codes", apiData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      onSave(data);
      toast.success("NAICS codes saved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save");
    },
  });

  const handleSaveAndContinue = (data: NaicsCodesFormData) => {
    saveMutation.mutate(data, {
      onSuccess: () => onNext(),
    });
  };

  // Auto-save with 500ms debounce (M2 requirement)
  const autoSaveState = useAutoSave({
    watch,
    onSave: async (data) => {
      // Only auto-save if data is valid
      const result = naicsCodesSchema.safeParse(data);
      if (result.success) {
        // Transform to API format
        const apiData = {
          ...result.data,
          naics_codes: result.data.naics_codes.map(code => code.value),
        };
        await api.post("/workflow/step/naics-codes", apiData);
        queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      }
    },
    debounceMs: 500,
    enabled: true,
  });

  return (
    <form onSubmit={handleSubmit(handleSaveAndContinue)} className="space-y-6">
      {/* NAICS Codes */}
      <div>
        <Label>NAICS Codes * (1-5 codes)</Label>
        <p className="text-xs text-gray-500 mb-3">
          6-digit North American Industry Classification System codes that describe your business activities.
        </p>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`naics_codes.${index}.value` as const)}
                placeholder="XXXXXX"
                maxLength={6}
                className="flex-1"
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {errors.naics_codes && (
          <p className="text-sm text-red-600 mt-1">
            {typeof errors.naics_codes === "object" && "message" in errors.naics_codes
              ? errors.naics_codes.message
              : "Invalid NAICS codes"}
          </p>
        )}

        {fields.length < 5 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ value: "" })}
            className="mt-2"
          >
            + Add NAICS Code
          </Button>
        )}
      </div>

      {/* Primary NAICS */}
      <div>
        <Label htmlFor="primary_naics">Primary NAICS Code *</Label>
        <Input
          id="primary_naics"
          {...register("primary_naics")}
          placeholder="Select from your NAICS codes above"
          maxLength={6}
        />
        {errors.primary_naics && (
          <p className="text-sm text-red-600 mt-1">{errors.primary_naics.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Your main business activity. Must match one of the codes above.
        </p>
      </div>

      {/* Annual Receipts */}
      <div>
        <Label htmlFor="annual_receipts_avg">Average Annual Receipts (optional)</Label>
        <Input
          id="annual_receipts_avg"
          type="number"
          {...register("annual_receipts_avg", { valueAsNumber: true })}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Average annual revenue for small business size determination.
        </p>
      </div>

      {/* Total Employees */}
      <div>
        <Label htmlFor="total_employees">Total Employees (optional)</Label>
        <Input
          id="total_employees"
          type="number"
          {...register("total_employees", { valueAsNumber: true })}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Total number of employees for small business size determination.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save & Continue"}
        </Button>
      </div>

      {/* Auto-save indicator */}
      <div className="flex items-center gap-2">
        {autoSaveState.isSaving && (
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </p>
        )}
        {!autoSaveState.isSaving && autoSaveState.lastSaved && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved at {autoSaveState.lastSaved.toLocaleTimeString()}
          </p>
        )}
        {autoSaveState.error && (
          <p className="text-xs text-red-600">
            Auto-save failed. Changes will be saved when you click "Save & Continue".
          </p>
        )}
      </div>
    </form>
  );
}
