// ============================================================
// KonvekSys API Service
// Centralized fetch wrapper for all backend API calls
// ============================================================

import type { FobAiAnalysisApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Ambil token dari localStorage
export function getToken(): string | null {
  return localStorage.getItem('konvek_token');
}

// Simpan token ke localStorage
export function saveToken(token: string): void {
  localStorage.setItem('konvek_token', token);
}

// Hapus token dari localStorage
export function clearToken(): void {
  localStorage.removeItem('konvek_token');
}

// Base fetch wrapper dengan auto-inject Authorization header
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));

    if (res.status === 401 && !endpoint.startsWith('/api/auth/login')) {
      clearToken();
      return { data: null, error: 'Sesi berakhir, silakan login kembali.' };
    }

    if (!res.ok) {
      return { data: null, error: json.error || 'Terjadi kesalahan.' };
    }

    return { data: json as T, error: null };
  } catch (err) {
    console.error('[API Error]', err);
    return { data: null, error: 'Tidak dapat terhubung ke server.' };
  }
}

// ============================================================
// AUTH
// ============================================================

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'BRAND';
    brandName?: string;
    accessibleBrands?: string[];
  };
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ data: LoginResponse | null; error: string | null }> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGetMe() {
  return apiFetch<{ user: LoginResponse['user'] }>('/api/auth/me');
}

