"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import type { Okul, Ders, Ogretmen, Sinif,OgretmenIzni,DersUcreti,DersBaslangicSaati,DersBaslangicSaatleriFormProps  } from "@/types";
import { useAppDispatch } from "@/lib/redux/hooks";
import { baslangicSaatleriGetir } from "@/lib/redux/slices/dersSaatleriSlice";

type Kaydet<T> = (veri: Partial<T>) => void | Promise<void>;

export const gunSecenekleri = [
  { deger: "1", ad: "Pazartesi" },
  { deger: "2", ad: "Salı" },
  { deger: "3", ad: "Çarşamba" },
  { deger: "4", ad: "Perşembe" },
  { deger: "5", ad: "Cuma" },
];

export function OkulForm({
  onKaydet,
  duzenlenen,
}: {
  onKaydet: Kaydet<Okul>;
  duzenlenen?: Okul | null;
}) {
  const [ad, setAd] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [sayi, setSayi] = useState("");
  const [sure, setSure] = useState("");
  const [molas, setMolas] = useState("");
  const [ilkDersBaslangicSaati, setIlkDersBaslangicSaati] = useState("08:30");
  const [gunler, setGunler] = useState<string[]>([]);

  useEffect(() => {
    if (duzenlenen) {
      setAd(duzenlenen.ad);
      setIl(duzenlenen.il);
      setIlce(duzenlenen.ilce);
      setSayi(String(duzenlenen.sayi));
      setSure(String(duzenlenen.sure));
      setMolas(String(duzenlenen.molas));
      setIlkDersBaslangicSaati(duzenlenen.ilk_ders_baslangic_saati?.slice(0, 5) || "08:30");
      setGunler(duzenlenen.gun);
    } else {
      setAd("");
      setIl("");
      setIlce("");
      setSayi("");
      setSure("");
      setMolas("");
      setIlkDersBaslangicSaati("08:30");
      setGunler([]);
    }
  }, [duzenlenen]);

  async function kaydet(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await onKaydet({
      ad,
      il,
      ilce,
      sayi: Number(sayi),
      sure: Number(sure),
      molas: Number(molas),
      gun: gunler,
      ilk_ders_baslangic_saati: ilkDersBaslangicSaati,
    });
  }

  return (
    <form className="form-card mx-auto" onSubmit={kaydet}>
      <h2 className="text-xl font-bold-mb-4">Okul Bilgileri</h2>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-adi">Okul adı</label>
        <input className="form-input" id="okul-adi" value={ad} onChange={(e) => setAd(e.target.value)} required placeholder="Okul adını giriniz.." />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-il">İl</label>
        <input className="form-input" id="okul-il" value={il} onChange={(e) => setIl(e.target.value)} required placeholder="İl adını giriniz.." />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-ilce">İlçe</label>
        <input className="form-input" id="okul-ilce" value={ilce} onChange={(e) => setIlce(e.target.value)} required placeholder="İlçe adını giriniz.." />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-ders-sayisi">Günlük ders sayısı</label>
        <input className="form-input" id="okul-ders-sayisi" type="number" min="1" value={sayi} onChange={(e) => setSayi(e.target.value)} required placeholder="Örn;7" />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-ders-suresi">Ders süresi (dakika)</label>
        <input className="form-input" id="okul-ders-suresi" type="number" min="1" value={sure} onChange={(e) => setSure(e.target.value)} required placeholder="Örn:40" />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-mola-suresi">Mola süresi (dakika)</label>
        <input className="form-input" id="okul-mola-suresi" type="number" min="0" value={molas} onChange={(e) => setMolas(e.target.value)} required placeholder="Örn:10" />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="okul-ilk-ders-saati">İlk ders başlangıç saati</label>
        <input className="form-input" id="okul-ilk-ders-saati" type="time" value={ilkDersBaslangicSaati} onChange={(e) => setIlkDersBaslangicSaati(e.target.value)} required />
      </div>
      <div className="mb-4">
        <span className="giris-form">Eğitim günleri</span>
        {gunSecenekleri.map((gun) => (
          <label className="form-label" key={gun.deger}>
            <input
              className="form-input"
              type="checkbox"
              value={gun.deger}
              checked={gunler.includes(gun.deger)}
              onChange={(e) => {
                setGunler((oncekiGunler) =>
                  e.target.checked
                    ? [...oncekiGunler, gun.deger]
                    : oncekiGunler.filter((id) => id !== gun.deger)
                );
              }}
            />
            {gun.ad}
          </label>
        ))}
      </div>
      <button className="form-btn" type="submit">
        {duzenlenen ? "Değişiklikleri Kaydet" : "Okulu Kaydet"}
      </button>
    </form>
  );
}

