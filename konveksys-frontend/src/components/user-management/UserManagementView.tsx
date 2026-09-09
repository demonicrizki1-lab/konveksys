import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ManagedUser, Brand, UserRole } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  Users,
  Building2,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Mail,
  Phone,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    currentUser,
    managedUsers,
    fetchManagedUsers,
    createManagedUser,
    updateManagedUser,
    deleteManagedUser,
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    inboundRolls,
    spkList,
    suratJalanList,
  } = useApp();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'users' | 'brands'>('users');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'BRAND'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  // Loading & Toast State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Modals State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<ManagedUser | null>(null);

  // Brand Modals State
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [isEditBrandModalOpen, setIsEditBrandModalOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [deleteBrandConfirm, setDeleteBrandConfirm] = useState<Brand | null>(null);

  // Form State for Adding User
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'BRAND' as UserRole,
    status: 'ACTIVE',
    brandName: '',
    accessibleBrands: [] as string[],
  });

  // Form State for Editing User
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'BRAND' as UserRole,
    status: 'ACTIVE',
    brandName: '',
    accessibleBrands: [] as string[],
  });

  // Form State for Brand
  const [brandForm, setBrandForm] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchManagedUsers();
    setIsRefreshing(false);
    showToast('success', 'Data pengguna & brand diperbarui.');
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return (managedUsers || []).filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm)) ||
        (u.brandName && u.brandName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchBrand =
        brandFilter === 'ALL' ||
        u.brandName === brandFilter ||
        (Array.isArray(u.accessibleBrands) && u.accessibleBrands.includes(brandFilter));

      return matchSearch && matchRole && matchStatus && matchBrand;
    });
  }, [managedUsers, searchTerm, roleFilter, statusFilter, brandFilter]);

  // Brand Stats (Users count per brand)
  const brandUserCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    (managedUsers || []).forEach(u => {
      if (u.brandName) {
        map[u.brandName] = (map[u.brandName] || 0) + 1;
      }
      if (Array.isArray(u.accessibleBrands)) {
        u.accessibleBrands.forEach(b => {
          if (b !== u.brandName) {
            map[b] = (map[b] || 0) + 1;
          }
        });
      }
    });
    return map;
  }, [managedUsers]);

  // Open Edit User Modal
  const handleOpenEditUser = (user: ManagedUser) => {
    setUserToEdit(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      brandName: user.brandName || '',
      accessibleBrands: Array.isArray(user.accessibleBrands) ? [...user.accessibleBrands] : [],
    });
    setIsEditUserModalOpen(true);
  };

  // Submit Add User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      showToast('error', 'Nama, email, dan kata sandi wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const res = await createManagedUser({
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      phone: newUserForm.phone || undefined,
      role: newUserForm.role,
      status: newUserForm.status,
      brandName: newUserForm.role === 'BRAND' ? newUserForm.brandName || undefined : undefined,
      accessibleBrands: newUserForm.role === 'BRAND' ? newUserForm.accessibleBrands : [],
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', res.message);
      setIsAddUserModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'BRAND',
        status: 'ACTIVE',
        brandName: '',
        accessibleBrands: [],
      });
    } else {
      showToast('error', res.message);
    }
  };

  // Submit Edit User
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsSubmitting(true);
    const updatePayload: any = {
      name: editUserForm.name,
      email: editUserForm.email,
      phone: editUserForm.phone || undefined,
      role: editUserForm.role,
      status: editUserForm.status,
      brandName: editUserForm.role === 'BRAND' ? editUserForm.brandName || undefined : undefined,
      accessibleBrands: editUserForm.role === 'BRAND' ? editUserForm.accessibleBrands : [],
    };
    if (editUserForm.password && editUserForm.password.trim().length > 0) {
      updatePayload.password = editUserForm.password.trim();
    }

    const res = await updateManagedUser(userToEdit.id, updatePayload);
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', res.message);
      setIsEditUserModalOpen(false);
      setUserToEdit(null);
    } else {
      showToast('error', res.message);
    }
  };

  // Toggle User Status quickly (Active / Suspended)
  const handleToggleUserStatus = async (user: ManagedUser) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const label = newStatus === 'ACTIVE' ? 'diaktifkan' : 'dinonaktifkan (suspended)';
    const res = await updateManagedUser(user.id, { status: newStatus });
    if (res.success) {
      showToast('success', `Akun ${user.name} berhasil ${label}.`);
    } else {
      showToast('error', res.message);
    }
  };

  // Delete User Submit
  const handleDeleteUserSubmit = async () => {
    if (!deleteUserConfirm) return;
    setIsSubmitting(true);
    const res = await deleteManagedUser(deleteUserConfirm.id);
    setIsSubmitting(false);
    setDeleteUserConfirm(null);

    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // Submit Add Brand
  const handleAddBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim() || !brandForm.code.trim()) {
      showToast('error', 'Nama brand dan kode brand wajib diisi!');
      return;
    }

    // Check duplicate
    if (brands.some(b => b.name.toUpperCase() === brandForm.name.trim().toUpperCase())) {
      showToast('error', `Brand dengan nama "${brandForm.name.toUpperCase()}" sudah ada.`);
      return;
    }

    setIsSubmitting(true);
    await addBrand({
      name: brandForm.name.trim().toUpperCase(),
      code: brandForm.code.trim().toUpperCase(),
      contactPerson: brandForm.contactPerson.trim(),
      phone: brandForm.phone.trim(),
    });
    setIsSubmitting(false);
    setIsAddBrandModalOpen(false);
    setBrandForm({ name: '', code: '', contactPerson: '', phone: '' });
    showToast('success', `Brand ${brandForm.name.toUpperCase()} berhasil ditambahkan!`);
  };

  // Open Edit Brand Modal
  const handleOpenEditBrand = (brand: Brand) => {
    setBrandToEdit(brand);
    setBrandForm({
      name: brand.name,
      code: brand.code,
      contactPerson: brand.contactPerson,
      phone: brand.phone,
    });
    setIsEditBrandModalOpen(true);
  };

  // Submit Edit Brand
  const handleUpdateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandToEdit) return;

    setIsSubmitting(true);
    await updateBrand({
      id: brandToEdit.id,
      name: brandForm.name.trim().toUpperCase(),
      code: brandForm.code.trim().toUpperCase(),
      contactPerson: brandForm.contactPerson.trim(),
      phone: brandForm.phone.trim(),
    });
    setIsSubmitting(false);
    setIsEditBrandModalOpen(false);
    setBrandToEdit(null);
    showToast('success', 'Data brand berhasil diperbarui!');
  };

  // Delete Brand Submit with Check
  const handleDeleteBrandSubmit = async () => {
    if (!deleteBrandConfirm) return;

    // Check if brand is in use
    const bName = deleteBrandConfirm.name;
    const usersWithBrand = (managedUsers || []).filter(
      u => u.brandName === bName || (Array.isArray(u.accessibleBrands) && u.accessibleBrands.includes(bName))
    );
    const rollsWithBrand = (inboundRolls || []).filter(r => r.brand === bName);
    const spkWithBrand = (spkList || []).filter(s => s.brand === bName);
    const sjWithBrand = (suratJalanList || []).filter(sj => sj.brand === bName);

    if (usersWithBrand.length > 0 || rollsWithBrand.length > 0 || spkWithBrand.length > 0 || sjWithBrand.length > 0) {
      showToast(
        'error',
        `Tidak dapat menghapus brand "${bName}" karena masih digunakan oleh ${usersWithBrand.length} user, ${rollsWithBrand.length} rol, ${spkWithBrand.length} SPK, dan ${sjWithBrand.length} Surat Jalan.`
      );
      setDeleteBrandConfirm(null);
      return;
    }

    setIsSubmitting(true);
    await deleteBrand(deleteBrandConfirm.id);
    setIsSubmitting(false);
    setDeleteBrandConfirm(null);
    showToast('success', `Brand "${bName}" berhasil dihapus dari sistem.`);
  };

  // Accessible Brands checkbox toggle helper
  const toggleBrandInAccessible = (
    brandName: string,
    currentList: string[],
    setList: (val: string[]) => void
  ) => {
    if (currentList.includes(brandName)) {
      setList(currentList.filter(b => b !== brandName));
    } else {
      setList([...currentList, brandName]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PORTAL ADMINISTRATOR UTAMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              Manajemen User & Brand
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Pusat kendali pengguna aktif, penetapan brand mitra, pengalihan hak akses, serta pengelolaan master brand
              dalam ekosistem Konveksys.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/10 transition backdrop-blur-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan</span>
            </button>

            {activeTab === 'users' ? (
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengguna</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setBrandForm({ name: '', code: '', contactPerson: '', phone: '' });
                  setIsAddBrandModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Brand Mitra</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Counters inside header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-slate-400 text-xs font-medium">Total Akun Pengguna</div>
            <div className="text-xl font-bold text-white mt-1">{(managedUsers || []).length} Akun</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-slate-400 text-xs font-medium">User Brand Aktif</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {(managedUsers || []).filter(u => u.role === 'BRAND' && u.status === 'ACTIVE').length} User
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-slate-400 text-xs font-medium">Brand Terdaftar</div>
            <div className="text-xl font-bold text-indigo-300 mt-1">{(brands || []).length} Brand</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-slate-400 text-xs font-medium">Administrator</div>
            <div className="text-xl font-bold text-purple-300 mt-1">
              {(managedUsers || []).filter(u => u.role === 'ADMIN').length} Admin
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Akun Pengguna</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {(managedUsers || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'brands'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Brand Mitra</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'brands' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {(brands || []).length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, email, no telepon, atau brand..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as any)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN">Administrator</option>
                <option value="BRAND">Akun Brand</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                <option value="SUSPENDED">Nonaktif / Suspended</option>
              </select>

              {/* Brand Filter */}
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              >
                <option value="ALL">Semua Brand</option>
                {(brands || []).map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nama & Akun</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Brand Utama & Akses</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Tgl Terdaftar</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">Tidak ada data pengguna ditemukan.</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau filter pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelf = currentUser?.id === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition">
                          {/* Name & Contact */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                  user.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-medium">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {user.email}
                                  </span>
                                  {user.phone && (
                                    <span className="flex items-center gap-1 text-slate-400">
                                      • <Phone className="w-3 h-3" />
                                      {user.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            {user.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                <ShieldCheck className="w-3 h-3" />
                                Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <Building2 className="w-3 h-3" />
                                User Brand
                              </span>
                            )}
                          </td>

                          {/* Brand & Accessible Brands */}
                          <td className="py-3.5 px-4">
                            {user.role === 'ADMIN' ? (
                              <span className="text-xs font-medium text-slate-400 italic">
                                Semua Brand (Akses Penuh)
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-slate-500">Utama:</span>
                                  {user.brandName ? (
                                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                                      {user.brandName}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-amber-600 italic">Belum diset</span>
                                  )}
                                </div>

                                {Array.isArray(user.accessibleBrands) && user.accessibleBrands.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                    <span className="text-[11px] text-slate-400">Mitra:</span>
                                    {user.accessibleBrands.map(b => (
                                      <span
                                        key={b}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                                      >
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {user.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Aktif
                              </span>
                            ) : user.status === 'PENDING_APPROVAL' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Menunggu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                <UserX className="w-3 h-3 text-rose-600" />
                                Suspended
                              </span>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {user.createdAt ? formatDateIndo(user.createdAt.split('T')[0]) : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Toggle Status */}
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                disabled={isSelf}
                                title={
                                  user.status === 'ACTIVE'
                                    ? 'Nonaktifkan akun ini (Suspend)'
                                    : 'Aktifkan kembali akun ini'
                                }
                                className={`p-1.5 rounded-lg border transition ${
                                  user.status === 'ACTIVE'
                                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 border-slate-200'
                                    : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                } ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
                              >
                                {user.status === 'ACTIVE' ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>

                              {/* Edit User & Ganti Brand */}
                              <button
                                onClick={() => handleOpenEditUser(user)}
                                title="Edit data akun & ganti brand"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => setDeleteUserConfirm(user)}
                                disabled={isSelf}
                                title={isSelf ? 'Tidak bisa menghapus akun Anda sendiri' : 'Hapus akun'}
                                className={`p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition ${
                                  isSelf ? 'opacity-30 cursor-not-allowed' : ''
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANDS LIST */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Menampilkan <span className="font-bold text-slate-900">{(brands || []).length}</span> brand mitra yang
              terhubung ke sistem Konveksys.
            </div>
            <button
              onClick={() => {
                setBrandForm({ name: '', code: '', contactPerson: '', phone: '' });
                setIsAddBrandModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Brand Baru</span>
            </button>
          </div>

          {/* Brands Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nama Brand</th>
                    <th className="py-3.5 px-4">Kode Singkatan</th>
                    <th className="py-3.5 px-4">Person In Charge (PIC)</th>
                    <th className="py-3.5 px-4">No. Telepon / WhatsApp</th>
                    <th className="py-3.5 px-4">User Terhubung</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {(brands || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">Belum ada data brand mitra.</p>
                      </td>
                    </tr>
                  ) : (
                    (brands || []).map(brand => {
                      const userCount = brandUserCountMap[brand.name] || 0;

                      return (
                        <tr key={brand.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-500" />
                              <span>{brand.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold">
                              {brand.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {brand.contactPerson || <span className="text-slate-400 italic">-</span>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                            {brand.phone || <span className="text-slate-400 italic">-</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                userCount > 0
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              {userCount} Akun
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditBrand(brand)}
                                title="Edit data brand"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteBrandConfirm(brand)}
                                title="Hapus brand"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH USER BARU */}
      {/* ============================================================ */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">Buat akun untuk admin baru atau mitra brand</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi (Password) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={newUserForm.password}
                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* No WhatsApp / Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={newUserForm.phone}
                  onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Role & Status Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Akun</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                  >
                    <option value="BRAND">User Brand Mitra</option>
                    <option value="ADMIN">Administrator Utama</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={newUserForm.status}
                    onChange={e => setNewUserForm({ ...newUserForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                  >
                    <option value="ACTIVE">Aktif Langsung</option>
                    <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                    <option value="SUSPENDED">Nonaktif / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Brand Assignment (Only if role === 'BRAND') */}
              {newUserForm.role === 'BRAND' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">Brand Utama (Default)</label>
                    <select
                      value={newUserForm.brandName}
                      onChange={e => {
                        const val = e.target.value;
                        const accessible = newUserForm.accessibleBrands.includes(val)
                          ? newUserForm.accessibleBrands
                          : [...newUserForm.accessibleBrands, val].filter(Boolean);
                        setNewUserForm({ ...newUserForm, brandName: val, accessibleBrands: accessible });
                      }}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-bold text-indigo-700 bg-white"
                    >
                      <option value="">-- Pilih Brand Utama --</option>
                      {(brands || []).map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Akses Brand Tambahan (Multi-brand)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Pilih brand apa saja yang dapat dilihat dan dikelola oleh user ini:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(brands || []).map(b => {
                        const isChecked = newUserForm.accessibleBrands.includes(b.name);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                toggleBrandInAccessible(
                                  b.name,
                                  newUserForm.accessibleBrands,
                                  val => setNewUserForm({ ...newUserForm, accessibleBrands: val })
                                )
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT USER & GANTI BRAND */}
      {/* ============================================================ */}
      {isEditUserModalOpen && userToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Pengguna & Ganti Brand</h3>
                  <p className="text-xs text-slate-500">Kelola penetapan brand dan kredensial akun</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="p-6 space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Email & No Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email}
                    onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={editUserForm.phone}
                    onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Ganti Kata Sandi (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ubah Kata Sandi <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin ganti)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Ketik kata sandi baru untuk mereset..."
                    value={editUserForm.password}
                    onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Akun</label>
                  <select
                    value={editUserForm.role}
                    onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                  >
                    <option value="BRAND">User Brand Mitra</option>
                    <option value="ADMIN">Administrator Utama</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={editUserForm.status}
                    onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                    <option value="SUSPENDED">Nonaktif / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Ganti Brand & Multi-Brand Access */}
              {editUserForm.role === 'BRAND' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Pengaturan Brand Mitra</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Brand Utama (Active Brand)
                    </label>
                    <select
                      value={editUserForm.brandName}
                      onChange={e => {
                        const val = e.target.value;
                        const accessible = editUserForm.accessibleBrands.includes(val)
                          ? editUserForm.accessibleBrands
                          : [...editUserForm.accessibleBrands, val].filter(Boolean);
                        setEditUserForm({ ...editUserForm, brandName: val, accessibleBrands: accessible });
                      }}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-bold text-indigo-700 bg-white"
                    >
                      <option value="">-- Pilih Brand Utama --</option>
                      {(brands || []).map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Hak Akses Brand (Accessible Brands)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      User dapat melihat data dan beralih ke brand-brand yang dicentang di bawah ini:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(brands || []).map(b => {
                        const isChecked = editUserForm.accessibleBrands.includes(b.name);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                toggleBrandInAccessible(
                                  b.name,
                                  editUserForm.accessibleBrands,
                                  val => setEditUserForm({ ...editUserForm, accessibleBrands: val })
                                )
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS USER */}
      {/* ============================================================ */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Akun Pengguna?</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{' '}
              <span className="font-bold text-slate-900">{deleteUserConfirm.name}</span> ({deleteUserConfirm.email})?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteUserConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUserSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH BRAND BARU */}
      {/* ============================================================ */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Tambah Brand Mitra Baru</h3>
              </div>
              <button
                onClick={() => setIsAddBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBrandSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Brand *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: GREYWOLF, NAMI, CITA-CITA"
                  value={brandForm.name}
                  onChange={e => setBrandForm({ ...brandForm, name: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Singkatan Brand (3-4 Karakter) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: GW, NMI, CTC, PDG"
                  value={brandForm.code}
                  onChange={e => setBrandForm({ ...brandForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Person In Charge (PIC)</label>
                <input
                  type="text"
                  placeholder="Nama Kontak Utama"
                  value={brandForm.contactPerson}
                  onChange={e => setBrandForm({ ...brandForm, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={brandForm.phone}
                  onChange={e => setBrandForm({ ...brandForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT BRAND */}
      {/* ============================================================ */}
      {isEditBrandModalOpen && brandToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Data Brand Mitra</h3>
              </div>
              <button
                onClick={() => setIsEditBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBrandSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Brand *</label>
                <input
                  type="text"
                  required
                  value={brandForm.name}
                  onChange={e => setBrandForm({ ...brandForm, name: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Singkatan Brand *</label>
                <input
                  type="text"
                  required
                  value={brandForm.code}
                  onChange={e => setBrandForm({ ...brandForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Person In Charge (PIC)</label>
                <input
                  type="text"
                  value={brandForm.contactPerson}
                  onChange={e => setBrandForm({ ...brandForm, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={brandForm.phone}
                  onChange={e => setBrandForm({ ...brandForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditBrandModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS BRAND */}
      {/* ============================================================ */}
      {deleteBrandConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Brand Mitra?</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus brand{' '}
              <span className="font-bold text-slate-900">{deleteBrandConfirm.name}</span> ({deleteBrandConfirm.code})?
              Pastikan tidak ada rol kain, SPK, atau user yang sedang menggunakan brand ini.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteBrandConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteBrandSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagementView;
