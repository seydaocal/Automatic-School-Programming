"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as { name?: string; rol?: "admin" | "ogretmen" } | undefined;
  const panelUrl = user?.rol === "admin" ? "/okul-sec" : "/ogretmen";

  const isOgretmenSayfasi = pathname?.startsWith("/ogretmen");

  async function handleSignOut() {
    await signOut({ callbackUrl: "/giris" });
  }

  if (pathname === "/swagger" ) {
    return null;
  }


  return (
    <header className="ust-bar">
      <div className="font-semibold text-sm tracking-[0.18em] text-sky-100 sm:text-base md:text-lg truncate mr-4">
        OTOMATİK DERS PROGRAMI OLUŞTURMA UYGULAMASI
      </div>
      <nav className="hidden md:flex items-center gap-2">
        {isOgretmenSayfasi ? (
          <>
            <Link href="/ogretmenbilgi" prefetch={false} className="nav-item">Öğretmen Bilgileri</Link>
            <Link href="/sss" prefetch={false} className="nav-item">SSS</Link>
          </>
        ) : (
          <>
            <Link href="/" prefetch={false} className="nav-item">Ana Sayfa</Link>
            <Link href="/okul-sec" prefetch={false} className="nav-item">Kayıtlı Okullar</Link>
            <Link href="/sss" prefetch={false} className="nav-item">SSS</Link>
          </>
        )}
      </nav>
      <div className="hidden md:flex items-center gap-3">
        {status === "authenticated" ? (
          <>
            <Link href={panelUrl} className="text-sm font-semibold text-sky-100 hover:text-white transition">
              {user?.name || "Panelim"}
            </Link>
            <button onClick={handleSignOut} className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
              Çıkış yap
            </button>
          </>
        ) : (
          <Link href="/giris" className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
            Giriş yap
          </Link>
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-xl text-white hover:bg-white/10 rounded-lg transition"
        aria-label="Menüyü aç/kapat"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {isOpen && (
        <nav className="md:hidden bg-blue-100 border-t border-gray-100 text-blue-950 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {isOgretmenSayfasi ? (
            <>
              <Link href="/ogretmenbilgi" prefetch={false} onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
                Öğretmen Bilgileri
              </Link>
              <Link href="/sss" prefetch={false} onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
                SSS
              </Link>
            </>
          ) : (
            <>
              <Link href="/" prefetch={false} onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
                Ana Sayfa
              </Link>
              <Link href="/okul-sec" prefetch={false} onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
                Kayıtlı Okullar Listesi
              </Link>
              <Link href="/sss" prefetch={false} onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
                SSS
              </Link>
            </>
          )}

          {status === "authenticated" ? (
            <>
              <Link href={panelUrl} prefetch={false} onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
                Panelim
              </Link>
              <button onClick={handleSignOut} className="nav-item block w-full py-2 px-3 rounded text-left hover:bg-gray-100">
                Çıkış yap
              </button>
            </>
          ) : (
            <Link href="/giris" onClick={() => setIsOpen(false)} className="nav-item block py-2 px-3 rounded hover:bg-gray-100">
              Giriş yap
            </Link>
          )}
        </nav>
      )}
    </header>

  );
}