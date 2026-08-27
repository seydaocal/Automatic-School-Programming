import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/siniflar:
 *   get:
 *     summary: Sınıf ve şubeleri listeler
 *     description: Belirtilen okul ID'sine ait sınıf ve şube tanımlarını listeler.
 *     tags: [SinifSube]
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
 *         description: Yetkisiz erişim veya okula erişim hakkı yok
 *       500:
 *         description: Şube listesi alınamadı
 *   post:
 *     summary: Yeni sınıf/şube ekler
 *     description: Okula yeni bir sınıf ve şube tanımı ekler (Yalnızca Admin).
 *     tags: [SinifSube]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               okulId:
 *                 type: integer
 *               sube:
 *                 type: integer
 *               seviye:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Şube başarıyla eklendi!
 *       400:
 *         description: Okul ID ve şube adı zorunludur
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Bu sınıf/şube çifti zaten kayıtlı
 *       500:
 *         description: Şube ekleme hatası
 *   put:
 *     summary: Sınıf/şube bilgilerini günceller
 *     description: Mevcut sınıf veya şube tanımını günceller (Yalnızca Admin).
 *     tags: [SinifSube]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             id:
 *               type: integer
 *             okulId:
 *               type: integer
 *             sube:
 *               type: integer
 *             seviye:
 *               type: integer
 *     responses:
 *       200:
 *         description: Sınıf başarıyla güncellendi
 *       400:
 *         description: Eksik ID veya zorunlu alanlar
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Güncellenecek sınıf bulunamadı
 *       409:
 *         description: Sınıf/şube çifti çakışması
 *       500:
 *         description: Şube güncelleme hatası
 *   delete:
 *     summary: Sınıf/şube siler
 *     description: Belirtilen ID'ye sahip sınıf veya şube tanımını siler (Yalnızca Admin).
 *     tags: [SinifSube]
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
 *         description: Sınıf silindi
 *       400:
 *         description: Sınıf ID gereklidir
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sınıf silme hatası
 */

function buildDuplicateMessage() {
  return 'Bu sınıf/şube çifti zaten kayıtlı. Lütfen farklı bir sınıf veya şube seçin.';
}

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawOkulId = searchParams.get('okul_id');
    const okulId = Number.parseInt(rawOkulId || '', 10);
    const userId = session.user?.id;
    const userRol = session.user?.rol;

    if (!rawOkulId || Number.isNaN(okulId)) {
      return NextResponse.json({ error: 'Okul ID gereklidir.' }, { status: 400 });
    }

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

    if (!okulCheck || okulCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT id, sınıf_seviyesi AS seviye, sınıf_şubesi AS sube, okul_id,
             (sınıf_seviyesi::text || ' ' || sınıf_şubesi) AS ad
       FROM sınıf_sube_tanımlama
       WHERE okul_id = $1
       ORDER BY sınıf_seviyesi::text ASC, sınıf_şubesi ASC`,
      [okulId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Şube listesi hatası:', error);
    return NextResponse.json({ success: false, error: 'Şube listesi alınamadı.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Yetkisiz erişim. Sadece yönetici şube ekleyebilir.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { okulId, sube, seviye } = body;
    const userId = session.user?.id;

    const normalizedSube = typeof sube === 'string' ? sube.trim() : sube;
    const normalizedSeviye = seviye === null || seviye === undefined || seviye === '' ? null : String(seviye).trim();

    if (!okulId || !normalizedSube) {
      return NextResponse.json(
       { success: false, error: 'Okul ID ve şube adı zorunludur.' },
       { status: 400 }
      );
    }

    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [okulId, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    const duplicateCheck = await pool.query(
      `SELECT id
       FROM sınıf_sube_tanımlama
       WHERE okul_id = $1 AND sınıf_seviyesi IS NOT DISTINCT FROM $2 AND sınıf_şubesi = $3`,
      [okulId, normalizedSeviye, normalizedSube]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: buildDuplicateMessage() }, { status: 409 });
    }

    const result = await pool.query(
      `INSERT INTO sınıf_sube_tanımlama (sınıf_şubesi, sınıf_seviyesi, okul_id)
       VALUES ($1, $2, $3)
       RETURNING id, sınıf_seviyesi AS seviye, sınıf_şubesi AS sube, okul_id,
                (sınıf_seviyesi::text || ' ' || sınıf_şubesi) AS ad`,
      [normalizedSube, normalizedSeviye, okulId]
    );

    return NextResponse.json(
      {
       success: true,
       message: 'Şube başarıyla eklendi!',
       data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error && error.code === '23505') {
      return NextResponse.json({ success: false, error: buildDuplicateMessage() }, { status: 409 });
    }

    console.error('Şube ekleme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Şube eklenemedi.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, okulId, sube, seviye } = body;
    const userId = session.user?.id;

    const normalizedSube = typeof sube === 'string' ? sube.trim() : sube;
    const normalizedSeviye = seviye === null || seviye === undefined || seviye === '' ? null : String(seviye).trim();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Güncellenecek sınıfın ID bilgisi eksik.' }, { status: 400 });
    }

    if (!okulId || !normalizedSube) {
      return NextResponse.json({ success: false, error: 'Okul ID ve şube adı zorunludur.' }, { status: 400 });
    }

    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [okulId, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
    }

    const duplicateCheck = await pool.query(
      `SELECT id
       FROM sınıf_sube_tanımlama
       WHERE okul_id = $1 AND sınıf_seviyesi IS NOT DISTINCT FROM $2 AND sınıf_şubesi = $3 AND id <> $4`,
      [okulId, normalizedSeviye, normalizedSube, id]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: buildDuplicateMessage() }, { status: 409 });
    }

    const result = await pool.query(
      `UPDATE sınıf_sube_tanımlama
       SET sınıf_şubesi = $1, sınıf_seviyesi = $2, okul_id = $3
       WHERE id = $4
       RETURNING id, sınıf_seviyesi AS seviye, sınıf_şubesi AS sube, okul_id,
                (sınıf_seviyesi::text || ' ' || sınıf_şubesi) AS ad`,
      [normalizedSube, normalizedSeviye, okulId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Güncellenecek sınıf bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Sınıf başarıyla güncellendi.', data: result.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      return NextResponse.json({ success: false, error: buildDuplicateMessage() }, { status: 409 });
    }

    console.error('Şube güncelleme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Sınıf güncellenemedi.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Sınıf ID gereklidir.' }, { status: 400 });
    }

    const userId = session.user?.id;
    const ownerCheck = await pool.query(
      `SELECT s.id
       FROM sınıf_sube_tanımlama s
       INNER JOIN okullar o ON o.id = s.okul_id
       WHERE s.id = $1 AND o.yonetici_kullanici_id = $2`,
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Bu sınıfa erişim hakkınız yok.' }, { status: 403 });
    }

    await pool.query('DELETE FROM sınıf_sube_tanımlama WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Sınıf silindi.' });
  } catch (error) {
    console.error('Sınıf silme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'Sınıf silinemedi.' }, { status: 500 });
  }
}