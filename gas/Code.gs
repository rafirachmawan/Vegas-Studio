/**
 * Vegas Studio — Google Apps Script Backend (Web App)
 *
 * Menulis otomatis data booking dari web ke Spreadsheet dengan 10 header persis seperti sheet JADWAL WISUDA:
 * No | Tanggal | FG | Jam | Paket | Nama Klien | Username IG | Kampus & Lokasi | No. WA & Bayar | Status
 *
 * Cara pakai:
 * 1. Buka Google Sheets Anda (boleh sheet baru maupun sheet JADWAL WISUDA yang sudah ada).
 * 2. Klik menu Extensions > Apps Script, hapus kode lama, dan tempel file ini.
 * 3. (Opsional) Jalankan fungsi `setupSpreadsheet` satu kali untuk membuat tab & header otomatis.
 * 4. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
 * 5. Salin URL Web App (/exec) ke `.env` (`VITE_GAS_WEB_APP_URL`) atau tab Koneksi & Setup di Panel Admin.
 */

var BOOKING_HEADERS = [
  'No',
  'Tanggal',
  'FG',
  'Jam',
  'Paket',
  'Nama Klien',
  'Username IG',
  'Kampus & Lokasi',
  'No. WA & Bayar',
  'Status',
];

var SHEET_SCHEMAS = {
  Jadwal: ['id', 'tanggal', 'jam', 'status', 'catatan'],
  Paket: ['id', 'nama_paket', 'harga', 'deskripsi', 'aktif'],
  Fotografer: ['id', 'nama_fotografer', 'spesialisasi', 'aktif'],
};

function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_SCHEMAS).forEach(function (name) {
    ensureSheet_(ss, name, SHEET_SCHEMAS[name]);
  });
  ensureBookingSheet_(ss);
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'bootstrap';
    if (action !== 'bootstrap') {
      return jsonResponse_({
        ok: false,
        code: 'UNKNOWN_ACTION',
        message: 'Action GET tidak dikenali: ' + action,
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return jsonResponse_({
      ok: true,
      data: {
        jadwal: readJadwal_(ss),
        paket: readPaket_(ss),
        fotografer: readFotografer_(ss),
        rekap: readBookingRows_(ss),
      },
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      code: 'SERVER_ERROR',
      message: String(err && err.message ? err.message : err),
    });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var rawBody = (e && e.postData && e.postData.contents) || '{}';
    var body = JSON.parse(rawBody);
    var action = body.action;
    var payload = body.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'createBooking') {
      return jsonResponse_(handleCreateBooking_(ss, payload));
    }
    if (action === 'updateBookingStatus') {
      return jsonResponse_(handleUpdateBookingStatus_(ss, payload));
    }
    if (action === 'createPackage') {
      return jsonResponse_(handleCreatePackage_(ss, payload));
    }
    if (action === 'updatePackage') {
      return jsonResponse_(handleUpdatePackage_(ss, payload));
    }
    if (action === 'deletePackage') {
      return jsonResponse_(handleDeleteRowById_(ss, 'Paket', payload.id));
    }
    if (action === 'createPhotographer') {
      return jsonResponse_(handleCreatePhotographer_(ss, payload));
    }
    if (action === 'updatePhotographer') {
      return jsonResponse_(handleUpdatePhotographer_(ss, payload));
    }
    if (action === 'deletePhotographer') {
      return jsonResponse_(handleDeleteRowById_(ss, 'Fotografer', payload.id));
    }
    if (action === 'createScheduleSlot') {
      return jsonResponse_(handleCreateScheduleSlot_(ss, payload));
    }
    if (action === 'updateScheduleStatus') {
      return jsonResponse_(handleUpdateScheduleStatus_(ss, payload));
    }
    if (action === 'deleteScheduleSlot') {
      return jsonResponse_(handleDeleteRowById_(ss, 'Jadwal', payload.id));
    }

    return jsonResponse_({
      ok: false,
      code: 'UNKNOWN_ACTION',
      message: 'Action POST tidak dikenali: ' + action,
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      code: 'SERVER_ERROR',
      message: String(err && err.message ? err.message : err),
    });
  } finally {
    lock.releaseLock();
  }
}

