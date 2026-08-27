"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

type Role = "admin" | "ogretmen";

const roleContent = {
  admin: {
    title: "Yönetici girişi",
    description: "Okul, ders ve program ayarlarını yönetin.",
    label: "Yönetici",
  },
  ogretmen: {
    title: "Öğretmen girişi",
    description: "Ders programınıza ve okul bilgilerinize erişin.",
    label: "Öğretmen",
  },
};

export default function LoginForm({ role }: { role: Role }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const content = roleContent[role];
  const callbackUrl = role === "admin" ? "/okul-sec" : "/ogretmen";

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      mail: formData.get("mail"),
      sifre: formData.get("sifre"),
      rol: role,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-posta, şifre veya kullanıcı türü hatalı.");
      return;
    }

    // Önceki oturumdan kalan (başka bir yöneticiye ait olabilecek) okul
    // seçimini temizle; her hesap yalnızca kendi okulunu görmeli.
    localStorage.removeItem("secilenOkul");

    window.location.assign(result?.url || callbackUrl);
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/30 md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-linear-to-br from-sky-600 via-blue-700 to-indigo-950 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-100">DERS PROGRAMI</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight">Planlı bir okul günüyle başlayın.</h1>
            <p className="mt-4 max-w-sm text-blue-100">Ders programınızı tek bir yerden takip edin ve yönetin.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-blue-50">
            <p className="font-semibold">{content.label} hesabı</p>
            <p className="mt-1 text-blue-100">Bu ekran yalnızca {content.label.toLocaleLowerCase("tr-TR")} kullanıcıları içindir.</p>
          </div>
        </div>

        <div className="p-7 sm:p-10">
          <Link href="/giris" className="text-sm font-medium text-slate-500 transition hover:text-blue-700">← Kullanıcı türü seç</Link>
          <div className="mt-10">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">{content.label}</span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">{content.title}</h2>
            <p className="mt-2 text-slate-600">{content.description}</p>
          </div>

          <form action={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="mail" className="giris-form">E-posta adresi</label>
              <input id="mail" name="mail" type="email" autoComplete="email" required className="form-input" placeholder="ornek@okul.edu.tr" />
            </div>
            <div>
              <label htmlFor="sifre" className="giris-form">Şifre</label>
              <input id="sifre" name="sifre" type="password" autoComplete="current-password" required className="form-input" placeholder="Şifrenizi girin" />
            </div>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button type="submit" disabled={loading} className="form-btn">
              {loading ? "Giriş yapılıyor…" : "Giriş yap"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}