import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReceivedBookingsClient from "./ReceivedBookingsClient";

interface Booking {
  id: string;
  itemId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  totalAmount: { toNumber?: () => number } | number;
  status: string;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    title: string;
  };
  renter: {
    id: string;
    name: string | null;
    email: string;
  };
}

async function loadBookings(): Promise<Booking[]> {
  const session = await auth();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/bookings/received`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    return [];
  }
  return (await res.json()) as Booking[];
}

export default async function ReceivedBookingsPage() {
  const bookings = await loadBookings();
  return <ReceivedBookingsClient bookings={bookings} />;
}
