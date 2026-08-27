import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/ogretmenler:
 *   get:
 *     summary: Öğretmenleri listeler
 *     description: Adminler için okula ait öğretmenleri, öğretmenler için ise kendi bilgilerini listeler.
 *     tags: [Ogretmenler]
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
 *       401:
 *         description: Oturum kullanıcı bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim veya okula erişim hakkı yok
 *       409:
 *         description: Öğretmen kaydı eşleştirilmemiş
 *       500:
 *         description: Öğretmen listesi alınamadı
 *   post:
 *     summary: Yeni öğretmen ekler
 *     description: Sisteme yeni bir öğretmen kaydı ekler (Yalnızca Admin).
 *     tags: [Ogretmenler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ad:
 *                 type: string
 *               soyad:
 *                 type: string
 *               tc:
 *                 type: integer
 *               dogum:
 *                 type: date
 *               mail:
 *                 type: string
 *               fotograf:
 *                 type: bytea
 *               ozgecmis:
 *                 type: bytea
 *               okulId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Öğretmen başarıyla eklendi
 *       400:
 *         description: Zorunlu alanlar eksik
 *       403:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Bu TC numarası başka bir öğretmene ait
 *       500:
 *         description: Öğretmen eklenemedi
 *   put:
 *     summary: Öğretmen bilgilerini günceller
 *     description: Admin veya öğretmenin ilgili kayıtları güncellemesini sağlar.
 *     tags: [Ogretmenler]
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
 *               soyad:
 *                 type: string
 *               tc:
 *                 type: integer
 *               dogum:
 *                 type: date
 *               mail:
 *                 type: string
 *               fotograf:
 *                 type: bytea
 *               ozgecmis:
 *                 type: bytea
 *               okulId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Öğretmen/bilgiler başarıyla güncellendi
 *       400:
 *         description: Güncellenecek bilgiler eksik
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Güncellenecek öğretmen bulunamadı
 *       409:
 *         description: TC numarası çakışması veya eşleşmeme
 *       500:
 *         description: Güncelleme hatası
 *   delete:
 *     summary: Öğretmen siler
 *     description: Belirtilen ID'ye sahip öğretmeni siler ve programı günceller (Yalnızca Admin).
 *     tags: [Ogretmenler]
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
 *         description: Öğretmen başarıyla silindi
 *       400:
 *         description: Silinecek öğretmenin ID bilgisi eksik
 *       403:
 *         description: Yetkisiz erişim veya yetki yok
 *       404:
 *         description: Öğretmen bulunamadı
 *       500:
 *         description: Öğretmen silme hatası
 */

function normalizeNullable(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value).trim();
}

