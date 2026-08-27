export type Okul ={
 id: number;
 ad: string;
 il: string;
 ilce: string;
 sayi: number;
 sure: number;
 molas: number;
 gun: string[];
 ilk_ders_baslangic_saati: string;
}

export type Ders ={
 id: number;
 ad: string;
 seviye: string;
 saat: number;
}

export type Ogretmen ={
 id: number;
 ad: string;
 soyad: string;
 tc: string;
 dogum: string;
 mail: string;
 fotograf: string | null;
 ozgecmis: string | null;
}

export type Sinif ={
 id: number;
 seviye: string;
 sube: string;
}

export type Atama = {
 id: number;
 ders_id: number;
 ogretmen_id: number;
}

export type DersProgramiSatiri ={
 id: number;
 sube_adi: number;
 gun_no: number;
 ders_saati: number;
 ogr_ders_id: number;
 ogretmen_id?: number | null;
 ogretmen_adi?: string;
 ikame_ogretmen?: boolean;
 asil_ogretmen_id?: number | null;
}

export interface OgretmenIzni {
  id: number;
  okul_id: number | null;
  ogretmen_id: number;
  baslangic_saati: string; 
  bitis_saati: string;     
  aciklama: string | null;
  gun_no: number; 
  onaylandi: boolean;
  tarih?: string | null;
  cakisan_dersler?: string | null;
}

export interface DersUcreti {
  id: number;
  okul_id: number;
  ders_id: number;
  saatlik_ucret: number;
  aylik_ucret: number | null;
}

export interface DersBaslangicSaati {
  gun_no: number;
  ders_saati_no: number;
  baslangic_saati: string;
  otomatik_mi?: boolean;
}

export interface DersBaslangicSaatleriFormProps {
  okulId: number;
  gunlukDersSayisi: number;
  gunler: string[];
  ilkDersBaslangicSaati?: string | null;
  dersSuresi?: number | null;
  molaSuresi?: number | null;
}

export type OkulKayit = Omit<Okul, "id">;
export type DersKayit = Omit<Ders, "id">;
export type OgretmenKayit = Omit<Ogretmen, "id">;
export type SinifKayit = Omit<Sinif, "id">;
export type UcretKayit = Omit<DersUcreti, "id">;

export interface OkulTablosuProps {
 okullarListesi: Okul[];
 duzenlemeyeBaslaOkul: (okul: Okul) => void;
 okulSil: (id: number) => void;
 setSecilenOkulId: (id: number) => void;
 setIsSaved: (saved: boolean) => void;
}

export interface DersTablosuProps {
 derslerListesi: Ders[];
 duzenlemeyeBasladers: (ders: Ders) => void;
 dersSil: (id: number) => void;
 setSecilenDersId: (id: string) => void;
 setIsSaved: (saved: boolean) => void;
}

export interface OgretmenTablosuProps {
 ogretmenlerListesi: Ogretmen[];
 duzenlemeyeBaslaogr: (ogretmen: Ogretmen) => void;
 ogretmenSil: (id: number) => void;
 setSecilenOgretmenId: (id: string) => void;
 setIsSaved: (saved: boolean) => void;
}

export interface SinifTablosuProps {
 siniflarListesi: Sinif[];
 duzenlemeyeBaslaSinif: (sinif: Sinif) => void;
 sinifSil: (id: number) => void;
 setSecilenSinifId: (id: number) => void;
 setIsSaved: (saved: boolean) => void;
}

export interface AtamaTablosuProps {
 atamalarListesi: Atama[];
 derslerListesi: Ders[];
 ogretmenlerListesi: Ogretmen[];
 duzenlemeyeBaslaatama: (atama: Atama) => void;
 secilenDersId: string;
 setSecilenDersId: (id: string) => void;
 secilenOgretmenId: string;
 setSecilenOgretmenId: (id: string) => void;
 atamaEkle: () => void;
 atamaGuncelle: (id: number) => void;
 atamaSil: (id: number) => void;
}

export interface DersProgramiTablosuProp {
 dersPrograminiGetir: () => void;
 dersProgramiOlustur: () => void;
 dersProgramiListesi: DersProgramiSatiri[];
 siniflarListesi: Sinif[];
 atamalarListesi: Atama[];
 derslerListesi: Ders[];
 ogretmenlerListesi: Ogretmen[];
 okulId: number;
 baslangicSaatleri: DersBaslangicSaati[];
 dersSuresi?: number | null;
 molaSuresi?: number | null;
 ilkDersBaslangicSaati?: string | null;
}

export interface OgretmenIzinTablosuProps {
  izinlerListesi: OgretmenIzni[];
  ogretmenlerListesi: Ogretmen[];
  duzenlemeyeBaslaIzin: (izin: OgretmenIzni) => void;
  izinSil: (id: number) => void;
  izinOnaylama: (id: OgretmenIzni) => void;
}

export interface DersUcretiTablosuProps {
  ucretlerListesi: DersUcreti[];
  derslerListesi: Ders[];
  duzenlemeyeBaslaUcret: (ucret: DersUcreti) => void;
  ucretSil: (id: number) => void;
}