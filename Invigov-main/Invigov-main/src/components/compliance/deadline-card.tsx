import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComplianceDeadline } from "@/types";
import { format, parseISO } from "date-fns";

interface DeadlineCardProps {
  deadline: ComplianceDeadline;
  onComplete?: (id: string) => void;
  completing?: boolean;
}

export function DeadlineCard({ deadline, onComplete, completing }: DeadlineCardProps) {
  const urgencyVariant =
    deadline.urgency === "critical"
      ? "error"
      : deadline.urgency === "warning"
      ? "warning"
      : "success";

  const urgencyLabel =
    deadline.urgency === "critical"
      ? `${deadline.days_remaining}d — Critical`
      : deadline.urgency === "warning"
      ? `${deadline.days_remaining}d — Due soon`
      : `${deadline.days_remaining}d remaining`;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-white transition-opacity",
        deadline.is_completed && "opacity-50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => !deadline.is_completed && onComplete?.(deadline.id)}
        disabled={deadline.is_completed || completing}
        aria-label={deadline.is_completed ? "Completed" : "Mark as complete"}
        className={cn(
          "h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
          deadline.is_completed
            ? "border-green-500 bg-green-500"
            : "border-gray-300 hover:border-blue-500"
        )}
      >
        {deadline.is_completed && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium text-gray-900", deadline.is_completed && "line-through text-gray-400")}>
          {deadline.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Due {format(parseISO(deadline.deadline_date), "MMMM d, yyyy")}
          {" · "}
          <span className="capitalize">{deadline.type.replace(/_/g, " ")}</span>
        </p>
      </div>

      {/* Urgency badge */}
      {!deadline.is_completed && (
        <Badge variant={urgencyVariant}>{urgencyLabel}</Badge>
      )}
      {deadline.is_completed && (
        <Badge variant="success">Done</Badge>
      )}
    </div>
  );
}
