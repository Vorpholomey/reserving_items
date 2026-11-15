"use client";

interface BookingTimelineProps {
  status: string;
  confirmedAt?: Date | null;
  receivedAt?: Date | null;
  returnedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  depositHeld?: boolean;
}

const mainSteps = [
  { key: "PENDING", label: "Ожидание" },
  { key: "CONFIRMED", label: "Подтверждено" },
  { key: "ACTIVE", label: "В использовании" },
  { key: "RETURNED", label: "Возвращено" },
  { key: "COMPLETED", label: "Завершено" },
];

const statusDateMap: Record<string, Date | null | undefined> = {
  CONFIRMED: ({} as BookingTimelineProps).confirmedAt,
  ACTIVE: ({} as BookingTimelineProps).receivedAt,
  RETURNED: ({} as BookingTimelineProps).returnedAt,
  COMPLETED: ({} as BookingTimelineProps).completedAt,
};

function formatDate(date?: Date | null): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("ru-RU");
}

function getStatusIndex(status: string): number {
  if (status === "CANCELLED" || status === "REJECTED") return -1;
  const idx = mainSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function BookingTimeline({
  status,
  confirmedAt,
  receivedAt,
  returnedAt,
  completedAt,
  cancelledAt,
  depositHeld,
}: BookingTimelineProps) {
  const currentIdx = getStatusIndex(status);
  const isCancelled = status === "CANCELLED";
  const isRejected = status === "REJECTED";

  const steps = isCancelled
    ? [...mainSteps, { key: "CANCELLED", label: "Отменено" }]
    : isRejected
      ? [...mainSteps, { key: "REJECTED", label: "Отклонено" }]
      : mainSteps;

  const getStepState = (stepKey: string, stepIdx: number): "done" | "current" | "upcoming" | "branch" => {
    if (isCancelled) {
      if (stepKey === "CANCELLED") return "current";
      return "upcoming";
    }
    if (isRejected) {
      if (stepKey === "REJECTED") return "current";
      return "upcoming";
    }
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "current";
    return "upcoming";
  };

  const getStepColor = (state: "done" | "current" | "upcoming" | "branch") => {
    switch (state) {
      case "done":
        return "bg-green-600 border-green-600 text-white";
      case "current":
        return "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-200";
      case "upcoming":
        return "bg-gray-200 border-gray-300 text-gray-400";
      case "branch":
        return "bg-red-600 border-red-600 text-white";
    }
  };

  const getTextColor = (state: "done" | "current" | "upcoming" | "branch") => {
    switch (state) {
      case "done":
        return "text-green-600";
      case "current":
        return "text-blue-600 font-semibold";
      case "upcoming":
        return "text-gray-400";
      case "branch":
        return "text-red-600 font-semibold";
    }
  };

  const getLineColor = (state: "done" | "current" | "upcoming" | "branch") => {
    switch (state) {
      case "done":
        return "border-green-600";
      case "current":
        return "border-blue-600";
      case "upcoming":
        return "border-gray-200";
      case "branch":
        return "border-red-600";
    }
  };

  const getIcon = (stepKey: string, state: "done" | "current" | "upcoming" | "branch") => {
    if (state === "done") return "✓";
    if (stepKey === "CANCELLED") return "✕";
    if (stepKey === "REJECTED") return "✕";
    if (state === "current") return mainSteps.findIndex((s) => s.key === stepKey) + 1;
    return mainSteps.findIndex((s) => s.key === stepKey) + 1;
  };

  const getStepDate = (stepKey: string): string => {
    switch (stepKey) {
      case "CONFIRMED":
        return formatDate(confirmedAt);
      case "ACTIVE":
        return formatDate(receivedAt);
      case "RETURNED":
        return formatDate(returnedAt);
      case "COMPLETED":
        return formatDate(completedAt);
      case "CANCELLED":
        return formatDate(cancelledAt);
      case "REJECTED":
        return formatDate(cancelledAt);
      default:
        return "";
    }
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Статус бронирования</h3>
      <div className="relative">
        {steps.map((step, idx) => {
          const state = getStepState(step.key, idx);
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.key} className="flex items-start mb-4 last:mb-0">
              {/* Вертикальная линия */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${getStepColor(
                    state
                  )}`}
                >
                  {getIcon(step.key, state)}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 h-8 ${getLineColor(state)}`}
                    style={{ backgroundColor: state === "done" ? "#16a34a" : state === "current" ? "#2563eb" : "#e5e7eb" }}
                  />
                )}
              </div>
              {/* Контент шага */}
              <div className="ml-3 pt-1">
                <div className={getTextColor(state)}>{step.label}</div>
                {getStepDate(step.key) && (
                  <div className="text-xs text-gray-500 mt-0.5">{getStepDate(step.key)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Индикатор залога */}
      {depositHeld !== undefined && (
        <div className="mt-6 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Залог:</span>
            {depositHeld ? (
              <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                Удержан
              </span>
            ) : (
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Возвращён
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
