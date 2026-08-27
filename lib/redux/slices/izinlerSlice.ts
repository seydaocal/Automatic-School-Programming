import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { OgretmenIzni } from "@/types";

interface IzinlerState {
  liste: OgretmenIzni[];
  yukleniyor: boolean;
  listeHata: string;
  duzenlenenIzinId: number | null;
  kaydediliyor: boolean;
  hata: string;
}

const initialState: IzinlerState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  duzenlenenIzinId: null,
  kaydediliyor: false,
  hata: "",
};

export const izinlerGetir = createAsyncThunk(
  "izinler/getir",
  async (okulId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/izinler?okul_id=${okulId}`);
    if (!response.ok) {
      return rejectWithValue("İzin listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as OgretmenIzni[];
  }
);

export const izinKaydet = createAsyncThunk(
  "izinler/kaydet",
  async (
    payload: { veri: Partial<OgretmenIzni>; okulId: number | null; duzenlenenId: number | null },
    { rejectWithValue }
  ) => {
    const { veri, okulId, duzenlenenId } = payload;
    const duzenlemeModu = duzenlenenId !== null;

    const response = await fetch("/api/izinler", {
      method: duzenlemeModu ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(duzenlemeModu ? { id: duzenlenenId } : {}),
        okulId: okulId ?? null,
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
      return rejectWithValue(sonuc.error || "İzin kaydedilemedi.");
    }

    const kaydedilenIzin: OgretmenIzni = {
      id: sonuc.data.id,
      okul_id: okulId ?? null,
      ogretmen_id: veri.ogretmen_id!,
      gun_no: veri.gun_no!,
      tarih: veri.tarih ?? null,
      baslangic_saati: veri.baslangic_saati!,
      bitis_saati: veri.bitis_saati!,
      aciklama: veri.aciklama ?? null,
      onaylandi: veri.onaylandi ?? false,
    };

    return { kaydedilenIzin, duzenlemeModu };
  }
);

export const izinSil = createAsyncThunk(
  "izinler/sil",
  async (id: number, { rejectWithValue }) => {
    const response = await fetch("/api/izinler", {
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

export const izinOnaylama = createAsyncThunk(
  "izinler/onayla",
  async (izinId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/izinler/${izinId}/onayla`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    const sonuc = await response.json();
    if (!response.ok || !sonuc.success) {
      return rejectWithValue(sonuc.error || "Onaylanamadı.");
    }
    return izinId;
  }
);

const izinlerSlice = createSlice({
  name: "izinler",
  initialState,
  reducers: {
    duzenlemeyeBaslaIzin(state, action: { payload: OgretmenIzni }) {
      state.duzenlenenIzinId = action.payload.id;
    },
    duzenlemeyiIptalEt(state) {
      state.duzenlenenIzinId = null;
      state.hata = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // --- izinlerGetir ---
      .addCase(izinlerGetir.pending, (state) => {
        state.yukleniyor = true;
        state.listeHata = "";
      })
      .addCase(izinlerGetir.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(izinlerGetir.rejected, (state, action) => {
        state.yukleniyor = false;
        state.listeHata = (action.payload as string) ?? "İzin listesi yüklenemedi.";
      })
      // --- izinKaydet ---
      .addCase(izinKaydet.pending, (state) => {
        state.kaydediliyor = true;
        state.hata = "";
      })
      .addCase(izinKaydet.fulfilled, (state, action) => {
        const { kaydedilenIzin, duzenlemeModu } = action.payload;
        if (duzenlemeModu) {
          state.liste = state.liste.map((izin) =>
            izin.id === kaydedilenIzin.id ? kaydedilenIzin : izin
          );
        } else {
          state.liste.push(kaydedilenIzin);
        }
        state.duzenlenenIzinId = null;
        state.kaydediliyor = false;
      })
      .addCase(izinKaydet.rejected, (state, action) => {
        state.kaydediliyor = false;
        state.hata = (action.payload as string) ?? "İzin kaydedilemedi. Lütfen tekrar deneyin.";
      })
      // --- izinSil ---
      .addCase(izinSil.fulfilled, (state, action) => {
        state.liste = state.liste.filter((izin) => izin.id !== action.payload);
      })
      // --- izinOnaylama ---
      .addCase(izinOnaylama.fulfilled, (state, action) => {
        const izin = state.liste.find((i) => i.id === action.payload);
        if (izin) izin.onaylandi = true;
      });
  },
});

export const { duzenlemeyeBaslaIzin, duzenlemeyiIptalEt } = izinlerSlice.actions;
export default izinlerSlice.reducer;