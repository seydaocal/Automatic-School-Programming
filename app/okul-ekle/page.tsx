"use client";

import { useRouter } from "next/navigation";
import { OkulForm } from "@/components/forms/formlar";
import { useOkulContext } from "@/context/okul-context";

export default function OkulEklePage() {
  const router = useRouter();
  const {
    okullar,
    duzenlenenOkulId,
    setDuzenlenenOkulId,
    okulKaydet,
    kaydediliyor,
    hata,
  } = useOkulContext();

  const duzenlenenOkul =
    duzenlenenOkulId !== null ? okullar.find((okul) => okul.id === duzenlenenOkulId) ?? null : null;

  return (
    <main className="space-y-6">
      <section className="form-card max-w-full space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {duzenlenenOkulId !== null ? "Okulu Düzenle" : "Okul Ekle"}
        </h1>
        <p className="form-description">
          Öncelikle okulun temel bilgilerini kaydedin.
        </p>
        <div className="form-card max-w-full">

        <OkulForm onKaydet={okulKaydet} duzenlenen={duzenlenenOkul} />

        {kaydediliyor && <p className="form-kaydet">Kaydediliyor...</p>}
        {hata && <p role="alert" className="form-alert">{hata}</p>}

        <button
          className="form-btn mt-4"
          type="button"
          onClick={() => {
            setDuzenlenenOkulId(null);
            router.push("/");
          }}
        >
          Geri
        </button>
        </div>
      </section>
    </main>
  );
}