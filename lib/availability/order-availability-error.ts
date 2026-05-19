/** Thrown when an order cannot be placed due to capacity / closed dates / notice rules. */
export class OrderAvailabilityBlockedError extends Error {
  readonly messageEn: string;
  readonly messageAr: string;

  constructor(messageEn: string, messageAr: string) {
    super("ORDER_AVAILABILITY_BLOCKED");
    this.name = "OrderAvailabilityBlockedError";
    this.messageEn = messageEn;
    this.messageAr = messageAr;
  }
}
