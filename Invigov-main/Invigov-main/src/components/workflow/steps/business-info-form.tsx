"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useAutoSave } from "@/hooks/useAutoSave";

const businessInfoSchema = z.object({
  legal_name: z.string().min(2, "Legal name is required"),
  dba_name: z.string().optional(),
  ein: z.string().regex(/^\d{2}-?\d{7}$/, "EIN must be in format XX-XXXXXXX"),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "State must be 2-letter code"),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  business_type: z.enum(["sole_proprietor", "llc", "corporation", "partnership", "nonprofit"]),
  uei_number: z.string().optional(),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

interface BusinessInfoFormProps {
  initialData?: Partial<BusinessInfoFormData>;
  onNext: () => void;
  onSave: (data: BusinessInfoFormData) => void;
}

export function BusinessInfoForm({ initialData, onNext, onSave }: BusinessInfoFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: initialData || {},
  });

  const saveMutation = useMutation({
    mutationFn: async (data: BusinessInfoFormData) => {
      const res = await api.post("/workflow/step/business-info", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      onSave(data);
      toast.success("Business information saved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save");
    },
  });

  const handleSaveAndContinue = (data: BusinessInfoFormData) => {
    saveMutation.mutate(data, {
      onSuccess: () => onNext(),
    });
  };

  // Auto-save with 500ms debounce (M2 requirement)
  const autoSaveState = useAutoSave({
    watch,
    onSave: async (data) => {
      // Only auto-save if data is valid
      const result = businessInfoSchema.safeParse(data);
      if (result.success) {
        await api.post("/workflow/step/business-info", data);
        queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      }
    },
    debounceMs: 500,
    enabled: true,
  });

  const businessTypes = [
    { value: "sole_proprietor", label: "Sole Proprietor" },
    { value: "llc", label: "Limited Liability Company (LLC)" },
    { value: "corporation", label: "Corporation" },
    { value: "partnership", label: "Partnership" },
    { value: "nonprofit", label: "Nonprofit Organization" },
  ];

  return (
    <form onSubmit={handleSubmit(handleSaveAndContinue)} className="space-y-6">
      {/* Legal Name */}
      <div>
        <Label htmlFor="legal_name">Legal Business Name *</Label>
        <Input
          id="legal_name"
          {...register("legal_name")}
          placeholder="Acme Corporation Inc."
        />
        {errors.legal_name && (
          <p className="text-sm text-red-600 mt-1">{errors.legal_name.message}</p>
        )}
      </div>

      {/* DBA Name */}
      <div>
        <Label htmlFor="dba_name">DBA Name (if applicable)</Label>
        <Input
          id="dba_name"
          {...register("dba_name")}
          placeholder="Doing Business As"
        />
      </div>

      {/* EIN */}
      <div>
        <Label htmlFor="ein">Employer Identification Number (EIN) *</Label>
        <Input
          id="ein"
          {...register("ein")}
          placeholder="XX-XXXXXXX"
          maxLength={10}
        />
        {errors.ein && (
          <p className="text-sm text-red-600 mt-1">{errors.ein.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Encrypted with AES-256. Only the last 4 digits are stored unencrypted.
        </p>
      </div>

      {/* Business Type */}
      <div>
        <Label htmlFor="business_type">Business Entity Type *</Label>
        <select
          id="business_type"
          {...register("business_type")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select entity type</option>
          {businessTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.business_type && (
          <p className="text-sm text-red-600 mt-1">{errors.business_type.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Determines applicable FAR/DFARS clauses in Reps & Certs step.
        </p>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="address_line1">Address Line 1 *</Label>
          <Input
            id="address_line1"
            {...register("address_line1")}
            placeholder="123 Main Street"
          />
          {errors.address_line1 && (
            <p className="text-sm text-red-600 mt-1">{errors.address_line1.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address_line2">Address Line 2</Label>
          <Input
            id="address_line2"
            {...register("address_line2")}
            placeholder="Suite 100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-1">
            <Label htmlFor="city">City *</Label>
            <Input id="city" {...register("city")} placeholder="New York" />
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
            )}
          </div>

          <div className="col-span-1">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              {...register("state")}
              placeholder="NY"
              maxLength={2}
              style={{ textTransform: "uppercase" }}
            />
            {errors.state && (
              <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
            )}
          </div>

          <div className="col-span-1">
            <Label htmlFor="zip_code">ZIP Code *</Label>
            <Input id="zip_code" {...register("zip_code")} placeholder="10001" />
            {errors.zip_code && (
              <p className="text-sm text-red-600 mt-1">{errors.zip_code.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* UEI Number */}
      <div>
        <Label htmlFor="uei_number">UEI Number (if already registered)</Label>
        <Input
          id="uei_number"
          {...register("uei_number")}
          placeholder="XXXXXXXXXX"
          maxLength={12}
        />
        <p className="text-xs text-gray-500 mt-1">
          Unique Entity Identifier. Leave blank if this is your first SAM.gov registration.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
        >
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
