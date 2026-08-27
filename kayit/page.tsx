"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function KayitPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ad: formData.get("ad"),
        soyad: formData.get("soyad"),
        mail: formData.get("mail"),
        sifre: formData.get("sifre"),
        rol: formData.get("rol"),
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Kayıt tamamlanamadı.");
      return;
    }
    if (form instanceof HTMLFormElement) {
        form.reset();
      }

      setMessage("Hesap oluşturuldu. Giriş yapabilirsiniz.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <section className="form-card">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-700">← Ana sayfa</Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Yeni kullanıcı ekle</h1>
        <p className="mt-2 text-slate-600">
          Öğretmen hesabı oluşturulduğunda, yöneticinin hesabı okul ve öğretmen kaydıyla eşleştirmesi gerekir.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="ad" className="giris-form">Ad</label>
            <input id="ad" name="ad" required placeholder="Adınız" className="form-input" />
          </div>
          <div>
            <label htmlFor="soyad" className="giris-form">Soyad</label>
            <input id="soyad" name="soyad" required placeholder="Soyadınız" className="form-input" />
          </div>
          <div>
            <label htmlFor="mail" className="giris-form">E-posta adresi</label>
            <input id="mail" name="mail" type="email" required placeholder="ornek@okul.edu.tr" className="form-input" />
          </div>
          <div>
            <label htmlFor="sifre" className="giris-form">Şifre</label>
            <input id="sifre" name="sifre" type="password" minLength={8} required placeholder="En az 8 karakter" className="form-input" />
          </div>
          <div>
            <label htmlFor="rol" className="giris-form">Kullanıcı türü</label>
            <select id="rol" name="rol" required defaultValue="" className="form-input">
              <option value="" disabled>Tür seçin</option>
              <option value="ogretmen">Öğretmen</option>
              <option value="admin">Yönetici (Admin)</option>
            </select>
          </div>

          {error && <p role="alert" className="form-error">{error}</p>}
          {message && <p role="status" className="form-success">{message}</p>}

          <button disabled={loading} className="form-btn">
            {loading ? "Kaydediliyor…" : "Kullanıcıyı kaydet"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Hesabınız var mı?{" "}
          <Link href="/giris" className="font-semibold text-blue-700">Giriş yapın</Link>
        </p>
      </section>
    </main>
  );
}