"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OkulTablosu } from "@/components/forms/tablolar";
import { useOkulContext } from "@/context/okul-context";
import type { Okul } from "@/types";

export default function OkulSecPage() {
  const router = useRouter();
  const {
    okullar,
    okullarYukleniyor,
    listeHata,
    okullariGetir,
    duzenlemeyeBaslaOkul,
    okulSil,
    setSecilenOkul,
  } = useOkulContext();

  const [secilenOkulId, setSecilenOkulId] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    okullariGetir();

  }, []);

  useEffect(() => {
    if (isSaved && secilenOkulId !== null) {
      const okul: Okul | undefined = okullar.find((item) => item.id === secilenOkulId);
      if (okul) {
        setSecilenOkul(okul);
        router.push("/yonetim/dersler");
      }
    }
  }, [isSaved, secilenOkulId, okullar, router, setSecilenOkul]);

  return (
    <main className="kapsayici">
      <section className="alt-kapsayici">
        <h1>Kayıtlı Okullar</h1>
        {okullarYukleniyor && <p>Yükleniyor...</p>}
        {listeHata && <p role="alert">{listeHata}</p>}
        {!okullarYukleniyor && !listeHata && okullar.length === 0 && (
          <p>Henüz kayıtlı okul bulunamadı.</p>
        )}
        {!okullarYukleniyor && okullar.length > 0 && (
          <OkulTablosu
            okullarListesi={okullar}
            duzenlemeyeBaslaOkul={duzenlemeyeBaslaOkul}
            okulSil={okulSil}
            setSecilenOkulId={setSecilenOkulId}
            setIsSaved={setIsSaved}
          />
        )}
        <button className="duzenle-btn" type="button" onClick={() => router.push("/")}>
          Geri
        </button>
      </section>
    </main>
  );
}