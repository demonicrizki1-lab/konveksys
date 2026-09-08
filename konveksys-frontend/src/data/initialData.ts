import {
  AuthUser,
  Brand,
  Vendor,
  HargaKonveksi,
  HargaBuyer,
  InboundRoll,
  SPKCutting,
  SuratJalan,
  KasbonTransaction,
  ReturnItem,
  AccessoryItem,
  AccessoryMutation,
} from '../types';

export const demoUsers: AuthUser[] = [
  {
    id: 'u-admin',
    name: 'Maison Rayyan (Admin/Owner)',
    email: 'admin@konveksys.com',
    password: 'admin',
    role: 'ADMIN',
    avatar: 'MR',
  },
];

export const initialBrands: Brand[] = [];

export const initialVendors: Vendor[] = [
  { id: 'v-1', name: 'SAHIRA', specialty: 'Kemeja & Kemeja Hawai', contact: '0819-0011-2233', currentKasbon: 0 },
  { id: 'v-2', name: 'RAKSUKAN', specialty: 'Kaos & Pakaian Anak', contact: '0818-4455-6677', currentKasbon: 0 },
  { id: 'v-3', name: 'BU NIKEN', specialty: 'Seragam & Kemeja Formal', contact: '0812-7788-9900', currentKasbon: 0 },
  { id: 'v-4', name: 'KANG SONY', specialty: 'Bedah Standar & Kaos', contact: '0852-3344-5566', currentKasbon: 0 },
  { id: 'v-5', name: 'PA YUSMAN', specialty: 'TNI & Pakaian Taktikal', contact: '0878-9900-1122', currentKasbon: 0 },
];

export const initialHargaKonveksi: HargaKonveksi[] = [];
export const initialHargaBuyer: HargaBuyer[] = [];
export const initialInboundRolls: InboundRoll[] = [];
export const initialSPKList: SPKCutting[] = [];
export const initialSuratJalanList: SuratJalan[] = [];
export const initialKasbonList: KasbonTransaction[] = [];
export const initialPembayaranList: any[] = [];
export const initialReturnList: ReturnItem[] = [];
export const initialAccessories: AccessoryItem[] = [];
export const initialAccessoryMutations: AccessoryMutation[] = [];
