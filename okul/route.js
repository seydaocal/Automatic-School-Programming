import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { otomatikDersSaatleriniUygula } from '@/lib/ders-saatleri-hesapla';

/**
 * @swagger
 * /api/okul:
 *   get:
 *     summary: Okul listesini getirir
 *     description: Oturum açan kullanıcının rolüne göre (admin veya öğretmen) ilişkili okulları listeler.
 *     tags: [Okul]
 *     responses:
 *       200:
 *         description: Başarılı liste
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Veritabanı bağlantı hatası
 *   post:
 *     summary: Yeni okul ekler
 *     tags: [Okul]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ad:
 *                 type: string
 *               il:
 *                 type: string
 *               ilce:
 *                 type: string
 *               sayi:
 *                 type: integer
 *               sure:
 *                 type: integer
 *               molas:
 *                 type: integer
 *               gun:
 *                 type: array
 *                 items:
 *                   type: string
 *               ilk_ders_baslangic_saati:
 *                 type: string
 *     responses:
 *       201:
 *         description: Başarıyla eklendi
 *       400:
 *         description: Zorunlu alanlar eksik
 *       403:
 *         description: Yetkisiz erişim (Admin gerekli)
 *       409:
 *         description: Bu kayıt zaten mevcut
 *       500:
 *         description: Sunucu hatası
 *   put:
 *     summary: Okul bilgilerini günceller
 *     tags: [Okul]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               ad:
 *                 type: string
 *               il:
 *                 type: string
 *               ilce:
 *                 type: string
 *               sayi:
 *                 type: integer
 *               sure:
 *                 type: integer
 *               molas:
 *                 type: integer
 *               gun:
 *                 type: array
 *                 items:
 *                   type: string
 *               ilk_ders_baslangic_saati:
 *                 type: string
 *     responses:
 *       200:
 *         description: Okul bilgileri başarıyla güncellendi
 *       400:
 *         description: ID bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim veya okul bulunamadı
 *       500:
 *         description: Sunucu hatası
 *   delete:
 *     summary: Okul siler
 *     tags: [Okul]
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
 *         description: Okul başarıyla silindi
 *       400:
 *         description: ID bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim veya okul bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Yetkisiz erişim.' },
      { status: 403 }
    );
  }

  try {
    const userId = session.user?.id;
    const userRol = session.user?.rol;

    let query = 'SELECT id, okul_adı AS ad, il_adı AS il, ilce_adı AS ilce, gunluk_ders_sayısı AS sayi, ders_suresi AS sure, mola_suresi AS molas, egitim_gunleri AS gun, ilk_ders_baslangic_saati FROM okullar';
    let params = [];

    if (userRol === 'admin') {
      query += ' WHERE yonetici_kullanici_id = $1';
      params = [userId];
    } else if (userRol === 'ogretmen') {
      query += ` WHERE id IN (
        SELECT okul_id FROM ogretmenler WHERE id = $1
      )`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Veritabanı bağlantı hatası:", error);
    return NextResponse.json(
      { error: "Veritabanına bağlanılamadı" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json(
      { error: 'Yetkisiz erişim. Sadece yönetici okul ekleyebilir.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { ad, il, ilce, sayi, sure, molas, gun, ilk_ders_baslangic_saati } = body;
    const userId = session.user?.id;

    if (!ad || !il || !ilce) {
      return NextResponse.json(
        { error: 'Ad, il ve ilçe zorunludur.' },
        { status: 400 }
      );
    }

    const dersSuresi = sure || 0;
    const molaSuresi = molas || 0;
    const gunlukDersSayisi = sayi || 0;
    const egitimGunleri = gun || [];
    const ilkDersSaati = ilk_ders_baslangic_saati || '08:30';

    const client = await pool.connect();
    let yeniOkul;
    try {
      await client.query('BEGIN');

      const queryText = `
        INSERT INTO okullar (okul_adı, il_adı, ilce_adı, gunluk_ders_sayısı, ders_suresi, mola_suresi, egitim_gunleri, ilk_ders_baslangic_saati, yonetici_kullanici_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const values = [ad, il, ilce, gunlukDersSayisi, dersSuresi, molaSuresi, egitimGunleri, ilkDersSaati, userId];
      const result = await client.query(queryText, values);
      yeniOkul = result.rows[0];

      if (gunlukDersSayisi > 0 && egitimGunleri.length > 0) {
        await otomatikDersSaatleriniUygula(client, yeniOkul.id, {
          ilkDersBaslangicSaati: ilkDersSaati,
          dersSuresi,
          molaSuresi,
          gunlukDersSayisi,
          gunler: egitimGunleri,
        });
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Kayıt başarıyla eklendi!',
      data: yeniOkul,
    }, { status: 201 });

  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({
        success: false,
        error: 'Bu isimde bir okul zaten kayıtlı. Lütfen farklı bir isim girin.',
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json(
      { error: 'Yetkisiz erişim.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, ad, il, ilce, sayi, sure, molas, gun, ilk_ders_baslangic_saati } = body;
    const userId = session.user?.id;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek okulun id bilgisi eksik!',
      }, { status: 400 });
    }

    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [id, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Bu okula erişim hakkınız yok veya okul bulunamadı!',
      }, { status: 403 });
    }

    const dersSuresi = sure || 0;
    const molaSuresi = molas || 0;
    const gunlukDersSayisi = sayi || 0;
    const egitimGunleri = gun || [];
    const ilkDersSaati = ilk_ders_baslangic_saati || '08:30';

    const client = await pool.connect();
    let guncelOkul;
    try {
      await client.query('BEGIN');

      const queryText = `
        UPDATE okullar
        SET okul_adı = $1, il_adı = $2, ilce_adı = $3, gunluk_ders_sayısı = $4, ders_suresi = $5, mola_suresi = $6, egitim_gunleri = $7, ilk_ders_baslangic_saati = $8, yonetici_kullanici_id = $9
        WHERE id = $10
        RETURNING *;
      `;
      const values = [ad, il, ilce, gunlukDersSayisi, dersSuresi, molaSuresi, egitimGunleri, ilkDersSaati, userId, id];
      const result = await client.query(queryText, values);
      guncelOkul = result.rows[0];

      if (gunlukDersSayisi > 0 && egitimGunleri.length > 0) {
        await otomatikDersSaatleriniUygula(client, id, {
          ilkDersBaslangicSaati: ilkDersSaati,
          dersSuresi,
          molaSuresi,
          gunlukDersSayisi,
          gunler: egitimGunleri,
        });
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Okul bilgileri başarıyla güncellendi!',
      data: guncelOkul,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json(
      { error: 'Yetkisiz erişim.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;
    const userId = session.user?.id;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Silinecek okulun id bilgisi eksik!',
      }, { status: 400 });
    }

    const okulCheck = await pool.query(
      'SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2',
      [id, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Bu okula erişim hakkınız yok veya okul bulunamadı!',
      }, { status: 403 });
    }

    const queryText = `
      DELETE FROM okullar 
      WHERE id = $1 
      RETURNING *;
    `;
    
    const values = [id];
    const result = await pool.query(queryText, values);

    return NextResponse.json({
      success: true,
      message: 'Okul başarıyla silindi!',
      data: result.rows[0],
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}