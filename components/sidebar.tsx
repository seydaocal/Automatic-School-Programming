"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const menu = [
  { href: "/okul-ekle", ad: "Okul Ekle" },
  { href: "/yonetim/okul", ad: "Okul Bilgileri" },
  { href: "/yonetim/dersler", ad: "Ders İşlemleri" },
  { href: "/yonetim/ogretmenler", ad: "Öğretmen İşlemleri" },
  { href: "/yonetim/siniflar", ad: "Sınıf-Şube İşlemleri" },
  { href: "/yonetim/atama", ad: "Ders Atama İşlemleri" },
  { href: "/yonetim/izinler", ad: "Öğretmen İzinleri" },
  { href: "/yonetim/ders-ucreti", ad: "Ders Ücreti" },
  { href: "/yonetim/program", ad: "Ders Programı Oluşturma" },
  { href: "/yonetim/ders-saatleri", ad: "Ders Saatleri" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  if (pathname === "/nasilkullanilir" || pathname === "/ogretmen" || 
      pathname === "/ogretmenbilgi" || pathname === "/swagger" ) {
    return null;
  }


  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md text-xl font-bold"
        onClick={() => setOpen(!open)}
        aria-label="Menüyü aç/kapat"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`yan-bar ${open ? "acik" : ""}`}>
        <div className="pt-16 md:pt-4 px-4 flex flex-col h-full">
          <div className="text-xl font-bold mb-4">Genel Bilgiler</div>
          <nav className="flex flex-col space-y-1">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                prefetch={false}
                className={`side-item block w-full text-left whitespace-nowrap p-2 rounded ${
                  pathname === item.href ? "aktif" : ""
                }`}
              >
                {item.ad}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}