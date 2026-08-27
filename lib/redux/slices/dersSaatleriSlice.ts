import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { DersBaslangicSaati } from "@/types";

interface DersSaatleriState {
  baslangicSaatleri: DersBaslangicSaati[];
  haftaBaslangici: string;
}

function buHaftaninPazartesi(): string {
  const bugun = new Date();
  const gun = bugun.getDay(); 
  const pazartesiyeFark = gun === 0 ? -6 : 1 - gun;
  const pazartesi = new Date(bugun);
  pazartesi.setDate(bugun.getDate() + pazartesiyeFark);
  const yyyy = pazartesi.getFullYear();
  const mm = String(pazartesi.getMonth() + 1).padStart(2, "0");
  const dd = String(pazartesi.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const initialState: DersSaatleriState = {
  baslangicSaatleri: [],
  haftaBaslangici: buHaftaninPazartesi(),
};

export const baslangicSaatleriGetir = createAsyncThunk(
  "dersSaatleri/getir",
  async (okulId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/ders-baslangic-saatleri?okul_id=${okulId}`);
      if (!response.ok) return rejectWithValue(null);
      const sonuc = await response.json();
      return (sonuc.kayitlar ?? []) as DersBaslangicSaati[];
    } catch (error) {
      console.error("Ders başlangıç saatleri getirilirken hata:", error);
      return rejectWithValue(null);
    }
  }
);

const dersSaatleriSlice = createSlice({
  name: "dersSaatleri",
  initialState,
  reducers: {
    setBaslangicSaatleri(state, action: PayloadAction<DersBaslangicSaati[]>) {
      state.baslangicSaatleri = action.payload;
    },
    setHaftaBaslangici(state, action: PayloadAction<string>) {
      state.haftaBaslangici = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(baslangicSaatleriGetir.fulfilled, (state, action) => {
      state.baslangicSaatleri = action.payload;
    });
  },
});

export const { setBaslangicSaatleri, setHaftaBaslangici } = dersSaatleriSlice.actions;
export default dersSaatleriSlice.reducer;