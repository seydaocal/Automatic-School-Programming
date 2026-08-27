import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/ders-ucreti:
 *   get:
 *     summary: Ders ücretlerini listeler
 *     description: Belirtilen okul ID'sine göre ders ücreti kayıtlarını getirir.
 *     tags: [DersUcreti]
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
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Veritabanı bağlantı hatası
 *   post:
 *     summary: Yeni ders ücreti ekler
 *     description: Belirtilen okul ve ders için ücret kaydı oluşturur (Yalnızca Admin).
 *     tags: [DersUcreti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               okulId:
 *                 type: integer
 *               unvan:
 *                 type: string
 *               ucret:
 *                 type: number
 *     responses:
 *       201:
 *         description: Ders ücreti başarıyla eklendi!
 *       400:
 *         description: Okul ve ders bilgisi zorunludur
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 *   put:
 *     summary: Ders ücretini günceller
 *     description: Mevcut ders ücreti kaydını günceller (Yalnızca Admin).
 *     tags: [DersUcreti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               okulId:
 *                 type: integer
 *               unvan:
 *                 type: string
 *               ucret:
 *                 type: number
 *     responses:
 *       200:
 *         description: Ders ücreti başarıyla güncellendi!
 *       400:
 *         description: Güncellenecek ücretin id bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Güncellenecek ücret kaydı bulunamadı
 *       500:
 *         description: Sunucu hatası
 *   delete:
 *     summary: Ders ücretini siler
 *     description: Belirtilen ID'ye sahip ders ücreti kaydını siler (Yalnızca Admin).
 *     tags: [DersUcreti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ders ücreti başarıyla silindi!
 *       400:
 *         description: Silinecek ücretin id bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Silinecek ücret kaydı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const okulId = searchParams.get('okul_id');

    if (!okulId) {
      return NextResponse.json({ success: false, error: 'okul_id gerekli' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, okul_id, ders_id, saatlik_ucret, "aylık_ucret" AS aylik_ucret FROM ders_ucreti WHERE okul_id = $1',
      [okulId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    return NextResponse.json({ success: false, error: 'Veritabanına bağlanılamadı' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Sadece yönetici ücret ekleyebilir.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { okulId, ders_id, saatlik_ucret, aylik_ucret } = body;

    if (!okulId || !ders_id) {
      return NextResponse.json({ success: false, error: 'Okul ve ders bilgisi zorunludur.' }, { status: 400 });
    }

    const queryText = `
      INSERT INTO ders_ucreti (okul_id, ders_id, saatlik_ucret, "aylık_ucret")
      VALUES ($1, $2, $3, $4)
      RETURNING id, okul_id, ders_id, saatlik_ucret, "aylık_ucret" AS aylik_ucret;
    `;

    const values = [okulId, ders_id, saatlik_ucret ?? 0, aylik_ucret ?? null];
    const result = await pool.query(queryText, values);

    return NextResponse.json({
      success: true,
      message: 'Ders ücreti başarıyla eklendi!',
      data: result.rows[0],
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Ders ücreti eklenemedi.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, okulId, ders_id, saatlik_ucret, aylik_ucret } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Güncellenecek ücretin id bilgisi eksik!' }, { status: 400 });
    }

    const queryText = `
      UPDATE ders_ucreti
      SET okul_id = $1, ders_id = $2, saatlik_ucret = $3, "aylık_ucret" = $4
      WHERE id = $5
      RETURNING id, okul_id, ders_id, saatlik_ucret, "aylık_ucret" AS aylik_ucret;
    `;

    const values = [okulId ?? null, ders_id ?? null, saatlik_ucret ?? 0, aylik_ucret ?? null, id];
    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Güncellenecek ücret kaydı bulunamadı!' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ders ücreti başarıyla güncellendi!',
      data: result.rows[0],
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Ders ücreti güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Silinecek ücretin id bilgisi eksik!' }, { status: 400 });
    }

    const queryText = `
      DELETE FROM ders_ucreti
      WHERE id = $1
      RETURNING *;
    `;

    const values = [id];
    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Silinecek ücret kaydı bulunamadı!' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ders ücreti başarıyla silindi!',
      data: result.rows[0],
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Ders ücreti silinemedi.' }, { status: 500 });
  }
}