export function DerslerForm({
  onKaydet,
  duzenlenen,
}: {
  onKaydet: Kaydet<Ders>;
  duzenlenen?: Ders | null;
}) {
  const [ad, setAd] = useState("");
  const [seviye, setSeviye] = useState("9. Sınıf");
  const [saat, setSaat] = useState("");

  useEffect(() => {
    if (duzenlenen) {
      setAd(duzenlenen.ad);
      setSeviye(duzenlenen.seviye);
      setSaat(String(duzenlenen.saat));
    } else {
      setAd("");
      setSeviye("9. Sınıf");
      setSaat("");
    }
  }, [duzenlenen]);

  async function kaydet(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await onKaydet({ ad, seviye, saat: Number(saat) });
  }

  return (
    <form className="alt-kapsayici" onSubmit={kaydet}>
      <h2 className="text-xl font-bold ">Ders Bilgileri</h2>
      <div className="okul">
        <label className="form-label" htmlFor="ders-adi">Ders adı</label>
        <input className="form-input" id="ders-adi" value={ad} onChange={(e) => setAd(e.target.value)} required placeholder="Ders adını giriniz.." />
      </div>
      <div className="okul">
        <label className="form-label" htmlFor="ders-seviyesi">Sınıf seviyesi</label>
        <select className="form-input" id="ders-seviyesi" value={seviye} onChange={(e) => setSeviye(e.target.value)}>
          <option value="9. Sınıf">9. Sınıf</option>
          <option value="10. Sınıf">10. Sınıf</option>
          <option value="11. Sınıf">11. Sınıf</option>
          <option value="12. Sınıf">12. Sınıf</option>
        </select>
      </div>
      <div className="okul">
        <label className="form-label" htmlFor="ders-saati">Haftalık ders saati</label>
        <input className="form-input" id="ders-saati" type="number" min="1" value={saat} onChange={(e) => setSaat(e.target.value)} required placeholder="Örn:8" />
      </div>
      <button className="form-btn" type="submit">
        {duzenlenen ? "Değişiklikleri Kaydet" : "Dersi Kaydet"}
      </button>
    </form>
  );
}

export function OgretmenForm({
  onKaydet,
  duzenlenen,
}: {
  onKaydet: Kaydet<Ogretmen>;
  duzenlenen?: Ogretmen | null;
}) {
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [tc, setTc] = useState("");
  const [dogum, setDogum] = useState("");
  const [mail, setMail] = useState("");
  const [fotograf, setFotograf] = useState("");
  const [ozgecmis, setOzgecmis] = useState("");

  useEffect(() => {
    if (duzenlenen) {
      setAd(duzenlenen.ad);
      setSoyad(duzenlenen.soyad);
      setTc(duzenlenen.tc);
      setDogum(duzenlenen.dogum ?? "");
      setMail(duzenlenen.mail);
      setFotograf(duzenlenen.fotograf ?? "");
      setOzgecmis(duzenlenen.ozgecmis ?? "");
    } else {
      setAd("");
      setSoyad("");
      setTc("");
      setDogum("");
      setMail("");
      setFotograf("");
      setOzgecmis("");
    }
  }, [duzenlenen]);

  async function kaydet(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await onKaydet({
      ad,
      soyad,
      tc,
      dogum,
      mail,
      fotograf: fotograf || null,
      ozgecmis: ozgecmis || null,
    });
  }

  return (
    <form className="form-card" onSubmit={kaydet}>
      <h2 className="text-xl font-bold ">Öğretmen Bilgileri</h2>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-ad">Ad</label><input id="ogretmen-ad" className="form-input" value={ad} onChange={(e) => setAd(e.target.value)} required placeholder="Öğretmen adını giriniz.."/></div>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-soyad">Soyad</label><input id="ogretmen-soyad" className="form-input" value={soyad} onChange={(e) => setSoyad(e.target.value)} required  placeholder="Öğretmen soyadını giriniz.."/></div>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-tc">TC kimlik no</label><input id="ogretmen-tc" className="form-input" inputMode="numeric" maxLength={11} value={tc} onChange={(e) => setTc(e.target.value)} required  placeholder="TC no giriniz.."/></div>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-dogum">Doğum tarihi</label><input id="ogretmen-dogum" className="form-input" type="date" value={dogum} onChange={(e) => setDogum(e.target.value)} required /></div>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-mail">E-posta</label><input id="ogretmen-mail" type="email" className="form-input" value={mail} onChange={(e) => setMail(e.target.value)} required  placeholder="Örn:isim@gmail.com"/></div>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-fotograf">Fotoğraf URL'si</label><input id="ogretmen-fotograf" type="url" className="form-input" value={fotograf} onChange={(e) => setFotograf(e.target.value)}  placeholder="https://.."/></div>
      <div className="okul"><label className="giris-form" htmlFor="ogretmen-ozgecmis">Özgeçmiş URL'si</label><input id="ogretmen-ozgecmis" type="url" className="form-input" value={ozgecmis} onChange={(e) => setOzgecmis(e.target.value)} placeholder="https://.."/></div>
      <button className="form-btn" type="submit">
        {duzenlenen ? "Değişiklikleri Kaydet" : "Öğretmeni Kaydet"}
      </button>
    </form>
  );
}

