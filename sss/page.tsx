"use client";

import { useState } from "react";
import Link from "next/link";

type SoruCevap = {
  soru: string;
  cevap: string;
};

const ogretmenSorulari: SoruCevap[] = [
  {
    soru: 'Ders programımı görüntülemeye çalıştığımda "Hesabınız henüz bir öğretmen ve okulla eşleştirilmemiş" hatası alıyorum. Ne yapmalıyım?',
    cevap:
      "Hesabınız sisteme kaydedildikten sonra, okulunuzdaki öğretmen kaydıyla otomatik olarak eşleştirilir. Bu eşleştirme yalnızca giriş yaptığınızda çalışır. Eğer yöneticiniz sizi öğretmen listesine yeni eklediyse, bir kez çıkış yapıp tekrar giriş yapmanız yeterlidir. Sorun devam ederse, kayıt olurken kullandığınız e-posta adresi ile öğretmen kaydınızdaki e-posta adresinin birebir aynı olduğundan emin olun.",
  },
  {
    soru: 'Yöneticim ders programını oluşturduğunu söylüyor ama panelimde "Henüz size atanmış bir ders programı bulunmuyor" yazıyor. Neden?',
    cevap:
      "Bu genellikle hesabınızın okul/öğretmen eşleştirmesinin henüz yapılmamış olmasından kaynaklanır. Çıkış yapıp tekrar giriş yaptıktan sonra da sorun devam ederse yöneticinizle iletişime geçin.",
  },
  {
    soru: 'İzin talebimi kaydettim ama hâlâ "Bekliyor" yazıyor. Bu normal mi?',
    cevap:
      "Evet. İzin talepleri kaydedildiğinde otomatik olarak onaylanmaz; yöneticinizin talebi onaylaması gerekir. Onaylanana kadar durumunuz Bekliyor olarak görünür.",
  },
  {
    soru: "Onaylanmamış (bekleyen) bir izin talebim, ders programımı hemen etkiler mi?",
    cevap:
      "Hayır. Yalnızca yönetici tarafından onaylanmış izinler, otomatik ders programı oluşturulurken dikkate alınır. Onay bekleyen bir talep, siz onaylanana kadar programınızı etkilemez.",
  },
  {
    soru: "Kendi bilgilerimi (ad, soyad, TC, e-posta, fotoğraf, özgeçmiş) güncelleyebilir miyim?",
    cevap:
      "Evet, Öğretmen Bilgileri sayfasından kendi kaydınızı güncelleyebilirsiniz. Okulunuz bilgisi ise yalnızca yönetici tarafından değiştirilebilir.",
  },
  {
    soru: "Öğretmen bilgilerimdeki e-postayı değiştirirsem, giriş yaparken kullandığım e-posta da değişir mi?",
    cevap:
      "Hayır. Öğretmen bilgilerinizdeki e-posta ile giriş yaptığınız hesabın e-postası ayrı bilgilerdir. Öğretmen bilgilerinizi güncellemek, giriş bilgilerinizi değiştirmez.",
  },
];

const yoneticiSorulari: SoruCevap[] = [
  {
    soru: "Yeni bir öğretmen kaydı oluşturdum ama giriş yapamıyor / paneli boş görünüyor. Neden?",
    cevap:
      "Öğretmen hesabı ile öğretmen kaydının e-posta üzerinden otomatik eşleşmesi gerekiyor. Öğretmenin kayıt sırasında kullandığı e-posta ile öğretmen kaydına girdiğiniz e-posta aynı olmalı. Öğretmenin bir kez çıkış yapıp tekrar giriş yapması eşleştirmeyi tamamlar.",
  },
  {
    soru: "Bir öğretmenin izin talebini onayladım ama ders programında hâlâ o saatte ders görünüyor. Neden?",
    cevap:
      'Onay, yalnızca ders programı yeniden oluşturulduğunda etkili olur. Onayladıktan sonra "Ders Programını Oluştur" işlemini tekrar çalıştırmanız gerekir.',
  },
  {
    soru: "Bir öğretmeni sildiğimde ne olur?",
    cevap:
      "Öğretmenin tüm ders atamaları ve ders programındaki ilgili saatleri otomatik olarak silinir, ardından okulun ders programı otomatik olarak yeniden oluşturulur.",
  },
  {
    soru: "Okul bilgilerimi (ders süresi, mola süresi, ilk ders başlangıç saati) sonradan değiştirirsem mevcut ders programı ne olur?",
    cevap:
      "Mevcut program otomatik güncellenmez; değişikliklerin yansıması için ders programını yeniden oluşturmanız gerekir.",
  },
];

function SoruListesi({ sorular }: { sorular: SoruCevap[] }) {
  const [acikIndex, setAcikIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {sorular.map((item, index) => {
        const acik = acikIndex === index;
        return (
          <div key={item.soru} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setAcikIndex(acik ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={acik}
            >
              <span className="font-medium text-slate-900">{item.soru}</span>
              <span className={`shrink-0 text-xl text-slate-400 transition-transform ${acik ? "rotate-45" : ""}`}>+</span>
            </button>
            {acik && (
              <div className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">
                {item.cevap}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SssPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="rounded-3xl bg-linear-to-br from-sky-600 to-blue-800 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold tracking-[0.16em] text-sky-100">YARDIM</p>
        <h1 className="mt-3 text-3xl font-bold">Sıkça Sorulan Sorular</h1>
        <p className="mt-3 max-w-xl text-blue-100">
          Karşılaşabileceğiniz durumlar ve çözümleri aşağıda listelenmiştir.
        </p>
        <Link href="/nasilkullanilir" className="mt-5 inline-block font-semibold text-sky-100 underline underline-offset-4 hover:text-white">
          Nasıl kullanılır sayfasına git →
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Öğretmenler için</h2>
        <p className="mt-1 text-sm text-slate-600">Ders programı, izin talepleri ve kişisel bilgilerle ilgili sorular.</p>
        <div className="mt-4">
          <SoruListesi sorular={ogretmenSorulari} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Yöneticiler için</h2>
        <p className="mt-1 text-sm text-slate-600">Öğretmen yönetimi, izin onayı ve ders programı oluşturmayla ilgili sorular.</p>
        <div className="mt-4">
          <SoruListesi sorular={yoneticiSorulari} />
        </div>
      </div>
    </section>
  );
}