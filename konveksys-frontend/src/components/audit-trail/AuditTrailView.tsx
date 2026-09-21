import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  History,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  User,
  AlertTriangle,
  Info,
  Trash2,
  Edit3,
  PlusCircle,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  X,
  Building2,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditLogEntry, AuditModule, AuditActionType, AuditSeverity } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';

const MODULE_LABELS: Record<AuditModule, { label: string; color: string }> = {
  ARUS_KAS: { label: 'Arus Kas', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INBOUND_DP: { label: 'DP Inbound', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  STOK_KAIN: { label: 'Stok Kain', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  STOK_AKSESORIS: { label: 'Aksesoris & Trims', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SPK_CUTTING: { label: 'SPK & Cutting', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SURAT_JALAN: { label: 'Surat Jalan', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  HPP_FOB: { label: 'HPP & FOB', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  FINANCE_INVOICE: { label: 'Faktur & Invoice', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  USER_AUTH: { label: 'Manajemen User', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  PENGEMBALIAN_RETUR: { label: 'Retur & Cacat', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  SISTEM: { label: 'Sistem', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const ACTION_BADGES: Record<AuditActionType, { label: string; badge: string; icon: any }> = {
  CREATE: { label: 'Tambah Data', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: PlusCircle },
  UPDATE: { label: 'Ubah Data', badge: 'bg-amber-100 text-amber-800 border-amber-300', icon: Edit3 },
  DELETE: { label: 'Hapus Data', badge: 'bg-rose-100 text-rose-800 border-rose-300', icon: Trash2 },
  APPROVE: { label: 'Persetujuan', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: CheckCircle2 },
  REJECT: { label: 'Penolakan', badge: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle },
  STATUS_CHANGE: { label: 'Ganti Status', badge: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
};

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useApp();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');

  // Modal Detail State
  const [detailModalLog, setDetailModalLog] = useState<AuditLogEntry | null>(null);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchSearch =
          log.entityName.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.userName.toLowerCase().includes(query) ||
          log.entityId.toLowerCase().includes(query);
        if (!matchSearch) return false;
      }

      // Module
      if (selectedModule !== 'ALL' && log.module !== selectedModule) {
        return false;
      }

      // Action
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }

      // Severity
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }

      // Time Range
      if (selectedTimeRange !== 'ALL') {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (selectedTimeRange === 'TODAY') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (logDate < startOfToday) return false;
        } else if (selectedTimeRange === '7DAYS') {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (logDate < sevenDaysAgo) return false;
        } else if (selectedTimeRange === '30DAYS') {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedModule, selectedAction, selectedSeverity, selectedTimeRange]);

  // Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const criticalDeletes = auditLogs.filter(l => l.action === 'DELETE').length;
    const financeChanges = auditLogs.filter(l => ['ARUS_KAS', 'INBOUND_DP', 'FINANCE_INVOICE'].includes(l.module)).length;
    const inventoryChanges = auditLogs.filter(l => ['STOK_KAIN', 'STOK_AKSESORIS', 'SPK_CUTTING'].includes(l.module)).length;

    return { total, criticalDeletes, financeChanges, inventoryChanges };
  }, [auditLogs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log untuk diekspor.');
      return;
    }

    const headers = ['ID Log', 'Waktu', 'User Pelaku', 'Role', 'Modul', 'Tindakan', 'Tingkat', 'Entitas', 'Keterangan'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${l.userName}"`,
      l.userRole,
      l.module,
      l.action,
      l.severity,
      `"${l.entityName.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Trail_Konveksys_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatDateIndo(isoString.split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Rekam Jejak & Audit Trail
              <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Anti-Manipulasi
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan kronologis aktivitas sistem, integritas kas finansial, mutasi stok, dan pencegahan kecurangan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-base cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-base cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Log</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Log Aktivitas</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total.toLocaleString('id-ID')}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Semua rekam jejak</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-rose-50/20">
          <div>
            <span className="text-xs font-medium text-rose-700">Tindakan Hapus (Kritis)</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{stats.criticalDeletes.toLocaleString('id-ID')}</div>
            <span className="text-[11px] text-rose-500/80 mt-0.5 block">Data dihapus dari sistem</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/20">
          <div>
            <span className="text-xs font-medium text-emerald-700">Aktivitas Finansial & Kas</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.financeChanges.toLocaleString('id-ID')}</div>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Arus kas, DP & invoice</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-blue-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-blue-50/20">
          <div>
            <span className="text-xs font-medium text-blue-700">Aktivitas Stok & Produksi</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.inventoryChanges.toLocaleString('id-ID')}</div>
            <span className="text-[11px] text-blue-600/80 mt-0.5 block">Kain, SPK & Surat Jalan</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari kata kunci (nama bahan, nomor SPK, nominal, user pelaku)..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 hover:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto overflow-x-auto">
            {(['ALL', 'TODAY', '7DAYS', '30DAYS'] as const).map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedTimeRange === range
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'ALL' && 'Semua Waktu'}
                {range === 'TODAY' && 'Hari Ini'}
                {range === '7DAYS' && '7 Hari'}
                {range === '30DAYS' && '30 Hari'}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100 text-xs">
          {/* Module Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filter Modul
            </label>
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-semibold bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Modul Sistem</option>
              {Object.entries(MODULE_LABELS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filter Tipe Aksi
            </label>
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-semibold bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Tipe Aksi</option>
              {Object.entries(ACTION_BADGES).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tingkat Urgensi
            </label>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-semibold bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Urgensi</option>
              <option value="CRITICAL">Kritis (Hapus / Manipulasi)</option>
              <option value="WARNING">Peringatan (Perubahan Nilai)</option>
              <option value="INFO">Informasi Normal (Pencatatan)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Kronologi Rekam Jejak</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredLogs.length} Aktivitas
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Log bersifat permanen & tidak dapat dimanipulasi
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada rekam jejak yang cocok</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter modul dan rentang waktu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 w-40">Waktu</th>
                  <th className="py-3 px-4 w-44">User Pelaku</th>
                  <th className="py-3 px-3 w-36">Modul</th>
                  <th className="py-3 px-3 w-32">Aksi</th>
                  <th className="py-3 px-4 min-w-[180px]">Entitas / Target</th>
                  <th className="py-3 px-4 min-w-[280px]">Rincian Tindakan</th>
                  <th className="py-3 px-3 text-center w-24">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const mod = MODULE_LABELS[log.module] || { label: log.module, color: 'bg-slate-50 text-slate-700 border-slate-200' };
                  const act = ACTION_BADGES[log.action] || { label: log.action, badge: 'bg-slate-100 text-slate-700', icon: Info };
                  const ActionIcon = act.icon;
                  const hasDiff = Boolean(log.previousData || log.newData);

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        log.severity === 'CRITICAL' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {formatRelativeTime(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} •{' '}
                          {new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {log.userName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-slate-900 truncate" title={log.userName}>
                              {log.userName}
                            </div>
                            <span className="text-[9px] font-medium text-slate-400 tracking-wider uppercase">
                              {log.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${mod.color}`}
                        >
                          {mod.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${act.badge}`}
                        >
                          <ActionIcon className="w-3 h-3 shrink-0" />
                          <span>{act.label}</span>
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={log.entityName}>
                          {log.entityName}
                        </div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            ID: {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                      </td>

                      {/* Action / Diff Button */}
                      <td className="py-3 px-3 text-center">
                        {hasDiff ? (
                          <button
                            onClick={() => setDetailModalLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="Lihat snapshot data & perbandingan"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Diff</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail & Diff */}
      {detailModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Perbandingan Data (Audit Snapshot)</h3>
                  <p className="text-[11px] text-slate-400">ID Log: {detailModalLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalLog(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Meta information */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{detailModalLog.entityName}</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(detailModalLog.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{detailModalLog.details}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Pelaku: <strong className="text-slate-800">{detailModalLog.userName}</strong> ({detailModalLog.userRole})</span>
                </div>
              </div>

              {/* Side by side diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Previous Data */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-rose-50/80 px-3 py-1.5 border-b border-rose-100 text-rose-800 font-bold text-[11px] flex items-center justify-between">
                    <span>Data Sebelum Perubahan (Lama)</span>
                    <span className="text-[9px] uppercase">Sebelum</span>
                  </div>
                  <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-64">
                    {detailModalLog.previousData ? (
                      <pre>{JSON.stringify(detailModalLog.previousData, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-500 italic">Tidak ada data sebelumnya (Data baru dibuat)</span>
                    )}
                  </div>
                </div>

                {/* New Data */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50/80 px-3 py-1.5 border-b border-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-between">
                    <span>Data Setelah Perubahan (Baru)</span>
                    <span className="text-[9px] uppercase">Sesudah</span>
                  </div>
                  <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-64">
                    {detailModalLog.newData ? (
                      <pre>{JSON.stringify(detailModalLog.newData, null, 2)}</pre>
                    ) : (
                      <span className="text-rose-400 italic">Data telah dihapus sepenuhnya</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setDetailModalLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
