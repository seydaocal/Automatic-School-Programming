import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { DersUcreti } from "@/types";

interface UcretState {
  liste: DersUcreti[];
  yukleniyor: boolean;
  listeHata: string;
  duzenlenenUcretId: number | null;
  kaydediliyor: boolean;
  hata: string;
}

const initialState: UcretState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  duzenlenenUcretId: null,
  kaydediliyor: false,
  hata: "",
};

export const ucretlerGetir = createAsyncThunk(
  "ucret/getir",
  async (okulId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/ders-ucreti?okul_id=${okulId}`);
    if (!response.ok) {
      return rejectWithValue("Ders ücreti listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as DersUcreti[];
  }
);

export const ucretKaydet = createAsyncThunk(
  "ucret/kaydet",
  async (
    payload: { veri: Partial<DersUcreti>; okulId: number; duzenlenenId: number | null },
    { rejectWithValue }
  ) => {
    const { veri, okulId, duzenlenenId } = payload;
    const duzenlemeModu = duzenlenenId !== null;

    const response = await fetch("/api/ders-ucreti", {
      method: duzenlemeModu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(duzenlemeModu ? { id: duzenlenenId } : {}),
        okulId,
        ders_id: veri.ders_id,
        saatlik_ucret: veri.saatlik_ucret,
        aylik_ucret: veri.aylik_ucret,
      }),
    });

    const sonuc = await response.json();
    if (!response.ok || !sonuc.success) {
      return rejectWithValue(sonuc.error || "Ders ücreti kaydedilemedi.");
    }

    const kaydedilenUcret: DersUcreti = {
      id: sonuc.data.id,
      okul_id: okulId,
      ders_id: veri.ders_id!,
      saatlik_ucret: veri.saatlik_ucret!,
      aylik_ucret: veri.aylik_ucret ?? null,
    };

    return { kaydedilenUcret, duzenlemeModu };
  }
);

export const ucretSil = createAsyncThunk(
  "ucret/sil",
  async (id: number, { rejectWithValue }) => {
    const response = await fetch("/api/ders-ucreti", {
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

const ucretSlice = createSlice({
  name: "ucret",
  initialState,
  reducers: {
    duzenlemeyeBaslaUcret(state, action: { payload: DersUcreti }) {
      state.duzenlenenUcretId = action.payload.id;
    },
    duzenlemeyiIptalEt(state) {
      state.duzenlenenUcretId = null;
      state.hata = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // --- ucretlerGetir ---
      .addCase(ucretlerGetir.pending, (state) => {
        state.yukleniyor = true;
        state.listeHata = "";
      })
      .addCase(ucretlerGetir.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(ucretlerGetir.rejected, (state, action) => {
        state.yukleniyor = false;
        state.listeHata = (action.payload as string) ?? "Ders ücreti listesi yüklenemedi.";
      })
      // --- ucretKaydet ---
      .addCase(ucretKaydet.pending, (state) => {
        state.kaydediliyor = true;
        state.hata = "";
      })
      .addCase(ucretKaydet.fulfilled, (state, action) => {
        const { kaydedilenUcret, duzenlemeModu } = action.payload;
        if (duzenlemeModu) {
          state.liste = state.liste.map((ucret) =>
            ucret.id === kaydedilenUcret.id ? kaydedilenUcret : ucret
          );
        } else {
          state.liste.push(kaydedilenUcret);
        }
        state.duzenlenenUcretId = null;
        state.kaydediliyor = false;
      })
      .addCase(ucretKaydet.rejected, (state, action) => {
        state.kaydediliyor = false;
        state.hata = (action.payload as string) ?? "Ders ücreti kaydedilemedi. Lütfen tekrar deneyin.";
      })
      // --- ucretSil ---
      .addCase(ucretSil.fulfilled, (state, action) => {
        state.liste = state.liste.filter((ucret) => ucret.id !== action.payload);
      });
  },
});

export const { duzenlemeyeBaslaUcret, duzenlemeyiIptalEt } = ucretSlice.actions;
export default ucretSlice.reducer;