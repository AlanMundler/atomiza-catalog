/**
 * API JSON de stock para ATOMIZA (lee la planilla y la sirve al sitio).
 *
 * COMO USAR:
 * 1. Abri la planilla en Google Sheets.
 * 2. Extensiones > Apps Script > pega este archivo (stock.gs).
 * 3. Tu planilla necesita una pestana llamada "stock" con encabezados:
 *      id            | ml  | stock
 *      baroque-rouge | 5   | 3
 *    - id: el slug del perfume en perfumes.json (ej: baroque-rouge-540)
 *    - ml: tamanio en ml (5, 10, ...)
 *    - stock: cantidad disponible (0 = agotado)
 * 4. Implementar > Nueva implementacion > App web:
 *      Ejecutar como: Yo
 *      Quien tiene acceso: Cualquier persona
 * 5. Copia la URL .../exec y ponela en LIVE_STOCK_URL de src/utils/live-stock.ts.
 * 6. IMPORTANTE: cada vez que edites este codigo, crea una NUEVA implementacion
 *    (nueva version) para que el cambio se refleje.
 */
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('stock');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Falta la pestana 'stock'" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getValues();
  const rows = values
    .slice(1)
    .filter(function (row) {
      return row[0] && String(row[0]).trim() !== '';
    })
    .map(function (row) {
      return {
        id: String(row[0]).trim(),
        ml: Number(row[1]),
        stock: Number(row[2]),
      };
    });

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
