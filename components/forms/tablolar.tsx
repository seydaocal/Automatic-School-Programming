"use client";
import { useEffect, useState } from 'react';
import { gunSecenekleri } from '@/components/forms/formlar';
import type {
  AtamaTablosuProps,
  DersProgramiTablosuProp,
  DersTablosuProps,
  OgretmenTablosuProps,
  OkulTablosuProps,
  SinifTablosuProps,
  OgretmenIzinTablosuProps,
  DersUcretiTablosuProps,
  DersBaslangicSaati
} from "@/types";
import { dersSaatleriniHesapla } from "@/lib/ders-saatleri-hesapla";
import { useFormState } from 'react-dom';


function csvHucre(deger: string) {
  const guvenli = deger.replace(/"/g, '""');
  return `"${guvenli}"`;
}
 
function csvIndir(dosyaAdi: string, satirlar: string[][]) {
  const icerik = satirlar.map((satir) => satir.map(csvHucre).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + icerik], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = dosyaAdi;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const tabs = [
  { id: "dersler", label: "Dersler" },
  { id: "ogretmenler", label: "Öğretmenler" },
  { id: "atama", label: "Ders Atama" },
  { id: "siniflar", label: "Sınıflar ve Şubeler" },
  { id: "program", label: "Ders Programı" },
  { id: "izinler", label: "Öğretmen İzinleri" },
  { id: "ucretler", label:"Ders Ücretleri" },
];


export function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <nav className="ana-icerik" aria-label="Yönetim menüsü">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`secme-btn ${activeTab === tab.id ? "aktif" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function OkulTablosu({
  okullarListesi,
  duzenlemeyeBaslaOkul,
  okulSil,
  setSecilenOkulId,
  setIsSaved
}: OkulTablosuProps) {
  return (
    <div className="tablo-alani">
      <table className="veri-tablosu">
        <thead>
          <tr><th>Okul adı</th><th>İl</th><th>İlçe</th><th>Ders sayısı</th><th>Ders süresi</th><th>Mola süresi</th><th>Eğitim günleri</th><th>İşlemler</th></tr>
        </thead>
        <tbody>
          {okullarListesi.map((okul) => (
            <tr key={okul.id}>
              <td>{okul.ad}</td><td>{okul.il}</td><td>{okul.ilce}</td><td>{okul.sayi}</td><td>{okul.sure}</td><td>{okul.molas}</td><td>{okul.gun.map((g) => gunSecenekleri.find((x) => x.deger === g)?.ad ?? g).join(", ")}</td>
              <td>
                <button className="form-btn m-2" onClick={() => duzenlemeyeBaslaOkul(okul)}>Düzenle</button>
                <button className="form-btn m-2" onClick={() => okulSil(okul.id)}>Sil</button>
                <button className="form-btn m-2" onClick={() => { setSecilenOkulId(okul.id); setIsSaved(true); }}>Yönet</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DersTablosu({ derslerListesi, duzenlemeyeBasladers, dersSil }: DersTablosuProps) {
  const [aramaMetni, setAramaMetni] = useState('');
  const liste = Array.isArray(derslerListesi) ? derslerListesi : [];
  const filtrelenmisDers = liste.filter((item) => 
  item.ad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
  item.seviye.toLowerCase().includes(aramaMetni.toLowerCase()) ||
  String(item.saat).includes(aramaMetni) 
);
  return (
    <div className="tablo-alani">
      <table className="veri-tablosu">
        <thead><tr><th>Ders adı</th><th>Seviye</th><th>Haftalık saat</th><th>İşlemler</th></tr></thead>
        <tbody>
          {filtrelenmisDers.map((ders) => (
            <tr key={ders.id}>
              <td>{ders.ad}</td><td>{ders.seviye}</td><td>{ders.saat}</td>
              <td><button className="form-btn m-2" onClick={() => duzenlemeyeBasladers(ders)}>Düzenle</button>
              <button className="form-btn m-2" onClick={() => dersSil(ders.id)}>Sil</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OgretmenTablosu({ ogretmenlerListesi, duzenlemeyeBaslaogr, ogretmenSil }: OgretmenTablosuProps) {
  const [aramaMetni, setAramaMetni] = useState('');
  const liste = Array.isArray(ogretmenlerListesi) ? ogretmenlerListesi : [];
  const filtrelenmisOgretmen = liste.filter((item) => 
  item.ad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
  item.soyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
  String(item.tc).includes(aramaMetni) ||
  (item.dogum && item.dogum.toLowerCase().includes(aramaMetni.toLowerCase())) ||
  item.mail.toLowerCase().includes(aramaMetni.toLowerCase())  
);
  return (
    <div className="tablo-alani">
      <div className="mb-4">
       <input type="text" placeholder="Tabloda ara..." value={aramaMetni} onChange={(e) => setAramaMetni(e.target.value)} 
       className="w-full max-w-sm rounded-md border p-2 text-sm  bg-gray-300 border-purple-800"/>
      </div>
      <table className="veri-tablosu">

        <thead><tr><th>Ad soyad</th><th>TC no</th><th>E-posta</th><th>Fotoğraf</th><th>Özgeçmiş</th><th>İşlemler</th></tr></thead>
        <tbody>
          {filtrelenmisOgretmen.map((ogretmen) => (
            <tr key={ogretmen.id}>
              <td>{ogretmen.ad} {ogretmen.soyad}</td><td>{ogretmen.tc}</td><td>{ogretmen.mail}</td>
              <td>{ogretmen.fotograf ? <img src={ogretmen.fotograf} alt={`${ogretmen.ad} ${ogretmen.soyad}`} width="50" /> : "-"}</td>
              <td>{ogretmen.ozgecmis ? <a href={ogretmen.ozgecmis} target="_blank" rel="noreferrer">Görüntüle</a> : "-"}</td>
              <td><button className="form-btn m-2" onClick={() => duzenlemeyeBaslaogr(ogretmen)}>Düzenle</button> 
              <button className="form-btn m-2" onClick={() => ogretmenSil(ogretmen.id)}>Sil</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AtamaTablosu({
  atamalarListesi,
  derslerListesi,
  ogretmenlerListesi,
  secilenDersId,
  setSecilenDersId,
  secilenOgretmenId,
  setSecilenOgretmenId,
  atamaEkle,
  duzenlemeyeBaslaatama,
  atamaSil,
}: AtamaTablosuProps) {
  const [aramaMetni, setAramaMetni] = useState('');
  const liste = Array.isArray(atamalarListesi) ? atamalarListesi : [];
  const guvenliDersler = Array.isArray(derslerListesi) ? derslerListesi : [];
  const guvenliOgretmenler = Array.isArray(ogretmenlerListesi) ? ogretmenlerListesi : [];

  const filtrelenmisAtama = liste.filter((item) => {
    const ders = guvenliDersler.find((d) => d.id === item.ders_id);
    const ogretmen = guvenliOgretmenler.find((o) => o.id === item.ogretmen_id);
    const dersAdi = ders?.ad ?? "";
    const ogretmenAdSoyad = ogretmen ? `${ogretmen.ad} ${ogretmen.soyad}` : "";
   return (
      dersAdi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      ogretmenAdSoyad.toLowerCase().includes(aramaMetni.toLowerCase())
    );
  });

  return (
     <div className="alt-kapsayici">
      <div className="okul">
        <label htmlFor="atanacak-ders">Ders</label>
        <select id="atanacak-ders" className="secim-kutusu" value={secilenDersId} onChange={(e) => setSecilenDersId(e.target.value)}>
          <option value="">Ders seçin</option>
          {guvenliDersler.map((ders) => <option key={ders.id} value={ders.id}>{ders.ad}</option>)}
        </select>
      </div>
      <div className="okul">
        <label htmlFor="atanacak-ogretmen">Öğretmen</label>
        <select id="atanacak-ogretmen" className="secim-kutusu" value={secilenOgretmenId} onChange={(e) => setSecilenOgretmenId(e.target.value)}>
          <option value="">Öğretmen seçin</option>
          {guvenliOgretmenler.map((ogretmen) => <option key={ogretmen.id} value={ogretmen.id}>{ogretmen.ad} {ogretmen.soyad}</option>)}
        </select>
      </div>
      <button className="form-btn m-2" onClick={atamaEkle} disabled={!secilenDersId || !secilenOgretmenId}>Atamayı Kaydet</button>
      <div className="tablo-alani">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tabloda ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full max-w-sm rounded-md border p-2 text-sm bg-gray-300 border-purple-800"/>
        </div>
         <table className="veri-tablosu">
          <thead><tr><th>Ders</th><th>Öğretmen</th><th>İşlemler</th></tr></thead>
          <tbody>
            {filtrelenmisAtama.map((atama) => {
              const ders = guvenliDersler.find((item) => item.id === atama.ders_id);
              const ogretmen = guvenliOgretmenler.find((item) => item.id === atama.ogretmen_id);
              return (
                <tr key={atama.id}>
                  <td>{ders?.ad ?? "Bilinmeyen ders"}</td>
                  <td>{ogretmen ? `${ogretmen.ad} ${ogretmen.soyad}` : "Bilinmeyen öğretmen"}</td>
                  <td>
                    <button className="form-btn m-2" onClick={() => duzenlemeyeBaslaatama(atama)}>Düzenle</button>
                    <button className="form-btn m-2" onClick={() => atamaSil(atama.id)}>Sil</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
         </div>
    </div>
  );
}

export function SinifTablosu({ siniflarListesi, duzenlemeyeBaslaSinif, sinifSil }: SinifTablosuProps) {
  const [aramaMetni, setAramaMetni] = useState('');
  const liste = Array.isArray(siniflarListesi) ? siniflarListesi : [];
  const filtrelenmisSinif = liste.filter((item) => 

    String(item.seviye).includes(aramaMetni) ||
    item.sube.toLowerCase().includes(aramaMetni.toLowerCase()) 
  );
  return (
    <div className="tablo-alani">
      <table className="veri-tablosu">
        <thead><tr><th>Seviye</th><th>Şube</th><th>İşlemler</th></tr></thead>
        <tbody>{filtrelenmisSinif.map((sinif) => 
          <tr key={sinif.id}>
            <td>{sinif.seviye}</td>
            <td>{sinif.sube}</td>
            <td>
          <button className="form-btn m-2" onClick={() => duzenlemeyeBaslaSinif(sinif)}>Düzenle</button>
          <button className="form-btn m-2" onClick={() => sinifSil(sinif.id)}>Sil</button></td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function DersProgramiTablosu({
  dersPrograminiGetir,
  dersProgramiOlustur,
  dersProgramiListesi,
  siniflarListesi,
  atamalarListesi,
  derslerListesi,
  ogretmenlerListesi,
  baslangicSaatleri,
  dersSuresi,
  molaSuresi,
  ilkDersBaslangicSaati,
  okulId,
}: DersProgramiTablosuProp) {
  const gunler = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const [aramaMetni, setAramaMetni] = useState("");
  const [secilenSubeId, setSecilenSubeId] = useState<number | "">("");

  // Okulun ders süresi/mola süresi/ilk ders başlangıcı biliniyorsa, DB'de
  // (ders_baslangic_saatleri) hiç kayıt olmasa bile saatleri anlık hesaplayabiliriz.
  const otomatikHesaplananSaatler = (() => {
    if (!ilkDersBaslangicSaati || !dersSuresi) return [] as string[];
    const guvenliListe = Array.isArray(dersProgramiListesi) ? dersProgramiListesi : [];
    const enBuyukDersSaati = guvenliListe.reduce(
      (maks, satir) => Math.max(maks, Number(satir.ders_saati) || 0),
      0
    );
    // Veri henüz gelmemişse bile makul bir üst sınırla (12 ders saati) hesaplayalım
    const gunlukDersSayisi = Math.max(enBuyukDersSaati, 12);
    try {
      return dersSaatleriniHesapla({
        ilkDersBaslangicSaati,
        dersSuresi,
        molaSuresi: molaSuresi ?? 0,
        gunlukDersSayisi,
      });
    } catch {
      return [] as string[];
    }
  })();

  function baslangicSaatiBul(gunNo: number, dersSaati: number) {
    const liste = Array.isArray(baslangicSaatleri) ? baslangicSaatleri : [];
    const kayit = liste.find(
      (k) => Number(k.gun_no) === Number(gunNo) && Number(k.ders_saati_no) === Number(dersSaati)
    );
    if (kayit) return kayit.baslangic_saati;

    // DB'de kayıt yoksa otomatik hesaplanan saate düş
    const index = Number(dersSaati) - 1;
    if (index >= 0 && index < otomatikHesaplananSaatler.length) {
      return otomatikHesaplananSaatler[index];
    }
    return undefined;
  }

  // Bir saate (HH:MM) belirli dakika ekler, yeni saati HH:MM formatında döndürür
  function saateDakikaEkle(saat: string, eklenecekDakika: number): string {
    const [saatKismi, dakikaKismi] = saat.split(":").map(Number);
    const toplamDakika = saatKismi * 60 + dakikaKismi + eklenecekDakika;
    const yeniSaat = Math.floor(toplamDakika / 60) % 24;
    const yeniDakika = toplamDakika % 60;
    return `${String(yeniSaat).padStart(2, "0")}:${String(yeniDakika).padStart(2, "0")}`;
  }

  // Başlangıç saatine ders süresini ekleyerek "08:30-09:10" gibi bir aralık üretir.
  // Ders süresi bilinmiyorsa sadece başlangıç saatini döndürür.
  function saatAraligiBul(gunNo: number, dersSaati: number) {
    const baslangic = baslangicSaatiBul(gunNo, dersSaati);
    if (!baslangic) return undefined;
    if (!dersSuresi) return baslangic;
    const bitis = saateDakikaEkle(baslangic, dersSuresi);
    return `${baslangic}-${bitis}`;
  }

  const guvenliProgram = Array.isArray(dersProgramiListesi) ? dersProgramiListesi : [];
  const guvenliSiniflar = Array.isArray(siniflarListesi) ? siniflarListesi : [];
  const guvenliAtamalar = Array.isArray(atamalarListesi) ? atamalarListesi : [];
  const guvenliDersler = Array.isArray(derslerListesi) ? derslerListesi : [];
  const guvenliOgretmenler = Array.isArray(ogretmenlerListesi) ? ogretmenlerListesi : [];

  const filtrelenmisDersProgrami = guvenliProgram.filter((satir) => {
    const sinif = guvenliSiniflar.find((item) => item.id === satir.sube_adi);
    const atama = guvenliAtamalar.find((item) => item.id === satir.ogr_ders_id);
    const ders = atama ? guvenliDersler.find((item) => item.id === atama.ders_id) : undefined;
    const ogretmen = atama ? guvenliOgretmenler.find((item) => item.id === atama.ogretmen_id) : undefined;

    const sinifAdi = sinif ? `${sinif.seviye}-${sinif.sube}` : "";
    const dersAdi = ders?.ad ?? "";
    const ogretmenAdSoyad = ogretmen ? `${ogretmen.ad} ${ogretmen.soyad}` : "";
    const gunAdi = gunler[satir.gun_no] ?? "";

    return (
      sinifAdi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      dersAdi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      ogretmenAdSoyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      gunAdi.toLowerCase().includes(aramaMetni.toLowerCase())
    );
  });

  const programdakiSubeIdleri = Array.from(new Set(guvenliProgram.map((satir) => satir.sube_adi)));
  const programdakiSubeler = guvenliSiniflar.filter((sinif) => programdakiSubeIdleri.includes(sinif.id));

  const aktifSubeId =
    secilenSubeId !== "" ? secilenSubeId : programdakiSubeler[0]?.id ?? "";

  const subeninSatirlari = guvenliProgram.filter((satir) => satir.sube_adi === aktifSubeId);

  const dersSaatleri = Array.from(new Set(subeninSatirlari.map((satir) => satir.ders_saati))).sort(
    (a, b) => a - b
  );

   function hucreBul(gunNo: number, dersSaati: number) {
    const satir = subeninSatirlari.find((s) => s.gun_no === gunNo && s.ders_saati === dersSaati);
    if (!satir) return null;
    const atama = guvenliAtamalar.find((item) => item.id === satir.ogr_ders_id);
    const ders = atama ? guvenliDersler.find((item) => item.id === atama.ders_id) : undefined;

    // Öğretmeni ÖNCE satırın kendi alanlarından bul: dersPrograminiGetir bir izin
    // çakışması nedeniyle ikame öğretmen atamış olabilir (satir.ogretmen_id / ogretmen_adi).
    // atamalarListesi'ndeki orijinal (sabit) atamaya geri düşmek ikame atamayı görmezden gelir.
    let ogretmenAdi: string | undefined = satir.ogretmen_adi;
    let ogretmen = ogretmenAdi
      ? undefined
      : (satir.ogretmen_id
          ? guvenliOgretmenler.find((item) => item.id === satir.ogretmen_id)
          : (atama ? guvenliOgretmenler.find((item) => item.id === atama.ogretmen_id) : undefined));

    if (!ogretmenAdi && ogretmen) {
      ogretmenAdi = `${ogretmen.ad} ${ogretmen.soyad}`;
    }

    return { ders, ogretmen, ogretmenAdi, ikame: !!satir.ikame_ogretmen };
  }

  return (
    <div className="alt-kapsayici">
      <button className="form-btn m-2" onClick={dersPrograminiGetir}>
        Programı Yenile
      </button>
      <button
        className="form-btn m-2"
        onClick={() => {
          if (
            confirm(
              "Bu işlem mevcut ders programını tamamen silip rastgele yeniden oluşturacak. Devam etmek istediğinize emin misiniz?"
            )
          ) {
            dersProgramiOlustur();
          }
        }}
      >
        Programı Yeniden Oluştur
      </button>

      {programdakiSubeler.length > 0 && (
        <div className="tablo-alani">
          <h3>Haftalık Ders Programı</h3>

          <div className="okul">
            <label htmlFor="sube-secimi">Şube</label>
            <select
              id="sube-secimi"
              className="secim-kutusu"
              value={aktifSubeId}
              onChange={(e) => setSecilenSubeId(Number(e.target.value))}
            >
              {programdakiSubeler.map((sinif) => (
                <option key={sinif.id} value={sinif.id}>
                  {sinif.seviye}-{sinif.sube}
                </option>
              ))}
            </select>
          </div>

          {dersSaatleri.length > 0 && (
            <button
              type="button"
              className="form-btn m-2"
              onClick={() => {
                const aktifSube = programdakiSubeler.find((sinif) => sinif.id === aktifSubeId);
                const subeAdi = aktifSube ? `${aktifSube.seviye}-${aktifSube.sube}` : "sube";
                const basliklar = ["Ders Saati", "Saat Aralığı", ...gunler.slice(1)];
                const satirlar = dersSaatleri.map((saat) => {
                  const hucreler = [1, 2, 3, 4, 5].map((gunNo) => {
                    const hucre = hucreBul(gunNo, saat);
                    if (!hucre) return "-";
                    const dersAdi = hucre.ders?.ad ?? "Bilinmeyen ders";
                    const ogretmenAdi = hucre.ogretmenAdi ?? "Bilinmeyen öğretmen";
                    return `${dersAdi} (${ogretmenAdi})${hucre.ikame ? " [İKAME]" : ""}`;
                  });
                  return [String(saat), saatAraligiBul(1, saat) ?? "-", ...hucreler];
                });
                csvIndir(`ders-programi-${subeAdi}.csv`, [basliklar, ...satirlar]);
              }}
            >
              İndir (CSV)
            </button>
          )}
 
          {dersSaatleri.length === 0 ? (
            <p>Bu şube için henüz program verisi yok.</p>
          ) : (
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Ders Saati</th>
                  <th>Saat Aralığı</th>
                  {[1, 2, 3, 4, 5].map((gunNo) => (
                    <th key={gunNo}>{gunler[gunNo]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dersSaatleri.map((saat,index) => (
                  <tr key={saat}>
                    <td>{saat}</td>
                    <td>{saatAraligiBul(1, saat) ?? "-"}</td>
                    {[1, 2, 3, 4, 5].map((gunNo) => {
                      const hucre = hucreBul(gunNo, saat);
                      return (
                        <td key={gunNo}>
                          {hucre ? (
                            <>
                              {hucre.ders?.ad ?? "Bilinmeyen ders"}
                              <br />
                              <small>
                                {hucre.ogretmenAdi ?? "Bilinmeyen öğretmen"}
                                {hucre.ikame && (
                                  <span style={{ color: "#b45309", fontWeight: 600 }}> (İkame)</span>
                                )}
                              </small>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="tablo-alani">
        <h3>Tüm Program Kayıtları</h3>

        {guvenliProgram.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tabloda ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full max-w-sm rounded-md border p-2 text-sm bg-gray-300 border-purple-800"
            />
          </div>
        )}

        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>ID</th>
              <th>Şube</th>
              <th>Gün</th>
              <th>Ders saati</th>
              <th>Saat Aralığı</th>
              <th>Ders</th>
              <th>Öğretmen</th>
            </tr>
          </thead>
          <tbody>
            {guvenliProgram.length === 0 ? (
              <tr>
                <td colSpan={7}>Henüz program yüklenmedi veya veri yok.</td>
              </tr>
            ) : filtrelenmisDersProgrami.length === 0 ? (
              <tr>
                <td colSpan={7}>Arama sonucuyla eşleşen kayıt bulunamadı.</td>
              </tr>
            ) : (
              filtrelenmisDersProgrami.map((satir) => {
                const sinif = guvenliSiniflar.find((item) => item.id === satir.sube_adi);
                const atama = guvenliAtamalar.find((item) => item.id === satir.ogr_ders_id);
                const ders = atama ? guvenliDersler.find((item) => item.id === atama.ders_id) : undefined;

                // Öğretmeni önce satırın kendi alanından bul (izin nedeniyle ikame atanmış olabilir);
                // sadece satirda hiç bilgi yoksa orijinal statik atamaya geri düş.
                let ogretmenAdi: string | undefined = satir.ogretmen_adi;
                if (!ogretmenAdi) {
                  const ogretmenId = satir.ogretmen_id ?? atama?.ogretmen_id;
                  const ogretmen = ogretmenId ? guvenliOgretmenler.find((item) => item.id === ogretmenId) : undefined;
                  ogretmenAdi = ogretmen ? `${ogretmen.ad} ${ogretmen.soyad}` : undefined;
                }

                const saatAraligi = saatAraligiBul(satir.gun_no, satir.ders_saati);

                return (
                  <tr key={satir.id}>
                    <td>{satir.id}</td>
                    <td>{sinif ? `${sinif.seviye}-${sinif.sube}` : satir.sube_adi}</td>
                    <td>{gunler[satir.gun_no] ?? satir.gun_no}</td>
                    <td>{satir.ders_saati}</td>
                    <td>{saatAraligi ?? "-"}</td>
                    <td>{ders?.ad ?? "Bilinmeyen ders"}</td>
                    <td>
                      {ogretmenAdi ?? "Bilinmeyen öğretmen"}
                      {satir.ikame_ogretmen && (
                        <span style={{ color: "#b45309", fontWeight: 600 }}> (İkame)</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OgretmenIzinTablosu({
  izinlerListesi,
  ogretmenlerListesi,
  duzenlemeyeBaslaIzin,
  izinSil,
  izinOnaylama,
}: OgretmenIzinTablosuProps) {
  const gunler = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const [aramaMetni, setAramaMetni] = useState("");
  const liste = Array.isArray(izinlerListesi) ? izinlerListesi : [];

  function tarihNormallestir(deger: any): string {
    if (!deger) return "";
    if (typeof deger === "string") return deger.slice(0, 10);
    try {
      // toISOString() UTC'ye çevirdiği için UTC+ dilimlerinde tarihi bir gün
      // geriye kaydırabilir; bunun yerine yerel tarih bileşenlerini kullanıyoruz.
      const d = new Date(deger);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  }

  const filtrelenmisIzinler = liste.filter((izin) => {
    const ogretmen = ogretmenlerListesi.find((item) => item.id === izin.ogretmen_id);
    const ogretmenAdSoyad = ogretmen ? `${ogretmen.ad} ${ogretmen.soyad}` : "";
    const gunAdi = gunler[izin.gun_no] ?? "";
    const aciklama = izin.aciklama ?? "";

    return (
      ogretmenAdSoyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      gunAdi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      aciklama.toLowerCase().includes(aramaMetni.toLowerCase())
    );
  });

  return (
    <div className="tablo-alani">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tabloda ara..."
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          className="w-full max-w-sm rounded-md border p-2 text-sm bg-gray-300 border-purple-800"
        />
      </div>
      <table className="veri-tablosu">
        <thead>
          <tr>
            <th>Öğretmen</th>
            <th>Tür</th>
            <th>Gün / Tarih</th>
            <th>Başlangıç Saati</th>
            <th>Bitiş Saati</th>
            <th>Açıklama</th>
            <th>Ders Var mı</th>
            <th>Onay Durumu</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {filtrelenmisIzinler.length === 0 ? (
            <tr>
              <td colSpan={9}>Kayıt bulunamadı.</td>
            </tr>
          ) : (
            filtrelenmisIzinler.map((izin) => {
              const ogretmen = ogretmenlerListesi.find((item) => item.id === izin.ogretmen_id);
              const izinTarihi = tarihNormallestir(izin.tarih);
              return (
                <tr key={izin.id}>
                  <td>{ogretmen ? `${ogretmen.ad} ${ogretmen.soyad}` : "Bilinmeyen öğretmen"}</td>
                  <td>
                    {izinTarihi ? (
                      <span style={{ color: "#1d4ed8" }}>Tarihli</span>
                    ) : (
                      <span style={{ color: "#7c3aed" }}>Kalıcı</span>
                    )}
                  </td>
                  <td>
                    {gunler[izin.gun_no] ?? izin.gun_no}
                    {izinTarihi && (
                      <>
                        <br />
                        <small>{new Date(`${izinTarihi}T00:00:00`).toLocaleDateString("tr-TR")}</small>
                      </>
                    )}
                  </td>
                  <td>{izin.baslangic_saati?.slice(0, 5)}</td>
                  <td>{izin.bitis_saati?.slice(0, 5)}</td>
                  <td>{izin.aciklama ?? "-"}</td>
                  <td>
                    {izin.cakisan_dersler ? (
                      <span style={{ color: "#b45309", fontWeight: "bold" }}>
                        Dersi var: {izin.cakisan_dersler}
                      </span>
                    ) : (
                      <span style={{ color: "#999" }}>Dersi yok</span>
                    )}
                  </td>
                  <td>
                    {izin.onaylandi ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>✓ Onaylandı</span>
                    ) : (
                      <span style={{ color: "#999" }}>Bekliyor</span>
                    )}
                  </td>
                  <td>
                    {!izin.onaylandi && (
                      <button className="form-btn m-2" onClick={() => izinOnaylama(izin)}>
                        Onayla
                      </button>
                    )}
                    <button className="form-btn m-2" onClick={() => duzenlemeyeBaslaIzin(izin)}>
                      Düzenle
                    </button>
                    <button className="form-btn m-2" onClick={() => izinSil(izin.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DersUcretiTablosu({
  ucretlerListesi,
  derslerListesi,
  duzenlemeyeBaslaUcret,
  ucretSil,
}: DersUcretiTablosuProps) {
  const [aramaMetni, setAramaMetni] = useState("");
  const liste = Array.isArray(ucretlerListesi) ? ucretlerListesi : [];

  const filtrelenmisUcretler = liste.filter((ucret) => {
    const ders = derslerListesi.find((item) => item.id === ucret.ders_id);
    const dersAdi = ders?.ad ?? "";
    return String(dersAdi).toLowerCase().includes(aramaMetni.toLowerCase());
  });

  return (
    <div className="tablo-alani">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tabloda ara..."
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          className="w-full max-w-sm rounded-md border p-2 text-sm bg-gray-300 border-purple-800"
        />
      </div>
      <table className="veri-tablosu">
        <thead>
          <tr>
            <th>Ders</th>
            <th>Saatlik Ücret</th>
            <th>Aylık Ücret</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {filtrelenmisUcretler.length === 0 ? (
            <tr>
              <td colSpan={4}>Kayıt bulunamadı.</td>
            </tr>
          ) : (
            filtrelenmisUcretler.map((ucret) => {
              const ders = derslerListesi.find((item) => item.id === ucret.ders_id);
              return (
                <tr key={ucret.id}>
                  <td>{ders?.ad ?? "Bilinmeyen ders"}</td>
                  <td>{ucret.saatlik_ucret} ₺</td>
                  <td>{ucret.aylik_ucret !== null ? `${ucret.aylik_ucret} ₺` : "-"}</td>
                  <td>
                    <button className="form-btn m-2" onClick={() => duzenlemeyeBaslaUcret(ucret)}>
                      Düzenle
                    </button>
                    <button className="form-btn m-2" onClick={() => ucretSil(ucret.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}