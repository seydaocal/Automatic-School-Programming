import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/redux/store";
import type { DersProgramiSatiri } from "@/types";
import { dersSaatleriniHesapla } from "@/lib/ders-saatleri-hesapla";

interface DersProgramiState {
  liste: DersProgramiSatiri[];
  yukleniyor: boolean;
  hata: string;
}

const initialState: DersProgramiState = {
  liste: [],
  yukleniyor: false,
  hata: "",
};

interface DersPrograminiGetirParams {
  okulId: number;
  okulSure?: number | null;
  okulMolas?: number | null;
  okulIlkDersBaslangicSaati?: string | null;
  okulSayi?: number | null;
}

export const dersPrograminiGetir = createAsyncThunk<
  DersProgramiSatiri[],
  DersPrograminiGetirParams,
  { state: RootState; rejectValue: string }
>("dersProgrami/getir", async (params, { getState, rejectWithValue }) => {
  const { okulId, okulSure, okulMolas, okulIlkDersBaslangicSaati, okulSayi } = params;

  try {
    const [programRes, izinRes] = await Promise.all([
      fetch(`/api/ders-programi?okul_id=${okulId}`),
      fetch(`/api/izinler?okul_id=${okulId}`),
    ]);

    if (!programRes.ok) throw new Error("Ders programı yüklenemedi.");

    const sonuc = await programRes.json();
    const hamProgram: any[] = sonuc.data || [];

    let aktifIzinler: any[] = [];
    if (izinRes.ok) {
      const izinSonuc = await izinRes.json();
      aktifIzinler = (izinSonuc.data || []).filter((iz: any) => iz.onaylandi === true);
    }

    const state = getState();
    const tumOgretmenler = state.ogretmenler.liste || [];
    const atamalarListesi = state.atama.liste || [];
    const baslangicSaatleri = state.dersSaatleri.baslangicSaatleri || [];
    const haftaBaslangici = state.dersSaatleri.haftaBaslangici;

    const saatTemizle = (s: any) => {
      if (!s) return "";
      const str = String(s).trim();
      return str.length >= 5 ? str.substring(0, 5) : str;
    };

    const tarihNormallestir = (deger: any): string => {
      if (!deger) return "";
      if (typeof deger === "string") return deger.slice(0, 10);
      try {
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
      if (okulIlkDersBaslangicSaati && okulSure && okulSayi) {
        try {
          otomatikHesaplananSaatler = dersSaatleriniHesapla({
            ilkDersBaslangicSaati: okulIlkDersBaslangicSaati,
            dersSuresi: okulSure,
            molaSuresi: okulMolas ?? 0,
            gunlukDersSayisi: okulSayi,
          });
        } catch (e) {
          otomatikHesaplananSaatler = [];
        }
      }

      return (gunNo: number, dersSaatiNo: any) => {
        const kayit = baslangicSaatleri.find(
          (b: any) => Number(b.gun_no) === gunNo && Number(b.ders_saati_no) === Number(dersSaatiNo)
        );
        if (kayit) return saatTemizle(kayit.baslangic_saati);

        const index = Number(dersSaatiNo) - 1;
        if (index >= 0 && index < otomatikHesaplananSaatler.length) {
          return saatTemizle(otomatikHesaplananSaatler[index]);
        }

        return "";
      };
    })();

    function saateDakikaEkle(saat: string, eklenecekDakika: number): string {
      const [saatKismi, dakikaKismi] = saat.split(":").map(Number);
      const toplamDakika = saatKismi * 60 + dakikaKismi + eklenecekDakika;
      const yeniSaat = Math.floor(toplamDakika / 60) % 24;
      const yeniDakika = toplamDakika % 60;
      return `${String(yeniSaat).padStart(2, "0")}:${String(yeniDakika).padStart(2, "0")}`;
    }

    function dersTarihiHesapla(gunNo: number): string {
      const pazartesi = new Date(`${haftaBaslangici}T00:00:00`);
      pazartesi.setDate(pazartesi.getDate() + (gunNo - 1));
      const yyyy = pazartesi.getFullYear();
      const mm = String(pazartesi.getMonth() + 1).padStart(2, "0");
      const dd = String(pazartesi.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    const islenmisProgram: any[] = [];
    const slotBazliEkAtamalar = new Map<string, Set<number>>();

    hamProgram.forEach((ders: any) => {
      const dersGunNo = Number(ders.gun_no);
      const dersSaati = gercekSaat(dersGunNo, ders.ders_saati);
      const dersBitisSaati = dersSaati !== "" && okulSure ? saateDakikaEkle(dersSaati, okulSure) : dersSaati;
      const dersTarihi = dersTarihiHesapla(dersGunNo);
      const slotKey = `${dersGunNo}-${ders.ders_saati}`;

      const izinCakismasi = aktifIzinler.find((izin: any) => {
        const ayniGun = Number(izin.gun_no) === dersGunNo;
        const ayniOgretmen = Number(izin.ogretmen_id) === Number(ders.ogretmen_id);
        const tarihUygun = izin.tarih ? tarihNormallestir(izin.tarih) === dersTarihi : true;

        const baslangic = saatTemizle(izin.baslangic_saati);
        const bitis = saatTemizle(izin.bitis_saati);

        // Gerçek aralık kesişimi: ders başlangıcı izin bitişinden önce VE ders
        // bitişi izin başlangıcından sonra ise iki aralık kesişiyor demektir.
        const saatAraliginda = dersSaati !== "" && dersSaati < bitis && dersBitisSaati > baslangic;

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

      const orijinalAtama = atamalarListesi.find(
        (a: any) => Number(a.id) === Number(ders.ogr_ders_id)
      );
      const dersId = orijinalAtama?.ders_id;

      const dersiVerebilenOgretmenIdleri = new Set(
        atamalarListesi
          .filter((a: any) => dersId != null && Number(a.ders_id) === Number(dersId))
          .map((a: any) => Number(a.ogretmen_id))
      );

      const uygunOgretmenler = tumOgretmenler.filter((ogr: any) => {
        const musaitMi = !mesgulOgretmenIdleri.has(Number(ogr.id));
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

    return islenmisProgram as DersProgramiSatiri[];
  } catch (error) {
    console.error("Program getirilirken hata:", error);
    return rejectWithValue("Ders programı yüklenemedi.");
  }
});

export const dersProgramiOlustur = createAsyncThunk<
  DersProgramiSatiri[],
  number,
  { rejectValue: string }
>("dersProgrami/olustur", async (okulId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/ders-programi?okul_id=${okulId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ okul_id: okulId }),
    });

    if (!response.ok) throw new Error("Ders programı oluşturulamadı.");
    const sonuc = await response.json();
    return sonuc.data as DersProgramiSatiri[];
  } catch (error) {
    console.error("Program oluşturulurken hata:", error);
    return rejectWithValue("Ders programı oluşturulamadı.");
  }
});

const dersProgramiSlice = createSlice({
  name: "dersProgrami",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- dersPrograminiGetir ---
      .addCase(dersPrograminiGetir.pending, (state) => {
        state.yukleniyor = true;
        state.hata = "";
      })
      .addCase(dersPrograminiGetir.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(dersPrograminiGetir.rejected, (state, action) => {
        state.yukleniyor = false;
        state.hata = action.payload ?? "Ders programı yüklenemedi.";
      })
      // --- dersProgramiOlustur ---
      .addCase(dersProgramiOlustur.pending, (state) => {
        state.yukleniyor = true;
        state.hata = "";
      })
      .addCase(dersProgramiOlustur.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(dersProgramiOlustur.rejected, (state, action) => {
        state.yukleniyor = false;
        state.hata = action.payload ?? "Ders programı oluşturulamadı.";
      });
  },
});

export default dersProgramiSlice.reducer;