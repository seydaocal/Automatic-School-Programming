import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Ders, DersKayit } from "@/types";

interface DerslerState {
  liste: Ders[];
  yukleniyor: boolean;
  listeHata: string;
  duzenlenenDersId: number | null;
  kaydediliyor: boolean;
  hata: string;
}

const initialState: DerslerState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  duzenlenenDersId: null,
  kaydediliyor: false,
  hata: "",
};

export const derslerGetir = createAsyncThunk(
  "dersler/getir",
  async (okulId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/dersler?okul_id=${okulId}`);
    if (!response.ok) {
      return rejectWithValue("Ders listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as Ders[];
  }
);

export const dersKaydet = createAsyncThunk(
  "dersler/kaydet",
  async (
    payload: { veri: Partial<DersKayit>; okulId: number; duzenlenenId: number | null },
    { rejectWithValue }
  ) => {
    const { veri, okulId, duzenlenenId } = payload;
    const duzenlemeModu = duzenlenenId !== null;

    const response = await fetch("/api/dersler", {
      method: duzenlemeModu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(duzenlemeModu ? { id: duzenlenenId } : {}),
        okulId,
        ad: veri.ad,
        seviye: veri.seviye,
        saat: veri.saat,
      }),
    });

    const sonuc = await response.json();
    if (!response.ok || !sonuc.success) {
      return rejectWithValue(sonuc.error || "Ders kaydedilemedi.");
    }

    const kaydedilenDers: Ders = {
      id: sonuc.data.id,
      ad: veri.ad!,
      seviye: veri.seviye!,
      saat: veri.saat!,
    };

    return { kaydedilenDers, duzenlemeModu };
  }
);

export const dersSil = createAsyncThunk(
  "dersler/sil",
  async (id: number, { rejectWithValue }) => {
    const response = await fetch("/api/dersler", {
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

const dersSlice = createSlice({
  name: "dersler",
  initialState,
  reducers: {
    duzenlemeyeBasladers(state, action: { payload: Ders }) {
      state.duzenlenenDersId = action.payload.id;
    },
    duzenlemeyiIptalEt(state) {
      state.duzenlenenDersId = null;
      state.hata = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // --- derslerGetir ---
      .addCase(derslerGetir.pending, (state) => {
        state.yukleniyor = true;
        state.listeHata = "";
      })
      .addCase(derslerGetir.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(derslerGetir.rejected, (state, action) => {
        state.yukleniyor = false;
        state.listeHata = (action.payload as string) ?? "Ders listesi yüklenemedi.";
      })
      // --- dersKaydet ---
      .addCase(dersKaydet.pending, (state) => {
        state.kaydediliyor = true;
        state.hata = "";
      })
      .addCase(dersKaydet.fulfilled, (state, action) => {
        const { kaydedilenDers, duzenlemeModu } = action.payload;
        if (duzenlemeModu) {
          state.liste = state.liste.map((ders) =>
            ders.id === kaydedilenDers.id ? kaydedilenDers : ders
          );
        } else {
          state.liste.push(kaydedilenDers);
        }
        state.duzenlenenDersId = null;
        state.kaydediliyor = false;
      })
      .addCase(dersKaydet.rejected, (state, action) => {
        state.kaydediliyor = false;
        state.hata = (action.payload as string) ?? "Ders kaydedilemedi. Lütfen tekrar deneyin.";
      })
      // --- dersSil ---
      .addCase(dersSil.fulfilled, (state, action) => {
        state.liste = state.liste.filter((ders) => ders.id !== action.payload);
      });
  },
});

export const { duzenlemeyeBasladers, duzenlemeyiIptalEt } = dersSlice.actions;
export default dersSlice.reducer;