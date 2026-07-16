const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const nodemailer = require('nodemailer');

// ======================================================================
// CONFIGURACIÓN FIJA DEL INSTITUTO — EDITAR ANTES DE USAR EN PRODUCCIÓN
// ======================================================================
const INSTITUTO_REP_NOMBRE = 'Diego Lerner';
const INSTITUTO_REP_CARGO = 'CEO';
const DEST_EMAIL = process.env.DEST_EMAIL || 'administracion@institutoilce.com';
// ======================================================================

const CLAUSES = [
  { title: null, body: 'Entre, por una parte, Instituto ILCE, en adelante "EL INSTITUTO", y por la otra, {NOMBRE}, DNI {DNI}, en adelante "EL/LA DOCENTE", ambas partes acuerdan celebrar el presente contrato de prestación de servicios profesionales, conforme a las siguientes cláusulas:' },
  { title: '1. Objeto', body: 'EL INSTITUTO contrata a EL/LA DOCENTE para el diseño, desarrollo y/o dictado de un curso en modalidad asincrónica, que será comercializado a través de las plataformas educativas del Instituto ILCE.' },
  { title: '2. Modalidad del curso', body: 'El curso será de modalidad 100% asincrónica, quedando a disposición de los/as estudiantes a través del campus virtual del Instituto. EL/LA DOCENTE se compromete a entregar los contenidos acordados (clases grabadas, materiales y/o recursos pedagógicos) en los plazos previamente definidos entre las partes.' },
  { title: '3. Duración', body: 'El presente contrato tendrá una duración de dos (2) años, contados a partir de la fecha de firma, período durante el cual EL INSTITUTO podrá comercializar y utilizar el curso.' },
  { title: '4. Remuneración', body: 'La remuneración de EL/LA DOCENTE consistirá en un {PCT}% sobre el total de las ventas efectivamente cobradas del curso, porcentaje acordado previamente entre las partes. Los pagos se realizarán de manera periódica, según el esquema administrativo definido por EL INSTITUTO. Dicho porcentaje constituye la única contraprestación por la creación del contenido y por la autorización de uso otorgada en el presente contrato, sin que ello genere derecho a pagos adicionales por futuras reutilizaciones, ediciones o comercialización del curso.' },
  { title: '5. Relación contractual', body: 'Las partes acuerdan que la presente contratación no genera relación laboral, tratándose de una prestación de servicios profesionales de carácter independiente. EL/LA DOCENTE será responsable de sus obligaciones impositivas y previsionales.' },
  { title: '6. Propiedad intelectual, licencia de uso e imagen', body: [
      'EL/LA DOCENTE, en su carácter de autor/a del contenido producido en el marco del presente contrato, otorga a EL INSTITUTO una licencia amplia, no exclusiva y por el plazo de vigencia del presente contrato, para utilizar dicho contenido en los cursos actuales y futuros del Instituto, así como en sus plataformas, clases grabadas, materiales complementarios y demás espacios institucionales.',
      'Asimismo, EL/LA DOCENTE autoriza expresamente a EL INSTITUTO el uso de su imagen, voz, nombre y participación en las grabaciones y materiales producidos, con fines educativos y comerciales vinculados al curso.',
      'EL/LA DOCENTE autoriza además a EL INSTITUTO a editar, fragmentar, subtitular, adaptar y reutilizar total o parcialmente el contenido producido, cuando resulte necesario, siempre respetando el sentido original de dicho contenido.',
      'La autorización otorgada en la presente cláusula respecto del uso del material, la imagen, la voz y el nombre de EL/LA DOCENTE no podrá ser revocada respecto de los contenidos ya producidos y publicados por EL INSTITUTO.'
    ] },
  { title: '7. Actualización de los cursos', body: 'EL INSTITUTO podrá complementar, modificar o actualizar el contenido del curso, incluso incorporando a otros/as profesionales, cuando ello resulte necesario para mantener la vigencia académica y la calidad del curso.' },
  { title: '8. Confidencialidad', body: 'EL/LA DOCENTE se compromete a mantener confidencial toda información académica, comercial o interna del Instituto a la que acceda con motivo de este contrato.' },
  { title: '9. Rescisión', body: 'Cualquiera de las partes podrá rescindir el presente contrato sin expresión de causa, notificando a la otra parte con 15 días corridos de anticipación, vía correo electrónico. Para comunicaciones formales, EL INSTITUTO fija como correo válido: administracion@institutoilce.com' },
  { title: '10. Ley aplicable', body: 'El presente contrato se regirá por las leyes de la República Argentina.' },
  { title: '11. Aceptación', body: 'Leído y aceptado, se firma el presente contrato de forma digital, quedando su copia disponible para ambas partes.' },
];

