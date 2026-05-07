import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-[#e7d4c2] pt-6 pb-8 text-center text-sm text-[#7a5f4e]">
      <p className="font-medium text-[#4b2e21]">{brand.name}</p>
      <p className="mt-1">Location: {brand.city}</p>
      <p className="mt-1">Made fresh by pre-order.</p>
      <p className="mt-3 text-xs text-[#9a7a63]">
        DM-ready desserts for your feed and special moments. {brand.instagramHandle}
      </p>
    </footer>
  );
}
