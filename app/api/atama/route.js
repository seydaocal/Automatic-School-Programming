import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/atama:
 *   get:
 *     summary: Atama listesini getirir
 *     description: Belirtilen okul ID'sine ait öğretmen ders atamalarını listeler.
 *     tags: [Atama]
 *     parameters:
 *       - in: query
 *         name: okul_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listelenecek okulun ID'si
 *     responses:
 *       200:
 *         description: Başarılı liste
 *       400:
 *         description: okul_id parametresi eksik
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Veritabanı bağlantı hatası
 *   post:
 *     summary: Yeni ders ataması oluşturur
 *     description: Öğretmene ders ataması yapar (Yalnızca Admin).
 *     tags: [Atama]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               okulId:
 *                 type: integer
 *               ders_id:
 *                 type: integer
 *               ogretmen_id:
 *                 type: integer 
 *     responses:
 *       201:
 *         description: Kayıt başarıyla eklendi!
 *       400:
 *         description: Okul, ders ve öğretmen bilgisi zorunludur
 *       403:
 *         description: Yetkisiz erişim (Yönetici gerekli)
 *       409:
 *         description: Bu öğretmene bu ders zaten atanmış
 *       500:
 *         description: Sunucu hatası
 *   put:
 *     summary: Mevcut ders atamasını günceller
 *     description: Atama bilgilerini günceller (Yalnızca Admin).
 *     tags: [Atama]
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
 *               ders_id:
 *                 type: integer
 *               ogretmen_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Atama bilgileri başarıyla güncellendi!
 *       400:
 *         description: Güncellenecek atamanın id bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Güncellenecek atama bulunamadı
 *       500:
 *         description: Sunucu hatası
 *   delete:
 *     summary: Ders atamasını siler
 *     description: Atamayı siler ve ders programını günceller.
 *     tags: [Atama]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Kayıt silindi ve program güncellendi
 *       500:
 *         description: Silme ve yeniden oluşturma hatası
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
      'SELECT id, okul_id, ders_id, ogretmen_id FROM ogretmenlere_ders_atama WHERE okul_id = $1',
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
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Sadece yönetici atama ekleyebilir.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const okulId = body.okulId ?? body.okul_id;
    const ders = body.ders_id ?? body.ders;
    const ogretmen = body.ogretmen_id ?? body.ogretmen;

    if (!okulId || !ders || !ogretmen) {
      return NextResponse.json({ success: false, error: 'Okul, ders ve öğretmen bilgisi zorunludur.' }, { status: 400 });
    }

    const duplicateCheck = await pool.query(
      'SELECT id FROM ogretmenlere_ders_atama WHERE okul_id = $1 AND ders_id = $2 AND ogretmen_id = $3',
      [okulId, Number(ders), Number(ogretmen)]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Bu öğretmene bu ders zaten atanmış!' }, { status: 409 });
    }

    const queryText = `
      INSERT INTO ogretmenlere_ders_atama (okul_id, ders_id, ogretmen_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [okulId, Number(ders), Number(ogretmen)];
    const result = await pool.query(queryText, values);

    return NextResponse.json({
      success: true,
      message: 'Kayıt başarıyla eklendi!',
      data: result.rows[0],
    }, { status: 201 });
  } catch (error) {
    if (error && error.code === '23505') {
      return NextResponse.json({ success: false, error: 'Bu öğretmene bu ders zaten atanmış!' }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: error.message || 'Atama eklenemedi.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, okulId, okul_id, ders_id, ders, ogretmen_id, ogretmen } = body;
    const resolvedOkulId = okulId ?? okul_id;
    const resolvedDersId = ders_id ?? ders;
    const resolvedOgretmenId = ogretmen_id ?? ogretmen;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Güncellenecek atamanın id bilgisi eksik!' }, { status: 400 });
    }

    const queryText = `
      UPDATE ogretmenlere_ders_atama
      SET okul_id = $1, ders_id = $2, ogretmen_id = $3
      WHERE id = $4
      RETURNING *;
    `;

    const values = [resolvedOkulId, Number(resolvedDersId), Number(resolvedOgretmenId), id];
    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Güncellenecek atama bulunamadı!' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Atama bilgileri başarıyla güncellendi!',
      data: result.rows[0],
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Atama güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Sadece yönetici atama silebilir.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { atamaId, okulId } = body;

    if (!atamaId || !okulId) {
      return NextResponse.json({ success: false, error: 'Atama ID ve okul ID gereklidir.' }, { status: 400 });
    }

    // Bu atamanın gerçekten bu yöneticinin okuluna ait olduğunu doğrula
    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [okulId, session.user?.id]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    await pool.query(
      `DELETE FROM ders_programi WHERE ogr_ders_id = $1`,
      [atamaId]
    );

    await pool.query(
      `DELETE FROM ogretmenlere_ders_atama WHERE id = $1`,
      [atamaId]
    );

    await pool.query('CALL otomatik_ders_atama($1)', [okulId]);

    return NextResponse.json({ success: true, message: 'Kayıt silindi ve program güncellendi.' });
  } catch (error) {
    console.error('Silme ve yeniden oluşturma hatası:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}