export function SinifForm({
  onKaydet,
  duzenlenen,
}: {
  onKaydet: Kaydet<Sinif>;
  duzenlenen?: Sinif | null;
}) {
  const [seviye, setSeviye] = useState("9. Sınıf");
  const [sube, setSube] = useState("");

  useEffect(() => {
    if (duzenlenen) {
      setSeviye(duzenlenen.seviye);
      setSube(duzenlenen.sube);
    } else {
      setSeviye("9. Sınıf");
      setSube("");
    }
  }, [duzenlenen]);

  async function kaydet(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await onKaydet({ seviye, sube });
  }

  return (
    <form className="alt-kapsayici" onSubmit={kaydet}>
      <h2 className="text-xl font-bold mb-4 ">Sınıf Bilgileri</h2>
      <div className="mb-4">
        <label className="giris-form" htmlFor="sinif-seviyesi">Sınıf seviyesi</label>
        <select id="sinif-seviyesi" className="secim-kutusu" value={seviye} onChange={(e) => setSeviye(e.target.value)}>
          <option value="9. Sınıf">9. Sınıf</option>
          <option value="10. Sınıf">10. Sınıf</option>
          <option value="11. Sınıf">11. Sınıf</option>
          <option value="12. Sınıf">12. Sınıf</option>
        </select>
      </div>
      <div className="okul">
        <label className="giris-form" htmlFor="sinif-sube">Şube</label>
        <input id="sinif-sube" className="form-input" value={sube} onChange={(e) => setSube(e.target.value)} placeholder="Örn. A" required />
      </div>
      <button className="form-btn" type="submit">
        {duzenlenen ? "Değişiklikleri Kaydet" : "Sınıfı Kaydet"}
      </button>
    </form>
  );
}

