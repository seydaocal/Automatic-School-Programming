"use client";

import { useEffect } from "react";
import { OgretmenTablosu } from "@/components/forms/tablolar";
import { OgretmenForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  ogretmenlerGetir,
  ogretmenKaydet,
  ogretmenSil,
  duzenlemeyeBaslaogr,
  duzenlemeyiIptalEt,
} from "@/lib/redux/slices/ogretmenlerSlice";
import type { Ogretmen } from "@/types";

export default function YonetimOgretmenlerPage() {
  const { secilenOkul } = useOkulContext();

  const dispatch = useAppDispatch();
  const {
    liste: ogretmenlerListesi,
    yukleniyor: ogretmenlerYukleniyor,
    listeHata: ogretmenListeHata,
    duzenlenenOgretmenId,
    kaydediliyor: ogretmenKaydediliyor,
    hata: ogretmenHata,
  } = useAppSelector((state) => state.ogretmenler);

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(ogretmenlerGetir(secilenOkul.id));
    }
  }, [secilenOkul, dispatch]);

  const duzenlenen: Ogretmen | null =
      duzenlenenOgretmenId !== null
        ? ogretmenlerListesi.find((ogretmen) => ogretmen.id === duzenlenenOgretmenId) ?? null
        : null;
  
    async function handleKaydet(veri: Partial<Ogretmen>) {
      if (!secilenOkul?.id) return;
      await dispatch(
        ogretmenKaydet({ veri, okulId: secilenOkul.id, duzenlenenId: duzenlenenOgretmenId })
      );
    }
  
    function handleSil(id: number) {
      if (!confirm("Bu öğretmeni silmek istediğinize emin misiniz?")) return;
      dispatch(ogretmenSil(id));
    }
  

  return (
    <>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Öğretmenler</h2>
<div className="form-card max-w-full">
      <OgretmenForm
        onKaydet={handleKaydet}
        duzenlenen={duzenlenen} />

      {ogretmenKaydediliyor && <p className="form-kaydet">Kaydediliyor...</p>}
      {ogretmenHata && <p role="alert" className="form-alert">{ogretmenHata}</p>}

      {duzenlenenOgretmenId !== null && (
        <button className="form-btn mt-4 " 
        type="button" 
        onClick={() => dispatch(duzenlemeyiIptalEt())}>
          Vazgeç
        </button>
      )}

      {ogretmenlerYukleniyor && <p className="form-kaydet">Yükleniyor...</p>}
      {ogretmenListeHata && <p role="alert" className="form-alert">{ogretmenListeHata}</p>}

      {!ogretmenlerYukleniyor && !ogretmenListeHata && (
        <OgretmenTablosu
          ogretmenlerListesi={ogretmenlerListesi}
          duzenlemeyeBaslaogr={(ogretmen) => dispatch(duzenlemeyeBaslaogr(ogretmen))}
          ogretmenSil={handleSil}
          setSecilenOgretmenId={() => {}}
          setIsSaved={() => {}}
        />
      )}
      </div>
    </div>
    </>
  );
}