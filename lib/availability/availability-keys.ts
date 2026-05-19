/** AvailabilitySetting.key values stored in PostgreSQL */
export const AVAILABILITY_KEYS = {
  minimumNoticeDays: "minimum_notice_days",
  defaultDailyOrderLimit: "default_daily_order_limit",
  largeOrderNoticeDays: "large_order_notice_days",
  largeOrderQuantityThreshold: "large_order_quantity_threshold",
} as const;
