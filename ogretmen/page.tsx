"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";

type ProgramSatiri = {
  id: number;
  sube_seviye: string | null;
  sube_adi: string | null;
  gun_no: number;
  ders_saati: number;
  ders_adi: string | null;
};

type Izin = {
  id: number;
  gun_no: number;
  baslangic_saati: string;
  bitis_saati: string;
  aciklama: string | null;
  onaylandi: boolean;
};

type Sinif = {
  id: number;
  sınıf_seviyesi: string | number;
  sınıf_şubesi: string;
};

type BaslangicSaati = {
  gun_no: number;
  ders_saati_no: number;
  baslangic_saati: string;
};

const gunler = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

function csvHucre(deger: string) {
  const guvenli = deger.replace(/"/g, '""');
  return `"${guvenli}"`;
}

function csvIndir(dosyaAdi: string, satirlar: string[][]) {
  const icerik = satirlar.map((satir) => satir.map(csvHucre).join(";")).join("\r\n");
  // Excel'in Türkçe karakterleri doğru göstermesi için UTF-8 BOM ekleniyor
  const blob = new Blob(["\uFEFF" + icerik], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = dosyaAdi;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function saateDakikaEkle(saat: string, eklenecekDakika: number): string {
  const [saatKismi, dakikaKismi] = saat.split(":").map(Number);
  const toplamDakika = saatKismi * 60 + dakikaKismi + eklenecekDakika;
  const yeniSaat = Math.floor(toplamDakika / 60) % 24;
  const yeniDakika = toplamDakika % 60;
  return `${String(yeniSaat).padStart(2, "0")}:${String(yeniDakika).padStart(2, "0")}`;
}

export default function OgretmenPaneliPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string } | undefined;
  const [program, setProgram] = useState<ProgramSatiri[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [izinler, setIzinler] = useState<Izin[]>([]);
  const [baslangicSaatleri, setBaslangicSaatleri] = useState<BaslangicSaati[]>([]);
  const [dersSuresi, setDersSuresi] = useState<number | null>(null);
  const [molaSuresi, setMolaSuresi] = useState<number | null>(null);
  const [ilkDersBaslangicSaati, setIlkDersBaslangicSaati] = useState<string | null>(null);
  const [gunlukDersSayisi, setGunlukDersSayisi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function verileriGetir() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ogretmen-panel");
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Panel verileri yüklenemedi.");
      return;
    }

    setProgram(result.program);
    setIzinler(result.izinler);
    setSiniflar(result.siniflar || []);
    setGunlukDersSayisi(result.gunlukDersSayisi ?? null);
    setDersSuresi(result.dersSuresi ?? null);
    setMolaSuresi(result.molaSuresi ?? null);
    setIlkDersBaslangicSaati(result.ilkDersBaslangicSaati ?? null);
    setBaslangicSaatleri(result.baslangicSaatleri || []);
  }

  useEffect(() => {
    let aktif = true;

    void fetch("/api/ogretmen-panel")
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!aktif) return;
        setLoading(false);
        if (!response.ok) {
          setError(result.error || "Panel verileri yüklenemedi.");
          return;
        }
        setProgram(result.program);
        setIzinler(result.izinler);
        setSiniflar(result.siniflar || []);
        setGunlukDersSayisi(result.gunlukDersSayisi ?? null);
        setDersSuresi(result.dersSuresi ?? null);
        setMolaSuresi(result.molaSuresi ?? null);
        setIlkDersBaslangicSaati(result.ilkDersBaslangicSaati ?? null);
        setBaslangicSaatleri(result.baslangicSaatleri || []);
      })
      .catch(() => {
        if (!aktif) return;
        setLoading(false);
        setError("Panel verileri yüklenemedi.");
      });

    return () => {
      aktif = false;
    };
  }, []);

  async function izinKaydet(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  // ÖNEMLİ: form referansını await'ten ÖNCE yakalayın.
  // event.currentTarget, olay işleyicisinin senkron kısmı bittikten sonra
  // (yani bir await noktasından sonra) React tarafından null'a çevrilir.
  const form = event.currentTarget;

  setSaving(true);
  setError("");
  setMessage("");

  const formData = new FormData(form);
  const response = await fetch("/api/ogretmen-panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gun_no: formData.get("gun_no"),
      baslangic_saati: formData.get("baslangic_saati"),
      bitis_saati: formData.get("bitis_saati"),
      aciklama: formData.get("aciklama"),
    }),
  });
  const result = await response.json();
  setSaving(false);

  if (!response.ok) {
    setError(result.error || "İzin kaydedilemedi.");
    return;
  }

  form.reset();
  setMessage(result.message);
  await verileriGetir();
}

  function hucreBul(gunNo: number, dersSaati: number) {
    const satir = program.find((s) => Number(s.gun_no) === Number(gunNo) && Number(s.ders_saati) === Number(dersSaati));
    if (!satir) return null;
    const sinifAdi = satir.sube_seviye ? `${satir.sube_seviye} ${satir.sube_adi ?? ""}`.trim() : "Sınıf bilgisi yok";
    return {
      dersAdi: satir.ders_adi || "Ders bilgisi yok",
      sinifAdi,
    };
  }

  function baslangicSaatiBul(gunNo: number, dersSaati: number) {
    const kayit = baslangicSaatleri.find(
      (kayit) => kayit.gun_no === gunNo && kayit.ders_saati_no === dersSaati
    )?.baslangic_saati;

    if (kayit) return kayit;

    if (!ilkDersBaslangicSaati) return undefined;
    const gecenDakika = (dersSaati - 1) * ((dersSuresi ?? 40) + (molaSuresi ?? 0));
    return saateDakikaEkle(String(ilkDersBaslangicSaati).slice(0, 5), gecenDakika);
  }

  function saatAraligiBul(gunNo: number, dersSaati: number) {
    const baslangic = baslangicSaatiBul(gunNo, dersSaati);
    if (!baslangic) return undefined;
    if (!dersSuresi) return baslangic;
    const bitis = saateDakikaEkle(baslangic, dersSuresi);
    return `${baslangic}-${bitis}`;
  }

  const dersSaatleri = gunlukDersSayisi
    ? Array.from({ length: gunlukDersSayisi }, (_, i) => i + 1)
    : Array.from(new Set(program.map((satir) => satir.ders_saati))).sort((a, b) => a - b);

  function programIndir() {
    const basliklar = ["Ders Saati", "Saat Aralığı", ...gunler.slice(1)];
    const satirlar = dersSaatleri.map((saat) => {
      const hucreler = [1, 2, 3, 4, 5].map((gunNo) => {
        const hucre = hucreBul(gunNo, saat);
        return hucre ? `${hucre.dersAdi} (${hucre.sinifAdi})` : "-";
      });
      return [String(saat), saatAraligiBul(1, saat) ?? "-", ...hucreler];
    });
    csvIndir("ders-programim.csv", [basliklar, ...satirlar]);
  }

  function izinlerIndir() {
    const basliklar = ["Gün", "Başlangıç", "Bitiş", "Açıklama", "Onay Durumu"];
    const satirlar = izinler.map((izin) => [
      gunler[izin.gun_no] ?? String(izin.gun_no),
      izin.baslangic_saati.slice(0, 5),
      izin.bitis_saati.slice(0, 5),
      izin.aciklama ?? "",
      izin.onaylandi ? "Onaylandı" : "Bekliyor",
    ]);
    csvIndir("izinlerim.csv", [basliklar, ...satirlar]);
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl bg-linear-to-br from-sky-600 to-blue-800 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold tracking-[0.16em] text-sky-100">ÖĞRETMEN PANELİ</p>
        <h1 className="mt-3 text-3xl font-bold">Hoş geldiniz{user?.name ? `, ${user.name}` : ""}.</h1>
        <p className="mt-3 max-w-xl text-blue-100">Okulun genel ders programından size atanmış dersler aşağıda otomatik olarak filtrelenir.</p>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-2xl bg-green-50 p-4 text-green-700">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ders programım</h2>
              <p className="mt-1 text-sm text-slate-600">Yalnızca size atanmış dersler gösterilir.</p>
            </div>
            {!loading && program.length > 0 && (
              <button
                type="button"
                onClick={programIndir}
                className="shrink-0 rounded-xl border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                İndir (CSV)
              </button>
            )}
          </div>

          {loading ? (
            <p className="mt-5 text-slate-600">Yükleniyor…</p>
          ) : program.length === 0 ? (
            <p className="mt-5 text-slate-600">Henüz size atanmış bir ders programı bulunmuyor.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Ders Saati</th>
                    {[1, 2, 3, 4, 5].map((gunNo) => (
                      <th key={gunNo} className="pb-3 pr-4">{gunler[gunNo]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dersSaatleri.map((saat) => (
                    <tr key={saat} className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 pr-4 font-semibold">
                        {saat}. ders
                        {saatAraligiBul(1, saat) && (
                          <>
                            <br />
                            <small className="font-normal text-slate-500">{saatAraligiBul(1, saat)}</small>
                          </>
                        )}
                      </td>
                      {[1, 2, 3, 4, 5].map((gunNo) => {
                        const hucre = hucreBul(gunNo, saat);
                        return (
                          <td key={gunNo} className="py-3 pr-4">
                            {hucre ? (
                              <>
                                <span className="font-medium text-slate-900">{hucre.dersAdi}</span>
                                <br />
                                <small className="text-slate-500">{hucre.sinifAdi}</small>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">İzin bildir</h2>
          <p className="mt-1 text-sm text-slate-600">Kaydınız okulun izin listesine eklenir.</p>
          <form onSubmit={izinKaydet} className="mt-5 space-y-4">
            <select name="gun_no" required defaultValue="" className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="" disabled>Gün seçin</option>{gunler.slice(1).map((gun, index) => <option key={gun} value={index + 1}>{gun}</option>)}</select>
            <label className="block text-sm font-medium text-slate-700">Başlangıç<input name="baslangic_saati" type="time" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
            <label className="block text-sm font-medium text-slate-700">Bitiş<input name="bitis_saati" type="time" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
            <input name="aciklama" placeholder="Açıklama (isteğe bağlı)" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            <button disabled={saving} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? "Kaydediliyor…" : "İzni kaydet"}</button>
          </form>

          <div className="mt-8 flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">İzinlerim</h3>
            {izinler.length > 0 && (
              <button
                type="button"
                onClick={izinlerIndir}
                className="shrink-0 rounded-xl border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                İndir (CSV)
              </button>
            )}
          </div>
          {izinler.length === 0 ? <p className="mt-2 text-sm text-slate-600">Kayıtlı izin yok.</p> : (
            <ul className="mt-3 space-y-2">
              {izinler.map((izin) => (
                <li key={izin.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      <strong>{gunler[izin.gun_no]}</strong> · {izin.baslangic_saati.slice(0, 5)}–{izin.bitis_saati.slice(0, 5)}
                      {izin.aciklama ? ` · ${izin.aciklama}` : ""}
                    </span>
                    {izin.onaylandi ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">✓ Onaylandı</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Bekliyor</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}