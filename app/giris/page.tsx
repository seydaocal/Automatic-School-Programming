import Link from "next/link";

const roles = [
  { href: "/giris/admingiris", title: "Yönetici girişi", description: "Okul, ders, öğretmen ve program yönetimi için giriş yapın.", badge: "YÖNETİM" },
  { href: "/giris/ogretmengiris", title: "Öğretmen girişi", description: "Ders programınıza ve size tanımlanan bilgilere erişin.", badge: "ÖĞRETMEN" },
];

export default function GirisPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className="w-full max-w-3xl text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-sky-300">DERS PROGRAMI</p>
        <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Nasıl giriş yapmak istersiniz?</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">Size uygun giriş türünü seçin. Hesap türünüz dışındaki ekrana giriş yapamazsınız.</p>
        <div className="mt-10 grid gap-5 text-left sm:grid-cols-2">
          {roles.map((role) => (
            <Link key={role.href} 
            href={role.href} 
            className="group rounded-3xl border border-slate-700 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-sky-400 hover:bg-slate-800">
              <span className="text-xs font-bold tracking-widest text-sky-300">{role.badge}</span>
              <h2 className="mt-5 text-2xl font-bold text-white">{role.title}</h2>
              <p className="mt-3 leading-6 text-slate-300">{role.description}</p>
              <span className="mt-7 inline-block font-semibold text-sky-300 group-hover:text-sky-200">Giriş ekranına git →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}