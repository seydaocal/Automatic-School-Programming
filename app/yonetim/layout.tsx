"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useOkulContext } from "@/context/okul-context";

export default function YonetimLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { secilenOkul } = useOkulContext();

  if (!secilenOkul) {
    return (
      <main className="kapsayici">
        <section className="alt-kapsayici">
          <p>Önce bir okul seçmelisiniz.</p>
          <Link href="/" className="kaydet-btn">
            Ana sayfaya dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="kapsayici">
      <header className="site-adi">
        <h1>{secilenOkul.ad}</h1>
        <p>
          {secilenOkul.il} / {secilenOkul.ilce}
        </p>
      </header>

      <section className="alt-kapsayici">{children}</section>

      <Link href="/" className="duzenle-btn">
        Ana sayfaya dön
      </Link>
    </main>
  );
}