export default function NasilKullanilirPage() {
  return (
    <main className="kapsayici">
       <section className="border-y border-slate-200 bg-white px-5 py-14 sm:px-8">
       <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Nasıl Kullanılır?</h1>
          <p className="text-slate-600">Sistemi kendi rolünüze uygun adımlarla hemen kullanmaya başlayın.</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <p className="bg-blue-100 border border-blue-200 p-4 mb-6 text-center rounded-xl text-blue-950 font-medium text-base sm:text-lg shadow-sm">
            1. Size uygun olan hesabı oluşturun.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <article className=" w-40% rounded-3xl bg-slate-800 p-7 text-white">
          <div>
            <p className="text-sm font-bold tracking-wider text-sky-300">YÖNETİCİLER İÇİN</p>
            <div className="space-y-3 text-slate-300 text-sm sm:text-base">
              <p className="kullanma-yazisi">2. Giriş yaptıktan sonra istenen okul bilgilerini girin.</p>
              <p className="kullanma-yazisi">3. Ders programı sayfasından oluştur butonuna basın ve sizin için otomatik ders programı oluşturalım.</p>
              <p className="kullanma-yazisi">4. Programı beğenmezseniz butona tekrar basarak yeni bir program oluşturabilirsiniz.</p>
            </div>
          </div>
          </article>
          <article className="w-40% rounded-3xl bg-slate-800 p-7 text-white">
          <div>
            <p className="text-sm font-bold tracking-wider text-sky-300">ÖĞRETMENLER İÇİN</p>
            <div className="space-y-3 text-slate-300 text-sm sm:text-base">
              <p className="kullanma-yazisi">2. Giriş yaptıktan sonra istenen öğretmen bilgilerini girin.</p>
              <p className="kullanma-yazisi">3. Atanan dersleri görün ve izin bilgilerinizi okul kayıtlarına iletin.</p>
              <p className="kullanma-yazisi">4. Size özel ders programınızı görün.</p>
            </div>
          </div>
          </article>
        </div>
      </section>
    </main>
  );
}