export function OgretmenIzinForm({
  onKaydet,
  duzenlenen,
  ogretmenlerListesi,
}: {
  onKaydet: Kaydet<OgretmenIzni>;
  duzenlenen?: OgretmenIzni | null;
  ogretmenlerListesi: Ogretmen[];
}) {
  const [ogretmenId, setOgretmenId] = useState("");
  const [izinTuru, setIzinTuru] = useState<"tarihli" | "kalici">("tarihli");
  const [tarih, setTarih] = useState("");
  const [gunNo, setGunNo] = useState("1");
  const [baslangicSaati, setBaslangicSaati] = useState("");
  const [bitisSaati, setBitisSaati] = useState("");
  const [aciklama, setAciklama] = useState("");

  const guvenliOgretmenler = Array.isArray(ogretmenlerListesi) ? ogretmenlerListesi : [];

  // JS'in getDay() değeri (Pzt=1..Cuma=5) uygulamadaki gun_no ile birebir örtüşüyor
  function tarihtenGunNoHesapla(tarihStr: string): number | null {
    if (!tarihStr) return null;
    const gun = new Date(`${tarihStr}T00:00:00`).getDay();
    return gun >= 1 && gun <= 5 ? gun : null;
  }

  // Sunucudan tarih bazen "YYYY-MM-DD" saf metin, bazen Date nesnesi/ISO zaman damgası
  // ("2026-08-17T00:00:00.000Z") olarak gelebilir. Her durumda saf tarihe indirger.
  function tarihNormallestir(deger: any): string {
    if (!deger) return "";
    if (typeof deger === "string") return deger.slice(0, 10);
    try {
      // ÖNEMLİ: toISOString() UTC'ye çevirir, bu da Türkiye gibi UTC+ dilimlerinde
      // gece yarısı tarihi bir gün geriye kaydırır. Bunun yerine YEREL tarih
      // bileşenlerini kullanıyoruz (pg sürücüsü date sütununu zaten yerel
      // gece yarısı olarak oluşturuyor).
      const d = new Date(deger);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  }

  useEffect(() => {
    if (duzenlenen) {
      setOgretmenId(String(duzenlenen.ogretmen_id));
      setIzinTuru(duzenlenen.tarih ? "tarihli" : "kalici");
      setTarih(tarihNormallestir(duzenlenen.tarih));
      setGunNo(String(duzenlenen.gun_no));
      setBaslangicSaati(duzenlenen.baslangic_saati ? duzenlenen.baslangic_saati.slice(0, 5) : "");
      setBitisSaati(duzenlenen.bitis_saati ? duzenlenen.bitis_saati.slice(0, 5) : "");
      setAciklama(duzenlenen.aciklama ?? "");
    } else {
      setOgretmenId("");
      setIzinTuru("tarihli");
      setTarih("");
      setGunNo("1");
      setBaslangicSaati("");
      setBitisSaati("");
      setAciklama("");
    }
  }, [duzenlenen]);

  async function kaydet(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (izinTuru === "tarihli") {
      const hesaplananGun = tarihtenGunNoHesapla(tarih);
      if (!hesaplananGun) {
        alert("Lütfen hafta içi (Pazartesi–Cuma) bir tarih seçin.");
        return;
      }
      await onKaydet({
        ogretmen_id: Number(ogretmenId),
        gun_no: hesaplananGun,
        tarih,
        baslangic_saati: baslangicSaati,
        bitis_saati: bitisSaati,
        aciklama: aciklama || null,
      });
    } else {
      await onKaydet({
        ogretmen_id: Number(ogretmenId),
        gun_no: Number(gunNo),
        tarih: null,
        baslangic_saati: baslangicSaati,
        bitis_saati: bitisSaati,
        aciklama: aciklama || null,
      });
    }
  }

  return (
    <form className="form-card" onSubmit={kaydet}>
      <h2 className="text-xl font-bold mb-4 ">Öğretmen İzni</h2>
      <div className="mb-4">
        <label className="giris-form" htmlFor="izin-ogretmen">Öğretmen</label>
        <select
          id="izin-ogretmen"
          className="secim-kutusu"
          value={ogretmenId}
          onChange={(e) => setOgretmenId(e.target.value)}
          required
        >
          <option value="">Öğretmen seçin</option>
          {guvenliOgretmenler.map((ogretmen) => (
            <option key={ogretmen.id} value={ogretmen.id}>
              {ogretmen.ad} {ogretmen.soyad}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="giris-form">İzin Türü</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="izin-turu"
              checked={izinTuru === "tarihli"}
              onChange={() => setIzinTuru("tarihli")}
            />
            Belirli bir tarih (tek seferlik)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="izin-turu"
              checked={izinTuru === "kalici"}
              onChange={() => setIzinTuru("kalici")}
            />
            Her hafta tekrarlanan (kalıcı)
          </label>
        </div>
      </div>

      {izinTuru === "tarihli" ? (
        <div className="mb-4">
          <label className="giris-form" htmlFor="izin-tarih">Tarih</label>
          <input
            className="form-input"
            id="izin-tarih"
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Bu izin sadece seçtiğiniz tarihte geçerli olur, sonraki haftalara yansımaz.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className="giris-form" htmlFor="izin-gun">Gün</label>
          <select
            id="izin-gun"
            className="secim-kutusu"
            value={gunNo}
            onChange={(e) => setGunNo(e.target.value)}
            required
          >
            <option value="1">Pazartesi</option>
            <option value="2">Salı</option>
            <option value="3">Çarşamba</option>
            <option value="4">Perşembe</option>
            <option value="5">Cuma</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Bu izin, her hafta seçtiğiniz günde otomatik olarak uygulanmaya devam eder.
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="giris-form" htmlFor="izin-baslangic">Başlangıç Saati</label>
        <input
          className="form-input"
          id="izin-baslangic"
          type="time"
          value={baslangicSaati}
          onChange={(e) => setBaslangicSaati(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="izin-bitis">Bitiş Saati</label>
        <input
          className="form-input"
          id="izin-bitis"
          type="time"
          value={bitisSaati}
          onChange={(e) => setBitisSaati(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="izin-aciklama">Açıklama (İsteğe bağlı)</label>
        <input
          className="form-input"
          id="izin-aciklama"
          type="text"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Örn: Doktor randevusu"
        />
      </div>
      <button className="form-btn" type="submit">
        {duzenlenen ? "Değişiklikleri Kaydet" : "İzni Kaydet"}
      </button>
    </form>
  );
}
export function DersUcretiForm({
  onKaydet,
  duzenlenen,
  derslerListesi,
}: {
  onKaydet: Kaydet<DersUcreti>;
  duzenlenen?: DersUcreti | null;
  derslerListesi: Ders[];
}) {
  const [dersId, setDersId] = useState("");
  const [saatlikUcret, setSaatlikUcret] = useState("");
  const [aylikUcret, setAylikUcret] = useState("");
  const guvenliDersler = Array.isArray(derslerListesi) ? derslerListesi : [];

  useEffect(() => {
    if (duzenlenen) {
      setDersId(String(duzenlenen.ders_id));
      setSaatlikUcret(String(duzenlenen.saatlik_ucret));
      setAylikUcret(duzenlenen.aylik_ucret !== null ? String(duzenlenen.aylik_ucret) : "");
    } else {
      setDersId("");
      setSaatlikUcret("");
      setAylikUcret("");
    }
  }, [duzenlenen]);

  async function kaydet(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await onKaydet({
      ders_id: Number(dersId),
      saatlik_ucret: Number(saatlikUcret),
      aylik_ucret: aylikUcret ? Number(aylikUcret) : null,
    });
  }

  return (
    <form className="form-card" onSubmit={kaydet}>
      <h2 className="text-xl font-bold mb-4 ">Ders Ücreti</h2>
      <div className="mb-4">
        <label className="giris-form" htmlFor="ucret-ders">Ders</label>
        <select
          id="ucret-ders"
          className="secim-kutusu"
          value={dersId}
          onChange={(e) => setDersId(e.target.value)}
          required
        >
          <option value="">Ders seçin</option>
          {guvenliDersler.map((ders) => (
            <option key={ders.id} value={ders.id}>
              {ders.ad}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="ucret-saatlik">Saatlik Ücret (₺)</label>
        <input className="form-input"
          id="ucret-saatlik"
          type="number"
          min="0"
          step="0.01"
          value={saatlikUcret}
          onChange={(e) => setSaatlikUcret(e.target.value)}
          required
          placeholder="Örn: 1000"
        />
      </div>
      <div className="mb-4">
        <label className="giris-form" htmlFor="ucret-aylik">Aylık Ücret (₺) — isteğe bağlı</label>
        <input className="form-input"
          id="ucret-aylik"
          type="number"
          min="0"
          step="0.01"
          value={aylikUcret}
          onChange={(e) => setAylikUcret(e.target.value)}
          placeholder="Boş bırakılabilir"
        />
      </div>
      <button className="form-btn" type="submit">
        {duzenlenen ? "Değişiklikleri Kaydet" : "Ücreti Kaydet"}
      </button>
    </form>
  );
}

export function DersBaslangicSaatleriForm({ okulId, gunlukDersSayisi, gunler: egitimGunleri }: DersBaslangicSaatleriFormProps) {
  const dispatch = useAppDispatch();
  const [saatler, setSaatler] = useState<Record<number, Record<number, string>>>({});
  const [manuelHucreler, setManuelHucreler] = useState<Record<number, Record<number, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const gunNoListesi = (egitimGunleri ?? []).map((g) => Number(g)).filter((n) => Number.isInteger(n) && n >= 1);
 
  useEffect(() => {
    let aktif = true;
    setLoading(true);
    setError("");
 
    fetch(`/api/ders-baslangic-saatleri?okul_id=${okulId}`)
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!aktif) return;
        setLoading(false);
        if (!response.ok) {
          setError(result.error || "Ders başlangıç saatleri yüklenemedi.");
          return;
        }
        const yeniSaatler: Record<number, Record<number, string>> = {};
        const yeniManuelHucreler: Record<number, Record<number, boolean>> = {};
        for (const kayit of result.kayitlar as DersBaslangicSaati[]) {
          if (!yeniSaatler[kayit.gun_no]) yeniSaatler[kayit.gun_no] = {};
          yeniSaatler[kayit.gun_no][kayit.ders_saati_no] = kayit.baslangic_saati;
          if (!yeniManuelHucreler[kayit.gun_no]) yeniManuelHucreler[kayit.gun_no] = {};
          yeniManuelHucreler[kayit.gun_no][kayit.ders_saati_no] = kayit.otomatik_mi === false;
        }
        setSaatler(yeniSaatler);
        setManuelHucreler(yeniManuelHucreler);
      })
      .catch(() => {
        if (!aktif) return;
        setLoading(false);
        setError("Ders başlangıç saatleri yüklenemedi.");
      });
 
    return () => {
      aktif = false;
    };
  }, [okulId]);
 
  function saatDegistir(gunNo: number, dersSaatiNo: number, deger: string) {
    setSaatler((onceki) => ({
      ...onceki,
      [gunNo]: { ...onceki[gunNo], [dersSaatiNo]: deger },
    }));
    setManuelHucreler((onceki) => ({
      ...onceki,
      [gunNo]: { ...onceki[gunNo], [dersSaatiNo]: true },
    }));
  }
 
  async function kaydet() {
    setSaving(true);
    setError("");
    setMessage("");
 
    const kayitlar: DersBaslangicSaati[] = [];
    for (const gunNo of gunNoListesi) {
      for (let dersSaatiNo = 1; dersSaatiNo <= gunlukDersSayisi; dersSaatiNo++) {
        const deger = saatler[gunNo]?.[dersSaatiNo];
        if (deger) {
          kayitlar.push({ gun_no: gunNo, ders_saati_no: dersSaatiNo, baslangic_saati: deger });
        }
      }
    }
 
    const response = await fetch("/api/ders-baslangic-saatleri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ okul_id: okulId, kayitlar }),
    });
    const result = await response.json();
    setSaving(false);
 
    if (!response.ok) {
      setError(result.error || "Kaydedilemedi.");
      return;
    }
 
    setMessage(result.message);
    // Bu formun kendi state'i (saatler/manuelHucreler) dışında, /yonetim/program
    // sayfasının kullandığı Redux'taki dersSaatleriSlice de aynı veriyi tutuyor —
    // kaydettikten sonra onu da tazeleyip iki yerin senkron kalmasını sağlıyoruz.
    dispatch(baslangicSaatleriGetir(okulId));
  }
 
  const dersSaatleri = Array.from({ length: gunlukDersSayisi }, (_, i) => i + 1);
 
  if (loading) return <p className="text-slate-600">Yükleniyor…</p>;
 
  return (
    <div className="form-card">
      <h2 className="text-xl font-bold mb-4">Ders Başlangıç Saatleri</h2>
      <p className="bilgi-tb">Her gün için ders saatlerinin başlangıç zamanını girin.</p>
      <p className="bilgi-tb">
        <span className="inline-block h-3 w-3 rounded bg-amber-50 border border-amber-400 align-middle mr-1" />
        Elle düzenlenmiş hücreler — okul bilgileri güncellense bile bu hücreler otomatik olarak değişmez.
      </p>
 
      {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-2xl bg-green-50 p-4 text-green-700">{message}</p>}
 
      <div className="mt-5 overflow-x-auto">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>Ders Saati</th>
              {gunNoListesi.map((gunNo) => (
                <th key={gunNo}>{gunSecenekleri.find((g) => g.deger === String(gunNo))?.ad ?? `${gunNo}. gün`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dersSaatleri.map((dersSaatiNo) => (
              <tr key={dersSaatiNo}>
                <td className="font-semibold">{dersSaatiNo}. ders</td>
                {gunNoListesi.map((gunNo) => (
                  <td key={gunNo}>
                    <input
                      className={`form-input ${manuelHucreler[gunNo]?.[dersSaatiNo] ? "border-amber-400 bg-amber-50" : ""}`}
                      type="time"
                      value={saatler[gunNo]?.[dersSaatiNo] ?? ""}
                      onChange={(e) => saatDegistir(gunNo, dersSaatiNo, e.target.value)}
                      title={manuelHucreler[gunNo]?.[dersSaatiNo] ? "Elle düzenlendi — otomatik hesaplama bu hücreyi değiştirmez" : "Otomatik hesaplandı"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
      <button className="form-btn mt-4" type="button" onClick={kaydet} disabled={saving}>
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}