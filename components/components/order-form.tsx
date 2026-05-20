"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getOrderDateAvailabilityAction } from "@/app/actions/order-date-availability";
import { createOrderAction } from "@/app/actions/orders";
import { ProductVisual } from "@/components/product-visual";
import { usePublicBusinessSettings } from "@/components/public-settings-provider";
import { formatLocaleQuantity } from "@/components/review-format";
import { brand } from "@/config/brand";
import { FULFILLMENT, type FulfillmentMethod } from "@/config/fulfillment";
import type { StorefrontProduct } from "@/lib/storefront/types";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";
import { buildWhatsappOrderLines, joinWhatsappMessage } from "@/lib/orders/build-whatsapp-order-message";
import { ADDRESS_MIN_CHARS } from "@/lib/orders/constants";
import { hasDeliveryLocationMethod } from "@/lib/orders/location-rules";
import { isHttpsOrHttpUrl } from "@/lib/orders/http-url";
import type { AvailabilityDayClientPayload } from "@/lib/availability/public-types";
import {
  easePremium,
  scaleTapWhile,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";
import { localizedFromSettings, resolveWhatsappNumber } from "@/lib/settings/public-settings-types";

type GpsCapture = {
  lat: number;
  lng: number;
  accuracyM: number | undefined;
  mapsUrl: string;
};

type GeoUiStatus = "idle" | "loading" | "success" | "error";

type OrderFormState = {
  customerName: string;
  phoneNumber: string;
  productId: string;
  sizeId: string;
  quantity: number;
  dateNeeded: string;
  fulfillmentMethod: FulfillmentMethod;
  mapsLinkPasted: string;
  addressDetails: string;
  notes: string;
};

const FALLBACK_SIZE_ID = "";

const labelClass = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const inputStyles =
  "mt-1 min-h-11 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2.5 text-[13px] text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold-muted)]/40";

function buildMapsLatLngUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function geolocationErrorText(
  language: AppLanguage,
  err: GeolocationPositionError | null,
  unsupported: boolean,
): string {
  const geo = translations[language].geolocation;
  if (unsupported) return geo.notSupported;
  if (!err) return geo.unknownError;
  if (err.code === 1) return geo.permissionDenied;
  return geo.positionError;
}

function MotionSection({
  title,
  reduced,
  children,
}: {
  title: string;
  reduced: boolean;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={staggerItemVariants(reduced)}
      className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
    >
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-gold-muted)]">{title}</h3>
      <div className="mt-2.5 space-y-2.5">{children}</div>
    </motion.section>
  );
}

