import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

type RoleClaims = {
  rol?: unknown;
  ogretmen_id?: unknown;
  okul_id?: unknown;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        rol: { label: "Rol", type: "hidden" },
        mail: { label: "E-posta", type: "email" },
        sifre: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials?.mail ||
          !credentials?.sifre ||
          (credentials.rol !== "admin" && credentials.rol !== "ogretmen")
        ) return null;

        try {
          const result = await pool.query(
            `SELECT id, ad, soyad, mail, sifre, rol, ogretmen_id, okul_id
             FROM kullanicilar
             WHERE mail = $1 AND rol = $2 AND aktif = true`,
            [credentials.mail, credentials.rol]
          );

          const kullanici = result.rows[0];
          if (!kullanici) return null;

          const sifreEslesti = await bcrypt.compare(
            credentials.sifre,
            kullanici.sifre
          );

          if (!sifreEslesti) return null;

          let ogretmenId = kullanici.ogretmen_id;
          let okulId = kullanici.okul_id;

          if (kullanici.rol === "ogretmen" && (ogretmenId === null || okulId === null)) {
            const ogretmenSonuc = await pool.query(
              `SELECT id, okul_id FROM ogretmenler WHERE mail = $1`,
              [kullanici.mail]
            );
            const eslesenOgretmen = ogretmenSonuc.rows[0];

            if (eslesenOgretmen) {
              ogretmenId = eslesenOgretmen.id;
              okulId = eslesenOgretmen.okul_id;

              await pool.query(
                `UPDATE kullanicilar SET ogretmen_id = $1, okul_id = $2 WHERE id = $3`,
                [ogretmenId, okulId, kullanici.id]
              );
            }
          }

          return {
            id: String(kullanici.id),
            name: `${kullanici.ad} ${kullanici.soyad}`,
            email: kullanici.mail,
            rol: kullanici.rol,
            ogretmen_id: ogretmenId,
            okul_id: okulId,
          };
        } catch (error) {
          console.error("Giriş hatası:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userClaims = user as typeof user & RoleClaims;
        const tokenClaims = token as typeof token & RoleClaims;
        tokenClaims.rol = userClaims.rol;
        tokenClaims.ogretmen_id = userClaims.ogretmen_id;
        tokenClaims.okul_id = userClaims.okul_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & RoleClaims & { id?: string };
        const tokenClaims = token as typeof token & RoleClaims;
        sessionUser.id = token.sub;
        sessionUser.rol = tokenClaims.rol;
        sessionUser.ogretmen_id = tokenClaims.ogretmen_id;
        sessionUser.okul_id = tokenClaims.okul_id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/giris", 
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, 
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };