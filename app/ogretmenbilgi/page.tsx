"use client";

import { useEffect, useState, type FormEvent } from "react";

type OgretmenBilgi = {
  id: number;
  ad: string;
  soyad: string;
  tc: string;
  dogum: string | null;
  mail: string;
  fotograf: string | null;
  ozgecmis: string | null;
  okul_id: number;
};

export default function OgretmenBilgiPage() {
  const [bilgi, setBilgi] = useState<OgretmenBilgi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [tc, setTc] = useState("");
  const [dogum, setDogum] = useState("");
  const [mail, setMail] = useState("");
  const [fotograf, setFotograf] = useState("");
  const [ozgecmis, setOzgecmis] = useState("");

  async function verileriGetir() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ogretmenler");
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Bilgileriniz yüklenemedi.");
        return;
      }

      const kayit: OgretmenBilgi | undefined = result.data?.[0];
      if (!kayit) {
        setError("Kayıtlı öğretmen bilgisi bulunamadı.");
        return;
      }

      setBilgi(kayit);
      setAd(kayit.ad ?? "");
      setSoyad(kayit.soyad ?? "");
      setTc(kayit.tc ?? "");
      setDogum(kayit.dogum ? String(kayit.dogum).slice(0, 10) : "");
      setMail(kayit.mail ?? "");
      setFotograf(kayit.fotograf ?? "");
      setOzgecmis(kayit.ozgecmis ?? "");
    } catch {
      setError("Bilgileriniz yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void verileriGetir();
  }, []);

  async function kaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bilgi) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/ogretmenler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bilgi.id,
          ad,
          soyad,
          tc,
          dogum: dogum || null,
          mail,
          fotograf: fotograf || null,
          ozgecmis: ozgecmis || null,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Bilgileriniz güncellenemedi.");
        return;
      }

      setMessage(result.message || "Bilgileriniz güncellendi.");
      setBilgi(result.data);
    } catch {
      setError("Bilgileriniz güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-slate-600">Yükleniyor…</p>;
  }

  if (error && !bilgi) {
    return <p role="alert" className="m-6 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="rounded-3xl bg-linear-to-br from-sky-600 to-blue-800 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold tracking-[0.16em] text-sky-100">ÖĞRETMEN BİLGİLERİ</p>
        <h1 className="mt-3 text-3xl font-bold">Bilgilerinizi düzenleyin</h1>
        <p className="mt-3 max-w-xl text-blue-100">Aşağıdaki bilgileri güncelleyip kaydedebilirsiniz.</p>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-2xl bg-green-50 p-4 text-green-700">{message}</p>}

      <form onSubmit={kaydet} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Ad
            <input value={ad} onChange={(e) => setAd(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Soyad
            <input value={soyad} onChange={(e) => setSoyad(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            TC Kimlik No
            <input value={tc} onChange={(e) => setTc(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Doğum tarihi
            <input type="date" value={dogum} onChange={(e) => setDogum(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          E-posta
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Fotoğraf URL
          <input value={fotograf} onChange={(e) => setFotograf(e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Özgeçmiş
          <textarea value={ozgecmis} onChange={(e) => setOzgecmis(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>

        <button disabled={saving} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {saving ? "Kaydediliyor…" : "Bilgilerimi kaydet"}
        </button>
      </form>
    </section>
  );
}