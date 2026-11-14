/* CJExport：在浏览器内生成 .xlsx / .docx 配置清单（无依赖）。
   data = { title, company, date, rows:[[项目,配置]], contact:[[项目,内容]], note } */
(function (global) {
  'use strict';

  var enc = new TextEncoder();
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- ZIP（仅存储，不压缩） ---------- */
  var CRC = (function () {
    var t = [], c, n, k;
    for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(files) {
    var d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var parts = [], central = [], offset = 0;
    function header(sig, extra, f) {
      var h = new DataView(new ArrayBuffer(extra ? 46 : 30)), p = 0;
      h.setUint32(p, sig, true); p += 4;
      if (extra) { h.setUint16(p, 20, true); p += 2; }
      h.setUint16(p, 20, true); p += 2;
      h.setUint16(p, 0x0800, true); p += 2;   // 文件名为 UTF-8
      h.setUint16(p, 0, true); p += 2;        // 存储
      h.setUint16(p, time, true); p += 2;
      h.setUint16(p, date, true); p += 2;
      h.setUint32(p, f.crc, true); p += 4;
      h.setUint32(p, f.data.length, true); p += 4;
      h.setUint32(p, f.data.length, true); p += 4;
      h.setUint16(p, f.name.length, true); p += 2;
      h.setUint16(p, 0, true); p += 2;
      if (extra) h.setUint32(42, f.offset, true);   // 其余字段（注释、磁盘号、属性）为 0
      return new Uint8Array(h.buffer);
    }
    files.forEach(function (f) {
      var e = { name: enc.encode(f[0]), data: typeof f[1] === 'string' ? enc.encode(f[1]) : f[1], offset: offset };
      e.crc = crc32(e.data);
      var lh = header(0x04034b50, false, e);
      parts.push(lh, e.name, e.data);
      offset += lh.length + e.name.length + e.data.length;
      central.push(header(0x02014b50, true, e), e.name);
    });
    var cdSize = central.reduce(function (n, a) { return n + a.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    var all = parts.concat(central, [new Uint8Array(end.buffer)]);
    var out = new Uint8Array(all.reduce(function (n, a) { return n + a.length; }, 0)), pos = 0;
    all.forEach(function (a) { out.set(a, pos); pos += a.length; });
    return out;
  }

  var XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var PKG = 'http://schemas.openxmlformats.org/package/2006';

  /* ---------- Excel ---------- */
  function xlsx(d) {
    var rows = [], merges = [], r = 0;
    function row(cells, ht) {
      r++;
      var x = cells.map(function (c, i) {
        return '<c r="' + 'AB'[i] + r + '" s="' + c[1] + '" t="inlineStr"><is><t xml:space="preserve">' + esc(c[0]) + '</t></is></c>';
      }).join('');
      rows.push('<row r="' + r + '"' + (ht ? ' ht="' + ht + '" customHeight="1"' : '') + '>' + x + '</row>');
    }
    function wide(text, style, ht) { row([[text, style], ['', style]], ht); merges.push('A' + r + ':B' + r); }
    wide(d.title, 1, 34);
    wide(d.company, 5, 22);
    wide('生成日期：' + d.date, 6);
    row([['', 0]]);
    row([['项目', 2], ['配置', 2]], 24);
    d.rows.forEach(function (p) { row([[p[0], 3], [p[1], 4]], 22); });
    row([['', 0]]);
    row([['联系方式', 2], ['', 2]], 24); merges.push('A' + r + ':B' + r);
    d.contact.forEach(function (p) { row([[p[0], 3], [p[1], 4]], 22); });
    row([['', 0]]);
    wide(d.note, 6, 34);

    var sheet = XML + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>' +
      '<cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="2" width="56" customWidth="1"/></cols>' +
      '<sheetData>' + rows.join('') + '</sheetData>' +
      '<mergeCells count="' + merges.length + '">' + merges.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') + '</mergeCells>' +
      '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>' +
      '<pageSetup paperSize="9" orientation="portrait"/></worksheet>';

    function font(sz, color, bold) { return '<font>' + (bold ? '<b/>' : '') + '<sz val="' + sz + '"/><color rgb="' + color + '"/><name val="微软雅黑"/><family val="2"/></font>'; }
    var side = '<left style="thin"><color rgb="FFD5DBE1"/></left><right style="thin"><color rgb="FFD5DBE1"/></right><top style="thin"><color rgb="FFD5DBE1"/></top><bottom style="thin"><color rgb="FFD5DBE1"/></bottom><diagonal/>';
    function xf(f, fill, b, wrap) {
      return '<xf numFmtId="0" fontId="' + f + '" fillId="' + fill + '" borderId="' + b + '" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' +
        '<alignment horizontal="left" vertical="center"' + (wrap ? ' wrapText="1"' : '') + ' indent="' + (b ? 1 : 0) + '"/></xf>';
    }
    var styles = XML + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="5">' + font(11, 'FF152233') + font(18, 'FF0B2545', 1) + font(11, 'FFFFFFFF', 1) + font(11, 'FF0B2545', 1) + font(9, 'FF6B7480') + '</fonts>' +
      '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF0B2545"/><bgColor indexed="64"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF3F5F7"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>' + side + '</border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="7">' + xf(0, 0, 0) + xf(1, 0, 0) + xf(2, 2, 1) + xf(3, 3, 1) + xf(0, 0, 1, 1) + xf(3, 0, 0) + xf(4, 0, 0, 1) + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

    return zip([
      ['[Content_Types].xml', XML + '<Types xmlns="' + PKG + '/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', XML + '<Relationships xmlns="' + PKG + '/relationships"><Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', XML + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + REL + '"><sheets><sheet name="配置清单" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', XML + '<Relationships xmlns="' + PKG + '/relationships"><Relationship Id="rId1" Type="' + REL + '/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + REL + '/styles" Target="styles.xml"/></Relationships>'],
      ['xl/worksheets/sheet1.xml', sheet],
      ['xl/styles.xml', styles]
    ]);
  }

  /* ---------- Word ---------- */
  // img 可选：{ png: Uint8Array, w: 像素宽, h: 像素高 }
  function docx(d, img) {
    function run(text, o) {
      o = o || {};
      return '<w:r><w:rPr><w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:eastAsia="微软雅黑" w:cs="Microsoft YaHei"/>' + (o.bold ? '<w:b/>' : '') +
        '<w:color w:val="' + (o.color || '152233') + '"/><w:sz w:val="' + (o.size || 21) + '"/><w:szCs w:val="' + (o.size || 21) + '"/></w:rPr>' +
        '<w:t xml:space="preserve">' + esc(text) + '</w:t></w:r>';
    }
    function para(text, o) {
      o = o || {};
      return '<w:p><w:pPr><w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 80 : o.after) + '"/>' + (o.center ? '<w:jc w:val="center"/>' : '') + '</w:pPr>' + run(text, o) + '</w:p>';
    }
    function cell(text, w, o) {
      o = o || {};
      return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (o.span ? '<w:gridSpan w:val="2"/>' : '') + (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : '') + '<w:vAlign w:val="center"/></w:tcPr>' +
        para(text, { bold: o.bold, color: o.color, after: 0 }) + '</w:tc>';
    }
    function table(head, pairs) {
      var b = '<w:top w:val="single" w:sz="4" w:space="0" w:color="D5DBE1"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D5DBE1"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D5DBE1"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D5DBE1"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D5DBE1"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D5DBE1"/>';
      var t = '<w:tbl><w:tblPr><w:tblW w:w="9300" w:type="dxa"/><w:tblBorders>' + b + '</w:tblBorders><w:tblLayout w:type="fixed"/>' +
        '<w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
        '<w:tblGrid><w:gridCol w:w="2900"/><w:gridCol w:w="6400"/></w:tblGrid>';
      t += '<w:tr>' + (head.length === 1
        ? cell(head[0], 9300, { span: 1, fill: '0B2545', bold: 1, color: 'FFFFFF' })
        : cell(head[0], 2900, { fill: '0B2545', bold: 1, color: 'FFFFFF' }) + cell(head[1], 6400, { fill: '0B2545', bold: 1, color: 'FFFFFF' })) + '</w:tr>';
      pairs.forEach(function (p) {
        t += '<w:tr>' + cell(p[0], 2900, { fill: 'F3F5F7', bold: 1, color: '0B2545' }) + cell(p[1], 6400) + '</w:tr>';
      });
      return t + '</w:tbl>';
    }
    var body = para(d.title, { size: 40, bold: 1, color: '0B2545', after: 60 }) +
      para(d.company, { size: 24, bold: 1, color: '0B2545', after: 40 }) +
      para('生成日期：' + d.date, { size: 18, color: '6B7480', after: 200 });
    if (img) {
      var cx = 5040000, cy = Math.round(cx * img.h / img.w);
      body += '<w:p><w:pPr><w:spacing w:before="0" w:after="160"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>' +
        '<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="1" name="风管三维示意"/>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="duct.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    }
    body += table(['项目', '配置'], d.rows) + para('', { after: 120 }) + table(['联系方式'], d.contact) +
      para(d.note, { size: 18, color: '6B7480', before: 200 }) +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1300" w:right="1300" w:bottom="1300" w:left="1300" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

    var doc = XML + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="' + REL + '" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body + '</w:body></w:document>';
    var files = [
      ['[Content_Types].xml', XML + '<Types xmlns="' + PKG + '/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
      ['_rels/.rels', XML + '<Relationships xmlns="' + PKG + '/relationships"><Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/document.xml', doc],
      ['word/_rels/document.xml.rels', XML + '<Relationships xmlns="' + PKG + '/relationships">' + (img ? '<Relationship Id="rId1" Type="' + REL + '/image" Target="media/duct.png"/>' : '') + '</Relationships>']
    ];
    if (img) files.push(['word/media/duct.png', img.png]);
    return zip(files);
  }

  function save(bytes, filename, mime) {
    var url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var api = {
    xlsx: xlsx, docx: docx, save: save,
    XLSX_MIME: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    DOCX_MIME: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.CJExport = api;
})(typeof window !== 'undefined' ? window : globalThis);
