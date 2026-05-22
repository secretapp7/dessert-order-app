"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  blockCustomerFormAction,
  markCustomerVipFormAction,
  touchCustomerContactedAction,
  unblockCustomerFormAction,
  unmarkCustomerVipFormAction,
  updateCustomerNoteFormAction,
  updateCustomerPreferredLanguageFormAction,
  updateCustomerProfileFormAction,
  updateCustomerTagsFormAction,
} from "@/lib/admin/actions/customer-actions";
import type { CustomerAdminRecord } from "@/lib/admin/data/customer-queries";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";
const btnOutline =
  "rounded-lg border border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--brand-burgundy)]";

export function CustomerProfileForm({ customer }: { customer: CustomerAdminRecord }) {
  return (
    <AdminActionForm action={updateCustomerProfileFormAction} className="max-w-xl space-y-3">
      <input type="hidden" name="id" value={customer.id} />
      <label className={lbl}>
        Name
        <input name="name" required defaultValue={customer.name} className={field} />
      </label>
      <label className={lbl}>
        Phone
        <input name="phone" required defaultValue={customer.phone} className={field} />
      </label>
      <label className={lbl}>
        Email (optional)
        <input name="email" type="email" defaultValue={customer.email ?? ""} className={field} />
      </label>
      <button type="submit" className={btn}>
        Save profile
      </button>
    </AdminActionForm>
  );
}

export function CustomerNoteForm({ customer }: { customer: CustomerAdminRecord }) {
  return (
    <AdminActionForm action={updateCustomerNoteFormAction} className="max-w-xl space-y-3">
      <input type="hidden" name="id" value={customer.id} />
      <label className={lbl}>
        Internal note (admin only)
        <textarea
          name="internalNote"
          rows={4}
          defaultValue={customer.internalNote ?? ""}
          className={field}
        />
      </label>
      <button type="submit" className={btn}>
        Save note
      </button>
    </AdminActionForm>
  );
}

export function CustomerTagsForm({ customer }: { customer: CustomerAdminRecord }) {
  return (
    <AdminActionForm action={updateCustomerTagsFormAction} className="max-w-xl space-y-3">
      <input type="hidden" name="id" value={customer.id} />
      <label className={lbl}>
        Tags (comma-separated)
        <input name="tags" defaultValue={customer.tags ?? ""} className={field} placeholder="vip, corporate, family" />
      </label>
      <button type="submit" className={btn}>
        Save tags
      </button>
    </AdminActionForm>
  );
}

export function CustomerLanguageForm({ customer }: { customer: CustomerAdminRecord }) {
  return (
    <AdminActionForm action={updateCustomerPreferredLanguageFormAction} className="max-w-xl space-y-3">
      <input type="hidden" name="id" value={customer.id} />
      <label className={lbl}>
        Preferred WhatsApp language
        <select name="preferredLanguage" defaultValue={customer.preferredLanguage ?? ""} className={field}>
          <option value="">Auto (from latest order)</option>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </label>
      <button type="submit" className={btn}>
        Save language
      </button>
    </AdminActionForm>
  );
}

export function CustomerFlagsPanel({ customer }: { customer: CustomerAdminRecord }) {
  return (
    <div className="flex flex-wrap gap-2">
      {customer.isVip ? (
        <AdminActionForm action={unmarkCustomerVipFormAction}>
          <input type="hidden" name="id" value={customer.id} />
          <button type="submit" className={btnOutline}>
            Remove VIP
          </button>
        </AdminActionForm>
      ) : (
        <AdminActionForm action={markCustomerVipFormAction}>
          <input type="hidden" name="id" value={customer.id} />
          <button type="submit" className={btn}>
            Mark VIP
          </button>
        </AdminActionForm>
      )}
      {customer.isBlocked ? (
        <AdminActionForm action={unblockCustomerFormAction}>
          <input type="hidden" name="id" value={customer.id} />
          <button type="submit" className={btnOutline}>
            Unblock
          </button>
        </AdminActionForm>
      ) : (
        <AdminActionForm action={blockCustomerFormAction}>
          <input type="hidden" name="id" value={customer.id} />
          <button type="submit" className={btnOutline}>
            Block
          </button>
        </AdminActionForm>
      )}
      <AdminActionForm action={touchCustomerContactedAction}>
        <input type="hidden" name="id" value={customer.id} />
        <button type="submit" className={btnOutline}>
          Mark contacted now
        </button>
      </AdminActionForm>
    </div>
  );
}
