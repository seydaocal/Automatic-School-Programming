import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/ders-programi:
 *   get:
 *     summary: Ders programını getirir
 *     description: Belirtilen okul ID'sine göre ders programı kayıtlarını listeler.
 *     tags: [DersProgrami]
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
 *         description: okul_id gerekli
 *       500:
 *         description: Veritabanı bağlantı hatası
 *   post:
 *     summary: Otomatik ders programı oluşturur
 *     description: Belirtilen okul için mevcut programı temizleyip yeniden otomatik program oluşturur.
 *     tags: [DersProgrami]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               okul_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ders programı başarıyla oluşturuldu!
 *       400:
 *         description: okul_id gerekli
 *       500:
 *         description: API Hatası
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const okulId = searchParams.get("okul_id");

    if (!okulId) {
      return NextResponse.json({ success: false, error: "okul_id gerekli" }, { status: 400 });
    }

    const result = await pool.query(`
      SELECT dp.id, dp.sube_adi, dp.gun_no, dp.ders_saati, dp.ogr_ders_id, oda.ogretmen_id
      FROM ders_programi dp
      INNER JOIN ogretmenlere_ders_atama oda ON dp.ogr_ders_id = oda.id
      WHERE oda.okul_id = $1
      ORDER BY dp.sube_adi, dp.gun_no, dp.ders_saati
    `, [okulId]);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Veritabanı bağlantı hatası:", error);
    return NextResponse.json({ success: false, error: "Veritabanına bağlanılamadı" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { okul_id } = body;

    if (!okul_id) {
      return NextResponse.json({ success: false, error: "okul_id gerekli" }, { status: 400 });
    }

    await pool.query(`
      DELETE FROM ders_programi
      WHERE ogr_ders_id IN (
        SELECT id FROM ogretmenlere_ders_atama WHERE okul_id = $1
      )
    `, [okul_id]);

    await pool.query('CALL public.otomatik_ders_atama($1)', [okul_id]);

   
    const result = await pool.query(`
      SELECT dp.id, dp.sube_adi, dp.gun_no, dp.ders_saati, dp.ogr_ders_id, oda.ogretmen_id
      FROM ders_programi dp
      INNER JOIN ogretmenlere_ders_atama oda ON dp.ogr_ders_id = oda.id
      WHERE oda.okul_id = $1
      ORDER BY dp.sube_adi, dp.gun_no, dp.ders_saati
    `, [okul_id]);

    return NextResponse.json({
      success: true,
      message: 'Ders programı başarıyla oluşturuldu!',
      data: result.rows,
    }, { status: 200 });

  } catch (error) {
    console.error("API Hatası:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}