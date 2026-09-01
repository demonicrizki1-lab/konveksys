import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Scissors,
  Truck,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/formatters';

export const Dashboard: React.FC = () => {
  const {
    userRole,
    activeBrand,
    setActiveTab,
    inboundRolls,
    spkList,
    suratJalanList,
    vendors,
    getVendorRate,
    getBuyerRates,
  } = useApp();

  // Filter berdasarkan role
  const filteredRolls = userRole === 'BRAND' ? inboundRolls.filter(r => r.brand === activeBrand) : inboundRolls;
  const filteredSPK = userRole === 'BRAND' ? spkList.filter(s => s.brand === activeBrand) : spkList;
  const filteredSJ = userRole === 'BRAND' ? suratJalanList.filter(s => s.brand === activeBrand) : suratJalanList;

  // Kalkulasi metrik
  const totalMetersInStock = filteredRolls.reduce((acc, r) => acc + (r.status === 'DI_GUDANG' ? (r.meterLength - r.meterUsed) : 0), 0);
  const totalPcsDelivered = filteredSJ.reduce((acc, sj) => acc + sj.totalPcs, 0);

  const totalBuyerBilling = filteredSJ.reduce((acc, sj) => {
    const rates = getBuyerRates(sj.brand, sj.produk);
    const qtySML = sj.qtyDelivered.s + sj.qtyDelivered.m + sj.qtyDelivered.l;
    const qtyXL = sj.qtyDelivered.xl + sj.qtyDelivered.xxl;
    const qtyAnak4_10 = sj.qtyDelivered.anak4_10;
    const qtyAnak12_16 = sj.qtyDelivered.anak12_16;
    return acc + (qtySML * rates.rateSML + qtyXL * rates.rateXL + qtyAnak4_10 * rates.rateAnak4_10 + qtyAnak12_16 * rates.rateAnak12_16);
  }, 0);

  const totalVendorExpense = filteredSJ.reduce((acc, sj) => {
    const rate = getVendorRate(sj.vendor, sj.produk, sj.brand);
    return acc + sj.totalPcs * rate;
  }, 0);

  const totalActiveKasbon = vendors.reduce((acc, v) => acc + v.currentKasbon, 0);

  const formatRp = (amount: number) => 'Rp ' + amount.toLocaleString('id-ID');

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-7 text-white border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/20 px-3 py-1 rounded-full text-xs font-medium text-indigo-300 mb-3">
              {userRole === 'ADMIN' ? 'Admin & Owner Console' : `Brand Portal: ${activeBrand}`}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {userRole === 'ADMIN'
                ? 'Ikhtisar Operasional Makloon'
                : `Dashboard ${activeBrand}`}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              {userRole === 'ADMIN'
                ? 'Pantau stok rol, progress SPK, surat jalan harian, dan kalkulasi invoice & payroll.'
                : `Pelacakan stok kain, pengiriman, dan estimasi tagihan makloon ${activeBrand}.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {userRole === 'ADMIN' ? (
              <>
                <button
                  onClick={() => setActiveTab('inbound')}
                  className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-base btn-press shadow-sm"
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  + Inbound Rol
                </button>
                <button
                  onClick={() => setActiveTab('spk')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-base btn-press shadow-sm"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  + Buat SPK
                </button>
                <button
                  onClick={() => setActiveTab('outbound')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-base btn-press shadow-sm"
                >
                  <Truck className="w-3.5 h-3.5" />
                  + Surat Jalan
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab('finance')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-base btn-press shadow-sm shadow-indigo-600/25 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Lihat Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Stok Kain */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-base">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium text-slate-500">Stok Kain</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalMetersInStock.toLocaleString('id-ID')} m</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{filteredRolls.filter(r => r.status === 'DI_GUDANG').length} Rol Ready</span>
            <button onClick={() => setActiveTab('inbound')} className="text-indigo-600 font-medium hover:underline">
              Detail →
            </button>
          </div>
        </div>

        {/* SPK Aktif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-base">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium text-slate-500">SPK Cutting Aktif</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{filteredSPK.filter(s => s.status !== 'COMPLETED').length} SPK</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{filteredSPK.filter(s => s.status === 'COMPLETED').length} Selesai</span>
            {userRole === 'ADMIN' && (
              <button onClick={() => setActiveTab('spk')} className="text-indigo-600 font-medium hover:underline">
                Kelola →
              </button>
            )}
          </div>
        </div>

        {/* Pcs Terkirim */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-base">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium text-slate-500">Pcs Terkirim</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalPcsDelivered.toLocaleString('id-ID')} Pcs</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{filteredSJ.length} Surat Jalan</span>
            <button onClick={() => setActiveTab('outbound')} className="text-indigo-600 font-medium hover:underline">
              Riwayat →
            </button>
          </div>
        </div>

        {/* Estimasi Invoice */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-base">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium text-slate-500">
              {userRole === 'ADMIN' ? 'Estimasi Invoice' : 'Total Tagihan'}
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{formatRp(totalBuyerBilling)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Auto Pricing</span>
            <button onClick={() => setActiveTab('finance')} className="text-indigo-600 font-medium hover:underline">
              Cetak →
            </button>
          </div>
        </div>

      </div>

      {/* Ringkasan Finansial - Admin Only */}
      {userRole === 'ADMIN' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Ringkasan Finansial & Margin</h2>
              <p className="text-xs text-slate-500 mt-0.5">Perbandingan tagihan buyer vs beban ongkos jahit vendor.</p>
            </div>
            <button
              onClick={() => setActiveTab('finance')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-base btn-press shrink-0"
            >
              Buka Finance →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <div className="text-xs font-medium text-emerald-700 mb-1">Tagihan ke Brand (Pendapatan)</div>
              <div className="text-xl font-bold text-emerald-700">{formatRp(totalBuyerBilling)}</div>
              <div className="text-[11px] text-emerald-600 mt-1">Tarif multi-size per surat jalan</div>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
              <div className="text-xs font-medium text-rose-700 mb-1">Ongkos Jahit Vendor (Beban)</div>
              <div className="text-xl font-bold text-rose-700">{formatRp(totalVendorExpense)}</div>
              <div className="text-[11px] text-rose-600 mt-1">Tarif vendor + produk + brand</div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
              <div className="text-xs font-medium text-indigo-700 mb-1">Estimasi Gross Margin</div>
              <div className="text-xl font-bold text-indigo-700">
                {formatRp(Math.max(0, totalBuyerBilling - totalVendorExpense))}
              </div>
              <div className="text-[11px] text-indigo-600 mt-1">
                Kasbon aktif: <strong className="text-slate-700">{formatRp(totalActiveKasbon)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dua Kolom: Surat Jalan Terakhir & Progress SPK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Surat Jalan Terakhir */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h3 className="font-semibold text-slate-900 text-sm">Surat Jalan Terakhir</h3>
            </div>
            <button onClick={() => setActiveTab('outbound')} className="text-xs font-medium text-indigo-600 hover:underline">
              Lihat Semua ({filteredSJ.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredSJ.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada surat jalan.
              </div>
            ) : (
              filteredSJ.slice(0, 4).map((sj) => (
                <div key={sj.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      {sj.noSuratJalan}
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[10px] border border-indigo-100">
                        {sj.brand}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {sj.produk} · Penjahit: <span className="text-slate-700 font-medium">{sj.vendor}</span> · {formatDateIndo(sj.tanggal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{sj.totalPcs} Pcs</div>
                    <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> {sj.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Progress SPK */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <h3 className="font-semibold text-slate-900 text-sm">Progress SPK Cutting</h3>
            </div>
            {userRole === 'ADMIN' && (
              <button onClick={() => setActiveTab('spk')} className="text-xs font-medium text-indigo-600 hover:underline">
                Lihat Semua ({filteredSPK.length})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredSPK.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada SPK aktif.
              </div>
            ) : (
              filteredSPK.slice(0, 4).map((spk) => {
                const targetTotal = Object.values(spk.targetCutQty).reduce((a, b) => a + b, 0);
                const delivTotal = Object.values(spk.deliveredQty).reduce((a, b) => a + b, 0);
                const percent = targetTotal > 0 ? Math.round((delivTotal / targetTotal) * 100) : 0;
                const isCompleted = spk.status === 'COMPLETED' || (targetTotal > 0 && delivTotal >= targetTotal);
                const displayStatus = isCompleted ? 'COMPLETED' : (delivTotal > 0 ? 'PARTIAL_DELIVERED' : spk.status);

                return (
                  <div key={spk.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{spk.spkNumber}</span>
                        <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 font-medium rounded text-[10px]">
                          {spk.brand}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : delivTotal > 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {displayStatus}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{spk.produk} · {spk.vendor}</span>
                      <span className="font-medium text-slate-700">{delivTotal}/{targetTotal} Pcs ({percent}%)</span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