function wrapText(text, font, size, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function buildPdf({ nombre, dni, pct, fecha, signaturePngBytes }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPageIfNeeded(lineHeight) {
    if (y - lineHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawParagraph(text, opts = {}) {
    const size = opts.size || 11;
    const useFont = opts.bold ? fontBold : font;
    const lineHeight = size * 1.4;
    const lines = wrapText(text, useFont, size, maxWidth);
    for (const line of lines) {
      newPageIfNeeded(lineHeight);
      page.drawText(line, { x: margin, y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
    y -= opts.spacingAfter !== undefined ? opts.spacingAfter : 6;
  }

  // Título
  drawParagraph('CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES', { size: 15, bold: true, spacingAfter: 4 });
  drawParagraph('Instituto ILCE', { size: 12, bold: true, spacingAfter: 16 });

  const replaced = (t) =>
    t.replace('{NOMBRE}', nombre).replace('{DNI}', dni).replace('{PCT}', pct);

  for (const clause of CLAUSES) {
    if (clause.title) {
      newPageIfNeeded(20);
      drawParagraph(clause.title, { size: 12, bold: true, spacingAfter: 4 });
    }
    const bodies = Array.isArray(clause.body) ? clause.body : [clause.body];
    bodies.forEach((b, i) => {
      const isLast = i === bodies.length - 1;
      drawParagraph(replaced(b), { size: 11, spacingAfter: isLast ? 12 : 6 });
    });
  }

  // Firmas
  newPageIfNeeded(220);
  y -= 10;
  drawParagraph(`Firmado digitalmente el ${fecha}.`, { size: 11, spacingAfter: 20 });

  const colWidth = maxWidth / 2 - 10;

  // Bloque Instituto (izquierda)
  const blockTopY = y;
  page.drawText('Firma EL INSTITUTO', { x: margin, y, size: 11, font: fontBold });
  y -= 18;
  page.drawText(`Nombre: ${INSTITUTO_REP_NOMBRE}`, { x: margin, y, size: 10, font });
  y -= 14;
  page.drawText(`Cargo: ${INSTITUTO_REP_CARGO}`, { x: margin, y, size: 10, font });
  y -= 14;
  page.drawText(`Fecha: ${fecha}`, { x: margin, y, size: 10, font });

  // Bloque Docente (derecha)
  const rightX = margin + colWidth + 20;
  let yRight = blockTopY;
  page.drawText('Firma EL/LA DOCENTE', { x: rightX, y: yRight, size: 11, font: fontBold });
  yRight -= 8;

  if (signaturePngBytes) {
    const sigImage = await pdfDoc.embedPng(signaturePngBytes);
    const sigDims = sigImage.scale(1);
    const targetWidth = Math.min(colWidth, 180);
    const scaleFactor = targetWidth / sigDims.width;
    const targetHeight = sigDims.height * scaleFactor;
    yRight -= targetHeight + 6;
    page.drawImage(sigImage, { x: rightX, y: yRight, width: targetWidth, height: targetHeight });
  } else {
    yRight -= 40;
  }

  page.drawText(`Nombre: ${nombre}`, { x: rightX, y: yRight, size: 10, font });
  yRight -= 14;
  page.drawText(`DNI: ${dni}`, { x: rightX, y: yRight, size: 10, font });
  yRight -= 14;
  page.drawText(`Fecha: ${fecha}`, { x: rightX, y: yRight, size: 10, font });

  return pdfDoc.save();
}

const handler = async (req, res) => {
  // CORS básico (útil si el formulario se sirve embebido desde otro dominio, ej. Wix)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Método no permitido' });
    return;
  }

  try {
    const { nombre, dni, pct, signatureDataUrl } = req.body;

    if (!nombre || !dni || !pct || !signatureDataUrl) {
      res.status(400).json({ ok: false, error: 'Faltan datos obligatorios.' });
      return;
    }

    const fecha = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

    const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
    const signaturePngBytes = Buffer.from(base64Data, 'base64');

    const pdfBytes = await buildPdf({ nombre, dni, pct, fecha, signaturePngBytes });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const safeName = nombre.replace(/[^a-zA-Z0-9]+/g, '_');

    await transporter.sendMail({
      from: `"Instituto ILCE - Firma de Contratos" <${process.env.GMAIL_USER}>`,
      to: DEST_EMAIL,
      subject: `Contrato firmado - ${nombre} (DNI ${dni})`,
      text: `Se adjunta el contrato firmado digitalmente por ${nombre} (DNI ${dni}) con fecha ${fecha}.`,
      attachments: [
        {
          filename: `Contrato_ILCE_${safeName}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        },
      ],
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error al procesar el contrato:', err);
    res.status(500).json({ ok: false, error: 'Error interno al generar o enviar el contrato.' });
  }
};

module.exports = handler;
module.exports.buildPdf = buildPdf; // expuesto solo para tests locales
