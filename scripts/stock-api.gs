/**
 * API JSON de stock para ATOMIZA (lee la planilla y la sirve al sitio).
 *
 * COMO USAR:
 * 1. Abri la planilla en Google Sheets.
 * 2. Extensiones > Apps Script > pega este archivo (stock.gs).
 * 3. La planilla necesita una pestana (se busca "stock-pagina", despues "stock",
 *    o cualquiera cuyo encabezado tenga las columnas id | ml | stock):
 *      id                      | ml | stock
 *      qaed-al-fursan-untamed  | 5  | 4
 *    - id: el slug del perfume (lo ves en la URL del producto, ej: .../qaed-al-fursan-untamed/)
 *    - ml: tamanio en ml (5, 10, ...)
 *    - stock: cantidad disponible (0 = sin stock)
 * 4. Implementar > Administrar implementaciones > lapiz de la implementacion
 *    existente > "Version: Nueva version" > Implementar. La URL /exec NO cambia.
 * 5. IMPORTANTE: cada vez que edites este codigo, crea una NUEVA version
 *    de la implementacion para que el cambio se refleje.
 */
function doGet() {
  var sheet = findStockSheet();
  if (!sheet) {
    return json({ error: "No se encontro una pestana 'stock-pagina'/'stock' con columnas id, ml y stock" });
  }

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var idCol = headers.indexOf('id');
  var mlCol = headers.indexOf('ml');
  var stockCol = headers.indexOf('stock');
  if (idCol === -1 || stockCol === -1) {
    return json({ error: "La pestana " + sheet.getName() + " necesita las columnas id, ml y stock" });
  }

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[idCol] || String(row[idCol]).trim() === '') continue;
    rows.push({
      id: String(row[idCol]).trim(),
      ml: Number(row[mlCol]),
      stock: Number(row[stockCol]),
    });
  }
  return json(rows);
}

function findStockSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var preferred = ss.getSheetByName('stock-pagina') || ss.getSheetByName('stock');
  if (preferred) return preferred;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim().toLowerCase(); });
    if (headers.indexOf('id') !== -1 && headers.indexOf('ml') !== -1 && headers.indexOf('stock') !== -1) {
      return sheet;
    }
  }
  return null;
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
