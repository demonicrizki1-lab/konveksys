import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PendingBrandUser } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  Tag,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

interface BrandApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandApprovalModal: React.FC<BrandApprovalModalProps> = ({ isOpen, onClose }) => {
  const { pendingBrands, approveBrandUser, rejectBrandUser } = useApp();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleApprove = async (user: PendingBrandUser) => {
    setProcessingId(user.id);
    setFeedbackMsg(null);
    try {
      const res = await approveBrandUser(user.id, {
        accessibleBrands: user.accessibleBrands,
        brandName: user.accessibleBrands[0] || undefined,
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Akun ${user.name} berhasil disetujui & diaktifkan!` });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (user: PendingBrandUser) => {
    if (!window.confirm(`Yakin ingin menolak permohonan kemitraan dari ${user.name}?`)) return;
    setProcessingId(user.id);
    setFeedbackMsg(null);
    try {
      const res = await rejectBrandUser(user.id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Permohonan dari ${user.name} telah ditolak.` });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Persetujuan Pendaftaran Mitra Brand</h3>
              <p className="text-xs text-slate-400">Verifikasi dan aktivasi akun klien brand baru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3.5 text-xs font-semibold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {pendingBrands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div className="font-semibold text-slate-700 text-sm">Tidak Ada Antrean Pendaftaran</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Semua permohonan kemitraan brand baru telah selesai diverifikasi.
              </p>
            </div>
          ) : (
            pendingBrands.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                      Menunggu Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.email}</span>
                    </div>
                    {item.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Brand Tag Badges */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                      Brand yang Dinaungi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.accessibleBrands.map((b, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3 text-indigo-500" />
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Mendaftar pada: {formatDateIndo(item.createdAt)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.id}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{processingId === item.id ? 'Memproses...' : 'Setujui & Aktifkan'}</span>
                  </button>

                  <button
                    onClick={() => handleReject(item)}
                    disabled={processingId === item.id}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
