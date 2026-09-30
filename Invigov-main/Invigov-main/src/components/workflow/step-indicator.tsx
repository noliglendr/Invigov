import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/types";

interface Step {
  key: WorkflowStep;
  label: string;
  description: string;
}

export const WORKFLOW_STEPS: Step[] = [
  { key: "business_info", label: "Business Info", description: "Legal name, EIN, address, entity type" },
  { key: "naics_codes", label: "NAICS Codes", description: "Industry classification codes" },
  { key: "banking_info", label: "Banking Info", description: "EFT account details (encrypted)" },
  { key: "reps_certs", label: "Reps & Certs", description: "FAR/DFARS clause responses" },
  { key: "document_review", label: "Review", description: "Confirm all information" },
  { key: "preflight", label: "Preflight", description: "Final validation check" },
  { key: "complete", label: "Complete", description: "Workflow finished" },
];

type StepStatus = "completed" | "current" | "upcoming";

function getStepStatus(
  stepKey: WorkflowStep,
  currentStep: WorkflowStep,
  completedSteps: WorkflowStep[]
): StepStatus {
  if (completedSteps.includes(stepKey)) return "completed";
  if (stepKey === currentStep) return "current";
  return "upcoming";
}

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <nav aria-label="Workflow progress">
      <ol className="space-y-1">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step.key, currentStep, completedSteps);
          return (
            <li key={step.key} className="flex items-start gap-3">
              {/* Connector line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors",
                    status === "completed" &&
                      "border-blue-600 bg-blue-600 text-white",
                    status === "current" &&
                      "border-blue-600 bg-white text-blue-600",
                    status === "upcoming" &&
                      "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {status === "completed" ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mt-1 w-0.5 h-6 rounded",
                      status === "completed" ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pb-6 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    status === "current" ? "text-blue-700" : "text-gray-700",
                    status === "upcoming" && "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
