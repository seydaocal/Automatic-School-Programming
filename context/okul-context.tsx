"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Okul, Ders, Ogretmen, Sinif, Atama, DersProgramiSatiri,OgretmenIzni,DersUcreti, DersBaslangicSaati } from "@/types";
import { dersSaatleriniHesapla } from "@/lib/ders-saatleri-hesapla";

async function bilgigetir<T>(
  url: string,
  parametre: string,
  setVeri: (veri: T) => void,
  setListeHata: (hata: string) => void,
  setYukleniyor: (durum: boolean) => void
): Promise<void> {
  setListeHata("");
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const msg = `Bilgi alınamadı. Status: ${response.status} ${response.statusText} - ${text}`;
      console.error(`${parametre} fetch failed:`, msg);
      setListeHata(`${parametre} listesi yüklenemedi. (${response.status} ${response.statusText})`);
      return;
    }
    const sonuc = await response.json();
    setVeri(sonuc.data !== undefined ? sonuc.data : sonuc);
  } catch (error) {
    console.error(`${parametre} getirilirken hata:`, error);
    setListeHata(`${parametre} listesi yüklenemedi.`);
  } finally {
    setYukleniyor(false);
  }
}

interface OkulContextValue {
  // Seçili okul
  secilenOkul: Okul | null;
  setSecilenOkul: (okul: Okul | null) => void;

  // Okul CRUD
  okullar: Okul[];
  okullarYukleniyor: boolean;
  listeHata: string;
  okullariGetir: () => Promise<void>;
  kaydediliyor: boolean;
  hata: string;
  duzenlenenOkulId: number | null;
  setDuzenlenenOkulId: (id: number | null) => void;
  okulKaydet: (veri: Partial<Okul>) => Promise<void>;
  okulSil: (id: number) => Promise<void>;
  duzenlemeyeBaslaOkul: (okul: Okul) => void;

  // Dersler
  derslerListesi: Ders[];
  derslerYukleniyor: boolean;
  dersListeHata: string;
  derslerGetir: () => Promise<void>;
  duzenlenenDersId: number | null;
  setDuzenlenenDersId: (id: number | null) => void;
  dersKaydediliyor: boolean;
  dersHata: string;
  dersKaydet: (veri: Partial<Ders>) => Promise<void>;
  dersSil: (id: number) => Promise<void>;
  duzenlemeyeBasladers: (ders: Ders) => void;

  // Öğretmenler
  ogretmenlerListesi: Ogretmen[];
  ogretmenlerYukleniyor: boolean;
  ogretmenListeHata: string;
  ogretmenlerGetir: () => Promise<void>;
  duzenlenenOgretmenId: number | null;
  setDuzenlenenOgretmenId: (id: number | null) => void;
  ogretmenKaydediliyor: boolean;
  ogretmenHata: string;
  ogretmenKaydet: (veri: Partial<Ogretmen>) => Promise<void>;
  ogretmenSil: (id: number) => Promise<void>;
  duzenlemeyeBaslaogr: (ogretmen: Ogretmen) => void;

  // Sınıflar
  siniflarListesi: Sinif[];
  siniflarYukleniyor: boolean;
  sinifListeHata: string;
  siniflarGetir: () => Promise<void>;
  duzenlenenSinifId: number | null;
  setDuzenlenenSinifId: (id: number | null) => void;
  sinifKaydediliyor: boolean;
  sinifHata: string;
  sinifKaydet: (veri: Partial<Sinif>) => Promise<void>;
  sinifSil: (id: number) => Promise<void>;
  duzenlemeyeBaslaSinif: (sinif: Sinif) => void;

  // Ders Atama
  atamalarListesi: Atama[];
  atamalarYukleniyor: boolean;
  atamaListeHata: string;
  atamalarGetir: () => Promise<void>;
  secilenDersId: string;
  setSecilenDersId: (id: string) => void;
  secilenOgretmenId: string;
  setSecilenOgretmenId: (id: string) => void;
  duzenlenenAtamaId: number | null;
  atamaHata: string;
  atamaEkle: () => Promise<void>;
  atamaSil: (id: number) => Promise<void>;
  duzenlemeyeBaslaatama: (atama: Atama) => void;

  // Ders Programı
  dersProgramiListesi: DersProgramiSatiri[];
  dersProgramiYukleniyor: boolean;
  dersProgramiHata: string;
  dersPrograminiGetir: () => Promise<void>;
  dersProgramiOlustur: () => Promise<void>;
  baslangicSaatleri: DersBaslangicSaati[];
  setBaslangicSaatleri: (saatler: DersBaslangicSaati[]) => void;
  baslangicSaatleriGetir: () => Promise<void>;

  // Görüntülenen haftanın Pazartesi tarihi (YYYY-MM-DD). Tarihli izinlerin hangi
  // takvim gününe denk geldiğini hesaplamak için kullanılır.
  haftaBaslangici: string;
  setHaftaBaslangici: (tarih: string) => void;

  //Öğretmen İzinleri
  izinlerListesi: OgretmenIzni[];
  izinlerYukleniyor: boolean;
  izinListeHata: string;
  izinlerGetir: () => Promise<void>;
  duzenlenenIzinId: number | null;
  setDuzenlenenIzinId: (id: number | null) => void;
  izinKaydediliyor: boolean;
  izinHata: string;
  izinKaydet: (veri: Partial<OgretmenIzni>) => Promise<void>;
  izinSil: (id: number) => Promise<void>;
  izinOnaylama: (izin: OgretmenIzni) => Promise<void>;
  duzenlemeyeBaslaIzin: (izin: OgretmenIzni) => void;

