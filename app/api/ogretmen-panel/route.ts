import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/ogretmen-panel:
 *   get:
 *     summary: Öğretmen paneli verilerini getirir
 *     description: Giriş yapan öğretmenin ders programını, izinlerini, okul bilgilerini ve ders başlangıç saatlerini listeler.
 *     tags: [OgretmenPanel]
 *     responses:
 *       200:
 *         description: Panel verileri başarıyla getirildi
 *       403:
 *         description: Yetkisiz erişim (Yalnızca öğretmen hesapları)
 *       409:
 *         description: Hesap bir öğretmen ve okulla eşleştirilmemiş
 *       500:
 *         description: Panel verileri yüklenemedi
 *   post:
 *     summary: Öğretmen paneli üzerinden izin ekler
 *     description: Öğretmenin kendi panelinden yeni izin talebi eklemesini sağlar.
 *     tags: [OgretmenPanel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                ogretmen_id:
 *                  type: integer
 *                baslangic_saati:
 *                  type: integer
 *                bitis_saati:
 *                  type: integer
 *                aciklama:
 *                  type: string
 *                gun_no:
 *                  type: integer
 *     responses:
 *       201:
 *         description: İzin okul kayıtlarına eklendi
 *       400:
 *         description: Gün ve saat bilgilerini kontrol edin
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Hesap eşleştirilmemiş
 *       500:
 *         description: İzin kaydedilemedi
 */

type SessionUser = {
  rol?: string;
  ogretmen_id?: number | string | null;
  okul_id?: number | string | null;
};

async function getOgretmen() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (user?.rol !== "ogretmen") {
    return { error: "Bu alan yalnızca öğretmen hesapları içindir.", status: 403 };
  }

  if (
    user?.ogretmen_id === null ||
    user?.ogretmen_id === undefined ||
    user?.okul_id === null ||
    user?.okul_id === undefined
  ) {
    return { error: "Hesabınız henüz bir öğretmen ve okulla eşleştirilmemiş.", status: 409 };
  }

  const ogretmenId = Number(user.ogretmen_id);
  const okulId = Number(user.okul_id);

  if (!Number.isInteger(ogretmenId) || ogretmenId <= 0 || !Number.isInteger(okulId) || okulId <= 0) {
    return { error: "Hesabınız henüz bir öğretmen ve okulla eşleştirilmemiş.", status: 409 };
  }

  return { ogretmenId, okulId };
}

export async function GET() {
  const ogretmen = await getOgretmen();
  if ("error" in ogretmen) {
    return NextResponse.json({ success: false, error: ogretmen.error }, { status: ogretmen.status });
  }

  try {
    const [programResult, izinResult, okulResult, baslangicSaatleriResult] = await Promise.all([
      pool.query(
        `SELECT dp.id, dp.gun_no, dp.ders_saati,
                d.ders_adi AS ders_adi,
                sst.sınıf_seviyesi AS sube_seviye,
                sst.sınıf_şubesi AS sube_adi
         FROM ders_programi dp
         INNER JOIN ogretmenlere_ders_atama oda ON oda.id = dp.ogr_ders_id
         LEFT JOIN dersler d ON d.id = oda.ders_id
         LEFT JOIN sınıf_sube_tanımlama sst ON sst.id = dp.sube_adi
         WHERE oda.okul_id = $1 AND oda.ogretmen_id = $2
         ORDER BY dp.gun_no, dp.ders_saati, sst.sınıf_seviyesi, sst.sınıf_şubesi`,
        [ogretmen.okulId, ogretmen.ogretmenId]
      ),
      pool.query(
        `SELECT id, gun_no, baslangic_saati, bitis_saati, aciklama, onaylandi
         FROM ogretmen_izinleri
         WHERE okul_id = $1 AND ogretmen_id = $2
         ORDER BY gun_no, baslangic_saati`,
        [ogretmen.okulId, ogretmen.ogretmenId]
      ),
      pool.query(
        `SELECT gunluk_ders_sayısı, ders_suresi AS sure, mola_suresi AS molas, ilk_ders_baslangic_saati
         FROM okullar WHERE id = $1`,
        [ogretmen.okulId]
      ),
      pool.query(
        `SELECT gun_no, ders_saati_no, baslangic_saati
         FROM ders_baslangic_saatleri
         WHERE okul_id = $1
         ORDER BY gun_no, ders_saati_no`,
        [ogretmen.okulId]
      ),
    ]);

    return NextResponse.json({
      success: true,
      program: programResult.rows,
      izinler: izinResult.rows,
      gunlukDersSayisi: okulResult.rows[0]?.gunluk_ders_sayısı ?? null,
      dersSuresi: okulResult.rows[0]?.sure ?? null,
      molaSuresi: okulResult.rows[0]?.molas ?? null,
      ilkDersBaslangicSaati: okulResult.rows[0]?.ilk_ders_baslangic_saati ?? null,
      baslangicSaatleri: baslangicSaatleriResult.rows,
    });
  } catch (error) {
    console.error("Öğretmen paneli verileri alınamadı:", error);
    return NextResponse.json(
      { success: false, error: "Panel verileri yüklenemedi." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ogretmen = await getOgretmen();
  if ("error" in ogretmen) {
    return NextResponse.json({ success: false, error: ogretmen.error }, { status: ogretmen.status });
  }

  try {
    const body = await request.json();
    const gunNo = Number(body.gun_no);
    const baslangicSaati = typeof body.baslangic_saati === "string" ? body.baslangic_saati : "";
    const bitisSaati = typeof body.bitis_saati === "string" ? body.bitis_saati : "";
    const aciklama = typeof body.aciklama === "string" ? body.aciklama.trim() : null;

    if (
      !Number.isInteger(gunNo) ||
      gunNo < 1 ||
      gunNo > 5 ||
      !/^\d{2}:\d{2}$/.test(baslangicSaati) ||
      !/^\d{2}:\d{2}$/.test(bitisSaati) ||
      baslangicSaati >= bitisSaati
    ) {
      return NextResponse.json(
        { success: false, error: "Gün ve saat bilgilerini kontrol edin." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO ogretmen_izinleri
       (okul_id, ogretmen_id, baslangic_saati, bitis_saati, aciklama, gun_no)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, gun_no, baslangic_saati, bitis_saati, aciklama`,
      [
        ogretmen.okulId,
        ogretmen.ogretmenId,
        baslangicSaati,
        bitisSaati,
        aciklama || null,
        gunNo,
      ]
    );

    return NextResponse.json(
      { success: true, message: "İzin okul kayıtlarına eklendi.", data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Öğretmen izni kaydedilemedi:", error);
    return NextResponse.json(
      { success: false, error: "İzin kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}