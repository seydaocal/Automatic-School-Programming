import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/izinler:
 *   get:
 *     summary: Öğretmen izinlerini listeler
 *     description: Rol bazlı olarak öğretmenlerin kendi izinlerini ya da adminlerin okula ait izinleri listelemesini sağlar.
 *     tags: [Izinler]
 *     parameters:
 *       - in: query
 *         name: okul_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Okul ID'si (Adminler için gereklidir)
 *     responses:
 *       200:
 *         description: Başarılı liste
 *       400:
 *         description: Okul ID gereklidir veya geçersiz rol
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Öğretmen kaydı eşleştirilmemiş
 *       500:
 *         description: İzin listesi alınamadı
 *   post:
 *     summary: Yeni izin ekler
 *     description: Öğretmen veya yöneticilerin yeni izin talebi eklemesini sağlar. Admin için okulId ve ogretmen_id zorunludur; öğretmen kendi hesabıyla ekliyorsa bu alanlar oturumdan otomatik alınır.
 *     tags: [Izinler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gun_no
 *               - baslangic_saati
 *               - bitis_saati
 *             properties:
 *               okulId:
 *                 type: integer
 *               ogretmen_id:
 *                 type: integer
 *               gun_no:
 *                 type: integer
 *               tarih:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               baslangic_saati:
 *                 type: string
 *               bitis_saati:
 *                 type: string
 *               aciklama:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: İzin başarıyla eklendi!
 *       400:
 *         description: Eksik veya zorunlu alanlar
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Öğretmen kaydı eşleştirilmemiş
 *       500:
 *         description: İzin eklenemedi
 *   put:
 *     summary: İzin bilgilerini günceller
 *     description: Mevcut izin kaydını günceller.
 *     tags: [Izinler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - gun_no
 *               - baslangic_saati
 *               - bitis_saati
 *             properties:
 *               id:
 *                 type: integer
 *               okulId:
 *                 type: integer
 *               ogretmen_id:
 *                 type: integer
 *               gun_no:
 *                 type: integer
 *               tarih:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               baslangic_saati:
 *                 type: string
 *               bitis_saati:
 *                 type: string
 *               aciklama:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: İzin başarıyla güncellendi
 *       400:
 *         description: Eksik veya hatalı bilgi
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Güncellenecek izin bulunamadı
 *       500:
 *         description: İzin güncellenemedi
 *   delete:
 *     summary: İzin kaydını siler
 *     description: Belirtilen ID'ye sahip izin kaydını siler.
 *     tags: [Izinler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: İzin başarıyla silindi
 *       400:
 *         description: Silinecek izin ID gereklidir
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Silinecek izin bulunamadı veya erişim yok
 *       500:
 *         description: İzin silinemedi
 */

function normalizeNullable(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim();
}

// "YYYY-MM-DD" formatını doğrular; boş/geçersizse null döner (kalıcı izin anlamına gelir)
function normalizeTarih(value) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const userId = session.user?.id;
    const userRol = session.user?.rol;

    if (userRol === 'ogretmen') {
      const ogretmenId = session.user?.ogretmen_id;

      if (!ogretmenId) {
        return NextResponse.json(
          { success: false, error: 'Hesabınız henüz bir öğretmen kaydıyla eşleştirilmemiş.' },
          { status: 409 }
        );
      }

      const result = await pool.query(
        `SELECT id, gun_no, tarih, baslangic_saati, bitis_saati, aciklama, ogretmen_id, okul_id, onaylandi
         FROM ogretmen_izinleri
         WHERE ogretmen_id = $1
         ORDER BY tarih NULLS LAST, gun_no ASC`,
        [ogretmenId]
      );

      return NextResponse.json({ success: true, data: result.rows });
    }

    if (userRol === 'admin') {
      const { searchParams } = new URL(request.url);
      const okulId = searchParams.get('okul_id');

      if (!okulId) {
        return NextResponse.json({ success: false, error: 'Okul ID gereklidir.' }, { status: 400 });
      }

      const okulCheck = await pool.query(
        'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
        [okulId, userId]
      );

      if (okulCheck.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
      }

      const result = await pool.query(
        `SELECT i.id, i.gun_no, i.tarih, i.baslangic_saati, i.bitis_saati, i.aciklama, i.onaylandi,
                og.id AS ogretmen_id, og.ogretmen_adi AS ad, og.ogretmen_soyadı AS soyad,
                (
                  SELECT string_agg(DISTINCT (sst.sınıf_seviyesi || sst.sınıf_şubesi), ', ' ORDER BY (sst.sınıf_seviyesi || sst.sınıf_şubesi))
                  FROM ders_programi dp
                  INNER JOIN ogretmenlere_ders_atama oda ON dp.ogr_ders_id = oda.id
                  LEFT JOIN sınıf_sube_tanımlama sst ON sst.id = dp.sube_adi
                  WHERE oda.ogretmen_id = og.id
                    AND dp.gun_no = i.gun_no
                    AND public.ders_saati_baslangic(og.okul_id, dp.gun_no, dp.ders_saati) < i.bitis_saati
                    AND public.ders_saati_bitis(og.okul_id, dp.gun_no, dp.ders_saati) > i.baslangic_saati
                ) AS cakisan_dersler
         FROM ogretmen_izinleri i
         INNER JOIN ogretmenler og ON i.ogretmen_id = og.id
         WHERE og.okul_id = $1
         ORDER BY i.tarih NULLS LAST, i.gun_no ASC`,
        [okulId]
      );

      return NextResponse.json({ success: true, data: result.rows });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz kullanıcı rolü.' }, { status: 400 });
  } catch (error) {
    console.error('İzin listesi hatası:', error);
    return NextResponse.json({ success: false, error: 'İzin listesi alınamadı' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.rol !== 'ogretmen' && session.user?.rol !== 'admin')) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Sadece öğretmen veya yönetici izin ekleyebilir.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { okulId, ogretmen_id, gun_no, tarih, baslangic_saati, bitis_saati, aciklama } = body;
    const userId = session.user?.id;
    const targetOgretmenId = session.user?.rol === 'admin' ? ogretmen_id : session.user?.ogretmen_id;
    const normalizedTarih = normalizeTarih(tarih);

    if (session.user?.rol === 'ogretmen' && !targetOgretmenId) {
      return NextResponse.json(
        { success: false, error: 'Hesabınız henüz bir öğretmen kaydıyla eşleştirilmemiş.' },
        { status: 409 }
      );
    }

    if (!gun_no || !baslangic_saati || !bitis_saati) {
      return NextResponse.json({ success: false, error: 'Gün, başlangıç ve bitiş saati zorunludur.' }, { status: 400 });
    }

    if (session.user?.rol === 'admin' && (!okulId || !targetOgretmenId)) {
      return NextResponse.json({ success: false, error: 'Yönetici için okul ve öğretmen bilgisi zorunludur.' }, { status: 400 });
    }

    if (session.user?.rol === 'admin') {
      const okulCheck = await pool.query(
        'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
        [okulId, userId]
      );

      if (okulCheck.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
      }
    }

    const result = await pool.query(
      `INSERT INTO ogretmen_izinleri (gun_no, tarih, baslangic_saati, bitis_saati, aciklama, ogretmen_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [gun_no, normalizedTarih, baslangic_saati, bitis_saati, normalizeNullable(aciklama), targetOgretmenId]
    );

    return NextResponse.json({
      success: true,
      message: 'İzin başarıyla eklendi!',
      data: result.rows[0],
    }, { status: 201 });
  } catch (error) {
    console.error('İzin ekleme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'İzin eklenemedi.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.rol !== 'ogretmen' && session.user?.rol !== 'admin')) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, okulId, ogretmen_id, gun_no, tarih, baslangic_saati, bitis_saati, aciklama } = body;
    const userId = session.user?.id;
    const targetOgretmenId = session.user?.rol === 'admin' ? ogretmen_id : session.user?.ogretmen_id;
    const normalizedTarih = normalizeTarih(tarih);

    if (session.user?.rol === 'ogretmen' && !targetOgretmenId) {
      return NextResponse.json(
        { success: false, error: 'Hesabınız henüz bir öğretmen kaydıyla eşleştirilmemiş.' },
        { status: 409 }
      );
    }

    if (!id || !gun_no || !baslangic_saati || !bitis_saati) {
      return NextResponse.json({ success: false, error: 'Güncellenen izin bilgileri eksik.' }, { status: 400 });
    }

    if (session.user?.rol === 'admin' && (!okulId || !targetOgretmenId)) {
      return NextResponse.json({ success: false, error: 'Yönetici için okul ve öğretmen bilgisi zorunludur.' }, { status: 400 });
    }

    if (session.user?.rol === 'admin') {
      const okulCheck = await pool.query(
        'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
        [okulId, userId]
      );

      if (okulCheck.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Bu okula erişim hakkınız yok.' }, { status: 403 });
      }
    }

    const result = await pool.query(
      `UPDATE ogretmen_izinleri
       SET gun_no = $1,
           tarih = $2,
           baslangic_saati = $3,
           bitis_saati = $4,
           aciklama = $5,
           ogretmen_id = $6
       WHERE id = $7
       RETURNING *`,
      [gun_no, normalizedTarih, baslangic_saati, bitis_saati, normalizeNullable(aciklama), targetOgretmenId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Güncellenecek izin bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'İzin başarıyla güncellendi.', data: result.rows[0] });
  } catch (error) {
    console.error('İzin güncelleme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'İzin güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.rol !== 'ogretmen' && session.user?.rol !== 'admin')) {
    return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Silinecek izin ID gereklidir.' }, { status: 400 });
    }

    const targetOgretmenId = session.user?.rol === 'admin' ? null : session.user?.ogretmen_id;
    const userId = session.user?.id;

    const result = await pool.query(
      `DELETE FROM ogretmen_izinleri
       WHERE id = $1 AND ($2::integer = ogretmen_id OR EXISTS (
         SELECT 1 FROM okullar o
         INNER JOIN ogretmenler og ON og.okul_id = o.id
         WHERE og.id = ogretmen_izinleri.ogretmen_id AND o.yonetici_kullanici_id = $3
       ))
       RETURNING *`,
      [id, targetOgretmenId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Silinecek izin bulunamadı veya erişim yok.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'İzin başarıyla silindi.', data: result.rows[0] });
  } catch (error) {
    console.error('İzin silme hatası:', error);
    return NextResponse.json({ success: false, error: error.message || 'İzin silinemedi.' }, { status: 500 });
  }
}