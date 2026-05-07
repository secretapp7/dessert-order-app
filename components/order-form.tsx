"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { brand } from "@/config/brand";
import { products } from "@/data/products";

type DeliveryMethod =
  | typeof brand.fulfillmentLabels.pickup
  | typeof brand.fulfillmentLabels.delivery;

type OrderFormState = {
  customerName: string;
  phoneNumber: string;
  productId: string;
  sizeLabel: string;
  quantity: number;
  dateNeeded: string;
  fulfillmentMethod: DeliveryMethod;
  location: string;
  notes: string;
};

const initialProduct = products[0];
const initialSize = initialProduct.sizes[0];

const inputStyles =
  "mt-1 w-full rounded-xl border border-[#dfcbb8] bg-[#fffdfb] px-4 py-3 text-base text-[#4b2e21] outline-none transition focus:border-[#c9a37c] focus:ring-2 focus:ring-[#f0d8bf]";

export function OrderForm() {
  const dessertSelectRef = useRef<HTMLSelectElement>(null);
  const [form, setForm] = useState<OrderFormState>({
    customerName: "",
    phoneNumber: "",
    productId: initialProduct.id,
    sizeLabel: initialSize.label,
    quantity: 1,
    dateNeeded: "",
    fulfillmentMethod: brand.fulfillmentLabels.pickup,
    location: "",
    notes: "",
  });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) ?? products[0],
    [form.productId],
  );

  const availableSizes = selectedProduct.sizes;
  const selectedSize =
    availableSizes.find((size) => size.label === form.sizeLabel) ?? availableSizes[0];
  const estimatedTotal = selectedSize.priceOmr * form.quantity;

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof OrderFormState, string>> = {};

    if (form.customerName.trim().length < 2) {
      errors.customerName = "Please enter your full name.";
    }

    const cleanedPhone = form.phoneNumber.replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,15}$/.test(cleanedPhone)) {
      errors.phoneNumber = "Please enter a valid phone number.";
    }

    if (!form.dateNeeded) {
      errors.dateNeeded = "Please choose a date.";
    }

    if (form.quantity < 1 || Number.isNaN(form.quantity)) {
      errors.quantity = "Quantity must be at least 1.";
    }

    if (
      form.fulfillmentMethod === brand.fulfillmentLabels.delivery &&
      form.location.trim().length < 3
    ) {
      errors.location = "Please add delivery location details so we can confirm the area.";
    }

    return errors;
  }, [
    form.customerName,
    form.dateNeeded,
    form.fulfillmentMethod,
    form.location,
    form.phoneNumber,
    form.quantity,
  ]);

  const isValid = Object.keys(validationErrors).length === 0;

  const orderMessage = useMemo(() => {
    const dateLine = form.dateNeeded || "Not specified";
    const locationLine = form.location || "Not specified";
    const notesLine = form.notes || "None";

    return [
      `Hello ${brand.name}, I would like to place a dessert pre-order.`,
      "",
      "*Customer details*",
      `- Name: ${form.customerName || "-"}`,
      `- Phone: ${form.phoneNumber || "-"}`,
      "",
      "*Order details*",
      `- Dessert: ${selectedProduct.name}`,
      `- Size: ${selectedSize.label} (${selectedSize.serves})`,
      `- Quantity: ${form.quantity}`,
      `- Date needed: ${dateLine}`,
      `- Method: ${form.fulfillmentMethod}`,
      `- Location: ${
        form.fulfillmentMethod === brand.fulfillmentLabels.pickup ? "Pickup location to be shared" : locationLine
      }`,
      "",
      "*Extra notes*",
      `- ${notesLine}`,
      "",
      `Estimated total: ${estimatedTotal.toFixed(2)} ${brand.currency}`,
    ].join("\n");
  }, [estimatedTotal, form, selectedProduct.name, selectedSize.label, selectedSize.serves]);

  const whatsappHref = useMemo(() => {
    const normalizedPhone = brand.whatsappNumber.replace(/[^\d]/g, "");
    return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(orderMessage)}`;
  }, [orderMessage]);

  function updateForm<K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function onProductChange(productId: string) {
    const product = products.find((item) => item.id === productId) ?? products[0];
    setForm((previous) => ({
      ...previous,
      productId: product.id,
      sizeLabel: product.sizes[0].label,
    }));
  }

  useEffect(() => {
    const onDessertSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{ productId?: string }>;
      if (!customEvent.detail?.productId) {
        return;
      }

      onProductChange(customEvent.detail.productId);
      dessertSelectRef.current?.focus();
    };

    window.addEventListener("dessert:selected", onDessertSelect as EventListener);
    return () => window.removeEventListener("dessert:selected", onDessertSelect as EventListener);
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (!isValid) {
      return;
    }

    window.open(whatsappHref, "_blank", "noopener,noreferrer");
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
    <section id="order-form" className="rounded-[2rem] border border-[#e7d4c2] bg-[#fff8f1] p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#4b2e21]">Place your order</h2>
        <p className="mt-1 text-sm text-[#7a5f4e]">
          Fill in your details and continue on WhatsApp.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <label className="block text-sm font-medium text-[#5f4638]">
          Customer name
          <input
            className={inputStyles}
            value={form.customerName}
            onChange={(event) => updateForm("customerName", event.target.value)}
            required
          />
          {attemptedSubmit && validationErrors.customerName ? (
            <p className="mt-1 text-xs text-[#a44750]">{validationErrors.customerName}</p>
          ) : null}
        </label>

        <label className="block text-sm font-medium text-[#5f4638]">
          Phone number
          <input
            className={inputStyles}
            value={form.phoneNumber}
            onChange={(event) => updateForm("phoneNumber", event.target.value)}
            placeholder="+968..."
            inputMode="tel"
            required
          />
          {attemptedSubmit && validationErrors.phoneNumber ? (
            <p className="mt-1 text-xs text-[#a44750]">{validationErrors.phoneNumber}</p>
          ) : null}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[#5f4638]">
            Dessert selection
            <select
              ref={dessertSelectRef}
              className={inputStyles}
              value={form.productId}
              onChange={(event) => onProductChange(event.target.value)}
              required
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-[#5f4638]">
            Size
            <select
              className={inputStyles}
              value={form.sizeLabel}
              onChange={(event) => updateForm("sizeLabel", event.target.value)}
              required
            >
              {availableSizes.map((size) => (
                <option key={size.label} value={size.label}>
                  {size.label} ({size.serves}) - {size.priceOmr.toFixed(2)} OMR
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[#5f4638]">
            Quantity
            <input
              className={inputStyles}
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) =>
                updateForm("quantity", Math.max(1, Number(event.target.value) || 1))
              }
              required
            />
            {attemptedSubmit && validationErrors.quantity ? (
              <p className="mt-1 text-xs text-[#a44750]">{validationErrors.quantity}</p>
            ) : null}
          </label>
          <label className="block text-sm font-medium text-[#5f4638]">
            Date needed
            <input
              className={inputStyles}
              type="date"
              value={form.dateNeeded}
              onChange={(event) => updateForm("dateNeeded", event.target.value)}
              required
            />
            {attemptedSubmit && validationErrors.dateNeeded ? (
              <p className="mt-1 text-xs text-[#a44750]">{validationErrors.dateNeeded}</p>
            ) : null}
          </label>
        </div>

        <label className="block text-sm font-medium text-[#5f4638]">
          Pickup or delivery
          <select
            className={inputStyles}
            value={form.fulfillmentMethod}
            onChange={(event) =>
              updateForm("fulfillmentMethod", event.target.value as DeliveryMethod)
            }
            required
          >
            <option value={brand.fulfillmentLabels.pickup}>
              {brand.fulfillmentLabels.pickup}
            </option>
            <option value={brand.fulfillmentLabels.delivery}>
              {brand.fulfillmentLabels.delivery}
            </option>
          </select>
        </label>

        <label className="block text-sm font-medium text-[#5f4638]">
          {form.fulfillmentMethod === brand.fulfillmentLabels.delivery
            ? "Delivery location"
            : "Pickup location (optional)"}
          <input
            className={inputStyles}
            value={form.location}
            onChange={(event) => updateForm("location", event.target.value)}
            placeholder={
              form.fulfillmentMethod === brand.fulfillmentLabels.delivery
                ? "Area / address details"
                : "Optional pickup point"
            }
            required={form.fulfillmentMethod === brand.fulfillmentLabels.delivery}
          />
          {attemptedSubmit && validationErrors.location ? (
            <p className="mt-1 text-xs text-[#a44750]">{validationErrors.location}</p>
          ) : null}
        </label>

        <label className="block text-sm font-medium text-[#5f4638]">
          Notes
          <textarea
            className={inputStyles}
            value={form.notes}
            onChange={(event) => updateForm("notes", event.target.value)}
            placeholder="Allergies, sweetness level, preferred pickup time..."
            rows={3}
          />
        </label>

        <div className="rounded-xl bg-[#fff1e2] p-3 text-xs leading-relaxed text-[#7a5f4e]">
          {brand.orderConfirmationNote}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-[#fff4ea] px-4 py-3 text-sm">
          <span className="text-[#7a5f4e]">Estimated total</span>
          <span className="font-semibold text-[#4b2e21]">
            {estimatedTotal.toFixed(2)} {brand.currency}
          </span>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#4b2e21] px-4 py-3 text-sm font-semibold text-[#fff6eb] transition hover:bg-[#3d241a] disabled:cursor-not-allowed disabled:bg-[#8b6f60]"
          disabled={!isValid && attemptedSubmit}
        >
          Send order on WhatsApp
        </button>

        <p className="text-center text-xs text-[#7a5f4e]">
          If WhatsApp does not open, copy your order message and send it manually.
        </p>

        {isValid ? (
          <button
            type="button"
            onClick={onCopyMessage}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#ccb39a] bg-[#fffaf4] px-4 py-3 text-sm font-semibold text-[#5a3829] transition hover:bg-[#fff2e6]"
          >
            Copy order message
          </button>
        ) : null}

        {copiedMessage ? (
          <p className="text-center text-xs font-medium text-[#4b7f4f]">
            Order message copied successfully.
          </p>
        ) : null}
      </form>
    </section>
  );
}