  // Ders Ücreti
  ucretlerListesi: DersUcreti[];
  ucretlerYukleniyor: boolean;
  ucretListeHata: string;
  ucretlerGetir: () => Promise<void>;
  duzenlenenUcretId: number | null;
  setDuzenlenenUcretId: (id: number | null) => void;
  ucretKaydediliyor: boolean;
  ucretHata: string;
  ucretKaydet: (veri: Partial<DersUcreti>) => Promise<void>;
  ucretSil: (id: number) => Promise<void>;
  duzenlemeyeBaslaUcret: (ucret: DersUcreti) => void;
}

const OkulContext = createContext<OkulContextValue | null>(null);

export function OkulProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [secilenOkul, setSecilenOkulState] = useState<Okul | null>(null);

  useEffect(() => {
    try {
      const kayitli = localStorage.getItem("secilenOkul");
      if (kayitli) {
        setSecilenOkulState(JSON.parse(kayitli));
      }
    } catch (error) {
      console.error("Seçili okul yüklenemedi:", error);
    }
  }, []);

  function setSecilenOkul(okul: Okul | null) {
    setSecilenOkulState(okul);
    try {
      if (okul) {
        localStorage.setItem("secilenOkul", JSON.stringify(okul));
      } else {
        localStorage.removeItem("secilenOkul");
      }
    } catch (error) {
      console.error("Seçili okul kaydedilemedi:", error);
    }
  }

  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  const [duzenlenenOkulId, setDuzenlenenOkulId] = useState<number | null>(null);
  const [okullar, setOkullar] = useState<Okul[]>([]);
  const [okullarYukleniyor, setOkullarYukleniyor] = useState(false);
  const [listeHata, setListeHata] = useState("");

  const [derslerListesi, setDerslerListesi] = useState<Ders[]>([]);
  const [derslerYukleniyor, setDerslerYukleniyor] = useState(false);
  const [dersListeHata, setDersListeHata] = useState("");
  const [duzenlenenDersId, setDuzenlenenDersId] = useState<number | null>(null);
  const [dersKaydediliyor, setDersKaydediliyor] = useState(false);
  const [dersHata, setDersHata] = useState("");

  const [ogretmenlerListesi, setOgretmenlerListesi] = useState<Ogretmen[]>([]);
  const [ogretmenlerYukleniyor, setOgretmenlerYukleniyor] = useState(false);
  const [ogretmenListeHata, setOgretmenListeHata] = useState("");
  const [duzenlenenOgretmenId, setDuzenlenenOgretmenId] = useState<number | null>(null);
  const [ogretmenKaydediliyor, setOgretmenKaydediliyor] = useState(false);
  const [ogretmenHata, setOgretmenHata] = useState("");

  const [siniflarListesi, setSiniflarListesi] = useState<Sinif[]>([]);
  const [siniflarYukleniyor, setSiniflarYukleniyor] = useState(false);
  const [sinifListeHata, setSinifListeHata] = useState("");
  const [duzenlenenSinifId, setDuzenlenenSinifId] = useState<number | null>(null);
  const [sinifKaydediliyor, setSinifKaydediliyor] = useState(false);
  const [sinifHata, setSinifHata] = useState("");

  const [atamalarListesi, setAtamalarListesi] = useState<Atama[]>([]);
  const [atamalarYukleniyor, setAtamalarYukleniyor] = useState(false);
  const [atamaListeHata, setAtamaListeHata] = useState("");
  const [secilenDersId, setSecilenDersId] = useState("");
  const [secilenOgretmenId, setSecilenOgretmenId] = useState("");
  const [duzenlenenAtamaId, setDuzenlenenAtamaId] = useState<number | null>(null);
  const [atamaHata, setAtamaHata] = useState("");

  const [dersProgramiListesi, setDersProgramiListesi] = useState<DersProgramiSatiri[]>([]);
  const [dersProgramiYukleniyor, setDersProgramiYukleniyor] = useState(false);
  const [dersProgramiHata, setDersProgramiHata] = useState("");

  // Bugünün ait olduğu haftanın Pazartesi tarihini "YYYY-MM-DD" olarak hesaplar
  function buHaftaninPazartesi(): string {
    const bugun = new Date();
    const gun = bugun.getDay(); // 0=Pazar, 1=Pazartesi, ... 6=Cumartesi
    const pazartesiyeFark = gun === 0 ? -6 : 1 - gun;
    const pazartesi = new Date(bugun);
    pazartesi.setDate(bugun.getDate() + pazartesiyeFark);
    const yyyy = pazartesi.getFullYear();
    const mm = String(pazartesi.getMonth() + 1).padStart(2, "0");
    const dd = String(pazartesi.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const [haftaBaslangici, setHaftaBaslangici] = useState<string>(buHaftaninPazartesi());
  const [baslangicSaatleri, setBaslangicSaatleri] = useState<DersBaslangicSaati[]>([]);

  const [izinlerListesi, setIzinlerListesi] = useState<OgretmenIzni[]>([]);
  const [izinlerYukleniyor, setIzinlerYukleniyor] = useState(false);
  const [izinListeHata, setIzinListeHata] = useState("");
  const [duzenlenenIzinId, setDuzenlenenIzinId] = useState<number | null>(null);
  const [izinKaydediliyor, setIzinKaydediliyor] = useState(false);
  const [izinHata, setIzinHata] = useState("");

  const [ucretlerListesi, setUcretlerListesi] = useState<DersUcreti[]>([]);
  const [ucretlerYukleniyor, setUcretlerYukleniyor] = useState(false);
  const [ucretListeHata, setUcretListeHata] = useState("");
  const [duzenlenenUcretId, setDuzenlenenUcretId] = useState<number | null>(null);
  const [ucretKaydediliyor, setUcretKaydediliyor] = useState(false);
  const [ucretHata, setUcretHata] = useState("");

  // --- Veri çekme ---
  async function okullariGetir() {
    setOkullarYukleniyor(true);
    await bilgigetir<Okul[]>(
      "/api/okul",
       "Okul", 
       setOkullar,
       setListeHata, 
       setOkullarYukleniyor);
  }

  async function derslerGetir() {
    if (!secilenOkul?.id) return;
    setDerslerYukleniyor(true);
    await bilgigetir<Ders[]>(
      `/api/dersler?okul_id=${secilenOkul?.id}`, 
      "Ders", 
      setDerslerListesi, 
      setDersListeHata, 
      setDerslerYukleniyor);
  }

  async function ogretmenlerGetir() {
    if (!secilenOkul?.id) return;
    setOgretmenlerYukleniyor(true);
    await bilgigetir<Ogretmen[]>(
      `/api/ogretmenler?okul_id=${secilenOkul?.id}`,
      "Öğretmen",
      setOgretmenlerListesi,
      setOgretmenListeHata,
      setOgretmenlerYukleniyor
    );
  }

  async function siniflarGetir() {
    if (!secilenOkul?.id) return;
    setSiniflarYukleniyor(true);
    await bilgigetir<Sinif[]>(
      `/api/siniflar?okul_id=${secilenOkul?.id}`,
      "Sınıf", 
      setSiniflarListesi, 
      setSinifListeHata, 
      setSiniflarYukleniyor);
  }

  async function atamalarGetir() {
    if (!secilenOkul?.id) return;
    setAtamalarYukleniyor(true);
    await bilgigetir<Atama[]>(
       `/api/atama?okul_id=${secilenOkul?.id}`, 
      "Atama", 
      setAtamalarListesi, 
      setAtamaListeHata, 
      setAtamalarYukleniyor);
  }

  async function dersPrograminiGetir() {
    if (!secilenOkul?.id) return;
    setDersProgramiYukleniyor(true);
    setDersProgramiHata("");
    try {
      const [programRes, izinRes] = await Promise.all([
      fetch(`/api/ders-programi?okul_id=${secilenOkul.id}`),
      fetch(`/api/izinler?okul_id=${secilenOkul.id}`)
    ]);

    if (!programRes.ok) throw new Error("Ders programı yüklenemedi.");

    const sonuc = await programRes.json();
    const hamProgram: any[] = sonuc.data || [];

    let aktifIzinler: any[] = [];
    if (izinRes.ok) {
      const izinSonuc = await izinRes.json();
      aktifIzinler = (izinSonuc.data || []).filter((iz: any) => iz.onaylandi === true);
    }

    const tumOgretmenler = ogretmenlerListesi || [];

    const saatTemizle = (s: any) => {
      if (!s) return "";
      const str = String(s).trim();
      return str.length >= 5 ? str.substring(0, 5) : str;
    };

    // Sunucudan izin.tarih bazen "YYYY-MM-DD" saf metin, bazen Date nesnesi/ISO
    // zaman damgası ("2026-08-17T00:00:00.000Z") olarak gelebilir. Karşılaştırma
    // her zaman saf "YYYY-MM-DD" üzerinden yapılmalı, aksi halde hiç eşleşmez.
    const tarihNormallestir = (deger: any): string => {
      if (!deger) return "";
      if (typeof deger === "string") return deger.slice(0, 10);
      try {
        // toISOString() UTC'ye çevirdiği için UTC+ dilimlerinde tarihi bir gün
        // geriye kaydırabilir; bunun yerine yerel tarih bileşenlerini kullanıyoruz.
        const d = new Date(deger);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      } catch {
        return "";
      }
    };

    const gercekSaat = (() => {
      let otomatikHesaplananSaatler: string[] = [];
      if (
        secilenOkul?.ilk_ders_baslangic_saati &&
        secilenOkul?.sure &&
        secilenOkul?.sayi
      ) {
        try {
          otomatikHesaplananSaatler = dersSaatleriniHesapla({
            ilkDersBaslangicSaati: secilenOkul.ilk_ders_baslangic_saati,
            dersSuresi: secilenOkul.sure,
            molaSuresi: secilenOkul.molas ?? 0,
            gunlukDersSayisi: secilenOkul.sayi,
          });
        } catch (e) {
          otomatikHesaplananSaatler = [];
        }
      }

      return (gunNo: number, dersSaatiNo: any) => {
        // Önce DB'de bu gün+ders saati için manuel/kaydedilmiş bir saat var mı bak
        const kayit = baslangicSaatleri.find(
          (b: any) => Number(b.gun_no) === gunNo && Number(b.ders_saati_no) === Number(dersSaatiNo)
        );
        if (kayit) return saatTemizle(kayit.baslangic_saati);

        // Yoksa okulun ders süresine göre otomatik hesaplanan saati kullan
        const index = Number(dersSaatiNo) - 1;
        if (index >= 0 && index < otomatikHesaplananSaatler.length) {
          return saatTemizle(otomatikHesaplananSaatler[index]);
        }

        return "";
      };
    })();

    const islenmisProgram: any[] = [];
    const slotBazliEkAtamalar = new Map<string, Set<number>>();

    // haftaBaslangici (Pazartesi) + (gun_no - 1) gün ekleyerek o dersin gerçek takvim
    // tarihini hesaplar. Tarihli izinler bu tarihle eşleştirilir.
    function dersTarihiHesapla(gunNo: number): string {
      const pazartesi = new Date(`${haftaBaslangici}T00:00:00`);
      pazartesi.setDate(pazartesi.getDate() + (gunNo - 1));
      const yyyy = pazartesi.getFullYear();
      const mm = String(pazartesi.getMonth() + 1).padStart(2, "0");
      const dd = String(pazartesi.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    // Bir saate (HH:MM) dakika ekler; dersin bitiş saatini bulmak için kullanılır
    function saateDakikaEkle(saat: string, eklenecekDakika: number): string {
      const [saatKismi, dakikaKismi] = saat.split(":").map(Number);
      const toplamDakika = saatKismi * 60 + dakikaKismi + eklenecekDakika;
      const yeniSaat = Math.floor(toplamDakika / 60) % 24;
      const yeniDakika = toplamDakika % 60;
      return `${String(yeniSaat).padStart(2, "0")}:${String(yeniDakika).padStart(2, "0")}`;
    }

    hamProgram.forEach((ders: any) => {
      const dersGunNo = Number(ders.gun_no);
      const dersSaati = gercekSaat(dersGunNo, ders.ders_saati);
      // Dersin bitiş saati: okulun ders süresi biliniyorsa hesaplanır, yoksa
      // sadece başlangıç anını nokta olarak kabul ederiz (eski davranış).
      const dersBitisSaati =
        dersSaati !== "" && secilenOkul?.sure ? saateDakikaEkle(dersSaati, secilenOkul.sure) : dersSaati;
      const dersTarihi = dersTarihiHesapla(dersGunNo);
      const slotKey = `${dersGunNo}-${ders.ders_saati}`;

      const izinCakismasi = aktifIzinler.find((izin: any) => {
        const ayniGun = Number(izin.gun_no) === dersGunNo;
        const ayniOgretmen = Number(izin.ogretmen_id) === Number(ders.ogretmen_id);

        // İzin tarihli ise (tek seferlik), sadece o gün TAM olarak bu haftanın
        // ilgili günü ile eşleşiyorsa uygulanır. Tarihsiz (kalıcı) izinler eskisi
        // gibi sadece gun_no'ya göre HER HAFTA uygulanmaya devam eder.
        const tarihUygun = izin.tarih ? tarihNormallestir(izin.tarih) === dersTarihi : true;

        const baslangic = saatTemizle(izin.baslangic_saati);
        const bitis = saatTemizle(izin.bitis_saati);

        // Gerçek aralık kesişimi: ders başlangıcı izin bitişinden önce VE
        // ders bitişi izin başlangıcından sonra ise iki aralık kesişiyor demektir.
        // (Sadece "ders başlangıcı izin içinde mi" bakmak, dersin izinden önce
        // başlayıp izin sırasında devam ettiği durumları kaçırırdı.)
        const saatAraliginda =
          dersSaati !== "" && dersSaati < bitis && dersBitisSaati > baslangic;

        return ayniGun && ayniOgretmen && tarihUygun && saatAraliginda;
      });

      if (!izinCakismasi) {
        islenmisProgram.push(ders);
        return;
      }

      const mesgulOgretmenIdleri = new Set<number>();

      hamProgram.forEach((p: any) => {
        if (Number(p.gun_no) === dersGunNo && p.ders_saati === ders.ders_saati && p.ogretmen_id) {
          mesgulOgretmenIdleri.add(Number(p.ogretmen_id));
        }
      });

      aktifIzinler.forEach((iz: any) => {
        const bas = saatTemizle(iz.baslangic_saati);
        const bit = saatTemizle(iz.bitis_saati);
        const tarihUygun = iz.tarih ? tarihNormallestir(iz.tarih) === dersTarihi : true;
        const saatKesisiyor = dersSaati !== "" && dersSaati < bit && dersBitisSaati > bas;
        if (Number(iz.gun_no) === dersGunNo && tarihUygun && saatKesisiyor) {
          mesgulOgretmenIdleri.add(Number(iz.ogretmen_id));
        }
      });

      const buSlottaAtananlar = slotBazliEkAtamalar.get(slotKey);
      if (buSlottaAtananlar) {
        buSlottaAtananlar.forEach((id) => mesgulOgretmenIdleri.add(id));
      }

      // Asıl dersin hangi ders/branş olduğunu bul (atamalarListesi: ogretmenlere_ders_atama kaydı)
      const orijinalAtama = atamalarListesi.find(
        (a: any) => Number(a.id) === Number(ders.ogr_ders_id)
      );
      const dersId = orijinalAtama?.ders_id;

      // Bu dersi verebilen (okulda bu derse atanmış) öğretmenlerin id listesi
      const dersiVerebilenOgretmenIdleri = new Set(
        atamalarListesi
          .filter((a: any) => dersId != null && Number(a.ders_id) === Number(dersId))
          .map((a: any) => Number(a.ogretmen_id))
      );

      const uygunOgretmenler = tumOgretmenler.filter((ogr: any) => {
        const musaitMi = !mesgulOgretmenIdleri.has(Number(ogr.id));
        // Branş eşleşmesi bilgisi varsa (dersiVerebilenOgretmenIdleri doluysa) uygula;
        // hiçbir öğretmen bu derse kayıtlı görünmüyorsa (veri eksikliği), eski davranışa düş.
        const bransUyumlu =
          dersiVerebilenOgretmenIdleri.size === 0 || dersiVerebilenOgretmenIdleri.has(Number(ogr.id));
        return musaitMi && bransUyumlu;
      });

      if (uygunOgretmenler.length > 0) {
        const yeniOgretmen = uygunOgretmenler[0];

        if (!slotBazliEkAtamalar.has(slotKey)) {
          slotBazliEkAtamalar.set(slotKey, new Set());
        }
        slotBazliEkAtamalar.get(slotKey)!.add(Number(yeniOgretmen.id));

        islenmisProgram.push({
          ...ders,
          ogretmen_id: yeniOgretmen.id,
          ogretmen_adi: `${yeniOgretmen.ad} ${yeniOgretmen.soyad}`,
          ikame_ogretmen: true,
          asil_ogretmen_id: ders.ogretmen_id,
        });
      } else {
        islenmisProgram.push({
          ...ders,
          ogretmen_id: null,
          ogretmen_adi: "Uygun Öğretmen Bulunamadı",
          ikame_ogretmen: false,
        });
      }
    });

    setDersProgramiListesi(islenmisProgram);
    } catch (error) {
      console.error("Program getirilirken hata:", error);
      setDersProgramiHata("Ders programı yüklenemedi.");
    } finally {
      setDersProgramiYukleniyor(false);
    }
  }

  async function dersProgramiOlustur() {
    if (!secilenOkul?.id) return;
    setDersProgramiYukleniyor(true);
    setDersProgramiHata("");
    try {
      const response = await fetch(`/api/ders-programi?okul_id=${secilenOkul.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ okul_id: secilenOkul?.id }),
      });

      if (!response.ok) throw new Error("Ders programı oluşturulamadı.");
      const sonuc = await response.json();
      setDersProgramiListesi(sonuc.data);
    } catch (error) {
      console.error("Program oluşturulurken hata:", error);
      setDersProgramiHata("Ders programı oluşturulamadı.");
    } finally {
      setDersProgramiYukleniyor(false);
    }
  }

  async function baslangicSaatleriGetir() {
    if (!secilenOkul?.id) return;
    try {
      const response = await fetch(`/api/ders-baslangic-saatleri?okul_id=${secilenOkul.id}`);
      if (!response.ok) return;
      const sonuc = await response.json();
      setBaslangicSaatleri(sonuc.kayitlar ?? []);
    } catch (error) {
      console.error("Ders başlangıç saatleri getirilirken hata:", error);
    }
  }

  async function izinlerGetir() {
    if (!secilenOkul?.id) return;
    setIzinlerYukleniyor(true);
    await bilgigetir<OgretmenIzni[]>(
      `/api/izinler?okul_id=${secilenOkul?.id}`,
      "İzin",
      setIzinlerListesi,
      setIzinListeHata,
      setIzinlerYukleniyor
    );
  }

  async function ucretlerGetir() {
    if (!secilenOkul?.id) return;
    setUcretlerYukleniyor(true);
    await bilgigetir<DersUcreti[]>(
       `/api/ders-ucreti?okul_id=${secilenOkul?.id}`,
      "Ders ücreti",
      setUcretlerListesi,
      setUcretListeHata,
      setUcretlerYukleniyor
    );
  }

  // ================= OKUL =================

  async function okulKaydet(veri: Partial<Okul>) {
    setHata("");
    setKaydediliyor(true);
    const duzenlemeModu = duzenlenenOkulId !== null;

    try {
      const response = await fetch("/api/okul", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenOkulId } : {}),
          ad: veri.ad,
          il: veri.il,
          ilce: veri.ilce,
          sayi: veri.sayi,
          sure: veri.sure,
          molas: veri.molas,
          gun: veri.gun,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "Okul kaydedilemedi.");
      }

      const kaydedilenOkul: Okul = {
        id: sonuc.data.id,
        ad: veri.ad!,
        il: veri.il!,
        ilce: veri.ilce!,
        sayi: veri.sayi!,
        sure: veri.sure!,
        molas: veri.molas!,
        ilk_ders_baslangic_saati: veri.ilk_ders_baslangic_saati!,
        gun: veri.gun!,
      };

      setSecilenOkul(kaydedilenOkul);
      setOkullar((oncekiler) => {
        if (duzenlemeModu) {
          return oncekiler.map((okul) => (okul.id === kaydedilenOkul.id ? kaydedilenOkul : okul));
        }
        return [...oncekiler, kaydedilenOkul];
      });

      setDuzenlenenOkulId(null);
      if (duzenlemeModu) {
        router.push("/okul-sec");
      } else {
        router.push("/yonetim/dersler");
      }
    } catch (error) {
      console.error("Okul kaydedilirken hata:", error);
      setHata("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function okulSil(id: number) {
    if (!confirm("Bu okulu silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch("/api/okul", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setOkullar((oncekiler) => oncekiler.filter((okul) => okul.id !== id));
    } catch (error) {
      console.error("Okul silinirken hata:", error);
      alert("Okul silinemedi.");
    }
  }

  function duzenlemeyeBaslaOkul(okul: Okul) {
    setDuzenlenenOkulId(okul.id);
    router.push("/okul-ekle");
  }

  // ================= DERSLER =================

  async function dersSil(id: number) {
    if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch("/api/dersler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setDerslerListesi((oncekiler) => oncekiler.filter((ders) => ders.id !== id));
    } catch (error) {
      console.error("Ders silinirken hata:", error);
      alert("Ders silinemedi.");
    }
  }

  function duzenlemeyeBasladers(ders: Ders) {
    setDuzenlenenDersId(ders.id);
  }

  async function dersKaydet(veri: Partial<Ders>) {
    setDersHata("");
    setDersKaydediliyor(true);
    const duzenlemeModu = duzenlenenDersId !== null;

    try {
      const response = await fetch("/api/dersler", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenDersId } : {}),
          okulId: secilenOkul?.id,
          ad: veri.ad,
          seviye: veri.seviye,
          saat: veri.saat,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "Ders kaydedilemedi.");
      }

      const kaydedilenDers: Ders = {
        id: sonuc.data.id,
        ad: veri.ad!,
        seviye: veri.seviye!,
        saat: veri.saat!,
      };

      setDerslerListesi((oncekiler) => {
        const guvenliListe = Array.isArray(oncekiler) ? oncekiler : [];
        if (duzenlemeModu) {
          return guvenliListe.map((ders) => (ders.id === kaydedilenDers.id ? kaydedilenDers : ders));
        }
        return [...guvenliListe, kaydedilenDers];
      });

      setDuzenlenenDersId(null);
    } catch (error) {
      console.error("Ders kaydedilirken hata:", error);
      setDersHata("Ders kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setDersKaydediliyor(false);
    }
  }

  // ================= ÖĞRETMENLER =================

  async function ogretmenSil(id: number) {
    if (!confirm("Bu öğretmeni silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch("/api/ogretmenler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setOgretmenlerListesi((oncekiler) => oncekiler.filter((ogretmen) => ogretmen.id !== id));
    } catch (error) {
      console.error("Öğretmen silinirken hata:", error);
      alert("Öğretmen silinemedi.");
    }
  }

  function duzenlemeyeBaslaogr(ogretmen: Ogretmen) {
    setDuzenlenenOgretmenId(ogretmen.id);
  }

  async function ogretmenKaydet(veri: Partial<Ogretmen>) {
    setOgretmenHata("");
    setOgretmenKaydediliyor(true);
    const duzenlemeModu = duzenlenenOgretmenId !== null;

    try {
      const response = await fetch("/api/ogretmenler", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenOgretmenId } : {}),
          ad: veri.ad,
          soyad: veri.soyad,
          tc: veri.tc,
          dogum: veri.dogum || null,
          mail: veri.mail,
          fotograf: veri.fotograf || null,
          ozgecmis: veri.ozgecmis || null,
          okulId: secilenOkul?.id,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "Öğretmen kaydedilemedi.");
      }

      const kaydedilenOgretmen: Ogretmen = {
        id: sonuc.data.id,
        ad: veri.ad!,
        soyad: veri.soyad!,
        tc: veri.tc!,
        dogum: veri.dogum ?? "",
        mail: veri.mail!,
        fotograf: veri.fotograf || null,
        ozgecmis: veri.ozgecmis || null,
      };

      setOgretmenlerListesi((oncekiler) => {
        const guvenliListe = Array.isArray(oncekiler) ? oncekiler : [];
        if (duzenlemeModu) {
          return guvenliListe.map((ogretmen) =>
            ogretmen.id === kaydedilenOgretmen.id ? kaydedilenOgretmen : ogretmen
          );
        }
        return [...guvenliListe, kaydedilenOgretmen];
      });

      setDuzenlenenOgretmenId(null);
    } catch (error) {
      console.error("Öğretmen kaydedilirken hata:", error);
      setOgretmenHata("Öğretmen kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setOgretmenKaydediliyor(false);
    }
  }

  // ================= SINIFLAR =================

  async function sinifSil(id: number) {
    if (!confirm("Bu sınıfı silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch("/api/siniflar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setSiniflarListesi((oncekiler) => oncekiler.filter((sinif) => sinif.id !== id));
    } catch (error) {
      console.error("Sınıf silinirken hata:", error);
      alert("Sınıf silinemedi.");
    }
  }

  function duzenlemeyeBaslaSinif(sinif: Sinif) {
    setDuzenlenenSinifId(sinif.id);
  }

  async function sinifKaydet(veri: Partial<Sinif>) {
    setSinifHata("");
    setSinifKaydediliyor(true);
    const duzenlemeModu = duzenlenenSinifId !== null;

    try {
      const response = await fetch("/api/siniflar", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenSinifId } : {}),
          seviye: veri.seviye,
          sube: veri.sube,
          okulId: secilenOkul?.id,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "Sınıf kaydedilemedi.");
      }

      const kaydedilenSinif: Sinif = {
        id: sonuc.data.id,
        seviye: veri.seviye!,
        sube: veri.sube!,
      };

      setSiniflarListesi((oncekiler) => {
        const guvenliListe = Array.isArray(oncekiler) ? oncekiler : [];
        if (duzenlemeModu) {
          return guvenliListe.map((sinif) => (sinif.id === kaydedilenSinif.id ? kaydedilenSinif : sinif));
        }
        return [...guvenliListe, kaydedilenSinif];
      });

      setDuzenlenenSinifId(null);
    } catch (error) {
      console.error("Sınıf kaydedilirken hata:", error);
      setSinifHata("Sınıf kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSinifKaydediliyor(false);
    }
  }

  // ================= DERS ATAMA =================

  async function atamaSil(id: number) {
    if (!confirm("Bu atamayı silmek istediğinize emin misiniz?")) return;
    if (!secilenOkul?.id) {
      alert("Önce bir okul seçmelisiniz.");
      return;
    }
    try {
      const response = await fetch("/api/atama", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atamaId: id, okulId: secilenOkul.id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setAtamalarListesi((oncekiler) => oncekiler.filter((atama) => atama.id !== id));
    } catch (error) {
      console.error("Atama silinirken hata:", error);
      alert("Atama silinemedi.");
    }
  }

  function duzenlemeyeBaslaatama(atama: Atama) {
    setDuzenlenenAtamaId(atama.id);
    setSecilenDersId(String(atama.ders_id));
    setSecilenOgretmenId(String(atama.ogretmen_id));
  }

  async function atamaEkle() {
    setAtamaHata("");
    if (!secilenDersId || !secilenOgretmenId) return;
    const duzenlemeModu = duzenlenenAtamaId !== null;

    try {
      const response = await fetch("/api/atama", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenAtamaId } : {}),
          ders_id: secilenDersId,
          ogretmen_id: secilenOgretmenId,
          okulId: secilenOkul?.id,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "Atama kaydedilemedi.");
      }

      const kaydedilenAtama: Atama = {
        id: sonuc.data.id,
        ders_id: Number(secilenDersId),
        ogretmen_id: Number(secilenOgretmenId),
      };

      setAtamalarListesi((oncekiler) => {
        const guvenliListe = Array.isArray(oncekiler) ? oncekiler : [];
        if (duzenlemeModu) {
          return guvenliListe.map((atama) => (atama.id === kaydedilenAtama.id ? kaydedilenAtama : atama));
        }
        return [...guvenliListe, kaydedilenAtama];
      });

      setDuzenlenenAtamaId(null);
      setSecilenDersId("");
      setSecilenOgretmenId("");
    } catch (error) {
      console.error("Atama kaydedilirken hata:", error);
      setAtamaHata("Atama kaydedilemedi. Lütfen tekrar deneyin.");
    }
  }

  // ================= ÖĞRETMEN İZİNLERİ =================

  async function izinSil(id: number) {
    if (!confirm("Bu izin kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch("/api/izinler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setIzinlerListesi((oncekiler) => oncekiler.filter((izin) => izin.id !== id));
    } catch (error) {
      console.error("İzin silinirken hata:", error);
      alert("İzin kaydı silinemedi.");
    }
  }

  async function izinOnaylama(izin: OgretmenIzni) {
    try {
      const response = await fetch(`/api/izinler/${izin.id}/onayla`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Onaylanamadı.");
      setIzinlerListesi((oncekiler) => oncekiler.map((i) => (i.id === izin.id ? { ...i, onaylandi: true } : i)));
    } catch (error) {
      console.error("İzin onaylanırken hata:", error);
      alert("İzin onaylanamadı.");
    }
  }

  function duzenlemeyeBaslaIzin(izin: OgretmenIzni) {
    setDuzenlenenIzinId(izin.id);
  }

  async function izinKaydet(veri: Partial<OgretmenIzni>) {
    setIzinHata("");
    setIzinKaydediliyor(true);
    const duzenlemeModu = duzenlenenIzinId !== null;

    try {
      const response = await fetch("/api/izinler", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenIzinId } : {}),
          okulId: secilenOkul?.id ?? null,
          ogretmen_id: veri.ogretmen_id,
          gun_no: veri.gun_no,
          tarih: veri.tarih ?? null,
          baslangic_saati: veri.baslangic_saati,
          bitis_saati: veri.bitis_saati,
          aciklama: veri.aciklama,
          onaylandi: veri.onaylandi,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "İzin kaydedilemedi.");
      }

      const kaydedilenIzin: OgretmenIzni = {
        id: sonuc.data.id,
        okul_id: secilenOkul?.id ?? null,
        ogretmen_id: veri.ogretmen_id!,
        gun_no: veri.gun_no!,
        tarih: veri.tarih ?? null,
        baslangic_saati: veri.baslangic_saati!,
        bitis_saati: veri.bitis_saati!,
        aciklama: veri.aciklama ?? null,
        onaylandi: veri.onaylandi ?? false,
      };

      setIzinlerListesi((oncekiler) => {
        const guvenliListe = Array.isArray(oncekiler) ? oncekiler : [];
        if (duzenlemeModu) {
          return guvenliListe.map((izin) => (izin.id === kaydedilenIzin.id ? kaydedilenIzin : izin));
        }
        return [...guvenliListe, kaydedilenIzin];
      });

      setDuzenlenenIzinId(null);
    } catch (error) {
      console.error("İzin kaydedilirken hata:", error);
      setIzinHata("İzin kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIzinKaydediliyor(false);
    }
  }

  // ================= DERS ÜCRETİ =================

  async function ucretSil(id: number) {
    if (!confirm("Bu ücret kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch("/api/ders-ucreti", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) throw new Error(sonuc.error || "Silinemedi.");
      setUcretlerListesi((oncekiler) => oncekiler.filter((ucret) => ucret.id !== id));
    } catch (error) {
      console.error("Ücret silinirken hata:", error);
      alert("Ücret kaydı silinemedi.");
    }
  }

  function duzenlemeyeBaslaUcret(ucret: DersUcreti) {
    setDuzenlenenUcretId(ucret.id);
  }

  async function ucretKaydet(veri: Partial<DersUcreti>) {
    setUcretHata("");
    setUcretKaydediliyor(true);
    const duzenlemeModu = duzenlenenUcretId !== null;

    try {
      const response = await fetch("/api/ders-ucreti", {
        method: duzenlemeModu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(duzenlemeModu ? { id: duzenlenenUcretId } : {}),
          okulId: secilenOkul?.id,
          ders_id: veri.ders_id,
          saatlik_ucret: veri.saatlik_ucret,
          aylik_ucret: veri.aylik_ucret,
        }),
      });

      const sonuc = await response.json();
      if (!response.ok || !sonuc.success) {
        throw new Error(sonuc.error || "Ders ücreti kaydedilemedi.");
      }

      const kaydedilenUcret: DersUcreti = {
        id: sonuc.data.id,
        okul_id: secilenOkul?.id ?? 0,
        ders_id: veri.ders_id!,
        saatlik_ucret: veri.saatlik_ucret!,
        aylik_ucret: veri.aylik_ucret ?? null,
      };

      setUcretlerListesi((oncekiler) => {
        const guvenliListe = Array.isArray(oncekiler) ? oncekiler : [];
        if (duzenlemeModu) {
          return guvenliListe.map((ucret) => (ucret.id === kaydedilenUcret.id ? kaydedilenUcret : ucret));
        }
        return [...guvenliListe, kaydedilenUcret];
      });

      setDuzenlenenUcretId(null);
    } catch (error) {
      console.error("Ücret kaydedilirken hata:", error);
      setUcretHata("Ders ücreti kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setUcretKaydediliyor(false);
    }
  }

  const value: OkulContextValue = {
    secilenOkul,
    setSecilenOkul,
    okullar,
    okullarYukleniyor,
    listeHata,
    okullariGetir,
    kaydediliyor,
    hata,
    duzenlenenOkulId,
    setDuzenlenenOkulId,
    okulKaydet,
    okulSil,
    duzenlemeyeBaslaOkul,
    derslerListesi,
    derslerYukleniyor,
    dersListeHata,
    derslerGetir,
    duzenlenenDersId,
    setDuzenlenenDersId,
    dersKaydediliyor,
    dersHata,
    dersKaydet,
    dersSil,
    duzenlemeyeBasladers,
    ogretmenlerListesi,
    ogretmenlerYukleniyor,
    ogretmenListeHata,
    ogretmenlerGetir,
    duzenlenenOgretmenId,
    setDuzenlenenOgretmenId,
    ogretmenKaydediliyor,
    ogretmenHata,
    ogretmenKaydet,
    ogretmenSil,
    duzenlemeyeBaslaogr,
    siniflarListesi,
    siniflarYukleniyor,
    sinifListeHata,
    siniflarGetir,
    duzenlenenSinifId,
    setDuzenlenenSinifId,
    sinifKaydediliyor,
    sinifHata,
    sinifKaydet,
    sinifSil,
    duzenlemeyeBaslaSinif,
    atamalarListesi,
    atamalarYukleniyor,
    atamaListeHata,
    atamalarGetir,
    secilenDersId,
    setSecilenDersId,
    secilenOgretmenId,
    setSecilenOgretmenId,
    duzenlenenAtamaId,
    atamaHata,
    atamaEkle,
    atamaSil,
    duzenlemeyeBaslaatama,
    dersProgramiListesi,
    dersProgramiYukleniyor,
    dersProgramiHata,
    dersPrograminiGetir,
    dersProgramiOlustur,
    izinlerListesi,
    izinlerYukleniyor,
    izinListeHata,
    izinlerGetir,
    duzenlenenIzinId,
    setDuzenlenenIzinId,
    izinKaydediliyor,
    izinHata,
    izinKaydet,
    izinSil,
    izinOnaylama,
    duzenlemeyeBaslaIzin,
    ucretlerListesi,
    ucretlerYukleniyor,
    ucretListeHata,
    ucretlerGetir,
    duzenlenenUcretId,
    setDuzenlenenUcretId,
    ucretKaydediliyor,
    ucretHata,
    ucretKaydet,
    ucretSil,
    duzenlemeyeBaslaUcret,
    baslangicSaatleri,
    setBaslangicSaatleri,
    baslangicSaatleriGetir,
    haftaBaslangici,
    setHaftaBaslangici,

  };

  return <OkulContext.Provider value={value}>{children}</OkulContext.Provider>;
}

export function useOkulContext() {
  const ctx = useContext(OkulContext);
  if (!ctx) throw new Error("useOkulContext, OkulProvider içinde kullanılmalı.");
  return ctx;
}