"use client";

import { useEffect } from "react";
import { DersProgramiTablosu } from "@/components/forms/tablolar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { ogretmenlerGetir } from "@/lib/redux/slices/ogretmenlerSlice";
import { atamalarGetir } from "@/lib/redux/slices/atamaSlice";
import { derslerGetir } from "@/lib/redux/slices/derslerSlice";
import { siniflarGetir } from "@/lib/redux/slices/siniflarSlice";
import {
  baslangicSaatleriGetir,
  setHaftaBaslangici,
} from "@/lib/redux/slices/dersSaatleriSlice";
import {
  dersPrograminiGetir,
  dersProgramiOlustur,
} from "@/lib/redux/slices/dersProgramiSlice";

export default function YonetimProgramPage() {
  // secilenOkul hâlâ eski context'ten geliyor — okulSlice, "okullar" listesini
  // (CRUD) yönetiyor, "şu an seçili okul" ayrı bir kavram, bilerek karıştırmıyoruz.
  const { secilenOkul } = useOkulContext();

  const dispatch = useAppDispatch();

  const { liste: dersProgramiListesi, yukleniyor: dersProgramiYukleniyor, hata: dersProgramiHata } =
    useAppSelector((state) => state.dersProgrami);
  const { liste: siniflarListesi } = useAppSelector((state) => state.siniflar);
  const { liste: atamalarListesi } = useAppSelector((state) => state.atama);
  const { liste: derslerListesi } = useAppSelector((state) => state.dersler);
  const { liste: ogretmenlerListesi } = useAppSelector((state) => state.ogretmenler);
  const { baslangicSaatleri, haftaBaslangici } = useAppSelector((state) => state.dersSaatleri);

  // Programı okulun güncel bilgileriyle yeniden çeken yardımcı — hem ilk
  // yüklemede hem hafta değiştiğinde hem "Programı Yenile" butonunda kullanılır.
  function programiYenile() {
    if (!secilenOkul?.id) return;
    dispatch(
      dersPrograminiGetir({
        okulId: secilenOkul.id,
        okulSure: secilenOkul.sure,
        okulMolas: secilenOkul.molas,
        okulIlkDersBaslangicSaati: secilenOkul.ilk_ders_baslangic_saati,
        okulSayi: secilenOkul.sayi,
      })
    );
  }

  useEffect(() => {
    if (secilenOkul?.id) {
      // dersPrograminiGetir, ogretmenler ve atama slice'larındaki veriyi
      // getState() ile okuyor — o yüzden önce bunların yüklenmiş olması gerekiyor.
      if (ogretmenlerListesi.length === 0) dispatch(ogretmenlerGetir(secilenOkul.id));
      if (atamalarListesi.length === 0) dispatch(atamalarGetir(secilenOkul.id));
      if (derslerListesi.length === 0) dispatch(derslerGetir(secilenOkul.id));
      if (siniflarListesi.length === 0) dispatch(siniflarGetir(secilenOkul.id));
      dispatch(baslangicSaatleriGetir(secilenOkul.id));
      programiYenile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secilenOkul, haftaBaslangici, dispatch]);

  function haftaDegistir(gunFarki: number) {
    const mevcut = new Date(`${haftaBaslangici}T00:00:00`);
    mevcut.setDate(mevcut.getDate() + gunFarki);
    const yyyy = mevcut.getFullYear();
    const mm = String(mevcut.getMonth() + 1).padStart(2, "0");
    const dd = String(mevcut.getDate()).padStart(2, "0");
    dispatch(setHaftaBaslangici(`${yyyy}-${mm}-${dd}`));
  }

  const haftaBitisi = (() => {
    const cuma = new Date(`${haftaBaslangici}T00:00:00`);
    cuma.setDate(cuma.getDate() + 4);
    return cuma.toLocaleDateString("tr-TR");
  })();

  function handleProgramiOlustur() {
    if (!secilenOkul?.id) return;
    dispatch(dersProgramiOlustur(secilenOkul.id));
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <button type="button" className="form-btn" onClick={() => haftaDegistir(-7)}>
          ← Önceki Hafta
        </button>
        <span className="font-semibold text-slate-700">
          {new Date(`${haftaBaslangici}T00:00:00`).toLocaleDateString("tr-TR")} – {haftaBitisi}
        </span>
        <button type="button" className="form-btn" onClick={() => haftaDegistir(7)}>
          Sonraki Hafta →
        </button>
      </div>

      {dersProgramiYukleniyor && <p className="form-kaydet">Program yükleniyor...</p>}
      {dersProgramiHata && <p role="alert" className="form-alert">{dersProgramiHata}</p>}

      {!dersProgramiYukleniyor && secilenOkul && (
        <DersProgramiTablosu
          dersPrograminiGetir={programiYenile}
          dersProgramiOlustur={handleProgramiOlustur}
          dersProgramiListesi={dersProgramiListesi}
          siniflarListesi={siniflarListesi}
          atamalarListesi={atamalarListesi}
          derslerListesi={derslerListesi}
          ogretmenlerListesi={ogretmenlerListesi}
          okulId={secilenOkul.id}
          baslangicSaatleri={baslangicSaatleri}
          dersSuresi={secilenOkul.sure}
          molaSuresi={secilenOkul.molas}
          ilkDersBaslangicSaati={secilenOkul.ilk_ders_baslangic_saati}
        />
      )}
    </>
  );
}