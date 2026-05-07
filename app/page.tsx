import { HeroSection } from "@/components/hero-section";
import { OrderForm } from "@/components/order-form";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/config/brand";
import { products } from "@/data/products";

const whyOrderItems = [
  {
    title: "Crafted in small batches",
    description:
      "Each order is prepared with attention to texture, balance, and freshness.",
  },
  {
    title: "Premium ingredients",
    description: "Quality cream, cocoa, and fruit toppings for rich flavor in every bite.",
  },
  {
    title: "Simple mobile ordering",
    description: "Choose your dessert and send your full request on WhatsApp in seconds.",
  },
];

export default function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-3 sm:px-6 sm:pb-10 sm:pt-5">
        <header className="sticky top-2 z-20 mb-4 rounded-2xl border border-[#e7d4c2] bg-[#fff9f3]/95 px-4 py-3 shadow-[0_12px_25px_-20px_rgba(75,46,33,0.7)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold tracking-tight text-[#4b2e21]">{brand.name}</p>
              <p className="text-xs text-[#7a5f4e]">
                {brand.city} - {brand.headerNote}
              </p>
            </div>
            <a
              href="#order-form"
              className="inline-flex h-9 items-center rounded-full bg-[#4b2e21] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#fff7ee]"
            >
              Order
            </a>
          </div>
        </header>

        <HeroSection />

        <section className="mt-6 rounded-[2rem] border border-[#e7d4c2] bg-[#fff3ea] p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#4b2e21] sm:text-2xl">
            How it works
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {brand.howItWorks.map((step, index) => (
              <article key={step.title} className="rounded-2xl bg-[#fffaf4] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#9f7a52]">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 font-semibold text-[#5a3829]">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#7a5f4e]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[#4b2e21]">Dessert menu</h2>
            <p className="mt-1 text-sm text-[#7a5f4e]">
              Signature selections available for launch week.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mt-7 rounded-[2rem] border border-[#e7d4c2] bg-[#fff3ea] p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#4b2e21] sm:text-2xl">
            Important notes
          </h2>
          <ul className="mt-4 space-y-2">
            {brand.importantNotes.map((note) => (
              <li
                key={note}
                className="rounded-xl bg-[#fffaf4] px-4 py-3 text-sm leading-relaxed text-[#7a5f4e]"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7 rounded-[2rem] border border-[#e7d4c2] bg-[#fff3ea] p-5 sm:p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#4b2e21]">
            Why order from us
          </h2>
          <div className="mt-4 space-y-4">
            {whyOrderItems.map((item) => (
              <article key={item.title} className="rounded-2xl bg-[#fffaf4] p-4">
                <h3 className="font-semibold text-[#5a3829]">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#7a5f4e]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <OrderForm />
        </section>

        <SiteFooter />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7d4c2] bg-[#fff9f2]/90 p-3 backdrop-blur sm:hidden">
        <a
          href="#order-form"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#5c392a] to-[#4b2e21] px-4 py-3 text-sm font-semibold text-[#fff7ee] shadow-[0_10px_20px_-15px_rgba(75,46,33,0.9)]"
        >
          {brand.whatsappCtaLabel}
        </a>
      </div>
    </>
  );
}
