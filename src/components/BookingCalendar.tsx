"use client";

import { useState, useEffect } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { useSession } from "next-auth/react";
import "react-day-picker/style.css";

interface BookingRange {
  startDate: string;
  endDate: string;
}

interface BookingCalendarProps {
  itemId: string;
  pricePerDay: number;
  depositAmount: number;
  isOwner: boolean;
}

export default function BookingCalendar({
  itemId,
  pricePerDay,
  depositAmount,
  isOwner,
}: BookingCalendarProps) {
  const { data: session, status } = useSession();
  const [bookedRanges, setBookedRanges] = useState<BookingRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    undefined
  );
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [booking, setBooking] = useState(false);

  // Загрузка занятых диапазонов
  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`/api/bookings/item/${itemId}`);
        if (res.ok) {
          const data = await res.json();
          setBookedRanges(data);
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [itemId]);

  // Преобразуем booked ranges в matcher формат для disabled
  const bookedDisabledRanges = bookedRanges.map((range) => ({
    from: new Date(range.startDate),
    to: new Date(range.endDate),
  }));

  // Минимальная дата — сегодня
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Расчёт стоимости
  const getCalculation = () => {
    if (!selectedRange?.from || !selectedRange?.to) return null;

    const start = new Date(selectedRange.from);
    const end = new Date(selectedRange.to);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(
      1,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    );

    const rentalCost = days * pricePerDay;
    const commission = rentalCost * 0.1;
    const total = rentalCost + depositAmount + commission;

    return {
      days,
      rentalCost,
      depositAmount,
      commission,
      total,
    };
  };

  const calculation = getCalculation();

  const handleBook = async () => {
    if (!selectedRange?.from || !selectedRange?.to) return;

    if (status === "loading" || !session) {
      setMessage({ type: "error", text: "Войдите для бронирования" });
      return;
    }

    if (isOwner) {
      setMessage({
        type: "error",
        text: "Вы не можете забронировать свою вещь",
      });
      return;
    }

    setBooking(true);
    setMessage(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          startDate: selectedRange.from.toISOString(),
          endDate: selectedRange.to.toISOString(),
        }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Бронирование создано, ожидайте подтверждения",
        });
        setSelectedRange(undefined);
      } else if (res.status === 409) {
        setMessage({
          type: "error",
          text: "Выбранные даты уже заняты",
        });
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Ошибка при бронировании",
        });
      }
    } catch (err) {
      console.error("Booking error:", err);
      setMessage({ type: "error", text: "Ошибка сети при бронировании" });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Бронирование</h2>

      {isOwner && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Вы не можете забронировать свою вещь
        </div>
      )}

      {loading && !bookedRanges.length ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={setSelectedRange}
            disabled={[
              { before: today },
              ...bookedDisabledRanges,
            ]}
            numberOfMonths={2}
            modifiers={{
              booked: bookedDisabledRanges,
            }}
            modifiersClassNames={{
              booked: "bg-red-100 text-red-900 line-through",
            }}
            classNames={{
              today: "border-amber-500 font-bold",
              selected: "bg-blue-600 text-white hover:bg-blue-700",
              range_start: "bg-blue-600 text-white rounded-l-lg",
              range_end: "bg-blue-600 text-white rounded-r-lg",
              range_middle: "bg-blue-200 text-blue-900",
              disabled: "bg-gray-100 text-gray-400",
            }}
          />

          {/* Легенда */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-red-100 border border-red-300" />
              <span>Занято</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-blue-600" />
              <span>Выбрано</span>
            </div>
          </div>

          {/* Расчёт стоимости */}
          {calculation && (
            <div className="mt-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-inner">
              <h3 className="mb-3 font-semibold text-gray-900">
                Расчёт стоимости
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Количество дней:</span>
                  <span className="font-medium">{calculation.days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Стоимость аренды:</span>
                  <span className="font-medium">
                    {calculation.rentalCost.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Депозит:</span>
                  <span className="font-medium">
                    {calculation.depositAmount.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Комиссия сервиса (10%):</span>
                  <span className="font-medium">
                    {calculation.commission.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="font-semibold text-gray-900">Итого:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {calculation.total.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Кнопка бронирования */}
          {selectedRange?.from && selectedRange?.to && !isOwner && (
            <button
              onClick={handleBook}
              disabled={booking}
              className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {booking ? "Создание..." : "Забронировать"}
            </button>
          )}
        </>
      )}

      {/* Сообщения */}
      {message && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : message.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