function handleCreateBooking_(ss, payload) {
  var scheduleSheet = ensureSheet_(ss, 'Jadwal', SHEET_SCHEMAS.Jadwal);
  var bookingInfo = ensureBookingSheet_(ss);
  var bookingSheet = bookingInfo.sheet;
  var headerRow = bookingInfo.headerRow;

  var scheduleId = String(payload.scheduleId || '').trim();
  if (!scheduleId) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'scheduleId wajib disertakan.' };
  }

  var rowIndex = findRowIndexById_(scheduleSheet, scheduleId);
  if (rowIndex === -1) {
    return {
      ok: false,
      code: 'SLOT_ALREADY_BOOKED',
      message: 'Slot jadwal tidak ditemukan atau sudah dihapus. Muat ulang jadwal terbaru.',
    };
  }

  var rowValues = scheduleSheet.getRange(rowIndex, 1, 1, 5).getValues()[0];
  var currentStatus = String(rowValues[3] || '').trim().toLowerCase();
  if (currentStatus === 'booked') {
    return {
      ok: false,
      code: 'SLOT_ALREADY_BOOKED',
      message: 'Slot jadwal ini baru saja terisi pemesan lain. Pilih jadwal Kosong lainnya.',
    };
  }

  var tanggalIso = formatDateCell_(rowValues[1]);
  var jamSlot = formatTimeCell_(rowValues[2]);
  var catatanStr = String(rowValues[4] || '');

  // Tandai slot pada tab Jadwal sebagai Booked di dalam lock
  scheduleSheet.getRange(rowIndex, 4).setValue('Booked');

  var existingRows = readBookingRowsFrom_(bookingSheet, headerRow);
  var maxNo = 0;
  existingRows.forEach(function (r) {
    if (r.no > maxNo) {
      maxNo = r.no;
    }
  });
  var nextNo = maxNo + 1;

  var tanggalSlash = String(payload.tanggal || '').trim() || isoToSlash_(tanggalIso);
  var fg = String(payload.fg || '').trim();
  var jam = String(payload.jam || '').trim() || jamSlot;
  var paket = String(payload.paket || '').trim();
  var namaKlien = String(payload.nama_klien || '').trim();
  var usernameIg = String(payload.username_ig || '').trim();
  var kampusLokasi = String(payload.kampus_lokasi || '').trim();
  var noWaBayar = String(payload.no_wa_bayar || '').trim();
  var status = String(payload.status || 'Belum').trim() || 'Belum';

  var targetRow = Math.max(bookingSheet.getLastRow() + 1, headerRow + 1);
  var range = bookingSheet.getRange(targetRow, 1, 1, 10);
  // Paksa kolom Tanggal & teks lainnya memakai format teks polos agar DD/MM/YYYY tidak dibalik oleh locale spreadsheet
  range.setNumberFormats([['0', '@', '@', '@', '@', '@', '@', '@', '@', '@']]);
  range.setValues([[
    nextNo,
    tanggalSlash,
    fg,
    jam,
    paket,
    namaKlien,
    usernameIg,
    kampusLokasi,
    noWaBayar,
    status,
  ]]);

  SpreadsheetApp.flush();

  return {
    ok: true,
    data: {
      updatedSlot: {
        id: scheduleId,
        tanggal: tanggalIso,
        jam: jamSlot,
        status: 'Booked',
        catatan: catatanStr,
      },
      record: {
        no: nextNo,
        tanggal: tanggalSlash,
        fg: fg,
        jam: jam,
        paket: paket,
        nama_klien: namaKlien,
        username_ig: usernameIg,
        kampus_lokasi: kampusLokasi,
        no_wa_bayar: noWaBayar,
        status: status,
        harga_paket: Number(payload.harga_paket || 0) || undefined,
      },
    },
  };
}

