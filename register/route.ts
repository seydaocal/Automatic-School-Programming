
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı oluşturur
 *     description: Sistem için yeni bir kullanıcı (admin veya öğretmen) kaydı oluşturur ve şifreyi güvenli şekilde hash'ler.
 *     tags: [Auth]
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
 *               mail:
 *                 type: string
 *               sifre:
 *                 type: string
 *               rol:
 *                 type: string
 *               ogretmen_id:
 *                 type: integer
 *               okul_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla kaydedildi
 *       400:
 *         description: Geçersiz JSON verisi, eksik alanlar, geçersiz e-posta veya kısa şifre
 *       409:
 *         description: Bu e-posta adresi zaten kayıtlı
 *       500:
 *         description: Kayıt sırasında bir hata oluştu
 */

type RegisterBody = {
  ad?: unknown;
  soyad?: unknown;
  mail?: unknown;
  sifre?: unknown;
  rol?: unknown;
  ogretmen_id?: unknown;
  okul_id?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Geçersiz JSON verisi." },
      { status: 400 }
    );
  }

  const ad = text(body.ad);
  const soyad = text(body.soyad);
  const mail = text(body.mail).toLowerCase();
  const sifre = text(body.sifre);
  const rol = text(body.rol) === "admin" ? "admin" : "ogretmen";

  if (!ad || !soyad || !mail || !sifre) {
    return NextResponse.json(
      { success: false, error: "Ad, soyad, e-posta ve şifre zorunludur." },
      { status: 400 }
    );
  }

  if (!/^\S+@\S+\.\S+$/.test(mail)) {
    return NextResponse.json(
      { success: false, error: "Geçerli bir e-posta adresi girin." },
      { status: 400 }
    );
  }

  if (sifre.length < 8) {
    return NextResponse.json(
      { success: false, error: "Şifre en az 8 karakter olmalıdır." },
      { status: 400 }
    );
  }

  try {
    const mevcutKullanici = await pool.query(
      "SELECT id FROM kullanicilar WHERE mail = $1",
      [mail]
    );

    if (mevcutKullanici.rowCount) {
      return NextResponse.json(
        { success: false, error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    const sifreHash = await bcrypt.hash(sifre, 12);

    const result = await pool.query(
      `INSERT INTO kullanicilar (ad, soyad, mail, sifre, rol, ogretmen_id, okul_id, aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, ad, soyad, mail, rol, ogretmen_id, okul_id, aktif`,
      [
        ad,
        soyad,
        mail,
        sifreHash,
        rol,
        body.ogretmen_id ?? null,
        body.okul_id ?? null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Kullanıcı başarıyla kaydedildi.",
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { success: false, error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    console.error("Kullanıcı kayıt hatası:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}