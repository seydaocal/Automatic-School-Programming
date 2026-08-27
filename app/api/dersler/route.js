import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/dersler:
 *   get:
 *     summary: Ders listesini getirir
 *     tags: [Dersler]
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
 *         description: Okul ID gereklidir
 *       403:
 *         description: Yetkisiz erişim veya bu okula erişim hakkı yok
 *       500:
 *         description: Sunucu hatası
 *   post:
 *     summary: Yeni ders ekler
 *     tags: [Dersler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               okulId:
 *                 type: integer
 *               ad:
 *                 type: string
 *               seviye:
 *                 type: string
 *               saat:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Ders başarıyla eklendi!
 *       400:
 *         description: Okul ID ve ders adı zorunludur
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 *   put:
 *     summary: Ders bilgilerini günceller
 *     tags: [Dersler]
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
 *               ad:
 *                 type: string
 *               seviye:
 *                 type: string
 *               saat:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ders başarıyla güncellendi
 *       400:
 *         description: Eksik alanlar
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Güncellenecek ders bulunamadı
 *       500:
 *         description: Sunucu hatası
 *   delete:
 *     summary: Ders siler
 *     tags: [Dersler]
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
 *         description: Ders silindi ve program güncellendi
 *       400:
 *         description: Silinecek ders ID gereklidir
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Silinecek ders bulunamadı
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
    const rawOkulId = searchParams.get('okul_id');
    const userId = session.user?.id;
    const userRol = session.user?.rol;

    if (!rawOkulId) {
      return NextResponse.json({ success: false, error: 'Okul ID gereklidir.' }, { status: 400 });
    }

    const okulId = Number.parseInt(rawOkulId, 10);

    let okulCheck = { rows: [] };

    if (userRol === 'admin') {
      okulCheck = await pool.query(
        'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
        [okulId, userId]
      );
    } else if (userRol === 'ogretmen') {
      okulCheck = await pool.query(
        `SELECT o.id FROM okullar o
         INNER JOIN ogretmenler og ON o.id = og.okul_id
         WHERE o.id = $1 AND og.id = $2`,
        [okulId, userId]
      );
    }

    if (!okulCheck.rows || okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT id, ders_adi AS ad, ders_seviyesi AS seviye, haftalik_ders_saati AS saat, okul_id
       FROM dersler
       WHERE okul_id = $1
       ORDER BY ders_adi ASC`,
      [okulId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Ders listesi hatası:', error);
    return NextResponse.json({ success: false, error: 'Ders listesi alınamadı' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Sadece yönetici ders ekleyebilir.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { okulId, ad, seviye, saat } = body;
    const userId = session.user?.id;

    if (!okulId || !ad) {
      return NextResponse.json({ success: false, error: 'Okul ID ve ders adı zorunludur.' }, { status: 400 });
    }

    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [okulId, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    const result = await pool.query(
      `INSERT INTO dersler (ders_adi, ders_seviyesi, haftalik_ders_saati, okul_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [String(ad).trim(), seviye || null, saat || 1, okulId]
    );

    return NextResponse.json({
      success: true,
      message: 'Ders başarıyla eklendi!',
      data: {
        id: result.rows[0].id,
        ad: result.rows[0].ders_adi,
        seviye: result.rows[0].ders_seviyesi,
        saat: result.rows[0].haftalik_ders_saati,
        okul_id: result.rows[0].okul_id,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Ders ekleme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Ders eklenemedi.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, okulId, ad, seviye, saat } = body;
    const userId = session.user?.id;

    if (!id || !okulId || !ad) {
      return NextResponse.json({ success: false, error: 'Ders ID, okul ID ve ders adı zorunludur.' }, { status: 400 });
    }

    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [okulId, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    const result = await pool.query(
      `UPDATE dersler
       SET ders_adi = $1, ders_seviyesi = $2, haftalik_ders_saati = $3, okul_id = $4
       WHERE id = $5
       RETURNING *`,
      [String(ad).trim(), seviye || null, saat || 1, okulId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Güncellenecek ders bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ders başarıyla güncellendi.', data: result.rows[0] });
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Ders güncellenemedi.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Silinecek ders ID gereklidir.' }, { status: 400 });
    }

    const userId = session.user?.id;
    
    
    const ownerCheck = await pool.query(
      `SELECT d.okul_id
       FROM dersler d
       INNER JOIN okullar o ON o.id = d.okul_id
       WHERE d.id = $1 AND o.yonetici_kullanici_id = $2`,
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu dersi silmeye yetkiniz yok.' }, { status: 403 });
    }

    const okulId = ownerCheck.rows[0].okul_id;

   
    await pool.query(
      `DELETE FROM ders_programi WHERE ogr_ders_id IN (
         SELECT id FROM ogretmenlere_ders_atama WHERE ders_id = $1
       )`,
      [id]
    );


    await pool.query(`DELETE FROM ogretmenlere_ders_atama WHERE ders_id = $1`, [id]);


    const result = await pool.query(
      `DELETE FROM dersler
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Silinecek ders bulunamadı.' }, { status: 404 });
    }

    // 4. Ders silindiğine göre ders programını kalan verilerle yeniden oluştur
    if (okulId) {
      await pool.query('CALL otomatik_ders_atama($1::integer)', [okulId]);
    }

    return NextResponse.json({ success: true, message: 'Ders silindi ve program güncellendi.', data: result.rows[0] });
  } catch (error) {
    console.error('Ders silme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Ders silinemedi.' }, { status: 500 });
  }
}