function handleUpdateBookingStatus_(ss, payload) {
  var bookingInfo = ensureBookingSheet_(ss);
  var sheet = bookingInfo.sheet;
  var headerRow = bookingInfo.headerRow;
  var targetNo = Number(payload.no || 0);
  var nextStatus = String(payload.status || 'Belum').trim() || 'Belum';

  var lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return { ok: false, code: 'NOT_FOUND', message: 'Data booking tidak ditemukan.' };
  }

  var values = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, 10).getValues();
  for (var i = 0; i < values.length; i++) {
    if (Number(values[i][0]) === targetNo) {
      var actualRow = headerRow + 1 + i;
      sheet.getRange(actualRow, 10).setValue(nextStatus);
      SpreadsheetApp.flush();
      return {
        ok: true,
        data: rowToBookingRecord_(values[i], nextStatus),
      };
    }
  }
  return { ok: false, code: 'NOT_FOUND', message: 'Nomor booking #' + targetNo + ' tidak ditemukan.' };
}

function handleCreatePackage_(ss, payload) {
  var sheet = ensureSheet_(ss, 'Paket', SHEET_SCHEMAS.Paket);
  var id = generateId_('pkt');
  var item = {
    id: id,
    nama_paket: String(payload.nama_paket || '').trim(),
    harga: Number(payload.harga || 0),
    deskripsi: String(payload.deskripsi || '').trim(),
    aktif: Boolean(payload.aktif),
  };
  sheet.appendRow([item.id, item.nama_paket, item.harga, item.deskripsi, item.aktif]);
  SpreadsheetApp.flush();
  return { ok: true, data: item };
}

function handleUpdatePackage_(ss, payload) {
  var sheet = ensureSheet_(ss, 'Paket', SHEET_SCHEMAS.Paket);
  var rowIndex = findRowIndexById_(sheet, String(payload.id || ''));
  if (rowIndex === -1) {
    return { ok: false, code: 'NOT_FOUND', message: 'Paket tidak ditemukan.' };
  }
  var item = {
    id: String(payload.id),
    nama_paket: String(payload.nama_paket || '').trim(),
    harga: Number(payload.harga || 0),
    deskripsi: String(payload.deskripsi || '').trim(),
    aktif: Boolean(payload.aktif),
  };
  sheet
    .getRange(rowIndex, 1, 1, 5)
    .setValues([[item.id, item.nama_paket, item.harga, item.deskripsi, item.aktif]]);
  SpreadsheetApp.flush();
  return { ok: true, data: item };
}

function handleCreatePhotographer_(ss, payload) {
  var sheet = ensureSheet_(ss, 'Fotografer', SHEET_SCHEMAS.Fotografer);
  var id = generateId_('ftg');
  var item = {
    id: id,
    nama_fotografer: String(payload.nama_fotografer || '').trim(),
    spesialisasi: String(payload.spesialisasi || '').trim(),
    aktif: Boolean(payload.aktif),
  };
  sheet.appendRow([item.id, item.nama_fotografer, item.spesialisasi, item.aktif]);
  SpreadsheetApp.flush();
  return { ok: true, data: item };
}

function handleUpdatePhotographer_(ss, payload) {
  var sheet = ensureSheet_(ss, 'Fotografer', SHEET_SCHEMAS.Fotografer);
  var rowIndex = findRowIndexById_(sheet, String(payload.id || ''));
  if (rowIndex === -1) {
    return { ok: false, code: 'NOT_FOUND', message: 'Fotografer tidak ditemukan.' };
  }
  var item = {
    id: String(payload.id),
    nama_fotografer: String(payload.nama_fotografer || '').trim(),
    spesialisasi: String(payload.spesialisasi || '').trim(),
    aktif: Boolean(payload.aktif),
  };
  sheet
    .getRange(rowIndex, 1, 1, 4)
    .setValues([[item.id, item.nama_fotografer, item.spesialisasi, item.aktif]]);
  SpreadsheetApp.flush();
  return { ok: true, data: item };
}

