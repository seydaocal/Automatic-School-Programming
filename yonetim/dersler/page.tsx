"use client";

import { useEffect } from "react";
import { DersTablosu } from "@/components/forms/tablolar";
import { DerslerForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  derslerGetir,
  dersKaydet,
  dersSil,
  duzenlemeyeBasladers,
  duzenlemeyiIptalEt,
} from "@/lib/redux/slices/derslerSlice";
import type { Ders } from "@/types";

export default function YonetimDerslerPage() {
  const { secilenOkul } = useOkulContext();

  const dispatch = useAppDispatch();
  const {
    liste: derslerListesi,
    yukleniyor: derslerYukleniyor,
    listeHata: dersListeHata,
    duzenlenenDersId,
    kaydediliyor: dersKaydediliyor,
    hata: dersHata,
  } = useAppSelector((state) => state.dersler);

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(derslerGetir(secilenOkul.id));
    }
  }, [secilenOkul, dispatch]);

  const duzenlenen: Ders | null =
    duzenlenenDersId !== null
      ? derslerListesi.find((ders) => ders.id === duzenlenenDersId) ?? null
      : null;

  async function handleKaydet(veri: Partial<Ders>) {
    if (!secilenOkul?.id) return;
    await dispatch(dersKaydet({ veri, okulId: secilenOkul.id, duzenlenenId: duzenlenenDersId }));
  }

  function handleSil(id: number) {
    if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
    dispatch(dersSil(id));
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Dersler</h2>

        <div className="form-card max-w-full">
          <DerslerForm onKaydet={handleKaydet} duzenlenen={duzenlenen} />

          {dersKaydediliyor && <p className="form-kaydet">Kaydediliyor...</p>}
          {dersHata && <p role="alert" className="form-alert">{dersHata}</p>}

          {duzenlenenDersId !== null && (
            <button
              className="form-btn mt-4"
              type="button"
              onClick={() => dispatch(duzenlemeyiIptalEt())}
            >
              Vazgeç
            </button>
          )}
        </div>

        <div className="form-card max-w-full overflow-hidden">
          {derslerYukleniyor && <p className="form-kaydet">Yükleniyor...</p>}
          {dersListeHata && <p role="alert" className="form-alert">{dersListeHata}</p>}

          {!derslerYukleniyor && !dersListeHata && (
            <DersTablosu
              derslerListesi={derslerListesi}
              duzenlemeyeBasladers={(ders) => dispatch(duzenlemeyeBasladers(ders))}
              dersSil={handleSil}
              setSecilenDersId={() => {}}
              setIsSaved={() => {}}
            />
          )}
        </div>
      </div>
    </>
  );
}