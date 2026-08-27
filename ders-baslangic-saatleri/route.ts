import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/ders-baslangic-saatleri:
 *   get:
 *     summary: Ders başlangıç saatlerini getirir
 *     tags: [DersBaslangicSaatleri]
 *     parameters:
 *       - in: query
 *         name: okul_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Okul ID'si
 *     responses:
 *       200:
 *         description: Başarılı liste
 *       400:
 *         description: Geçerli bir okul_id belirtilmelidir
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 *   post:
 *     summary: Ders başlangıç saatlerini kaydeder
 *     tags: [DersBaslangicSaatleri]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               okul_id:
 *                 type: integer
 *               kayitlar:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     gun_no:
 *                       type: integer
 *                     ders_saati_no:
 *                       type: integer
 *                     baslangic_saati:
 *                       type: string
 *     responses:
 *       200:
 *         description: Ders başlangıç saatleri kaydedildi
 *       400:
 *         description: Eksik veya hatalı veri formatı
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */

type SessionUser = {
  rol?: string;
};

type Kayit = {
  gun_no: number;
  ders_saati_no: number;
  baslangic_saati: string;
};

async function yetkiKontrol() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (user?.rol !== "admin") {
    return { error: "Bu alan yalnızca yönetici hesapları içindir.", status: 403 };
  }

  return { ok: true as const };
}

export async function GET(request: Request) {
  const yetki = await yetkiKontrol();
  if ("error" in yetki) {
    return NextResponse.json({ success: false, error: yetki.error }, { status: yetki.status });
  }

  const { searchParams } = new URL(request.url);
  const okulId = Number(searchParams.get("okul_id"));

  if (!Number.isInteger(okulId) || okulId <= 0) {
    return NextResponse.json(
      { success: false, error: "Geçerli bir okul_id belirtilmelidir." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT gun_no, ders_saati_no, baslangic_saati, otomatik_mi
       FROM ders_baslangic_saatleri
       WHERE okul_id = $1
       ORDER BY gun_no, ders_saati_no`,
      [okulId]
    );

    return NextResponse.json({ success: true, kayitlar: result.rows });
  } catch (error) {
    console.error("Ders başlangıç saatleri alınamadı:", error);
    return NextResponse.json(
      { success: false, error: "Ders başlangıç saatleri yüklenemedi." },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  const yetki = await yetkiKontrol();
  if ("error" in yetki) {
    return NextResponse.json({ success: false, error: yetki.error }, { status: yetki.status });
  }

  try {
    const body = await request.json();
    const okulId = Number(body.okul_id);
    const kayitlar: Kayit[] = Array.isArray(body.kayitlar) ? body.kayitlar : [];

    if (!Number.isInteger(okulId) || okulId <= 0) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir okul_id belirtilmelidir." },
        { status: 400 }
      );
    }

    const gecerliSaatFormati = /^\d{2}:\d{2}$/;
    for (const kayit of kayitlar) {
      const gunNo = Number(kayit.gun_no);
      const dersSaatiNo = Number(kayit.ders_saati_no);
      if (
        !Number.isInteger(gunNo) || gunNo < 1 ||
        !Number.isInteger(dersSaatiNo) || dersSaatiNo < 1 ||
        typeof kayit.baslangic_saati !== "string" ||
        !gecerliSaatFormati.test(kayit.baslangic_saati)
      ) {
        return NextResponse.json(
          { success: false, error: "Gönderilen kayıtlarda gün, ders saati no veya saat formatı hatalı." },
          { status: 400 }
        );
      }
    }

    if (kayitlar.length === 0) {
      return NextResponse.json(
        { success: false, error: "Kaydedilecek kayıt bulunamadı." },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const kayit of kayitlar) {
        await client.query(
          `INSERT INTO ders_baslangic_saatleri (okul_id, gun_no, ders_saati_no, baslangic_saati, otomatik_mi)
           VALUES ($1, $2, $3, $4, false)
           ON CONFLICT (okul_id, gun_no, ders_saati_no)
           DO UPDATE SET baslangic_saati = EXCLUDED.baslangic_saati, otomatik_mi = false`,
          [okulId, kayit.gun_no, kayit.ders_saati_no, kayit.baslangic_saati]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true, message: "Ders başlangıç saatleri kaydedildi." });
  } catch (error) {
    console.error("Ders başlangıç saatleri kaydedilemedi:", error);
    return NextResponse.json(
      { success: false, error: "Ders başlangıç saatleri kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}