function handleCreateScheduleSlot_(ss, payload) {
  var sheet = ensureSheet_(ss, 'Jadwal', SHEET_SCHEMAS.Jadwal);
  var id = generateId_('jdw');
  var status = String(payload.status || '').trim() === 'Booked' ? 'Booked' : 'Kosong';
  var item = {
    id: id,
    tanggal: String(payload.tanggal || '').trim(),
    jam: String(payload.jam || '').trim(),
    status: status,
    catatan: String(payload.catatan || '').trim(),
  };
  var nextRow = sheet.getLastRow() + 1;
  var range = sheet.getRange(nextRow, 1, 1, 5);
  range.setNumberFormats([['@', '@', '@', '@', '@']]);
  range.setValues([[item.id, item.tanggal, item.jam, item.status, item.catatan]]);
  SpreadsheetApp.flush();
  return { ok: true, data: item };
}

function handleUpdateScheduleStatus_(ss, payload) {
  var sheet = ensureSheet_(ss, 'Jadwal', SHEET_SCHEMAS.Jadwal);
  var rowIndex = findRowIndexById_(sheet, String(payload.id || ''));
  if (rowIndex === -1) {
    return { ok: false, code: 'NOT_FOUND', message: 'Slot jadwal tidak ditemukan.' };
  }
  var status = String(payload.status || '').trim() === 'Booked' ? 'Booked' : 'Kosong';
  sheet.getRange(rowIndex, 4).setValue(status);
  var rowValues = sheet.getRange(rowIndex, 1, 1, 5).getValues()[0];
  SpreadsheetApp.flush();
  return {
    ok: true,
    data: {
      id: String(rowValues[0] || ''),
      tanggal: formatDateCell_(rowValues[1]),
      jam: formatTimeCell_(rowValues[2]),
      status: status,
      catatan: String(rowValues[4] || ''),
    },
  };
}

function handleDeleteRowById_(ss, sheetName, rawId) {
  var sheet = ensureSheet_(ss, sheetName, SHEET_SCHEMAS[sheetName]);
  var rowIndex = findRowIndexById_(sheet, String(rawId || ''));
  if (rowIndex === -1) {
    return { ok: false, code: 'NOT_FOUND', message: 'Data tidak ditemukan pada tab ' + sheetName };
  }
  sheet.deleteRow(rowIndex);
  SpreadsheetApp.flush();
  return { ok: true, data: { deleted: true } };
}

/**
 * Mencari tab rekap yang cocok dengan struktur header gambar ("JADWAL WISUDA" / "Jadwal_Wisuda"),
 * atau membuatnya otomatis dengan Row 1 judul "JADWAL WISUDA" dan Row 2 header 10 kolom.
 */
function ensureBookingSheet_(ss) {
  var candidates = ['Jadwal_Wisuda', 'JADWAL WISUDA', 'Rekap_Booking'];
  var sheet = null;
  for (var c = 0; c < candidates.length; c++) {
    var found = ss.getSheetByName(candidates[c]);
    if (found) {
      sheet = found;
      break;
    }
  }

  if (!sheet) {
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      if (detectHeaderRow_(allSheets[s]) > 0) {
        sheet = allSheets[s];
        break;
      }
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet('Jadwal_Wisuda');
  }

  var headerRow = detectHeaderRow_(sheet);
  if (headerRow === 0) {
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 10).merge();
      sheet.getRange(1, 1).setValue('JADWAL WISUDA');
      sheet.getRange(1, 1).setFontWeight('bold').setHorizontalAlignment('center');
      sheet.getRange(2, 1, 1, 10).setValues([BOOKING_HEADERS]);
      sheet.getRange(2, 1, 1, 10).setFontWeight('bold');
      headerRow = 2;
    } else {
      headerRow = 1;
    }
  }

  return { sheet: sheet, headerRow: headerRow };
}

