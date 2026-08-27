import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Ogretmen, OgretmenKayit } from "@/types";

interface OgretmenlerState {
    liste: Ogretmen[];
    yukleniyor: boolean;
    listeHata: string;
    duzenlenenOgretmenId: number | null;
    kaydediliyor: boolean;
    hata: string;
}

const initialState: OgretmenlerState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  duzenlenenOgretmenId: null,
  kaydediliyor: false,
  hata: "",
};

export const ogretmenlerGetir = createAsyncThunk(
  "ogretmenler/getir",
  async (okulId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/ogretmenler?okul_id=${okulId}`);
    if (!response.ok) {
      return rejectWithValue("Öğretmen listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as Ogretmen[];
  }
);

export const ogretmenKaydet = createAsyncThunk(
  "ogretmenler/kaydet",
  async (
    payload: { veri: Partial<OgretmenKayit>; okulId: number; duzenlenenId: number | null },
    { rejectWithValue }
  ) => {
    const { veri, okulId, duzenlenenId } = payload;
    const duzenlemeModu = duzenlenenId !== null;

    const response = await fetch("/api/ogretmenler", {
      method: duzenlemeModu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(duzenlemeModu ? { id: duzenlenenId } : {}),
        ad: veri.ad,
        soyad: veri.soyad,
        tc: veri.tc,
        dogum: veri.dogum || null,
        mail: veri.mail,
        fotograf: veri.fotograf || null,
        ozgecmis: veri.ozgecmis || null,
        okulId,
      }),
    });

    const sonuc = await response.json();
    if (!response.ok || !sonuc.success) {
      return rejectWithValue(sonuc.error || "Öğretmen kaydedilemedi.");
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
    
        return { kaydedilenOgretmen, duzenlemeModu };
      }
    );

    export const ogretmenSil = createAsyncThunk(
      "ogretmenler/sil",
      async (id: number, { rejectWithValue }) => {
        const response = await fetch("/api/ogretmenler", {
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

    const ogretmenlerSlice = createSlice({
      name: "ogretmenler",
      initialState,
      reducers: {
        duzenlemeyeBaslaogr(state, action: { payload: Ogretmen }) {
          state.duzenlenenOgretmenId = action.payload.id;
        },
        duzenlemeyiIptalEt(state) {
          state.duzenlenenOgretmenId = null;
          state.hata = "";
        },
      },
      extraReducers: (builder) => {
          builder
            .addCase(ogretmenlerGetir.pending, (state) => {
              state.yukleniyor = true;
              state.listeHata = "";
            })
            .addCase(ogretmenlerGetir.fulfilled, (state, action) => {
              state.liste = action.payload;
              state.yukleniyor = false;
            })
            .addCase(ogretmenlerGetir.rejected, (state, action) => {
              state.yukleniyor = false;
              state.listeHata = (action.payload as string) ?? "Öğretmen listesi yüklenemedi.";
            })
            // --- sinifKaydet ---
            .addCase(ogretmenKaydet.pending, (state) => {
              state.kaydediliyor = true;
              state.hata = "";
            })
            .addCase(ogretmenKaydet.fulfilled, (state, action) => {
              const { kaydedilenOgretmen, duzenlemeModu } = action.payload;
              if (duzenlemeModu) {
                state.liste = state.liste.map((ogretmen) =>
                  ogretmen.id === kaydedilenOgretmen.id ? kaydedilenOgretmen : ogretmen
                );
              } else {
                state.liste.push(kaydedilenOgretmen);
              }
              state.duzenlenenOgretmenId = null;
              state.kaydediliyor = false;
            })
            .addCase(ogretmenKaydet.rejected, (state, action) => {
              state.kaydediliyor = false;
              state.hata = (action.payload as string) ?? "Öğretmen kaydedilemedi. Lütfen tekrar deneyin.";
            })
            // --- sinifSil ---
            .addCase(ogretmenSil.fulfilled, (state, action) => {
              state.liste = state.liste.filter((ogretmen) => ogretmen.id !== action.payload);
            });
          // Not: sinifSil.rejected'i kasıtlı olarak eski davranışla aynı tutuyoruz
          // (context'teki gibi sadece alert ile bildiriliyor, ayrıca state tutmuyoruz).
        },
      });
      
      export const { duzenlemeyeBaslaogr, duzenlemeyiIptalEt } = ogretmenlerSlice.actions;
      export default ogretmenlerSlice.reducer;