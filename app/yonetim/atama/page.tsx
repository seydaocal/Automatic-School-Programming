"use client";

import { useEffect } from "react";
import { AtamaTablosu } from "@/components/forms/tablolar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { derslerGetir } from "@/lib/redux/slices/derslerSlice";
import { ogretmenlerGetir } from "@/lib/redux/slices/ogretmenlerSlice";
import {
  atamalarGetir,
  atamaEkle,
  atamaSil,
  duzenlemeyeBaslaatama,
  setSecilenDersId,
  setSecilenOgretmenId,
} from "@/lib/redux/slices/atamaSlice";

export default function YonetimAtamaPage() {
  const { secilenOkul } = useOkulContext();
  const dispatch = useAppDispatch();

  const {
    liste: atamalarListesi,
    yukleniyor: atamalarYukleniyor,
    listeHata: atamaListeHata,
    secilenDersId,
    secilenOgretmenId,
    hata: atamaHata,
  } = useAppSelector((state) => state.atama);

  const { liste: derslerListesi } = useAppSelector((state) => state.dersler);
  const { liste: ogretmenlerListesi } = useAppSelector((state) => state.ogretmenler);

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(atamalarGetir(secilenOkul.id));

      if (derslerListesi.length === 0) dispatch(derslerGetir(secilenOkul.id));
      if (ogretmenlerListesi.length === 0) dispatch(ogretmenlerGetir(secilenOkul.id));
    }
  }, [secilenOkul, dispatch]);

  function handleAtamaEkle() {
    if (!secilenOkul?.id) return;
    dispatch(atamaEkle(secilenOkul.id));
  }

  function handleSil(id: number) {
    if (!confirm("Bu atamayı silmek istediğinize emin misiniz?")) return;
    if (!secilenOkul?.id) return;
    dispatch(atamaSil({ id, okulId: secilenOkul.id }));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Ders Atama</h2>

      <div className="form-card max-w-full overflow-hidden">
        {atamalarYukleniyor && <p className="form-kaydet">Yükleniyor...</p>}
        {atamaListeHata && <p role="alert" className="form-alert">{atamaListeHata}</p>}
        {atamaHata && <p role="alert" className="form-alert">{atamaHata}</p>}

        {!atamalarYukleniyor && !atamaListeHata && (
          <AtamaTablosu
            atamalarListesi={atamalarListesi}
            derslerListesi={derslerListesi}
            ogretmenlerListesi={ogretmenlerListesi}
            duzenlemeyeBaslaatama={(atama) => dispatch(duzenlemeyeBaslaatama(atama))}
            secilenDersId={secilenDersId}
            setSecilenDersId={(id) => dispatch(setSecilenDersId(id))}
            secilenOgretmenId={secilenOgretmenId}
            setSecilenOgretmenId={(id) => dispatch(setSecilenOgretmenId(id))}
            atamaEkle={handleAtamaEkle}
            atamaGuncelle={handleAtamaEkle}
            atamaSil={handleSil}
          />
        )}
      </div>
    </div>
  );
}