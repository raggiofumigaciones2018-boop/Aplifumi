/* ============================================
   APLIFUMI — Módulo de Exportación
   Exportar datos como CSV y Excel (.xls)
   ============================================ */

/**
 * Módulo de exportación de datos.
 * Genera archivos CSV y Excel para descarga directa en el navegador.
 */
const Exportar = (() => {
  'use strict';

  /**
   * Exporta un array de objetos como archivo CSV.
   * @param {Array<Object>} data — Datos a exportar.
   * @param {Array<{key: string, label: string}>} columns — Definición de columnas.
   * @param {string} [filename='exportacion'] — Nombre del archivo (sin extensión).
   */
  function toCSV(data, columns, filename = 'exportacion') {
    if (!data || data.length === 0) {
      Toast.show('No hay datos para exportar', 'warning');
      return;
    }

    // Encabezados
    const headers = columns.map(col => _escapeCSVField(col.label));
    const rows = [headers.join(',')];

    // Filas de datos
    for (const item of data) {
      const row = columns.map(col => _escapeCSVField(String(item[col.key] ?? '')));
      rows.push(row.join(','));
    }

    // BOM para UTF-8 (compatibilidad con Excel)
    const bom = '\uFEFF';
    const csvContent = bom + rows.join('\r\n');

    _downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
    Toast.show('Archivo CSV descargado', 'success');
  }

  /**
   * Exporta un array de objetos como archivo Excel (.xls).
   * Usa formato HTML table que Excel interpreta nativamente.
   * @param {Array<Object>} data — Datos a exportar.
   * @param {Array<{key: string, label: string}>} columns — Definición de columnas.
   * @param {string} [filename='exportacion'] — Nombre del archivo (sin extensión).
   */
  function toExcel(data, columns, filename = 'exportacion') {
    if (!data || data.length === 0) {
      Toast.show('No hay datos para exportar', 'warning');
      return;
    }

    // Generar tabla HTML que Excel interpreta
    const headerCells = columns.map(col => `<th style="background:#4a5568;color:#fff;padding:8px;font-weight:bold;">${_escapeHtml(col.label)}</th>`);

    const bodyRows = data.map((item, index) => {
      const cells = columns.map(col => `<td style="padding:6px;border:1px solid #e2e8f0;">${_escapeHtml(String(item[col.key] ?? ''))}</td>`);
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f7fafc';
      return `<tr style="background:${bgColor}">${cells.join('')}</tr>`;
    });

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${_escapeHtml(filename)}</x:Name>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
          <thead><tr>${headerCells.join('')}</tr></thead>
          <tbody>${bodyRows.join('')}</tbody>
        </table>
      </body>
      </html>
    `;

    _downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    Toast.show('Archivo Excel descargado', 'success');
  }

  /* ─── Funciones Internas ─── */

  /**
   * Descarga un archivo generado en el navegador.
   * @param {string} content — Contenido del archivo.
   * @param {string} filename — Nombre del archivo.
   * @param {string} mimeType — Tipo MIME.
   */
  function _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Limpiar recursos
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Escapa un campo para CSV (maneja comas, comillas y saltos de línea).
   * @param {string} field — Valor del campo.
   * @returns {string} Campo escapado.
   */
  function _escapeCSVField(field) {
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /** Escapa HTML para prevenir inyección */
  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { toCSV, toExcel };
})();