function FieldError({
  show,
  message,
  reduced,
}: {
  show: boolean;
  message?: string;
  reduced: boolean;
}) {
  return (
    <AnimatePresence mode="sync">
      {show && message ? (
        <motion.p
          key={message}
          role="alert"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0.06 : 0.1 } }}
          transition={{ duration: reduced ? 0.12 : 0.18, ease: easePremium }}
          className="mt-1 text-[10px] leading-snug text-[color:var(--brand-burgundy-soft)]"
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

type OrderFormValidation = Partial<
  Record<
    | "customerName"
    | "phoneNumber"
    | "productId"
    | "sizeId"
    | "dateNeeded"
    | "quantity"
    | "mapsLinkPasted"
    | "addressDetails"
    | "deliveryLocationMethod"
    | "fulfillmentMethod",
    string
  >
>;

type OrderFormProps = {
  language: AppLanguage;
  initialProductId?: string;
  initialSizeId?: string;
  orderableProducts: StorefrontProduct[];
};

export function OrderForm({
  language,
  initialProductId,
  initialSizeId,
  orderableProducts,
}: OrderFormProps) {
  const t = translations[language];
  const settings = usePublicBusinessSettings();
  const reduced = useReducedMotion() ?? false;
  const tapScale = scaleTapWhile(reduced);

  const defaultProduct = orderableProducts[0];
  const urlRequestedProduct =
    initialProductId != null
      ? orderableProducts.find((product) => product.id === initialProductId)
      : undefined;
  const initialUnavailableFromUrl =
    Boolean(initialProductId?.trim()) && urlRequestedProduct == null;

  const initialSelectedProduct = urlRequestedProduct ?? defaultProduct;

  const initialSizeResolved =
    initialSelectedProduct?.sizes.find((s) => s.id === initialSizeId)?.id ??
    initialSelectedProduct?.sizes[0]?.id ??
    FALLBACK_SIZE_ID;

  const [form, setForm] = useState<OrderFormState>({
    customerName: "",
    phoneNumber: "",
    productId: initialSelectedProduct?.id ?? "",
    sizeId: initialSizeResolved,
    quantity: 1,
    dateNeeded: "",
    fulfillmentMethod: FULFILLMENT.PICKUP,
    mapsLinkPasted: "",
    addressDetails: "",
    notes: "",
  });

  const [gps, setGps] = useState<GpsCapture | null>(null);
  const [geoUi, setGeoUi] = useState<GeoUiStatus>("idle");
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [orderPersistPhase, setOrderPersistPhase] = useState<null | "saving" | "opening">(null);
  const [persistFailed, setPersistFailed] = useState(false);
  const [persistUserMessage, setPersistUserMessage] = useState<string | null>(null);
  const [dateAvailability, setDateAvailability] = useState<
    | null
    | { loading: true }
    | { loading: false; data: AvailabilityDayClientPayload | null }
  >(null);

  const selectedProduct =
    orderableProducts.find((product) => product.id === form.productId) ??
    defaultProduct;

  const availableSizes = selectedProduct.sizes;
  const selectedSize = availableSizes.find((size) => size.id === form.sizeId) ?? availableSizes[0];
  const estimatedTotal = (selectedSize?.priceOmr ?? 0) * form.quantity;
  const catalogEmpty = orderableProducts.length === 0;

  const showLocationAddedInSummary =
    form.fulfillmentMethod === FULFILLMENT.DELIVERY &&
    hasDeliveryLocationMethod({
      gps,
      mapsPaste: form.mapsLinkPasted,
      address: form.addressDetails,
    });

  const validationErrors: OrderFormValidation = (() => {
    const errors: OrderFormValidation = {};

    const productOk = Boolean(orderableProducts.find((p) => p.id === form.productId));
    if (!productOk) errors.productId = t.validation.productRequired;

    const sizeOk = Boolean(selectedProduct.sizes.some((s) => s.id === form.sizeId));
    if (!sizeOk) errors.sizeId = t.validation.sizeRequired;

    if (!form.fulfillmentMethod) {
      errors.fulfillmentMethod = t.validation.fulfillmentRequired;
    }

    if (form.customerName.trim().length < 2) {
      errors.customerName = t.validation.fullName;
    }

    const cleanedPhone = form.phoneNumber.replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,15}$/.test(cleanedPhone)) {
      errors.phoneNumber = t.validation.phone;
    }

    if (!form.dateNeeded) {
      errors.dateNeeded = t.validation.date;
    }

    if (form.quantity < 1 || Number.isNaN(form.quantity)) {
      errors.quantity = t.validation.quantity;
    }

    if (form.fulfillmentMethod !== FULFILLMENT.DELIVERY) {
      return errors;
    }

    const pasteTrimmed = form.mapsLinkPasted.trim();

    if (pasteTrimmed && !isHttpsOrHttpUrl(pasteTrimmed)) {
      errors.mapsLinkPasted = t.validation.mapsLinkInvalid;
      return errors;
    }

    if (form.addressDetails.trim().length < ADDRESS_MIN_CHARS) {
      errors.addressDetails = t.validation.addressDetailsRequired;
      return errors;
    }

    if (
      !hasDeliveryLocationMethod({
        gps,
        mapsPaste: form.mapsLinkPasted,
        address: form.addressDetails,
      })
    ) {
      errors.deliveryLocationMethod = t.validation.deliveryNeedMapOrDetail;
    }

    return errors;
  })();

  const isValid = Object.keys(validationErrors).length === 0;

  const dateLooksValid = /^\d{4}-\d{2}-\d{2}$/.test(form.dateNeeded);

  const availabilityBusy =
    dateLooksValid && (!dateAvailability || dateAvailability.loading === true);

  const availabilityGatePasses =
    !dateLooksValid ||
    (!!dateAvailability &&
      !dateAvailability.loading &&
      dateAvailability.data !== null &&
      (dateAvailability.data.status === "AVAILABLE" ||
        dateAvailability.data.status === "FEW_SLOTS_LEFT"));

  const availabilityPayload =
    dateAvailability && dateAvailability.loading === false ? dateAvailability.data : undefined;

  useEffect(() => {
    if (!dateLooksValid) {
      void Promise.resolve().then(() => setDateAvailability(null));
      return;
    }
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setDateAvailability({ loading: true });
    });
    const handle = window.setTimeout(async () => {
      const res = await getOrderDateAvailabilityAction({
        dateNeeded: form.dateNeeded,
        quantity: form.quantity,
      });
      if (cancelled) return;
      if (!res.ok) {
        setDateAvailability({ loading: false, data: null });
        return;
      }
      setDateAvailability({ loading: false, data: res.data });
    }, 380);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [dateLooksValid, form.dateNeeded, form.quantity]);

  const dessertName = selectedProduct.name[language];
  const sizeLine = `${selectedSize.label[language]} (${selectedSize.serves[language]})`;

  const orderMessageLines = buildWhatsappOrderLines({
    language,
    form,
    gps: form.fulfillmentMethod === FULFILLMENT.DELIVERY ? gps : null,
    dessertName,
    sizeLine,
    qty: form.quantity,
    estimated: estimatedTotal,
  });

  const isDelivery = form.fulfillmentMethod === FULFILLMENT.DELIVERY;

  const orderMessage = joinWhatsappMessage(orderMessageLines);
  const normalizedPhone = resolveWhatsappNumber(settings);
  const whatsappHref = `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(orderMessage)}`;

  function updateForm<K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function onFulfillmentChange(next: FulfillmentMethod) {
    if (next === FULFILLMENT.PICKUP) {
      setGeoUi("idle");
      setGeoErrorMessage(null);
      setGps(null);
    }
    setForm((previous) =>
      next === FULFILLMENT.PICKUP
        ? {
            ...previous,
            fulfillmentMethod: next,
            mapsLinkPasted: "",
            addressDetails: "",
          }
        : { ...previous, fulfillmentMethod: next },
    );
  }

  function onProductChange(productId: string) {
    const product = orderableProducts.find((item) => item.id === productId) ?? defaultProduct;
    setForm((previous) => ({
      ...previous,
      productId: product.id,
      sizeId: product.sizes[0].id,
    }));
  }

  function onUseGeolocationClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoErrorMessage(geolocationErrorText(language, null, true));
      setGeoUi("error");
      return;
    }

    setGeoUi("loading");
    setGeoErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const mapsUrl = buildMapsLatLngUrl(lat, lng);
        const accuracyM = Number.isFinite(accuracy) ? Math.round(accuracy) : undefined;
        setGps({ lat, lng, accuracyM, mapsUrl });
        setGeoUi("success");
      },
      (err) => {
        setGps(null);
        setGeoUi("error");
        setGeoErrorMessage(geolocationErrorText(language, err, false));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    setPersistFailed(false);
    setPersistUserMessage(null);

    if (!isValid) {
      return;
    }

    const gpsPayload =
      form.fulfillmentMethod === FULFILLMENT.DELIVERY && gps
        ? {
            lat: gps.lat,
            lng: gps.lng,
            mapsUrl: gps.mapsUrl,
            ...(gps.accuracyM !== undefined ? { accuracyM: gps.accuracyM } : {}),
          }
        : undefined;

    setOrderPersistPhase("saving");

    try {
      const result = await createOrderAction({
        customerName: form.customerName.trim(),
        customerPhone: form.phoneNumber.trim(),
        productId: form.productId,
        productSizeId: form.sizeId,
        quantity: form.quantity,
        dateNeeded: form.dateNeeded,
        fulfillmentMethod: form.fulfillmentMethod,
        mapsLinkPasted: form.mapsLinkPasted,
        addressDetails: form.addressDetails,
        notes: form.notes,
        language,
        ...(gpsPayload ? { gps: gpsPayload } : {}),
      });

      if (result.success) {
        setOrderPersistPhase("opening");
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
        queueMicrotask(() => setOrderPersistPhase(null));
        return;
      }

      setOrderPersistPhase(null);
      setPersistFailed(true);
      const msg =
        result.errorMessage === "PERSIST_FAILED" || result.errorMessage === "VALIDATION_FAILED"
          ? t.orderSave.saveFailed
          : result.errorMessage;
      setPersistUserMessage(msg);
    } catch {
      setOrderPersistPhase(null);
      setPersistFailed(true);
      setPersistUserMessage(t.orderSave.saveFailed);
    }
  }

  function openWhatsappWithoutSaving() {
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
    setPersistFailed(false);
    setPersistUserMessage(null);
  }

  if (catalogEmpty) {
    return (
      <motion.div
        className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-4 py-8 text-center"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[14px] font-semibold text-[color:var(--foreground)]">{t.form.productUnavailable}</p>
        <p className="mt-2 text-[12px] text-[color:var(--muted-text)]">{t.form.chooseAnotherProduct}</p>
      </motion.div>
    );
  }

  if (!selectedProduct || !selectedSize) {
    return null;
  }

  async function onCopyMessage() {
    if (!isValid) {
      return;
    }

    await navigator.clipboard.writeText(orderMessage);
    setCopiedMessage(true);
    window.setTimeout(() => setCopiedMessage(false), 1800);
  }

  return (
    <motion.div
      id="order-form"
      className="space-y-3"
      variants={staggerContainerVariants(reduced)}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItemVariants(reduced)} className="text-center">
        <h2 className="text-[18px] font-bold tracking-tight text-[color:var(--accent-cocoa)]">{t.form.title}</h2>
        <p className="mt-1 text-[11px] leading-snug text-[color:var(--foreground)]/68">{t.form.subtitle}</p>
        <p className="mx-auto mt-2 max-w-[20rem] text-[10px] leading-snug text-[color:var(--foreground)]/55">
          {localizedFromSettings(settings.notes.preorder, language)}
        </p>
      </motion.div>

      <motion.div
        key={`summary-${selectedProduct.id}-${selectedSize.id}-${form.quantity}-${form.fulfillmentMethod}`}
        variants={staggerItemVariants(reduced)}
        layout
        className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] shadow-[0_10px_32px_-22px_rgba(65,6,19,0.22)] ring-1 ring-[color:var(--brand-gold-muted)]/20"
      >
        <div className="flex gap-3 p-3">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--brand-burgundy)] shadow-inner ring-1 ring-[color:var(--brand-gold-muted)]/25">
            <ProductVisual
              key={selectedProduct.id}
              product={selectedProduct}
              language={language}
              className="absolute inset-0 h-full w-full"
              sizes="120px"
              density="compact"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-gold-muted)]">{t.form.summaryTitle}</p>
            <p className="mt-1 line-clamp-2 text-[14px] font-bold leading-tight text-[color:var(--accent-cocoa)]">
              {selectedProduct.name[language]}
            </p>
            <div className="mt-2 space-y-1 text-[10px] text-[color:var(--foreground)]/68">
              <p>
                <span className="font-semibold text-[color:var(--brand-burgundy-soft)]">{t.form.summarySizeLabel}:</span>{" "}
                {selectedSize.label[language]}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--brand-burgundy-soft)]">{t.form.summaryQtyLabel}:</span>{" "}
                {formatLocaleQuantity(language, form.quantity)}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--brand-burgundy-soft)]">{t.form.summaryFulfillmentLabel}:</span>{" "}
                {form.fulfillmentMethod === FULFILLMENT.PICKUP
                  ? t.form.fulfillmentOptions.pickup
                  : t.form.fulfillmentOptions.delivery}
              </p>
            </div>
            <AnimatePresence mode="sync">
              {showLocationAddedInSummary ? (
                <motion.p
                  key="loc-sum"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.12 : 0.22, ease: easePremium }}
                  className="mt-2 inline-flex rounded-full border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[color:var(--brand-gold-muted)] ring-1 ring-[color:var(--brand-gold-muted)]/25"
                >
                  {t.form.summaryLocationAdded}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
        <div className="space-y-2 border-t border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2.5">
          <div className="flex items-start justify-between gap-2 text-[10px]">
            <span className="pt-0.5 font-semibold text-[color:var(--foreground)]/62">{t.form.summaryDessertSubtotal}</span>
            <span className="shrink-0 font-bold tabular-nums text-[color:var(--foreground)]">
              {estimatedTotal.toFixed(2)} {brand.currency}
            </span>
          </div>
          {isDelivery ? (
            <div className="flex items-start justify-between gap-2 border-t border-dashed border-[color:var(--border-soft)] pt-2 text-[10px]">
              <span className="font-semibold text-[color:var(--foreground)]/62">{t.form.summaryDeliveryFeeLabel}</span>
              <span className="max-w-[63%] text-end font-medium leading-snug text-[color:var(--foreground)]/72">
                {t.form.summaryDeliveryFeeConfirmed}
              </span>
            </div>
          ) : (
            <p className="border-t border-dashed border-[color:var(--border-soft)] pt-2 text-[9px] leading-snug text-[color:var(--foreground)]/62">
              {t.form.summaryPickupLine}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-[color:var(--border-soft)] pt-2">
            <span className="text-[11px] font-bold text-[color:var(--accent-cocoa)]">{t.form.estimatedTotal}</span>
            <span className="text-[17px] font-bold tabular-nums text-[color:var(--accent-cocoa)]">
              {estimatedTotal.toFixed(2)} {brand.currency}
            </span>
          </div>
          <p className="text-[9px] leading-snug text-[color:var(--foreground)]/56">
            <span className="font-semibold text-[color:var(--brand-burgundy-soft)]">{t.form.summaryFulfillmentInline}:</span>{" "}
            {isDelivery ? t.form.fulfillmentOptions.delivery : t.form.fulfillmentOptions.pickup}
          </p>
        </div>
      </motion.div>

      <motion.form
        variants={staggerContainerVariants(reduced)}
        className="space-y-3"
        onSubmit={onSubmit}
        noValidate
      >
        <MotionSection title={t.form.sectionCustomer} reduced={reduced}>
          <label className={labelClass}>
            {t.form.customerName}
            <input
              className={inputStyles}
              autoComplete="name"
              value={form.customerName}
              onChange={(event) => updateForm("customerName", event.target.value)}
              required
            />
            <FieldError
              show={attemptedSubmit}
              message={validationErrors.customerName}
              reduced={reduced}
            />
          </label>
          <label className={labelClass}>
            {t.form.phone}
            <input
              className={inputStyles}
              value={form.phoneNumber}
              onChange={(event) => updateForm("phoneNumber", event.target.value)}
              placeholder="+968…"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            <FieldError show={attemptedSubmit} message={validationErrors.phoneNumber} reduced={reduced} />
          </label>
        </MotionSection>

        <MotionSection title={t.form.sectionDessert} reduced={reduced}>
          {initialUnavailableFromUrl ? (
            <p
              role="status"
              className="mb-2 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-[11px] font-medium text-[color:var(--brand-burgundy-soft)]"
            >
              {t.form.productUnavailable} {t.form.chooseAnotherProduct}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label className={labelClass}>
              {t.form.dessert}
              <select
                className={inputStyles}
                value={form.productId}
                onChange={(event) => onProductChange(event.target.value)}
                required
              >
                {orderableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name[language]}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {t.form.size}
              <select
                className={inputStyles}
                value={form.sizeId}
                onChange={(event) => updateForm("sizeId", event.target.value)}
                required
              >
                {availableSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.label[language]} ({size.serves[language]}) — {size.priceOmr.toFixed(2)}{" "}
                    {brand.currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <FieldError show={attemptedSubmit} message={validationErrors.productId ?? validationErrors.sizeId} reduced={reduced} />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label className={labelClass}>
              {t.form.quantity}
              <input
                className={inputStyles}
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) => updateForm("quantity", Math.max(1, Number(event.target.value) || 1))}
                required
              />
              <FieldError show={attemptedSubmit} message={validationErrors.quantity} reduced={reduced} />
            </label>
            <label className={labelClass}>
              {t.form.dateNeeded}
              <input
                className={inputStyles}
                type="date"
                value={form.dateNeeded}
                onChange={(event) => updateForm("dateNeeded", event.target.value)}
                required
              />
              <FieldError show={attemptedSubmit} message={validationErrors.dateNeeded} reduced={reduced} />
              {dateLooksValid ? (
                <div
                  role="status"
                  className={`mt-2 rounded-xl border px-2.5 py-2 text-[10px] leading-snug ${
                    availabilityBusy
                      ? "border-[color:var(--border-soft)] bg-[color:var(--card-cream)] text-[color:var(--muted-text)]"
                      : availabilityPayload?.status === "AVAILABLE"
                        ? "border-emerald-800/25 bg-emerald-50 text-emerald-950"
                        : availabilityPayload?.status === "FEW_SLOTS_LEFT"
                          ? "border-amber-800/35 bg-amber-50 text-amber-950"
                          : "border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-cream)] text-[color:var(--brand-burgundy-soft)]"
                  }`}
                >
                  {availabilityBusy ? (
                    t.form.availabilityChecking
                  ) : availabilityPayload ? (
                    language === "ar" ? availabilityPayload.messageAr : availabilityPayload.messageEn
                  ) : (
                    t.form.availabilityPickDate
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-[color:var(--muted-text)]">{t.form.availabilityPickDate}</p>
              )}
            </label>
          </div>
        </MotionSection>

        <MotionSection title={t.form.sectionFulfillment} reduced={reduced}>
          <label className={labelClass}>
            {t.form.fulfillment}
            <select
              className={inputStyles}
              value={form.fulfillmentMethod}
              onChange={(event) =>
                onFulfillmentChange(event.target.value as FulfillmentMethod)
              }
              required
            >
              <option value="pickup">{t.form.fulfillmentOptions.pickup}</option>
              <option value="delivery">{t.form.fulfillmentOptions.delivery}</option>
            </select>
          </label>
          <FieldError show={attemptedSubmit} message={validationErrors.fulfillmentMethod} reduced={reduced} />

          {form.fulfillmentMethod === FULFILLMENT.PICKUP ? (
            <motion.div
              key="pickup-note"
              layout={false}
              initial={reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.1 : 0.2, ease: easePremium }}
              className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2.5 text-[10px] leading-relaxed text-[color:var(--foreground)]/72"
            >
              {t.form.pickupDetailsWhatsappNote}
            </motion.div>
          ) : null}

          {form.fulfillmentMethod === FULFILLMENT.DELIVERY ? (
            <motion.div
              key="delivery-fields"
              layout={false}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.22, ease: easePremium }}
              className="space-y-2.5 border-t border-[color:var(--border-soft)] pt-2.5"
            >
              <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-gold-muted)]">
                {t.form.sectionDeliveryLocation}
              </h4>

              <div className="space-y-2">
                <motion.button
                  type="button"
                  onClick={onUseGeolocationClick}
                  disabled={geoUi === "loading"}
                  whileTap={tapScale}
                  transition={{ duration: 0.15 }}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[color:var(--brand-gold-muted)]/50 bg-[color:var(--brand-burgundy)] px-3 text-[12px] font-semibold text-[color:var(--card-cream)] shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-60"
                >
                  {geoUi === "loading" ? t.form.detectingLocation : t.form.useCurrentLocation}
                </motion.button>

                <AnimatePresence mode="sync">
                  {geoUi === "success" && gps ? (
                    <motion.div
                      key="geo-success"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0.12 : 0.2, ease: easePremium }}
                      className="space-y-2 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2.5 ring-1 ring-[color:var(--brand-gold-muted)]/25"
                    >
                      <p className="text-[11px] font-semibold text-[color:var(--brand-gold-muted)]">{t.form.locationAddedSuccess}</p>
                      {gps.accuracyM !== undefined ? (
                        <p className="text-[9px] text-[color:var(--foreground)]/58">±{gps.accuracyM} m</p>
                      ) : null}
                      <div className="rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--card-beige)]/90 px-2.5 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[color:var(--brand-burgundy-soft)]">
                          {t.form.locationGpsLine}
                        </p>
                        <a
                          href={gps.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 break-all text-[10px] text-[color:var(--brand-burgundy-soft)] underline decoration-[color:var(--border-soft)] underline-offset-2"
                        >
                          {gps.mapsUrl}
                        </a>
                        <motion.a
                          href={gps.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileTap={tapScale}
                          className="mt-2 inline-flex min-h-9 items-center rounded-full bg-[color:var(--brand-burgundy)] px-4 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--card-cream)] ring-1 ring-[color:var(--border-soft)]"
                        >
                          {t.form.openMap}
                        </motion.a>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence mode="sync">
                  {geoUi === "error" && geoErrorMessage ? (
                    <motion.div
                      key="geo-error"
                      role="alert"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0.12 : 0.18, ease: easePremium }}
                      className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-[10px] leading-snug text-[color:var(--brand-burgundy-soft)]"
                    >
                      {geoErrorMessage}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <label className={labelClass}>
                {t.form.googleMapsLinkLabel}
                <span className="mt-0.5 block text-[9px] font-normal text-[color:var(--foreground)]/55">
                  {t.form.pasteGoogleMapsLinkHint}
                </span>
                <input
                  className={inputStyles}
                  type="url"
                  inputMode="url"
                  value={form.mapsLinkPasted}
                  onChange={(event) => updateForm("mapsLinkPasted", event.target.value)}
                  placeholder="https://maps.google.com/…"
                />
                <FieldError show={attemptedSubmit} message={validationErrors.mapsLinkPasted} reduced={reduced} />
              </label>

              <label className={labelClass}>
                {t.form.addressDetailsLabel}
                <textarea
                  className={`${inputStyles} min-h-[4.75rem] resize-y py-2`}
                  required
                  value={form.addressDetails}
                  onChange={(event) => updateForm("addressDetails", event.target.value)}
                  placeholder={t.form.addressDetailsPlaceholder}
                  rows={3}
                />
                <FieldError show={attemptedSubmit} message={validationErrors.addressDetails} reduced={reduced} />
              </label>

              <FieldError
                show={attemptedSubmit}
                message={validationErrors.deliveryLocationMethod}
                reduced={reduced}
              />

              <p className="text-[9px] leading-snug text-[color:var(--foreground)]/62">
                {localizedFromSettings(settings.notes.delivery, language)}
              </p>
            </motion.div>
          ) : null}
        </MotionSection>

        <MotionSection title={t.form.sectionNotes} reduced={reduced}>
          <label className={labelClass}>
            {t.form.notes}
            <textarea
              className={`${inputStyles} min-h-[4.5rem] resize-y py-2`}
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder={t.form.notesPlaceholder}
              rows={3}
            />
          </label>
          <div className="space-y-1.5 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2 text-[10px] leading-snug text-[color:var(--foreground)]/70">
            <p>{t.form.orderConfirmationNote}</p>
            <p>{localizedFromSettings(settings.notes.payment, language)}</p>
            {isDelivery ? <p>{localizedFromSettings(settings.notes.delivery, language)}</p> : null}
          </div>
        </MotionSection>

        <motion.button
          type="submit"
          variants={staggerItemVariants(reduced)}
          whileTap={tapScale}
          transition={{ duration: 0.15 }}
          disabled={
            orderPersistPhase === "saving" ||
            orderPersistPhase === "opening" ||
            availabilityBusy ||
            !availabilityGatePasses
          }
          aria-busy={orderPersistPhase === "saving"}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color:var(--brand-gold-muted)]/45 bg-[color:var(--brand-burgundy)] px-4 py-3 text-[13px] font-semibold text-[color:var(--card-cream)] shadow-[0_10px_28px_-14px_rgba(65,6,19,0.45)] ring-1 ring-[color:var(--border-soft)] transition-[filter] hover:brightness-[1.03] focus-visible:outline-none active:brightness-95 disabled:pointer-events-none disabled:opacity-60"
        >
          {t.form.sendWhatsapp}
        </motion.button>

        <AnimatePresence mode="sync">
          {orderPersistPhase === "saving" ? (
            <motion.p
              key="order-saving"
              role="status"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.18, ease: easePremium }}
              className="px-1 text-center text-[10px] font-medium text-[color:var(--brand-gold-muted)]"
            >
              {t.orderSave.saving}
            </motion.p>
          ) : orderPersistPhase === "opening" ? (
            <motion.p
              key="order-opening"
              role="status"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.18, ease: easePremium }}
              className="px-1 text-center text-[10px] font-medium text-[color:var(--brand-gold-muted)]"
            >
              {t.orderSave.savedOpeningWhatsapp}
            </motion.p>
          ) : persistFailed ? (
            <motion.p
              key="order-failed"
              role="alert"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.18, ease: easePremium }}
              className="px-1 text-center text-[10px] leading-snug text-[color:var(--brand-burgundy-soft)]"
            >
              {persistUserMessage ?? t.orderSave.saveFailed}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {persistFailed ? (
          <motion.button
            type="button"
            variants={staggerItemVariants(reduced)}
            whileTap={tapScale}
            transition={{ duration: 0.15 }}
            className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-4 py-2.5 text-[11px] font-semibold text-[color:var(--brand-burgundy)] ring-1 ring-[color:var(--brand-gold-muted)]/20 focus-visible:outline-none active:bg-[color:var(--card-beige)]"
            onClick={openWhatsappWithoutSaving}
          >
            {t.orderSave.whatsappWithoutSave}
          </motion.button>
        ) : null}

        <p className="px-1 text-center text-[10px] leading-relaxed text-[color:var(--foreground)]/62">{t.form.fallback}</p>

        {isValid ? (
          <motion.button
            type="button"
            variants={staggerItemVariants(reduced)}
            onClick={onCopyMessage}
            whileTap={tapScale}
            transition={{ duration: 0.15 }}
            className="flex min-h-11 w-full items-center justify-center rounded-2xl border-2 border-[color:var(--brand-gold)] bg-[color:var(--card-cream)] px-4 py-2.5 text-[12px] font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-beige)] focus-visible:outline-none active:bg-[color:var(--card-beige)]"
          >
            {t.form.copyMessage}
          </motion.button>
        ) : null}

        <AnimatePresence mode="sync">
          {copiedMessage ? (
            <motion.p
              key="copied"
              role="status"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.2, ease: easePremium }}
              className="text-center text-[10px] font-medium text-[color:var(--brand-gold-muted)]"
            >
              {t.form.copied}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.form>
    </motion.div>
  );
}
