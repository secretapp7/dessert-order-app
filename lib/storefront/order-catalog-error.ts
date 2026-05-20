export const ORDER_CATALOG_UNAVAILABLE_EN =
  "This dessert is not available for ordering right now.";
export const ORDER_CATALOG_UNAVAILABLE_AR =
  "هذه الحلوى غير متاحة للطلب حالياً.";

export class OrderCatalogNotAvailableError extends Error {
  readonly messageEn: string;
  readonly messageAr: string;

  constructor(
    messageEn = ORDER_CATALOG_UNAVAILABLE_EN,
    messageAr = ORDER_CATALOG_UNAVAILABLE_AR,
  ) {
    super(messageEn);
    this.name = "OrderCatalogNotAvailableError";
    this.messageEn = messageEn;
    this.messageAr = messageAr;
  }
}
