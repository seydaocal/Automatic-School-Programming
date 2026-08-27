import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Sinif, SinifKayit } from "@/types";

interface SiniflarState {
  liste: Sinif[];
  yukleniyor: boolean;
  listeHata: string;
  duzenlenenSinifId: number | null;
  kaydediliyor: boolean;
  hata: string;
}

const initialState: SiniflarState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  duzenlenenSinifId: null,
  kaydediliyor: false,
  hata: "",
};

export const siniflarGetir = createAsyncThunk(
  "siniflar/getir",
  async (okulId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/siniflar?okul_id=${okulId}`);
    if (!response.ok) {
      return rejectWithValue("Sınıf listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as Sinif[];
  }
);

export const sinifKaydet = createAsyncThunk(
  "siniflar/kaydet",
  async (
    payload: { veri: Partial<SinifKayit>; okulId: number; duzenlenenId: number | null },
    { rejectWithValue }
  ) => {
    const { veri, okulId, duzenlenenId } = payload;
    const duzenlemeModu = duzenlenenId !== null;

    const response = await fetch("/api/siniflar", {
      method: duzenlemeModu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(duzenlemeModu ? { id: duzenlenenId } : {}),
        seviye: veri.seviye,
        sube: veri.sube,
        okulId,
      }),
    });

    const sonuc = await response.json();
    if (!response.ok || !sonuc.success) {
      return rejectWithValue(sonuc.error || "Sınıf kaydedilemedi.");
    }

    const kaydedilenSinif: Sinif = {
      id: sonuc.data.id,
      seviye: veri.seviye!,
      sube: veri.sube!,
    };

    return { kaydedilenSinif, duzenlemeModu };
  }
);

export const sinifSil = createAsyncThunk(
  "siniflar/sil",
  async (id: number, { rejectWithValue }) => {
    const response = await fetch("/api/siniflar", {
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

const siniflarSlice = createSlice({
  name: "siniflar",
  initialState,
  reducers: {
    // Eski context'teki setDuzenlenenSinifId'nin karşılığı — senkron, thunk gerekmez.
    duzenlemeyeBaslaSinif(state, action: { payload: Sinif }) {
      state.duzenlenenSinifId = action.payload.id;
    },
    duzenlemeyiIptalEt(state) {
      state.duzenlenenSinifId = null;
      state.hata = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // --- siniflarGetir ---
      .addCase(siniflarGetir.pending, (state) => {
        state.yukleniyor = true;
        state.listeHata = "";
      })
      .addCase(siniflarGetir.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(siniflarGetir.rejected, (state, action) => {
        state.yukleniyor = false;
        state.listeHata = (action.payload as string) ?? "Sınıf listesi yüklenemedi.";
      })
      // --- sinifKaydet ---
      .addCase(sinifKaydet.pending, (state) => {
        state.kaydediliyor = true;
        state.hata = "";
      })
      .addCase(sinifKaydet.fulfilled, (state, action) => {
        const { kaydedilenSinif, duzenlemeModu } = action.payload;
        if (duzenlemeModu) {
          state.liste = state.liste.map((sinif) =>
            sinif.id === kaydedilenSinif.id ? kaydedilenSinif : sinif
          );
        } else {
          state.liste.push(kaydedilenSinif);
        }
        state.duzenlenenSinifId = null;
        state.kaydediliyor = false;
      })
      .addCase(sinifKaydet.rejected, (state, action) => {
        state.kaydediliyor = false;
        state.hata = (action.payload as string) ?? "Sınıf kaydedilemedi. Lütfen tekrar deneyin.";
      })
      // --- sinifSil ---
      .addCase(sinifSil.fulfilled, (state, action) => {
        state.liste = state.liste.filter((sinif) => sinif.id !== action.payload);
      });
    // Not: sinifSil.rejected'i kasıtlı olarak eski davranışla aynı tutuyoruz
    // (context'teki gibi sadece alert ile bildiriliyor, ayrıca state tutmuyoruz).
  },
});

export const { duzenlemeyeBaslaSinif, duzenlemeyiIptalEt } = siniflarSlice.actions;
export default siniflarSlice.reducer;