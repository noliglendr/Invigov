"use client";

import { Button } from "@/components/ui/button";

interface DocumentReviewProps {
  sessionData: any;
  onNext: () => void;
  onPrevious: () => void;
}

export function DocumentReview({ sessionData, onNext, onPrevious }: DocumentReviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm font-medium text-blue-900">Review Your Information</p>
        <p className="text-xs text-blue-700 mt-1">
          Please review all data before proceeding to preflight check.
        </p>
      </div>

      {/* Business Info */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">Business Information</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">Legal Name:</dt>
            <dd className="text-gray-900">{sessionData?.step_data?.business_info?.legal_name || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">EIN:</dt>
            <dd className="text-gray-900">••••{sessionData?.step_data?.business_info?.ein?.slice(-4) || ""}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">Business Type:</dt>
            <dd className="text-gray-900">{sessionData?.step_data?.business_info?.business_type || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* NAICS Codes */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">NAICS Codes</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">Primary NAICS:</dt>
            <dd className="text-gray-900">{sessionData?.step_data?.naics_codes?.primary_naics || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">All Codes:</dt>
            <dd className="text-gray-900">
              {sessionData?.step_data?.naics_codes?.naics_codes?.join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Banking Info */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">Banking Information</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">Bank:</dt>
            <dd className="text-gray-900">{sessionData?.step_data?.banking_info?.bank_name || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-40">Routing Number:</dt>
            <dd className="text-gray-900">
              {sessionData?.step_data?.banking_info?.routing_number ? "•••••" + sessionData.step_data.banking_info.routing_number.slice(-4) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>
          Continue to Preflight Check
        </Button>
      </div>
    </div>
  );
}
