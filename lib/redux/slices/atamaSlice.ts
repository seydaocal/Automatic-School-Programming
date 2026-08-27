import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Atama } from "@/types";
import type { RootState } from "@/lib/redux/store";

interface AtamaState {
  liste: Atama[];
  yukleniyor: boolean;
  listeHata: string;
  secilenDersId: string;
  secilenOgretmenId: string;
  duzenlenenAtamaId: number | null;
  hata: string;
}

const initialState: AtamaState = {
  liste: [],
  yukleniyor: false,
  listeHata: "",
  secilenDersId: "",
  secilenOgretmenId: "",
  duzenlenenAtamaId: null,
  hata: "",
};

export const atamalarGetir = createAsyncThunk(
  "atama/getir",
  async (okulId: number, { rejectWithValue }) => {
    const response = await fetch(`/api/atama?okul_id=${okulId}`);
    if (!response.ok) {
      return rejectWithValue("Atama listesi yüklenemedi.");
    }
    const sonuc = await response.json();
    return (sonuc.data ?? []) as Atama[];
  }
);

export const atamaEkle = createAsyncThunk<
  { kaydedilenAtama: Atama; duzenlemeModu: boolean } | undefined,
  number,
  { state: RootState }
>("atama/ekle", async (okulId, { getState, rejectWithValue }) => {
  const { secilenDersId, secilenOgretmenId, duzenlenenAtamaId } = getState().atama;

  if (!secilenDersId || !secilenOgretmenId) {
    return undefined;
  }

  const duzenlemeModu = duzenlenenAtamaId !== null;

  const response = await fetch("/api/atama", {
    method: duzenlemeModu ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(duzenlemeModu ? { id: duzenlenenAtamaId } : {}),
      ders_id: secilenDersId,
      ogretmen_id: secilenOgretmenId,
      okulId,
    }),
  });

  const sonuc = await response.json();
  if (!response.ok || !sonuc.success) {
    return rejectWithValue(sonuc.error || "Atama kaydedilemedi.");
  }

  const kaydedilenAtama: Atama = {
    id: sonuc.data.id,
    ders_id: Number(secilenDersId),
    ogretmen_id: Number(secilenOgretmenId),
  };

  return { kaydedilenAtama, duzenlemeModu };
});

// DELETE için alan adı bilerek "atamaId" — daha önce "id" gönderildiğinde
// /api/atama'nın 400 döndüğü hatayı burada tekrar yaşamamak için.
export const atamaSil = createAsyncThunk<
  number,
  { id: number; okulId: number },
  { rejectValue: string }
>("atama/sil", async ({ id, okulId }, { rejectWithValue }) => {
  const response = await fetch("/api/atama", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ atamaId: id, okulId }),
  });
  const sonuc = await response.json();
  if (!response.ok || !sonuc.success) {
    return rejectWithValue(sonuc.error || "Silinemedi.");
  }
  return id;
});

const atamaSlice = createSlice({
  name: "atama",
  initialState,
  reducers: {
    setSecilenDersId(state, action: { payload: string }) {
      state.secilenDersId = action.payload;
    },
    setSecilenOgretmenId(state, action: { payload: string }) {
      state.secilenOgretmenId = action.payload;
    },
    duzenlemeyeBaslaatama(state, action: { payload: Atama }) {
      state.duzenlenenAtamaId = action.payload.id;
      state.secilenDersId = String(action.payload.ders_id);
      state.secilenOgretmenId = String(action.payload.ogretmen_id);
    },
    duzenlemeyiIptalEt(state) {
      state.duzenlenenAtamaId = null;
      state.secilenDersId = "";
      state.secilenOgretmenId = "";
      state.hata = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // --- atamalarGetir ---
      .addCase(atamalarGetir.pending, (state) => {
        state.yukleniyor = true;
        state.listeHata = "";
      })
      .addCase(atamalarGetir.fulfilled, (state, action) => {
        state.liste = action.payload;
        state.yukleniyor = false;
      })
      .addCase(atamalarGetir.rejected, (state, action) => {
        state.yukleniyor = false;
        state.listeHata = (action.payload as string) ?? "Atama listesi yüklenemedi.";
      })
      // --- atamaEkle ---
      .addCase(atamaEkle.pending, (state) => {
        state.hata = "";
      })
      .addCase(atamaEkle.fulfilled, (state, action) => {
        if (!action.payload) return; // secilenDersId/secilenOgretmenId boştu, sessizce çıkıldı
        const { kaydedilenAtama, duzenlemeModu } = action.payload;
        if (duzenlemeModu) {
          state.liste = state.liste.map((atama) =>
            atama.id === kaydedilenAtama.id ? kaydedilenAtama : atama
          );
        } else {
          state.liste.push(kaydedilenAtama);
        }
        state.duzenlenenAtamaId = null;
        state.secilenDersId = "";
        state.secilenOgretmenId = "";
      })
      .addCase(atamaEkle.rejected, (state, action) => {
        state.hata = (action.payload as string) ?? "Atama kaydedilemedi. Lütfen tekrar deneyin.";
      })
      // --- atamaSil ---
      .addCase(atamaSil.fulfilled, (state, action) => {
        state.liste = state.liste.filter((atama) => atama.id !== action.payload);
      });
  },
});

export const { setSecilenDersId, setSecilenOgretmenId, duzenlemeyeBaslaatama, duzenlemeyiIptalEt } =
  atamaSlice.actions;
export default atamaSlice.reducer;