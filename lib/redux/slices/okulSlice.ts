import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Okul, OkulKayit } from "@/types";

interface OkullarState {
  liste: Okul[];
  yukleniyor: boolean;
  listeHata: string;
  duzenlenenOkulId: number | null;
  kaydediliyor: boolean;
  hata: string;
}

const initialState: OkullarState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  duzenlenenOkulId: null,
  kaydediliyor: false,
  hata: "",
};

export const okullariGetir = createAsyncThunk(
  "okullar/getir",
  async (_: void, { rejectWithValue }) => {
    const response = await fetch(`/api/okul`);
    if (!response.ok) {
      return rejectWithValue("Okul listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as Okul[];
  }
);

export const okulKaydet = createAsyncThunk(
  "okullar/kaydet",
  async (
    payload: { veri: Partial<OkulKayit>; duzenlenenId: number | null },
    { rejectWithValue }
  ) => {
    const { veri, duzenlenenId } = payload;
    const duzenlemeModu = duzenlenenId !== null;

    const response = await fetch("/api/okul", {
      method: duzenlemeModu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(duzenlemeModu ? { id: duzenlenenId } : {}),
          ad: veri.ad,
          il: veri.il,
          ilce: veri.ilce,
          sayi: veri.sayi,
          sure: veri.sure,
          molas: veri.molas,
          ilk_ders_baslangic_saati: veri.ilk_ders_baslangic_saati,
          gun: veri.gun,
      }),
    });

    const sonuc = await response.json();
        if (!response.ok || !sonuc.success) {
          return rejectWithValue(sonuc.error || "Okul kaydedilemedi.");
        }
    
        const kaydedilenOkul: Okul= {
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
    
        return { kaydedilenOkul, duzenlemeModu };
      }
    );

    export const okulSil = createAsyncThunk(
  "okullar/sil",
  async (id: number, { rejectWithValue }) => {
    const response = await fetch("/api/okul", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const sonuc = await response.json();
    if (!response.ok || !sonuc.success) {
      return rejectWithValue(sonuc.error || "Silinemedi.");
    }
    return id;
  }
);

const okulSlice = createSlice({
  name: "okullar",
  initialState,
  reducers: {
    duzenlemeyeBaslaOkul(state, action: { payload: Okul }) {
      state.duzenlenenOkulId = action.payload.id;
    },
    duzenlemeyiIptalEt(state) {
      state.duzenlenenOkulId = null;
      state.hata = "";
    },
  },
  extraReducers: (builder) => {
      builder
        // --- Getir ---
        .addCase(okullariGetir.pending, (state) => {
          state.yukleniyor = true;
          state.listeHata = "";
        })
        .addCase(okullariGetir.fulfilled, (state, action) => {
          state.liste = action.payload;
          state.yukleniyor = false;
        })
        .addCase(okullariGetir.rejected, (state, action) => {
          state.yukleniyor = false;
          state.listeHata = (action.payload as string) ?? "Okul listesi yüklenemedi.";
        })
        // --- Kaydet ---
        .addCase(okulKaydet.pending, (state) => {
          state.kaydediliyor = true;
          state.hata = "";
        })
        .addCase(okulKaydet.fulfilled, (state, action) => {
          const { kaydedilenOkul, duzenlemeModu } = action.payload;
          if (duzenlemeModu) {
            state.liste = state.liste.map((okul) =>
              okul.id === kaydedilenOkul.id ? kaydedilenOkul : okul
            );
          } else {
            state.liste.push(kaydedilenOkul);
          }
          state.duzenlenenOkulId = null;
          state.kaydediliyor = false;
        })
        .addCase(okulKaydet.rejected, (state, action) => {
          state.kaydediliyor = false;
          state.hata = (action.payload as string) ?? "Okul kaydedilemedi. Lütfen tekrar deneyin.";
        })
        // --- Sil ---
        .addCase(okulSil.fulfilled, (state, action) => {
          state.liste = state.liste.filter((okul) => okul.id !== action.payload);
        });
    },
  });
  
  export const { duzenlemeyeBaslaOkul, duzenlemeyiIptalEt } = okulSlice.actions;
  export default okulSlice.reducer;