export async function apiRegisterBrand(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  brands: string[];
}): Promise<{ data: { success: boolean; message: string; userId?: string } | null; error: string | null }> {
  return apiFetch('/api/auth/register-brand', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetPendingBrands(): Promise<{
  data: { pending: any[] } | null;
  error: string | null;
}> {
  return apiFetch('/api/auth/pending-brands');
}

export async function apiApproveBrand(
  userId: string,
  data: { accessibleBrands?: string[]; brandName?: string } = {}
): Promise<{ data: { success: boolean; message: string } | null; error: string | null }> {
  return apiFetch(`/api/auth/approve-brand/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiRejectBrand(
  userId: string
): Promise<{ data: { success: boolean; message: string } | null; error: string | null }> {
  return apiFetch(`/api/auth/reject-brand/${userId}`, {
    method: 'POST',
  });
}

// User Management (Admin Only)
export async function apiGetUsers() {
  return apiFetch<any[]>('/api/auth/users');
}

export async function apiCreateUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'ADMIN' | 'BRAND';
  status?: string;
  brandName?: string;
  accessibleBrands?: string[];
}) {
  return apiFetch<{ success: boolean; message: string; user: any }>('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: 'ADMIN' | 'BRAND';
    status: string;
    brandName?: string;
    accessibleBrands?: string[];
  }>
) {
  return apiFetch<{ success: boolean; message: string; user: any }>(`/api/auth/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteUser(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/auth/users/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// BRANDS
// ============================================================

export interface ApiBrand {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
}

export async function apiGetBrands() {
  return apiFetch<ApiBrand[]>('/api/brands');
}

export async function apiAddBrand(data: Omit<ApiBrand, 'id'>) {
  return apiFetch<ApiBrand>('/api/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateBrand(id: string, data: Partial<ApiBrand>) {
  return apiFetch<ApiBrand>(`/api/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBrand(id: string) {
  return apiFetch<{ message: string }>(`/api/brands/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// VENDORS
// ============================================================

export interface ApiVendor {
  id: string;
  name: string;
  specialty?: string;
  contact?: string;
}

export async function apiGetVendors() {
  return apiFetch<ApiVendor[]>('/api/vendors');
}

export async function apiAddVendor(data: Omit<ApiVendor, 'id'>) {
  return apiFetch<ApiVendor>('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateVendor(id: string, data: Partial<ApiVendor>) {
  return apiFetch<ApiVendor>(`/api/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteVendor(id: string) {
  return apiFetch<{ message: string }>(`/api/vendors/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// HARGA KONVEKSI
// ============================================================

export interface ApiHargaKonveksi {
  id: string;
  vendor: string;
  brand: string;
  produk: string;
  harga: number | string;
}

export async function apiGetHargaKonveksi() {
  return apiFetch<ApiHargaKonveksi[]>('/api/harga/konveksi');
}

export async function apiAddHargaKonveksi(data: Omit<ApiHargaKonveksi, 'id'>) {
  return apiFetch<ApiHargaKonveksi>('/api/harga/konveksi', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateHargaKonveksi(id: string, data: Partial<ApiHargaKonveksi>) {
  return apiFetch<ApiHargaKonveksi>(`/api/harga/konveksi/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteHargaKonveksi(id: string) {
  return apiFetch<{ message: string }>(`/api/harga/konveksi/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// HARGA BUYER
// ============================================================

export interface ApiHargaBuyer {
  id: string;
  brand: string;
  produk: string;
  rateS?: number | string;
  rateM?: number | string;
  rateL?: number | string;
  rateXL?: number | string;
  rateXXL?: number | string;
  rateSML?: number | string;
  rateAnak4: number | string;
  rateAnak6: number | string;
  rateAnak8: number | string;
  rateAnak10: number | string;
  rateAnak12: number | string;
  rateAnak14: number | string;
  rateAnak16: number | string;
}

export async function apiGetHargaBuyer() {
  return apiFetch<ApiHargaBuyer[]>('/api/harga/buyer');
}

export async function apiAddHargaBuyer(data: Omit<ApiHargaBuyer, 'id'>) {
  return apiFetch<ApiHargaBuyer>('/api/harga/buyer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateHargaBuyer(id: string, data: Partial<ApiHargaBuyer>) {
  return apiFetch<ApiHargaBuyer>(`/api/harga/buyer/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteHargaBuyer(id: string) {
  return apiFetch<{ message: string }>(`/api/harga/buyer/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// INBOUND ROLLS
// ============================================================

export interface ApiInboundRoll {
  id: string;
  rollCode: string;
  brand: string;
  jenisKain: string;
  meterLength: number | string;
  meterUsed: number | string;
  hargaModalMeter: number | string;
  status: 'MENUNGGU_FISIK' | 'DI_GUDANG' | 'DIPROSES' | 'SELESAI';
  tanggalMasuk: string;
  keterangan?: string;
}

export async function apiGetInboundRolls(brand?: string) {
  const q = brand ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<ApiInboundRoll[]>(`/api/inbound${q}`);
}

export async function apiAddInboundRoll(data: Omit<ApiInboundRoll, 'id' | 'meterUsed'>) {
  return apiFetch<ApiInboundRoll>('/api/inbound', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateInboundStatus(id: string, status: ApiInboundRoll['status']) {
  return apiFetch<ApiInboundRoll>(`/api/inbound/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiDeleteInboundRoll(id: string) {
  return apiFetch<{ message: string }>(`/api/inbound/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// SPK
// ============================================================

export async function apiGetSpk(brand?: string) {
  const q = brand ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<unknown[]>(`/api/spk${q}`);
}

export async function apiCreateSpk(data: unknown) {
  return apiFetch<unknown>('/api/spk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateSpk(id: string, data: unknown) {
  return apiFetch<unknown>(`/api/spk/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteSpk(id: string) {
  return apiFetch<{ success: boolean; message?: string }>(`/api/spk/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// SURAT JALAN
// ============================================================

export async function apiGetSuratJalan(brand?: string) {
  const q = brand ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<unknown[]>(`/api/outbound${q}`);
}

export async function apiCreateSuratJalan(data: unknown) {
  return apiFetch<unknown>('/api/outbound', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateSuratJalan(id: string, data: unknown) {
  return apiFetch<unknown>(`/api/outbound/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteSuratJalan(id: string) {
  return apiFetch<{ success: boolean; message?: string }>(`/api/outbound/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// FINANCE - KASBON
// ============================================================

export interface ApiKasbon {
  id: string;
  vendor: string;
  tanggal: string;
  jumlah: number | string;
  tipe: 'PINJAMAN' | 'PELUNASAN';
  keterangan: string;
}

export async function apiGetKasbon(vendor?: string) {
  const q = vendor ? `?vendor=${encodeURIComponent(vendor)}` : '';
  return apiFetch<ApiKasbon[]>(`/api/finance/kasbon${q}`);
}

export async function apiAddKasbon(data: Omit<ApiKasbon, 'id'>) {
  return apiFetch<ApiKasbon>('/api/finance/kasbon', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// FINANCE - PEMBAYARAN BRAND & ARUS KAS
// ============================================================

export interface ApiPembayaran {
  id: string;
  brand: string;
  tanggal: string;
  jumlah: number | string;
  metode: 'TRANSFER' | 'TUNAI' | 'CEK' | 'GIRO';
  keterangan: string;
  referensiNomor?: string;
}

export async function apiGetPembayaran(brand?: string) {
  const q = brand ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<ApiPembayaran[]>(`/api/arus-kas${q}`);
}

export async function apiAddPembayaran(data: Omit<ApiPembayaran, 'id'>) {
  return apiFetch<ApiPembayaran>('/api/arus-kas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdatePembayaran(id: string, data: Partial<Omit<ApiPembayaran, 'id'>>) {
  return apiFetch<ApiPembayaran>(`/api/arus-kas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeletePembayaran(id: string) {
  return apiFetch<{ message: string }>(`/api/arus-kas/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetArusKasSummary() {
  return apiFetch<unknown[]>('/api/arus-kas/summary');
}

// ============================================================
// RETURN - PENGEMBALIAN BARANG CACAT & REWORK
// ============================================================

export interface ApiReturnItem {
  id: string;
  noRetur: string;
  sumber: 'INTERNAL_QC' | 'BRAND_COMPLAINT';
  spkId?: string | null;
  suratJalanId?: string | null;
  brand: string;
  produk: string;
  vendor: string;
  tanggalRetur: string;
  tanggalSelesai?: string | null;
  alasanCacat: string;
  kategoriCacat: string;
  catatan?: string | null;
  status: 'DIAJUKAN' | 'DIKIRIM_KE_VENDOR' | 'SELESAI_REWORK' | 'REJECT_TOTAL';
  qtyS: number;
  qtyM: number;
  qtyL: number;
  qtyXL: number;
  qtyXXL: number;
  qtyAnak4: number;
  qtyAnak6: number;
  qtyAnak8: number;
  qtyAnak10: number;
  qtyAnak12: number;
  qtyAnak14: number;
  qtyAnak16: number;
  totalPcs: number;
  qtyReworked: number;
  qtyRejectTotal: number;
  spk?: { spkNumber: string };
  suratJalan?: { noSuratJalan: string };
}

export async function apiGetReturns() {
  return apiFetch<ApiReturnItem[]>('/api/returns');
}

export async function apiCreateReturn(data: {
  sumber: 'INTERNAL_QC' | 'BRAND_COMPLAINT';
  spkId?: string;
  suratJalanId?: string;
  brand: string;
  produk: string;
  vendor: string;
  tanggalRetur?: string;
  alasanCacat: string;
  kategoriCacat: string;
  catatan?: string;
  qtyS: number;
  qtyM: number;
  qtyL: number;
  qtyXL: number;
  qtyXXL: number;
  qtyAnak4: number;
  qtyAnak6: number;
  qtyAnak8: number;
  qtyAnak10: number;
  qtyAnak12: number;
  qtyAnak14: number;
  qtyAnak16: number;
}) {
  return apiFetch<ApiReturnItem>('/api/returns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateReturnStatus(
  id: string,
  data: {
    status: 'DIAJUKAN' | 'DIKIRIM_KE_VENDOR' | 'SELESAI_REWORK' | 'REJECT_TOTAL';
    qtyReworked?: number;
    qtyRejectTotal?: number;
    catatan?: string;
  }
) {
  return apiFetch<ApiReturnItem>(`/api/returns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteReturn(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/returns/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// ACCESSORIES & TRIMS
// ============================================================

export interface ApiAccessory {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand?: string | null;
  unit: string;
  stock: number | string;
  safetyStock: number | string;
  location?: string | null;
  costPerUnit?: number | string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiAccessoryMutation {
  id: string;
  accessoryId: string;
  accessoryName: string;
  sku: string;
  type: string;
  quantity: number | string;
  unit: string;
  date: string;
  sourceOrDestination?: string | null;
  spkId?: string | null;
  spkNumber?: string | null;
  recipientOrVendor?: string | null;
  notes?: string | null;
  costTotal?: number | string | null;
  createdAt?: string;
}

export async function apiGetAccessories() {
  return apiFetch<ApiAccessory[]>('/api/accessories');
}

export async function apiGetAccessoryMutations() {
  return apiFetch<ApiAccessoryMutation[]>('/api/accessories/mutations');
}

export async function apiCreateAccessory(data: {
  sku: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  stock: number;
  safetyStock: number;
  location?: string;
  costPerUnit?: number;
  notes?: string;
}) {
  return apiFetch<ApiAccessory>('/api/accessories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateAccessory(id: string, data: {
  sku: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  stock: number;
  safetyStock: number;
  location?: string;
  costPerUnit?: number;
  notes?: string;
}) {
  return apiFetch<ApiAccessory>(`/api/accessories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteAccessory(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/accessories/${id}`, {
    method: 'DELETE',
  });
}

export async function apiRecordAccessoryMutation(data: {
  accessoryId: string;
  type: 'MASUK' | 'KELUAR' | 'PENYESUAIAN';
  quantity: number;
  date: string;
  sourceOrDestination?: string;
  spkId?: string;
  spkNumber?: string;
  recipientOrVendor?: string;
  notes?: string;
  costTotal?: number;
}) {
  return apiFetch<{ mutation: ApiAccessoryMutation; accessory: ApiAccessory }>('/api/accessories/mutations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// BRAND INVENTORY & MARKETPLACE SALES
// ============================================================

export async function apiGetBrandSKUs(brand?: string) {
  const query = brand && brand !== 'ALL' ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<any[]>(`/api/brand-inventory/skus${query}`);
}

export async function apiCreateBrandSKU(data: {
  brand?: string;
  produk: string;
  sku: string;
  warna?: string;
  ukuran?: string;
  hpp: number;
  stokAwal?: number;
  catatan?: string;
}) {
  return apiFetch<{ success: boolean; message: string; data: any }>('/api/brand-inventory/skus', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateBrandSKU(
  id: string,
  data: Partial<{
    produk: string;
    sku: string;
    warna?: string;
    ukuran?: string;
    hpp: number;
    stokAwal: number;
    catatan?: string;
  }>
) {
  return apiFetch<{ success: boolean; message: string; data: any }>(`/api/brand-inventory/skus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBrandSKU(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/brand-inventory/skus/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetBrandSales(brand?: string) {
  const query = brand && brand !== 'ALL' ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<any[]>(`/api/brand-inventory/sales${query}`);
}

export async function apiCreateBrandSale(data: {
  brand?: string;
  tanggal: string;
  marketplace: string;
  toko?: string;
  noPesanan?: string;
  username?: string;
  skuId?: string;
  sku: string;
  qty: number;
  hpp?: number;
  omset: number;
  biayaIklan?: number;
  biayaOperasional?: number;
  catatan?: string;
}) {
  return apiFetch<{ success: boolean; message: string; data: any }>('/api/brand-inventory/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBrandSale(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/brand-inventory/sales/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetBrandStockExits(brand?: string) {
  const query = brand && brand !== 'ALL' ? `?brand=${encodeURIComponent(brand)}` : '';
  return apiFetch<any[]>(`/api/brand-inventory/stock-exits${query}`);
}

export async function apiCreateBrandStockExit(data: {
  brand?: string;
  tanggal: string;
  skuId?: string;
  sku: string;
  qty: number;
  kategori: string;
  keterangan?: string;
}) {
  return apiFetch<{ success: boolean; message: string; data: any }>('/api/brand-inventory/stock-exits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBrandStockExit(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/brand-inventory/stock-exits/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// PRODUCTION PO (SURAT PO PRODUKSI KONVEKSI)
// ============================================================

export async function apiGetProductionPOs(params?: { brand?: string; status?: string; search?: string }) {
  const queryParts: string[] = [];
  if (params?.brand && params.brand !== 'ALL') queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params?.status && params.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.search && params.search.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiFetch<any[]>(`/api/production-po${query}`);
}

export async function apiGetProductionPO(id: string) {
  return apiFetch<any>(`/api/production-po/${id}`);
}

export async function apiCreateProductionPO(data: {
  noPO: string;
  brand: string;
  vendorTujuan: string;
  tanggalPO: string;
  targetDeadline: string;
  catatan?: string;
  status?: string;
  usedDepositId?: string | null;
  usedDepositInfo?: string | null;
  items: {
    namaProduk: string;
    warna?: string;
    ukuran?: string;
    qty: number;
    bahanKain?: string;
    catatan?: string;
    depositId?: string | null;
    depositInfo?: string | null;
  }[];
}) {
  return apiFetch<{ success: boolean; message: string; data: any }>('/api/production-po', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateProductionPO(
  id: string,
  data: Partial<{
    noPO: string;
    brand: string;
    vendorTujuan: string;
    tanggalPO: string;
    targetDeadline: string;
    catatan?: string;
    status: string;
    usedDepositId?: string | null;
    usedDepositInfo?: string | null;
    items: {
      namaProduk: string;
      warna?: string;
      ukuran?: string;
      qty: number;
      bahanKain?: string;
      catatan?: string;
      depositId?: string | null;
      depositInfo?: string | null;
    }[];
  }>
) {
  return apiFetch<{ success: boolean; message: string; data: any }>(`/api/production-po/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateProductionPOStatus(id: string, status: string) {
  return apiFetch<{ success: boolean; message: string; data: any }>(`/api/production-po/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiDeleteProductionPO(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/production-po/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// FOB COSTING & COMMERCIAL QUOTATION (SPH)
// ============================================================

export async function apiGetFobHppList(params?: { brand?: string; kategori?: string; search?: string }) {
  const queryParts: string[] = [];
  if (params?.brand && params.brand !== 'ALL') queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params?.kategori && params.kategori !== 'ALL') queryParts.push(`kategori=${encodeURIComponent(params.kategori)}`);
  if (params?.search && params.search.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiFetch<any[]>(`/api/fob/hpp${query}`);
}

export async function apiGetFobHppDetail(id: string) {
  return apiFetch<any>(`/api/fob/hpp/${id}`);
}

export async function apiCreateFobHpp(data: any) {
  return apiFetch<{ success: boolean; message: string; data: any }>('/api/fob/hpp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateFobHpp(id: string, data: any) {
  return apiFetch<{ success: boolean; message: string; data: any }>(`/api/fob/hpp/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteFobHpp(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/fob/hpp/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetFobQuotations(params?: { search?: string }) {
  const query = params?.search ? `?search=${encodeURIComponent(params.search.trim())}` : '';
  return apiFetch<any[]>(`/api/fob/quotations${query}`);
}

export async function apiCreateFobQuotation(data: any) {
  return apiFetch<{ success: boolean; message: string; data: any }>('/api/fob/quotations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteFobQuotation(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/fob/quotations/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetFobMaterials() {
  return apiFetch<any[]>('/api/fob/materials');
}

export async function apiSaveFobMaterial(data: any) {
  return apiFetch<{ success: boolean; data: any }>('/api/fob/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteFobMaterial(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/fob/materials/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetFobProducts() {
  return apiFetch<any[]>('/api/fob/products');
}

export async function apiSaveFobProduct(data: any) {
  return apiFetch<{ success: boolean; data: any }>('/api/fob/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteFobProduct(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/fob/products/${id}`, {
    method: 'DELETE',
  });
}

export async function apiAnalyzeFobHpp(payload: { hppRecordId?: string; hppData?: any }) {
  return apiFetch<FobAiAnalysisApiResponse>('/api/fob/ai-analysis', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================
// FOB PURCHASE ORDERS (PO BRAND)
// ============================================================

export async function apiGetFobOrders(params?: { brand?: string; status?: string; search?: string }) {
  const queryParts: string[] = [];
  if (params?.brand && params.brand !== 'ALL') queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params?.status && params.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.search && params.search.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiFetch<any[]>(`/api/fob/orders${query}`);
}

export async function apiGetFobOrderDetail(id: string) {
  return apiFetch<any>(`/api/fob/orders/${id}`);
}

export async function apiCreateFobOrder(data: any) {
  return apiFetch<any>('/api/fob/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateFobOrder(id: string, data: any) {
  return apiFetch<any>(`/api/fob/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateFobOrderStatus(id: string, status: string) {
  return apiFetch<any>(`/api/fob/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiDeleteFobOrder(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/fob/orders/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// FOB DOWN PAYMENTS (INBOUND DP UANG)
// ============================================================

export async function apiGetFobDeposits(params?: { brand?: string; search?: string }) {
  const queryParts: string[] = [];
  if (params?.brand && params.brand !== 'ALL') queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params?.search && params.search.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiFetch<any[]>(`/api/fob/deposits${query}`);
}

export async function apiCreateFobDeposit(data: any) {
  return apiFetch<any>('/api/fob/deposits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateFobDeposit(id: string, data: any) {
  return apiFetch<any>(`/api/fob/deposits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteFobDeposit(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/fob/deposits/${id}`, {
    method: 'DELETE',
  });
}



