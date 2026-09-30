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

const bankingInfoSchema = z.object({
  routing_number: z.string().regex(/^\d{9}$/, "Routing number must be 9 digits"),
  account_number: z.string().min(4, "Account number is required"),
  account_holder: z.string().min(2, "Account holder name is required"),
  bank_name: z.string().min(2, "Bank name is required"),
});

type BankingInfoFormData = z.infer<typeof bankingInfoSchema>;

interface BankingInfoFormProps {
  initialData?: Partial<BankingInfoFormData>;
  onNext: () => void;
  onPrevious: () => void;
  onSave: (data: BankingInfoFormData) => void;
}

export function BankingInfoForm({ initialData, onNext, onPrevious, onSave }: BankingInfoFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BankingInfoFormData>({
    resolver: zodResolver(bankingInfoSchema),
    defaultValues: initialData || {},
  });

  const saveMutation = useMutation({
    mutationFn: async (data: BankingInfoFormData) => {
      const res = await api.post("/workflow/step/banking-info", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      onSave(data);
      toast.success("Banking information saved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save");
    },
  });

  const handleSaveAndContinue = (data: BankingInfoFormData) => {
    saveMutation.mutate(data, {
      onSuccess: () => onNext(),
    });
  };

  // Auto-save with 500ms debounce (M2 requirement)
  const autoSaveState = useAutoSave({
    watch,
    onSave: async (data) => {
      // Only auto-save if data is valid
      const result = bankingInfoSchema.safeParse(data);
      if (result.success) {
        await api.post("/workflow/step/banking-info", data);
        queryClient.invalidateQueries({ queryKey: ["workflow-session"] });
      }
    },
    debounceMs: 500,
    enabled: true,
  });

  return (
    <form onSubmit={handleSubmit(handleSaveAndContinue)} className="space-y-6">
      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Encrypted Storage</p>
            <p className="text-xs text-blue-700 mt-1">
              All banking information is encrypted with AES-256-GCM before storage. Only the last 4 digits of your routing number are stored unencrypted for verification.
            </p>
          </div>
        </div>
      </div>

      {/* Bank Name */}
      <div>
        <Label htmlFor="bank_name">Bank Name *</Label>
        <Input
          id="bank_name"
          {...register("bank_name")}
          placeholder="Wells Fargo, Bank of America, etc."
        />
        {errors.bank_name && (
          <p className="text-sm text-red-600 mt-1">{errors.bank_name.message}</p>
        )}
      </div>

      {/* Account Holder */}
      <div>
        <Label htmlFor="account_holder">Account Holder Name *</Label>
        <Input
          id="account_holder"
          {...register("account_holder")}
          placeholder="Must match your legal business name"
        />
        {errors.account_holder && (
          <p className="text-sm text-red-600 mt-1">{errors.account_holder.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Must match the legal name on your bank account.
        </p>
      </div>

      {/* Routing Number */}
      <div>
        <Label htmlFor="routing_number">Routing Number *</Label>
        <Input
          id="routing_number"
          {...register("routing_number")}
          placeholder="XXXXXXXXX"
          maxLength={9}
          type="text"
          inputMode="numeric"
        />
        {errors.routing_number && (
          <p className="text-sm text-red-600 mt-1">{errors.routing_number.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          9-digit ABA routing number. Find it at the bottom of your checks.
        </p>
      </div>

      {/* Account Number */}
      <div>
        <Label htmlFor="account_number">Account Number *</Label>
        <Input
          id="account_number"
          {...register("account_number")}
          placeholder="Account number"
          type="text"
          inputMode="numeric"
        />
        {errors.account_number && (
          <p className="text-sm text-red-600 mt-1">{errors.account_number.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Your bank account number for Electronic Funds Transfer (EFT) payments.
        </p>
      </div>

      {/* FAR Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-xs text-gray-600">
          <strong>FAR 52.232-33:</strong> Payment by Electronic Funds Transfer — All federal payments are made via EFT to the bank account you provide here.
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
