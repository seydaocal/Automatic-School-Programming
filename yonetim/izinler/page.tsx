"use client";

import { useEffect } from "react";
import { OgretmenIzinTablosu } from "@/components/forms/tablolar";
import { OgretmenIzinForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { ogretmenlerGetir } from "@/lib/redux/slices/ogretmenlerSlice";
import {
  izinlerGetir,
  izinKaydet,
  izinSil,
  izinOnaylama,
  duzenlemeyeBaslaIzin,
  duzenlemeyiIptalEt,
} from "@/lib/redux/slices/izinlerSlice";
import type { OgretmenIzni } from "@/types";

export default function YonetimIzinlerPage() {
  // secilenOkul hâlâ eski context'ten geliyor.
  const { secilenOkul } = useOkulContext();

  const dispatch = useAppDispatch();
  const {
    liste: izinlerListesi,
    yukleniyor: izinlerYukleniyor,
    listeHata: izinListeHata,
    duzenlenenIzinId,
    kaydediliyor: izinKaydediliyor,
    hata: izinHata,
  } = useAppSelector((state) => state.izinler);
  const { liste: ogretmenlerListesi } = useAppSelector((state) => state.ogretmenler);

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(izinlerGetir(secilenOkul.id));
      if (ogretmenlerListesi.length === 0) dispatch(ogretmenlerGetir(secilenOkul.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secilenOkul, dispatch]);

  const duzenlenen: OgretmenIzni | null =
    duzenlenenIzinId !== null
      ? izinlerListesi.find((izin) => izin.id === duzenlenenIzinId) ?? null
      : null;

  async function handleKaydet(veri: Partial<OgretmenIzni>) {
    await dispatch(
      izinKaydet({ veri, okulId: secilenOkul?.id ?? null, duzenlenenId: duzenlenenIzinId })
    );
  }

  function handleSil(id: number) {
    if (!confirm("Bu izin kaydını silmek istediğinize emin misiniz?")) return;
    dispatch(izinSil(id));
  }

  function handleOnaylama(izin: OgretmenIzni) {
    dispatch(izinOnaylama(izin.id));
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Öğretmen İzinleri</h2>

        <div className="form-card w-full">
          <OgretmenIzinForm
            onKaydet={handleKaydet}
            ogretmenlerListesi={ogretmenlerListesi}
            duzenlenen={duzenlenen}
          />

          {izinKaydediliyor && <p className="form-kaydet">Kaydediliyor...</p>}
          {izinHata && <p role="alert" className="form-alert">{izinHata}</p>}

          {duzenlenenIzinId !== null && (
            <button
              className="form-btn mt-4"
              type="button"
              onClick={() => dispatch(duzenlemeyiIptalEt())}
            >
              Vazgeç
            </button>
          )}

          {izinlerYukleniyor && <p className="form-kaydet">Yükleniyor...</p>}
          {izinListeHata && <p role="alert" className="form-alert">{izinListeHata}</p>}

          {!izinlerYukleniyor && !izinListeHata && (
            <OgretmenIzinTablosu
              izinlerListesi={izinlerListesi}
              ogretmenlerListesi={ogretmenlerListesi}
              duzenlemeyeBaslaIzin={(izin) => dispatch(duzenlemeyeBaslaIzin(izin))}
              izinSil={handleSil}
              izinOnaylama={handleOnaylama}
            />
          )}
        </div>
      </div>
    </>
  );
}