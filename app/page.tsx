"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const steps = [
  { number: "01", title: "Hesabını oluştur", text: "Öğretmen/yönetici hesabını birkaç bilgiyle oluştur." },
  { number: "02", title: "Okulunu yapılandır", text: "Yönetici hesabıyla okul, sınıf ve ders bilgilerini ekleyin." },
  { number: "03", title: "Programını takip et", text: "Öğretmenler kendilerine ait programı tek ekranda görür." },
];

const preview = [
  { time: "09:00", lesson: "Matematik", branch: "9-A", tone: "bg-blue-100 text-blue-800" },
  { time: "10:00", lesson: "Geometri", branch: "10-B", tone: "bg-violet-100 text-violet-800" },
  { time: "11:10", lesson: "Etüt saati", branch: "11-A", tone: "bg-amber-100 text-amber-800" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user as { rol?: "admin" | "ogretmen" } | undefined;
  const girisYapilmis = status === "authenticated";
  const panelUrl = user?.rol === "admin" ? "/okul-sec" : "/ogretmen";

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="overflow-hidden bg-slate-950 px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-sky-300">DERS PROGRAMI YÖNETİMİ</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">Okul programınızı oluşturun.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">Yönetici okulun programını oluşturur; öğretmen kendi derslerini ve izinlerini tek bir ekrandan takip eder.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {girisYapilmis ? (
                <Link href={panelUrl} className="rounded-xl bg-sky-400 px-5 py-3 text-center font-bold text-slate-950 transition hover:bg-sky-300">Panelime git</Link>
              ) : (
                <>
                  <Link href="/kayit" className="rounded-xl bg-sky-400 px-5 py-3 text-center font-bold text-slate-950 transition hover:bg-sky-300">Hesap oluştur</Link>
                  <Link href="/giris" className="rounded-xl border border-slate-600 px-5 py-3 text-center font-bold text-white transition hover:border-slate-400 hover:bg-slate-800">Giriş yap</Link>
                </>
              )}
            </div>
            {!girisYapilmis && (
              <p className="mt-4 text-sm text-slate-400">Yeni misiniz? Önce hesap oluşturun, sonra kullanıcı türünüzle giriş yapın.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <p className="text-sm font-semibold text-sky-300">ÖRNEK GÖRÜNÜM</p>
                <h2 className="mt-1 text-xl font-bold text-white">Öğretmen ders programı</h2>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">PAZARTESİ</span>
            </div>
            <div className="mt-5 space-y-3">
              {preview.map((row) => (
                <div key={row.time} className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-2xl bg-slate-800 p-3">
                  <span className="text-sm font-semibold text-slate-300">{row.time}</span>
                  <span className="font-semibold text-white">{row.lesson}</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${row.tone}`}>{row.branch}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-400">Öğretmen panelinde yalnızca size atanmış dersler görünür.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="max-w-2xl"><p className="text-sm font-bold tracking-[0.16em] text-blue-700">BAŞLANGIÇ REHBERİ</p>
          <h2 className="mt-3 text-3xl font-bold">İlk kullanımda izleyeceğiniz yol</h2>
          <p className="mt-3 leading-7 text-slate-600">Sistemi bir kez kurduktan sonra program hazırlama ve takip işlemleri aynı akışta kalır.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step) => <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-bold text-blue-700">{step.number}</span>
            <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 leading-6 text-slate-600">{step.text}</p>
            </article>)}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <article className="rounded-3xl bg-blue-700 p-7 text-white"><p className="text-sm font-bold tracking-wider text-blue-200">YÖNETİCİ</p>
            <h2 className="mt-3 text-2xl font-bold">Okulun tüm planını yönetin.</h2>
            <p className="mt-3 leading-7 text-blue-100">Ders, sınıf, öğretmen, atama ve ders programını tek merkezden düzenleyin.</p>
            {girisYapilmis && user?.rol === "admin" ? (
              <Link href={panelUrl} className="mt-6 inline-block font-bold text-white underline underline-offset-4">Panelime git →</Link>
            ) : !girisYapilmis ? (
              <Link href="/giris/admingiris" className="mt-6 inline-block font-bold text-white underline underline-offset-4">Yönetici girişi →</Link>
            ) : null}
          </article>
          <article className="rounded-3xl bg-slate-900 p-7 text-white">
            <p className="text-sm font-bold tracking-wider text-sky-300">ÖĞRETMEN</p>
            <h2 className="mt-3 text-2xl font-bold">Kendi programınıza odaklanın.</h2>
            <p className="mt-3 leading-7 text-slate-300">Size atanan dersleri görün ve izin bilgilerinizi okul kayıtlarına iletin.</p>
            {girisYapilmis && user?.rol === "ogretmen" ? (
              <Link href={panelUrl} className="mt-6 inline-block font-bold text-white underline underline-offset-4">Panelime git →</Link>
            ) : !girisYapilmis ? (
              <Link href="/giris/ogretmengiris" className="mt-6 inline-block font-bold text-white underline underline-offset-4">Öğretmen girişi →</Link>
            ) : null}
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 text-center sm:px-8">
        {girisYapilmis ? (
          <>
            <h2 className="text-3xl font-bold">Tekrar hoş geldiniz.</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Kaldığınız yerden devam etmek için panelinize gidin.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={panelUrl} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">Panelime git</Link>
              <Link href="/nasilkullanilir" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-white">Nasıl kullanılır?</Link>
              <Link href="/sss" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-white">SSS</Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold">Başlamaya hazır mısınız?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Hesabınızı oluşturun veya mevcut hesabınızla giriş yapın.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/kayit" className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">Hesap oluştur</Link>
              <Link href="/nasilkullanilir" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-white">Nasıl kullanılır?</Link>
              <Link href="/sss" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-white">SSS</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}