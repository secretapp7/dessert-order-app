"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  updateBusinessIdentitySettingsAction,
  updateContactCopySettingsAction,
  updateContactSettingsAction,
  updateCustomerNoteSettingsAction,
  updateHomepageSettingsAction,
} from "@/lib/admin/actions/settings-actions";
import type { AdminBusinessSettingsRecord } from "@/lib/admin/data/settings-queries";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const textarea =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-4 py-2 text-xs font-semibold text-[color:var(--card-cream)] hover:brightness-110";

export function BusinessSettingsForms({ settings }: { settings: AdminBusinessSettingsRecord }) {
  return (
    <div className="space-y-6">
      <SettingsCard title="Business identity" description="Name and city shown across the customer app.">
        <AdminActionForm action={updateBusinessIdentitySettingsAction} className="grid gap-3 sm:grid-cols-2">
          <label className={lbl}>
            Business name (EN)
            <input name="businessNameEn" required defaultValue={settings.businessNameEn} className={field} />
          </label>
          <label className={lbl}>
            Business name (AR)
            <input name="businessNameAr" required defaultValue={settings.businessNameAr} className={field} dir="rtl" />
          </label>
          <label className={lbl}>
            City (EN)
            <input name="businessCityEn" required defaultValue={settings.businessCityEn} className={field} />
          </label>
          <label className={lbl}>
            City (AR)
            <input name="businessCityAr" required defaultValue={settings.businessCityAr} className={field} dir="rtl" />
          </label>
          <label className={lbl}>
            Currency
            <input name="currency" required defaultValue={settings.currency} className={field} maxLength={8} />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className={btn}>
              Save identity
            </button>
          </div>
        </AdminActionForm>
      </SettingsCard>

      <SettingsCard
        title="Contact channels"
        description="WhatsApp and Instagram used on Contact, footer, and WhatsApp links. Secrets stay in env — not here."
      >
        <AdminActionForm action={updateContactSettingsAction} className="grid gap-3 sm:grid-cols-2">
          <label className={`${lbl} sm:col-span-2`}>
            WhatsApp number
            <input
              name="whatsappNumber"
              required
              defaultValue={settings.whatsappNumber}
              className={field}
              inputMode="tel"
              placeholder="+968…"
            />
          </label>
          <label className={lbl}>
            Instagram handle
            <input name="instagramHandle" required defaultValue={settings.instagramHandle} className={field} />
          </label>
          <label className={lbl}>
            Instagram URL
            <input
              name="instagramUrl"
              required
              type="url"
              defaultValue={settings.instagramUrl}
              className={field}
              placeholder="https://www.instagram.com/…"
            />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className={btn}>
              Save contact channels
            </button>
          </div>
        </AdminActionForm>
      </SettingsCard>

      <SettingsCard title="Customer notes" description="Short policy lines on order, contact, and product pages.">
        <AdminActionForm action={updateCustomerNoteSettingsAction} className="grid gap-3 sm:grid-cols-2">
          <NotePair
            enName="preorderNoteEn"
            arName="preorderNoteAr"
            enLabel="Preorder note (EN)"
            arLabel="Preorder note (AR)"
            enDefault={settings.preorderNoteEn}
            arDefault={settings.preorderNoteAr}
          />
          <NotePair
            enName="deliveryNoteEn"
            arName="deliveryNoteAr"
            enLabel="Delivery note (EN)"
            arLabel="Delivery note (AR)"
            enDefault={settings.deliveryNoteEn}
            arDefault={settings.deliveryNoteAr}
          />
          <NotePair
            enName="paymentNoteEn"
            arName="paymentNoteAr"
            enLabel="Payment note (EN)"
            arLabel="Payment note (AR)"
            enDefault={settings.paymentNoteEn}
            arDefault={settings.paymentNoteAr}
          />
          <NotePair
            enName="pickupNoteEn"
            arName="pickupNoteAr"
            enLabel="Pickup note (EN)"
            arLabel="Pickup note (AR)"
            enDefault={settings.pickupNoteEn}
            arDefault={settings.pickupNoteAr}
          />
          <NotePair
            enName="largeOrderNoteEn"
            arName="largeOrderNoteAr"
            enLabel="Large order note (EN)"
            arLabel="Large order note (AR)"
            enDefault={settings.largeOrderNoteEn}
            arDefault={settings.largeOrderNoteAr}
          />
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className={btn}>
              Save customer notes
            </button>
          </div>
        </AdminActionForm>
      </SettingsCard>

      <SettingsCard title="Homepage copy" description="Hero tagline and subtitle on the home screen.">
        <AdminActionForm action={updateHomepageSettingsAction} className="grid gap-3 sm:grid-cols-2">
          <NotePair
            enName="homeHeadlineEn"
            arName="homeHeadlineAr"
            enLabel="Home headline (EN)"
            arLabel="Home headline (AR)"
            enDefault={settings.homeHeadlineEn}
            arDefault={settings.homeHeadlineAr}
            rows={2}
          />
          <NotePair
            enName="homeSubtitleEn"
            arName="homeSubtitleAr"
            enLabel="Home subtitle (EN)"
            arLabel="Home subtitle (AR)"
            enDefault={settings.homeSubtitleEn}
            arDefault={settings.homeSubtitleAr}
            rows={3}
          />
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className={btn}>
              Save homepage copy
            </button>
          </div>
        </AdminActionForm>
      </SettingsCard>

      <SettingsCard title="Contact page copy" description="Intro line under the Contact heading.">
        <AdminActionForm action={updateContactCopySettingsAction} className="grid gap-3 sm:grid-cols-2">
          <NotePair
            enName="contactIntroEn"
            arName="contactIntroAr"
            enLabel="Contact intro (EN)"
            arLabel="Contact intro (AR)"
            enDefault={settings.contactIntroEn}
            arDefault={settings.contactIntroAr}
            rows={2}
          />
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className={btn}>
              Save contact copy
            </button>
          </div>
        </AdminActionForm>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</h2>
      <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NotePair({
  enName,
  arName,
  enLabel,
  arLabel,
  enDefault,
  arDefault,
  rows = 2,
}: {
  enName: string;
  arName: string;
  enLabel: string;
  arLabel: string;
  enDefault: string;
  arDefault: string;
  rows?: number;
}) {
  return (
    <>
      <label className={lbl}>
        {enLabel}
        <textarea name={enName} required rows={rows} defaultValue={enDefault} className={textarea} />
      </label>
      <label className={lbl}>
        {arLabel}
        <textarea name={arName} required rows={rows} defaultValue={arDefault} className={textarea} dir="rtl" />
      </label>
    </>
  );
}
