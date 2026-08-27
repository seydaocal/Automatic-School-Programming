import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

/**
 * @swagger
 * /api/izinler/[id]/onayla:
 *  put:
 *     summary: Öğretmen iznini onaylar
 *     description: Belirtilen ID'ye sahip öğretmenin izin talebini onaylandı olarak günceller (Yalnızca Admin).
 *     tags: [Onaylama]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Onaylanacak iznin ID'si
 *     responses:
 *       200:
 *         description: İzin başarıyla onaylandı.
 *       400:
 *         description: İzin ID gereklidir.
 *       403:
 *         description: Yetkisiz erişim. Sadece yönetici izin onaylayabilir.
 *       404:
 *         description: Bu izne erişim hakkınız yok veya izin bulunamadı.
 *       500:
 *         description: İzin onaylanamadı / Sunucu hatası.
 */

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.rol !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Yetkisiz erişim. Sadece yönetici izin onaylayabilir.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const userId = session.user?.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'İzin ID gereklidir.' }, { status: 400 });
    }

  
    const yetkiKontrol = await pool.query(
      `SELECT i.id
       FROM ogretmen_izinleri i
       INNER JOIN ogretmenler og ON i.ogretmen_id = og.id
       INNER JOIN okullar o ON og.okul_id = o.id
       WHERE i.id = $1 AND o.yonetici_kullanici_id = $2`,
      [id, userId]
    );

    if (yetkiKontrol.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bu izne erişim hakkınız yok veya izin bulunamadı.' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `UPDATE ogretmen_izinleri
       SET onaylandi = true
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'İzin başarıyla onaylandı.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('İzin onaylama hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'İzin onaylanamadı.' },
      { status: 500 }
    );
  }
}