function normalizeMail(value) {
  return String(value).trim().toLowerCase();
}

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const userId = session.user?.id;
  const userRol = session.user?.rol;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Oturum kullanıcı bilgisi eksik." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const okulId = searchParams.get("okul_id");

    if (userRol === "admin") {
      if (!okulId) {
        return NextResponse.json({ success: false, error: "Okul ID gereklidir." }, { status: 400 });
      }

      const okulCheck = await pool.query(
        "SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2",
        [okulId, userId]
      );

      if (okulCheck.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Bu okula erişim hakkınız yok." }, { status: 403 });
      }

      const result = await pool.query(
        `SELECT id, ogretmen_adi AS ad, ogretmen_soyadı AS soyad, tc_no AS tc, dogum_tarihi AS dogum, e_posta AS mail, fotograf, ozgecmis, okul_id
         FROM ogretmenler
         WHERE okul_id = $1
         ORDER BY ogretmen_adi, ogretmen_soyadı ASC`,
        [okulId]
      );

      return NextResponse.json({ success: true, data: result.rows });
    }

    if (userRol === "ogretmen") {
      const ogretmenId = session.user?.ogretmen_id;

      if (!ogretmenId) {
        return NextResponse.json(
          { success: false, error: "Hesabınız henüz bir öğretmen kaydıyla eşleştirilmemiş." },
          { status: 409 }
        );
      }

      const result = await pool.query(
        `SELECT id, ogretmen_adi AS ad, ogretmen_soyadı AS soyad, tc_no AS tc, dogum_tarihi AS dogum, e_posta AS mail, fotograf, ozgecmis, okul_id
         FROM ogretmenler
         WHERE id = $1`,
        [ogretmenId]
      );

      return NextResponse.json({ success: true, data: result.rows });
    }

    return NextResponse.json({ success: false, error: "Geçersiz kullanıcı rolü." }, { status: 400 });
  } catch (error) {
    console.error("Öğretmen listesi hatası:", error);
    return NextResponse.json({ success: false, error: "Öğretmen listesi alınamadı" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.rol !== "admin") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim. Sadece yönetici öğretmen ekleyebilir." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { ad, soyad, tc, dogum, mail, fotograf, ozgecmis, okulId } = body;

    if (!okulId || !ad || !soyad || !tc || !mail) {
      return NextResponse.json({ success: false, error: "Okul, ad, soyad, TC ve e-posta zorunludur." }, { status: 400 });
    }

    const userId = session.user?.id;
    const okulCheck = await pool.query(
      "SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2",
      [okulId, userId]
    );

    if (okulCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Bu okula erişim hakkınız yok." }, { status: 403 });
    }

    const result = await pool.query(
      `INSERT INTO ogretmenler (ogretmen_adi, ogretmen_soyadı, tc_no, dogum_tarihi, e_posta, fotograf, ozgecmis, okul_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, ogretmen_adi AS ad, ogretmen_soyadı AS soyad, tc_no AS tc, dogum_tarihi AS dogum, e_posta AS mail, fotograf, ozgecmis, okul_id`,
      [String(ad).trim(), String(soyad).trim(), String(tc).trim(), normalizeNullable(dogum), normalizeMail(mail), normalizeNullable(fotograf), normalizeNullable(ozgecmis), okulId]
    );

    return NextResponse.json({
      success: true,
      message: "Öğretmen başarıyla eklendi",
      data: result.rows[0],
    }, { status: 201 });
  } catch (error) {
    if (error && error.code === "23505") {
      return NextResponse.json({ success: false, error: "Bu TC numarası başka bir öğretmene ait." }, { status: 409 });
    }

    console.error("Öğretmen ekleme hatası:", error);
    return NextResponse.json({ success: false, error: error.message || "Öğretmen eklenemedi." }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.rol !== "admin" && session.user?.rol !== "ogretmen")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ad, soyad, tc, dogum, mail, fotograf, ozgecmis, okulId } = body;
    const userId = session.user?.id;

    if (!id || !ad || !soyad || !tc || !mail) {
      return NextResponse.json({ success: false, error: "Güncellenecek öğretmen bilgileri eksik." }, { status: 400 });
    }

   
    if (session.user?.rol === "admin") {
      if (!okulId) {
        return NextResponse.json({ success: false, error: "Okul bilgisi zorunludur." }, { status: 400 });
      }

      const okulCheck = await pool.query(
        "SELECT id FROM okullar WHERE id = $1 AND yonetici_kullanici_id = $2",
        [okulId, userId]
      );

      if (okulCheck.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Bu okula erişim hakkınız yok." }, { status: 403 });
      }

      const result = await pool.query(
        `UPDATE ogretmenler
         SET ogretmen_adi = $1,
             ogretmen_soyadı = $2,
             tc_no = $3,
             dogum_tarihi = $4,
             e_posta = $5,
             fotograf = $6,
             ozgecmis = $7,
             okul_id = $8
         WHERE id = $9
         RETURNING id, ogretmen_adi AS ad, ogretmen_soyadı AS soyad, tc_no AS tc, dogum_tarihi AS dogum, e_posta AS mail, fotograf, ozgecmis, okul_id`,
        [String(ad).trim(), String(soyad).trim(), String(tc).trim(), normalizeNullable(dogum), normalizeMail(mail), normalizeNullable(fotograf), normalizeNullable(ozgecmis), okulId, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Güncellenecek öğretmen bulunamadı." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Öğretmen başarıyla güncellendi.", data: result.rows[0] });
    }

   
    const ogretmenId = session.user?.ogretmen_id;

    if (!ogretmenId) {
      return NextResponse.json(
        { success: false, error: "Hesabınız henüz bir öğretmen kaydıyla eşleştirilmemiş." },
        { status: 409 }
      );
    }

    if (Number(id) !== Number(ogretmenId)) {
      return NextResponse.json(
        { success: false, error: "Yalnızca kendi kaydınızı güncelleyebilirsiniz." },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE ogretmenler
       SET ogretmen_adi = $1,
           ogretmen_soyadı = $2,
           tc_no = $3,
           dogum_tarihi = $4,
           e_posta = $5,
           fotograf = $6,
           ozgecmis = $7
       WHERE id = $8
       RETURNING id, ogretmen_adi AS ad, ogretmen_soyadı AS soyad, tc_no AS tc, dogum_tarihi AS dogum, e_posta AS mail, fotograf, ozgecmis, okul_id`,
      [String(ad).trim(), String(soyad).trim(), String(tc).trim(), normalizeNullable(dogum), normalizeMail(mail), normalizeNullable(fotograf), normalizeNullable(ozgecmis), ogretmenId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Güncellenecek öğretmen bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Bilgileriniz başarıyla güncellendi.", data: result.rows[0] });
  } catch (error) {
    if (error && error.code === "23505") {
      return NextResponse.json({ success: false, error: "Bu TC numarası başka bir öğretmene ait." }, { status: 409 });
    }

    console.error("Öğretmen güncelleme hatası:", error);
    return NextResponse.json({ success: false, error: error.message || "Öğretmen güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.rol !== "admin") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Silinecek öğretmenin ID bilgisi eksik." }, { status: 400 });
    }

    const userId = session.user?.id;
    
  
    const ownerCheck = await pool.query(
      `SELECT o.okul_id
       FROM ogretmenler o
       INNER JOIN okullar ok ON ok.id = o.okul_id
       WHERE o.id = $1 AND ok.yonetici_kullanici_id = $2`,
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Bu öğretmene erişim hakkınız yok veya öğretmen bulunamadı." }, { status: 403 });
    }

    const okulId = ownerCheck.rows[0].okul_id;


    await pool.query(
      `DELETE FROM ders_programi WHERE ogr_ders_id IN (
         SELECT id FROM ogretmenlere_ders_atama WHERE ogretmen_id = $1
       )`,
      [id]
    );

    await pool.query(`DELETE FROM ogretmenlere_ders_atama WHERE ogretmen_id = $1`, [id]);

    const result = await pool.query(
      `DELETE FROM ogretmenler
       WHERE id = $1
       RETURNING id, ogretmen_adi AS ad, ogretmen_soyadı AS soyad, tc_no AS tc, dogum_tarihi AS dogum, e_posta AS mail, fotograf, ozgecmis, okul_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Silinecek öğretmen bulunamadı." }, { status: 404 });
    }

   
    if (okulId) {
      await pool.query('CALL otomatik_ders_atama($1::integer)', [okulId]);
    }

    return NextResponse.json({ success: true, message: "Öğretmen başarıyla silindi.", data: result.rows[0] });
  } catch (error) {
    console.error("Öğretmen silme hatası:", error);
    return NextResponse.json({ success: false, error: error.message || "Öğretmen silinemedi." }, { status: 500 });
  }
}