function detectHeaderRow_(sheet) {
  var lastRow = Math.min(sheet.getLastRow(), 3);
  if (lastRow === 0 || sheet.getLastColumn() < 6) {
    return 0;
  }
  for (var r = 1; r <= lastRow; r++) {
    var row = sheet.getRange(r, 1, 1, Math.min(sheet.getLastColumn(), 12)).getValues()[0];
    var joined = row
      .map(function (cell) {
        return String(cell || '').trim().toLowerCase();
      })
      .join('|');
    if (joined.indexOf('tanggal') !== -1 && joined.indexOf('nama klien') !== -1) {
      return r;
    }
  }
  return 0;
}

function readBookingRows_(ss) {
  var info = ensureBookingSheet_(ss);
  return readBookingRowsFrom_(info.sheet, info.headerRow);
}

function readBookingRowsFrom_(sheet, headerRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return [];
  }
  var rows = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, 10).getValues();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (String(row[5] || '').trim() === '' && String(row[1] || '').trim() === '') {
      continue;
    }
    out.push(rowToBookingRecord_(row));
  }
  return out;
}

function rowToBookingRecord_(row, overrideStatus) {
  var rawDate = row[1];
  var tanggalSlash =
    rawDate instanceof Date
      ? Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'dd/MM/yyyy')
      : String(rawDate || '').trim();
  return {
    no: Number(row[0] || 0) || 0,
    tanggal: tanggalSlash,
    fg: String(row[2] || '').trim(),
    jam: formatTimeCell_(row[3]),
    paket: String(row[4] || '').trim(),
    nama_klien: String(row[5] || '').trim(),
    username_ig: String(row[6] || '').trim(),
    kampus_lokasi: String(row[7] || '').trim(),
    no_wa_bayar: String(row[8] || '').trim(),
    status: overrideStatus || String(row[9] || 'Belum').trim() || 'Belum',
  };
}

function readJadwal_(ss) {
  var sheet = ensureSheet_(ss, 'Jadwal', SHEET_SCHEMAS.Jadwal);
  var rows = readDataRows_(sheet);
  return rows
    .filter(function (row) {
      return String(row[0] || '').trim() !== '';
    })
    .map(function (row) {
      var statusText = String(row[3] || '').trim().toLowerCase();
      return {
        id: String(row[0] || '').trim(),
        tanggal: formatDateCell_(row[1]),
        jam: formatTimeCell_(row[2]),
        status: statusText === 'booked' ? 'Booked' : 'Kosong',
        catatan: String(row[4] || '').trim(),
      };
    });
}

function readPaket_(ss) {
  var sheet = ensureSheet_(ss, 'Paket', SHEET_SCHEMAS.Paket);
  var rows = readDataRows_(sheet);
  return rows
    .filter(function (row) {
      return String(row[0] || '').trim() !== '';
    })
    .map(function (row) {
      return {
        id: String(row[0] || '').trim(),
        nama_paket: String(row[1] || '').trim(),
        harga: Number(row[2] || 0) || 0,
        deskripsi: String(row[3] || '').trim(),
        aktif: parseBool_(row[4]),
      };
    });
}

function readFotografer_(ss) {
  var sheet = ensureSheet_(ss, 'Fotografer', SHEET_SCHEMAS.Fotografer);
  var rows = readDataRows_(sheet);
  return rows
    .filter(function (row) {
      return String(row[0] || '').trim() !== '';
    })
    .map(function (row) {
      return {
        id: String(row[0] || '').trim(),
        nama_fotografer: String(row[1] || '').trim(),
        spesialisasi: String(row[2] || '').trim(),
        aktif: parseBool_(row[3]),
      };
    });
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function readDataRows_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) {
    return [];
  }
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

function findRowIndexById_(sheet, targetId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return -1;
  }
  var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0] || '').trim() === targetId) {
      return i + 2;
    }
  }
  return -1;
}

function isoToSlash_(isoStr) {
  var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoStr || '').trim());
  if (!match) {
    return String(isoStr || '').trim();
  }
  return match[3] + '/' + match[2] + '/' + match[1];
}

function formatDateCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value || '').trim().slice(0, 10);
}

function formatTimeCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(value || '').trim();
}

function parseBool_(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  var s = String(value || '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'ya' || s === 'aktif';
}

function generateId_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
