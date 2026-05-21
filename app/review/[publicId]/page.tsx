import { AppShell } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import {
  CustomerReviewForm,
  CustomerReviewMessage,
} from "@/components/reviews/customer-review-form";
import { translations } from "@/config/translations";
import { getCustomerReviewPageState } from "@/lib/reviews/customer-review-service";

export const dynamic = "force-dynamic";

type ReviewPageProps = {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function CustomerReviewPage({ params, searchParams }: ReviewPageProps) {
  const { publicId } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;

  const state = await getCustomerReviewPageState(publicId, token);

  if (state.kind === "invalid") {
    return (
      <AppShell>
        <div className="mx-auto max-w-md space-y-4 px-1 py-6">
          <CustomerReviewMessage language="en" variant="invalid" />
          <div dir="rtl">
            <CustomerReviewMessage language="ar" variant="invalid" />
          </div>
        </div>
      </AppShell>
    );
  }

  const language = state.language;
  const t = translations[language].orderReview;

  return (
    <AppShell>
      <div
        className="mx-auto max-w-md space-y-5 px-1 py-6"
        dir={language === "ar" ? "rtl" : "ltr"}
        lang={language}
      >
        <div className="flex flex-col items-center text-center">
          <BrandLogo variant="contact" language={language} />
          <h1 className="mt-4 text-[18px] font-bold text-[color:var(--brand-burgundy)]">{t.pageTitle}</h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted-text)]">{t.pageIntro}</p>
        </div>

        <div className="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          {state.kind === "already_reviewed" ? (
            <CustomerReviewMessage language={language} variant="already_reviewed" />
          ) : (
            <CustomerReviewForm {...state} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
