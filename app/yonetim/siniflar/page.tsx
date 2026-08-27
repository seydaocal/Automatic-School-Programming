"use client";

import { useEffect } from "react";
import { SinifTablosu } from "@/components/forms/tablolar";
import { SinifForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  siniflarGetir,
  sinifKaydet,
  sinifSil,
  duzenlemeyeBaslaSinif,
  duzenlemeyiIptalEt,
} from "@/lib/redux/slices/siniflarSlice";
import type { Sinif } from "@/types";

export default function YonetimSiniflarPage() {
  // secilenOkul hâlâ eski context'ten geliyor — okul seçimi henüz Redux'a
  // taşınmadı, o yüzden bu context sağlıklı çalışmaya devam ediyor.
  const { secilenOkul } = useOkulContext();

  const dispatch = useAppDispatch();
  const {
    liste: siniflarListesi,
    yukleniyor: siniflarYukleniyor,
    listeHata: sinifListeHata,
    duzenlenenSinifId,
    kaydediliyor: sinifKaydediliyor,
    hata: sinifHata,
  } = useAppSelector((state) => state.siniflar);

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(siniflarGetir(secilenOkul.id));
    }
  }, [secilenOkul, dispatch]);

  const duzenlenen: Sinif | null =
    duzenlenenSinifId !== null
      ? siniflarListesi.find((sinif) => sinif.id === duzenlenenSinifId) ?? null
      : null;

  async function handleKaydet(veri: Partial<Sinif>) {
    if (!secilenOkul?.id) return;
    await dispatch(
      sinifKaydet({ veri, okulId: secilenOkul.id, duzenlenenId: duzenlenenSinifId })
    );
  }

  function handleSil(id: number) {
    if (!confirm("Bu sınıfı silmek istediğinize emin misiniz?")) return;
    dispatch(sinifSil(id));
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Sınıflar</h2>

        <div className="form-card max-w-full">
          <SinifForm onKaydet={handleKaydet} duzenlenen={duzenlenen} />

          {sinifKaydediliyor && <p className="form-kaydet">Kaydediliyor...</p>}
          {sinifHata && <p role="alert" className="form-alert">{sinifHata}</p>}

          {duzenlenenSinifId !== null && (
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
          {siniflarYukleniyor && <p className="form-kaydet">Yükleniyor...</p>}
          {sinifListeHata && <p role="alert" className="form-alert">{sinifListeHata}</p>}

          {!siniflarYukleniyor && !sinifListeHata && (
            <SinifTablosu
              siniflarListesi={siniflarListesi}
              duzenlemeyeBaslaSinif={(sinif) => dispatch(duzenlemeyeBaslaSinif(sinif))}
              sinifSil={handleSil}
              setSecilenSinifId={() => {}}
              setIsSaved={() => {}}
            />
          )}
        </div>
      </div>
    </>
  );
}