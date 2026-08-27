"use client";

import { useEffect} from "react";
import { OkulTablosu } from "@/components/forms/tablolar";
import { OkulForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  okullariGetir,
  okulKaydet,
  okulSil,
  duzenlemeyeBaslaOkul,
  duzenlemeyiIptalEt,
} from "@/lib/redux/slices/okulSlice";
import type { Okul } from "@/types";

export default function YonetimOkulPage() {
  const { secilenOkul } = useOkulContext();

  const dispatch = useAppDispatch();
  const {
    liste: okullarListesi,
    yukleniyor: okullarYukleniyor,
    listeHata: okulListeHata,
    duzenlenenOkulId,
    kaydediliyor: okulKaydediliyor,
    hata: okulHata,
  } = useAppSelector((state) => state.okul);

  useEffect(() => {
      dispatch(okullariGetir());
    }, [dispatch]);
  
    const duzenlenen: Okul | null =
      duzenlenenOkulId !== null
        ? okullarListesi.find((okul) => okul.id === duzenlenenOkulId) ?? null
        : null;
  
    async function handleKaydet(veri: Partial<Okul>) {
      await dispatch(okulKaydet({ veri, duzenlenenId: duzenlenenOkulId }));
    }
  
    function handleSil(id: number) {
      if (!confirm("Bu okulu silmek istediğinize emin misiniz?")) return;
      dispatch(okulSil(id));
    }
 
  return (
    <>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Okul</h2>

      <div className="form-card max-w-full">
        <p className="bilgi-tb">
        Okul bilgileri: {secilenOkul?.ad}, {secilenOkul?.il} / {secilenOkul?.ilce}
      </p>
      </div>
    </div>
    </>
  );
}