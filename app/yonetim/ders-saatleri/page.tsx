"use client";

import { useEffect } from "react";
import { DersBaslangicSaatleriForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";
import { useAppDispatch } from "@/lib/redux/hooks";
import { baslangicSaatleriGetir } from "@/lib/redux/slices/dersSaatleriSlice";

export default function DersSaatleriPage() {
  const { secilenOkul } = useOkulContext();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (secilenOkul?.id) {
      dispatch(baslangicSaatleriGetir(secilenOkul.id));
    }
  }, [secilenOkul, dispatch]);

  if (!secilenOkul?.id) {
    return <p className="form-kaydet">Önce bir okul seçmelisiniz.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Ders Saatleri</h2>
      <DersBaslangicSaatleriForm
        okulId={secilenOkul.id}
        gunlukDersSayisi={secilenOkul.sayi}
        gunler={secilenOkul.gun}
        ilkDersBaslangicSaati={secilenOkul.ilk_ders_baslangic_saati}
        dersSuresi={secilenOkul.sure}
        molaSuresi={secilenOkul.molas}
      />
    </div>
  );
}