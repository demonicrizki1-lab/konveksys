import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Scissors,
  Truck,
  DollarSign,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
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
    returnList,
    vendors,
    getVendorRate,
    getBuyerRates,
    getSuratJalanItems,
  } = useApp();

  // Filter berdasarkan role
  const filteredRolls = userRole === 'BRAND' ? inboundRolls.filter(r => r.brand === activeBrand) : inboundRolls;
  const filteredSPK = userRole === 'BRAND' ? spkList.filter(s => s.brand === activeBrand) : spkList;
  const filteredSJ = userRole === 'BRAND' ? suratJalanList.filter(s => s.brand === activeBrand) : suratJalanList;
  const filteredReturns = userRole === 'BRAND' ? returnList.filter(r => r.brand === activeBrand) : returnList;

  // Kalkulasi metrik
  const totalMetersInStock = filteredRolls.reduce((acc, r) => acc + (r.status === 'DI_GUDANG' ? (r.meterLength - r.meterUsed) : 0), 0);
  const totalPcsDelivered = filteredSJ.reduce((acc, sj) => acc + sj.totalPcs, 0);

  const totalBuyerBilling = filteredSJ.reduce((acc, sj) => {
    const sjItems = getSuratJalanItems(sj);
    const sjSum = sjItems.reduce((sAcc, item) => {
      const rates = getBuyerRates(item.brand, item.produk);
      const subHuruf =
        (item.qtyDelivered?.s || 0) * (rates.rateS || rates.rateSML || 0) +
        (item.qtyDelivered?.m || 0) * (rates.rateM || rates.rateSML || 0) +
        (item.qtyDelivered?.l || 0) * (rates.rateL || rates.rateSML || 0) +
        (item.qtyDelivered?.xl || 0) * (rates.rateXL || 0) +
        (item.qtyDelivered?.xxl || 0) * (rates.rateXXL || rates.rateXL || 0);
      const subAnak =
        (item.qtyDelivered?.anak2 || 0) * (rates.rateAnak2 || rates.rateAnak4 || 0) +
        (item.qtyDelivered?.anak4 || 0) * (rates.rateAnak4 || 0) +
        (item.qtyDelivered?.anak6 || 0) * (rates.rateAnak6 || 0) +
        (item.qtyDelivered?.anak8 || 0) * (rates.rateAnak8 || 0) +
        (item.qtyDelivered?.anak10 || 0) * (rates.rateAnak10 || 0) +
        (item.qtyDelivered?.anak12 || 0) * (rates.rateAnak12 || 0) +
        (item.qtyDelivered?.anak14 || 0) * (rates.rateAnak14 || 0) +
        (item.qtyDelivered?.anak16 || 0) * (rates.rateAnak16 || 0) +
        (item.qtyDelivered?.anak18 || 0) * (rates.rateAnak18 || rates.rateAnak16 || 0);

      return sAcc + (subHuruf + subAnak);
    }, 0);
    return acc + sjSum;
  }, 0);

  const totalVendorExpense = filteredSJ.reduce((acc, sj) => {
    const sjItems = getSuratJalanItems(sj);
    const sjExp = sjItems.reduce((sAcc, item) => {
      const rate = getVendorRate(item.vendor, item.produk, item.brand);
      return sAcc + item.totalPcs * rate;
    }, 0);
    return acc + sjExp;
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
            <h1 className="text-xl font-bold tracking-tight">
              {userRole === 'ADMIN'
                ? 'Ikhtisar Operasional Makloon'
                : `Dashboard ${activeBrand}`}
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl leading-relaxed">
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
                  Inbound Rol
                </button>
                <button
                  onClick={() => setActiveTab('spk')}
                  className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-base btn-press shadow-sm"
                >
                  <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                  Buat SPK
                </button>
                <button
                  onClick={() => setActiveTab('outbound')}
                  className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-base btn-press shadow-sm"
                >
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  Surat Jalan
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
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stok Kain</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {totalMetersInStock.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">m</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{filteredRolls.filter(r => r.status === 'DI_GUDANG').length} Rol Ready</span>
            <button onClick={() => setActiveTab('inbound')} className="text-indigo-600 font-bold hover:underline cursor-pointer">
              Detail →
            </button>
          </div>
        </div>

        {/* SPK Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">SPK Cutting Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {filteredSPK.filter(s => s.status !== 'COMPLETED').length} <span className="text-sm font-semibold text-slate-500">SPK</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{filteredSPK.filter(s => s.status === 'COMPLETED').length} Selesai</span>
            {userRole === 'ADMIN' && (
              <button onClick={() => setActiveTab('spk')} className="text-indigo-600 font-bold hover:underline cursor-pointer">
                Kelola →
              </button>
            )}
          </div>
        </div>

        {/* Pcs Terkirim */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pcs Terkirim</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {totalPcsDelivered.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Pcs</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{filteredSJ.length} Surat Jalan</span>
            <button onClick={() => setActiveTab('outbound')} className="text-indigo-600 font-bold hover:underline cursor-pointer">
              Riwayat →
            </button>
          </div>
        </div>

        {/* Estimasi Invoice */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {userRole === 'ADMIN' ? 'Estimasi Invoice' : 'Total Tagihan'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatRp(totalBuyerBilling)}</div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Auto Pricing</span>
            <button onClick={() => setActiveTab('finance')} className="text-indigo-600 font-bold hover:underline cursor-pointer">
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
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-base btn-press shrink-0 cursor-pointer"
            >
              Buka Finance →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tagihan ke Brand (Pendapatan)</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-0.5">{formatRp(totalBuyerBilling)}</div>
              <p className="text-xs text-slate-400">Tarif multi-size per surat jalan</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Ongkos Jahit Vendor (Beban)</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Scissors className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-0.5">{formatRp(totalVendorExpense)}</div>
              <p className="text-xs text-slate-400">Tarif vendor + produk + brand</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Estimasi Gross Margin</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-700 mt-0.5">
                {formatRp(Math.max(0, totalBuyerBilling - totalVendorExpense))}
              </div>
              <p className="text-xs text-slate-400">
                Kasbon aktif: <strong className="text-slate-700">{formatRp(totalActiveKasbon)}</strong>
              </p>
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
                const isOverDelivery = spk.status === 'OVER_DELIVERY' || (targetTotal > 0 && delivTotal > targetTotal);
                const isCompleted = spk.status === 'COMPLETED' || (targetTotal > 0 && delivTotal === targetTotal);
                const displayStatus = isOverDelivery
                  ? 'OVER_DELIVERY'
                  : isCompleted
                  ? 'COMPLETED'
                  : delivTotal > 0
                  ? 'PARTIAL_DELIVERED'
                  : spk.status;

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
                        isOverDelivery
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isCompleted
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
                      <span className="font-medium text-slate-700">
                        {delivTotal}/{targetTotal} Pcs ({percent}%) {isOverDelivery && `(+${delivTotal - targetTotal} Over)`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isOverDelivery ? 'bg-amber-500' : percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
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

      {/* 3. Monitoring Barang Cacat & Rework di Penjahit */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Monitoring Barang Cacat &amp; Perbaikan (Rework)</h3>
              <p className="text-[11px] text-slate-500">Barang retur yang sedang dalam penanganan penjahit atau menunggu QC</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('return')} className="text-xs font-medium text-indigo-600 hover:underline">
            Kelola Retur ({filteredReturns.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredReturns.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              Tidak ada barang yang sedang diretur / dalam perbaikan.
            </div>
          ) : (
            filteredReturns.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-mono font-bold text-slate-900">{item.noRetur}</strong>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'DIKIRIM_KE_VENDOR'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : item.status === 'SELESAI_REWORK'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : item.status === 'REJECT_TOTAL'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {item.status === 'DIKIRIM_KE_VENDOR' ? 'Di Vendor (Rework)' : item.status}
                  </span>
                </div>

                <div className="text-slate-600">
                  <span className="font-bold text-slate-800">{item.produk}</span> · <span className="text-slate-500">{item.brand}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-indigo-700 font-semibold">{item.vendor}</span>
                  <span className="font-bold text-rose-600">{item.totalPcs} Pcs ({item.alasanCacat})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
