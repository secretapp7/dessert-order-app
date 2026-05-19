/** Shared availability types (safe for client + server imports). */

export type AvailabilityStatus =
  | "AVAILABLE"
  | "FEW_SLOTS_LEFT"
  | "FULLY_BOOKED"
  | "CLOSED"
  | "TOO_SOON"
  | "LARGE_ORDER_NEEDS_MORE_NOTICE";

export type AvailabilityDayClientPayload = {
  status: AvailabilityStatus;
  dateIso: string;
  maxOrders: number;
  usedSlots: number;
  remainingSlots: number;
  messageEn: string;
  messageAr: string;
};
