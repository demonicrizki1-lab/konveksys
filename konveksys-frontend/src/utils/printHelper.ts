// ============================================================
// KonvekSys Isolated PDF / Print Generator (1-Page Pure Document)
// ============================================================

export function printIsolatedDocument(paperElement: HTMLElement, documentTitle: string) {
  // Buat iframe tersembunyi agar TIDAK PERNAH mencetak elemen website di belakangnya
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // 1. Salin seluruh CSS (Tailwind, Fonts, Styles) dari aplikasi utama
  let stylesHtml = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
    stylesHtml += el.outerHTML;
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        ${stylesHtml}
        <style>
          @page {
            size: A4 portrait;
            /* Margin 0 menghilangkan tulisan tanggal/jam dan nama dokumen di paling atas kertas */
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          body {
            padding: 10mm 12mm !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          .print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            padding: 20px 24px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            width: 100% !important;
          }
          /* Pastikan background dan warna tetap tercetak walau user lupa centang background graphics */
          .bg-emerald-700 {
            background-color: #047857 !important;
            color: #ffffff !important;
          }
          .bg-slate-900 {
            background-color: #0f172a !important;
            color: #ffffff !important;
          }
          .bg-slate-50 {
            background-color: #f8fafc !important;
          }
          .text-emerald-700 {
            color: #047857 !important;
          }
          .text-rose-600 {
            color: #e11d48 !important;
          }
          .text-indigo-700 {
            color: #4338ca !important;
          }
          .whitespace-nowrap {
            white-space: nowrap !important;
          }
          .shrink-0 {
            flex-shrink: 0 !important;
          }
          th.text-right, td.text-right {
            text-align: right !important;
            white-space: nowrap !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${paperElement.innerHTML}
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Beri waktu 350ms agar semua stylesheet Tailwind ter-render sempurna
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 350);
}
