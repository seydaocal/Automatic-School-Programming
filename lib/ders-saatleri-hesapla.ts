import type { PoolClient } from "pg";

function saateDakikaEkle(saat: string, eklenecekDakika: number): string {
  const [saatKismi, dakikaKismi] = saat.split(":").map(Number);
  const toplamDakika = saatKismi * 60 + dakikaKismi + eklenecekDakika;
  const yeniSaat = Math.floor(toplamDakika / 60) % 24;
  const yeniDakika = toplamDakika % 60;
  return `${String(yeniSaat).padStart(2, "0")}:${String(yeniDakika).padStart(2, "0")}`;
}
export function dersSaatleriniHesapla({
  ilkDersBaslangicSaati,
  dersSuresi,
  molaSuresi,
  gunlukDersSayisi,
}: {
  ilkDersBaslangicSaati: string;
  dersSuresi: number;
  molaSuresi: number;
  gunlukDersSayisi: number;
}): string[] {
  const saatler: string[] = [];
  for (let i = 0; i < gunlukDersSayisi; i++) {
    const gecenDakika = i * (dersSuresi + molaSuresi);
    saatler.push(saateDakikaEkle(ilkDersBaslangicSaati, gecenDakika));
  }
  return saatler;
}
export async function otomatikDersSaatleriniUygula(
  client: PoolClient,
  okulId: number,
  params: {
    ilkDersBaslangicSaati: string;
    dersSuresi: number;
    molaSuresi: number;
    gunlukDersSayisi: number;
    gunler: string[];
  }
) {
  const hesaplananSaatler = dersSaatleriniHesapla({
    ilkDersBaslangicSaati: params.ilkDersBaslangicSaati,
    dersSuresi: params.dersSuresi,
    molaSuresi: params.molaSuresi,
    gunlukDersSayisi: params.gunlukDersSayisi,
  });

  for (const gunStr of params.gunler) {
    const gunNo = Number(gunStr);
    if (!Number.isInteger(gunNo) || gunNo < 1) continue;

    for (let i = 0; i < hesaplananSaatler.length; i++) {
      const dersSaatiNo = i + 1;
      const baslangicSaati = hesaplananSaatler[i];

      await client.query(
        `INSERT INTO ders_baslangic_saatleri (okul_id, gun_no, ders_saati_no, baslangic_saati, otomatik_mi)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (okul_id, gun_no, ders_saati_no)
         DO UPDATE SET baslangic_saati = EXCLUDED.baslangic_saati
         WHERE ders_baslangic_saatleri.otomatik_mi = true`,
        [okulId, gunNo, dersSaatiNo, baslangicSaati]
      );
    }
  }
}