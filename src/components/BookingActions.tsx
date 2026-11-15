"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateBookingStatus, confirmReceipt, confirmReturn, cancelBooking } from "@/actions/booking-actions";

interface BookingActionsProps {
  bookingId: string;
  status: string;
  isRenter: boolean;
  isOwner: boolean;
}

interface ActionButton {
  label: string;
  handler: () => Promise<void>;
  variant: "primary" | "success" | "danger" | "warning";
}

function getButtons(
  bookingId: string,
  status: string,
  isRenter: boolean,
  isOwner: boolean
): ActionButton[] {
  const buttons: ActionButton[] = [];

  switch (status) {
    case "PENDING":
      if (isOwner) {
        buttons.push({
          label: "Подтвердить бронирование",
          handler: async () => await updateBookingStatus(bookingId, "CONFIRMED"),
          variant: "success",
        });
        buttons.push({
          label: "Отклонить",
          handler: async () => await updateBookingStatus(bookingId, "REJECTED"),
          variant: "warning",
        });
      }
      if (isRenter || isOwner) {
        buttons.push({
          label: "Отменить",
          handler: async () => await cancelBooking(bookingId),
          variant: "danger",
        });
      }
      break;

    case "CONFIRMED":
      if (isRenter) {
        buttons.push({
          label: "Подтвердить получение",
          handler: async () => await confirmReceipt(bookingId),
          variant: "primary",
        });
      }
      if (isRenter || isOwner) {
        buttons.push({
          label: "Отменить",
          handler: async () => await cancelBooking(bookingId),
          variant: "danger",
        });
      }
      break;

    case "ACTIVE":
      if (isOwner) {
        buttons.push({
          label: "Подтвердить возврат",
          handler: async () => await confirmReturn(bookingId),
          variant: "success",
        });
      }
      if (isRenter || isOwner) {
        buttons.push({
          label: "Отменить",
          handler: async () => await cancelBooking(bookingId),
          variant: "danger",
        });
      }
      break;

    case "COMPLETED":
    case "CANCELLED":
    case "REJECTED":
      // Нет доступных действий
      break;
  }

  return buttons;
}

const variantClasses = {
  primary:
    "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
  success:
    "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white",
  danger:
    "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
  warning:
    "bg-orange-500 hover:bg-orange-600 focus:ring-orange-400 text-white",
};

export default function BookingActions({
  bookingId,
  status,
  isRenter,
  isOwner,
}: BookingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const buttons = getButtons(bookingId, status, isRenter, isOwner);

  if (buttons.length === 0) {
    return null;
  }

  const executeAction = async (handler: () => Promise<void>) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await handler();
        setSuccess("Действие выполнено успешно");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка");
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Действия</h3>

      <div className="flex flex-col gap-3">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isPending}
            onClick={() => executeAction(btn.handler)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[btn.variant]}`}
          >
            {isPending ? "Выполняется..." : btn.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
