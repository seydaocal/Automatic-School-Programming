"use client";

import { useEffect } from "react";
import { DersUcretiTablosu } from "@/components/forms/tablolar";
import { DersUcretiForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { derslerGetir } from "@/lib/redux/slices/derslerSlice";
import {
    ucretKaydet,
    ucretSil,
    duzenlemeyeBaslaUcret,
    ucretlerGetir,
    duzenlemeyiIptalEt,
} from "@/lib/redux/slices/ucretSlice";
import type { DersUcreti } from "@/types";

export default function YonetimDersUcretiPage() {
  const {secilenOkul} = useOkulContext();

  const dispatch = useAppDispatch();
  const {
    liste: ucretlerListesi,
    yukleniyor: ucretlerYukleniyor,
    listeHata: ucretListeHata,
    duzenlenenUcretId,
    kaydediliyor: ucretKaydediliyor,
    hata: ucretHata,
  } = useAppSelector((state) => state.ucret);

 const { liste: derslerListesi } = useAppSelector((state) => state.dersler);

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(ucretlerGetir(secilenOkul.id));
      if (derslerListesi.length === 0) dispatch(derslerGetir(secilenOkul.id));
    }
  }, [secilenOkul, dispatch]);

  const duzenlenen: DersUcreti | null =
      duzenlenenUcretId !== null
        ? ucretlerListesi.find((ucret) => ucret.id === duzenlenenUcretId) ?? null
        : null;
  
    async function handleKaydet(veri: Partial<DersUcreti>) {
      if (!secilenOkul?.id) return;
      await dispatch(
        ucretKaydet({ veri, okulId: secilenOkul.id, duzenlenenId: duzenlenenUcretId }));
    }
  
    function handleSil(id: number) {
      if (!confirm("Bu ders ücretini silmek istediğinize emin misiniz?")) return;
      dispatch(ucretSil(id));
    }

  return (
    <>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Ders Ücretleri</h2>

      <div className="form-card max-w-full">
      <DersUcretiForm
        onKaydet={handleKaydet}
        derslerListesi={derslerListesi}
        duzenlenen={duzenlenen}
      />

      {ucretKaydediliyor && <p className="form-kaydet">Kaydediliyor...</p>}
      {ucretHata && <p role="alert" className="form-alert">{ucretHata}</p>}

      {duzenlenenUcretId !== null && (
        <button className="form-btn mt-4" 
        type="button" 
        onClick={() => dispatch(duzenlemeyiIptalEt())}>
          Vazgeç
        </button>
      )}

      {ucretlerYukleniyor && <p className="form-kaydet">Yükleniyor...</p>}
      {ucretListeHata && <p role="alert" className="form-alert">{ucretListeHata}</p>}

      {!ucretlerYukleniyor && !ucretListeHata && (
        <DersUcretiTablosu
          ucretlerListesi={ucretlerListesi}
          derslerListesi={derslerListesi}
          duzenlemeyeBaslaUcret={(ucret) => dispatch(duzenlemeyeBaslaUcret (ucret))}
          ucretSil={handleSil}
        />
      )}
      </div>
    </div>
    </>
  );
}