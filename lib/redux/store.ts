import { configureStore } from "@reduxjs/toolkit";
import siniflarReducer from "./slices/siniflarSlice";
import ogretmenlerReducer from "./slices/ogretmenlerSlice";
import derslerReducer from "./slices/derslerSlice";
import atamaReducer from "./slices/atamaSlice";
import ucretReducer from "./slices/ucretSlice";
import okulReducer from "./slices/okulSlice";
import izinlerReducer from "./slices/izinlerSlice";
import dersSaatleriReducer from "./slices/dersSaatleriSlice";
import dersProgramiReducer from "./slices/dersProgramiSlice";

export const store = configureStore({
  reducer: {
    siniflar: siniflarReducer,
    dersler: derslerReducer,
    ogretmenler: ogretmenlerReducer,
    atama: atamaReducer,
    dersProgrami: dersProgramiReducer,
    izinler: izinlerReducer,
    ucret: ucretReducer,
    dersSaatleri: dersSaatleriReducer,
    okul: okulReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;