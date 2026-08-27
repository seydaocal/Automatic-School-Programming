import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db"; 

/**
 * @swagger
 * /api/ogretmenbilgi:
 *   get:
 *     summary: Öğretmen bilgilerini getirir
 *     description: Oturum açan öğretmenin kendi profil verilerini listeler.
 *     tags: [OgretmenProfil]
 *     responses:
 *       200:
 *         description: Başarılı liste
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Öğretmen kaydı bulunamadı
 *       500:
 *         description: Veriler alınamadı
 *   put:
 *     summary: Öğretmen bilgilerini günceller
 *     description: Öğretmenin kendi profil bilgilerini günceller.
 *     tags: [OgretmenProfil]
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
 *                 type: string
 *               mail:
 *                 type: string
 *               fotograf:
 *                 type: string
 *               ozgecmis:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bilgiler güncellendi
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Güncelleme başarısız
 */


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.rol !== "ogretmen") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, ad, soyad, tc, mail, fotograf, ozgecmis FROM ogretmenler WHERE id = $1`,
      [user.id] 
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Öğretmen kaydı bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows });
     } catch (error) {
    return NextResponse.json({ success: false, error: "Veriler alınamadı." }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.rol !== "ogretmen") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ad, soyad, tc, mail } = body;

    await pool.query(
      `UPDATE ogretmenler SET ad = $1, soyad = $2, tc = $3, mail = $4 WHERE id = $5`,
      [ad, soyad, tc, mail, user.id]
    );

    return NextResponse.json({ success: true, message: "Bilgiler güncellendi." });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Güncelleme başarısız." }, {status: 500});
  }
}