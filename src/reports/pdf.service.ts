import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Report, User } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

const BRAND = '#0B7A4B';
const INK = '#1A1A1A';
const MUTED = '#6B7280';

/** Formats an RWF integer like 185000 -> "RWF 185,000". */
function rwf(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `RWF ${n.toLocaleString('en-US')}`;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class PdfService {
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.publicUrl = (
      config.get<string>('PUBLIC_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  /** Renders a watermarked, signed report PDF and returns it as a Buffer. */
  async render(report: Report, user: User): Promise<Buffer> {
    const verifyUrl = `${this.publicUrl}/reports/verify/${report.verifyCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1 });
    const qrPng = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    this.drawWatermark(doc, report.verifyCode);
    this.drawHeader(doc);
    this.drawSummary(doc, report, user);
    this.drawVerification(doc, report, qrPng, verifyUrl);
    this.drawFooter(doc);

    doc.end();
    return done;
  }

  private drawWatermark(doc: PDFKit.PDFDocument, verifyCode: string) {
    const text = `VELO VERIFIED  ${verifyCode}`;
    doc.save();
    doc.rotate(-35, { origin: [297, 421] });
    doc.fontSize(26).fillColor(BRAND).opacity(0.06);
    for (let y = -100; y < 1000; y += 90) {
      for (let x = -200; x < 900; x += 320) {
        doc.text(text, x, y, { lineBreak: false });
      }
    }
    doc.restore();
    doc.opacity(1);
  }

  private drawHeader(doc: PDFKit.PDFDocument) {
    doc
      .fillColor(BRAND)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('VELO', 50, 50, { continued: true })
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(12)
      .text('  Loan-readiness report');
    doc.moveTo(50, 84).lineTo(545, 84).strokeColor(BRAND).lineWidth(2).stroke();
    doc.moveDown(2);
  }

  private drawSummary(doc: PDFKit.PDFDocument, report: Report, user: User) {
    const y = 110;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(13);
    doc.text('Account holder', 50, y);
    doc.font('Helvetica').fontSize(11).fillColor(MUTED);
    doc.text(`Phone ending ****${user.phoneNumber.slice(-4)}`, 50, y + 18);
    doc.text(
      `Period  ${fmtDate(report.periodStart)}  to  ${fmtDate(report.periodEnd)}`,
      50,
      y + 34,
    );
    doc.text(`Issued  ${fmtDate(report.createdAt)}`, 50, y + 50);

    // Score badge
    doc.roundedRect(380, y - 6, 165, 70, 8).fillAndStroke('#EAF6F0', BRAND);
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text('VELO SCORE', 396, y + 4);
    doc
      .fillColor(BRAND)
      .font('Helvetica-Bold')
      .fontSize(30)
      .text(`${report.veloScore}`, 396, y + 18, { continued: true })
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(12)
      .text(' / 1000');

    // Summary figures
    let cursor = y + 90;
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('Summary', 50, cursor);
    cursor += 22;

    const summary = (report.summaryJson ?? {}) as Record<string, unknown>;
    const rows: [string, unknown][] = [];
    if ('monthlyIncome' in summary)
      rows.push(['Average monthly income', rwf(summary.monthlyIncome)]);
    if ('totalIncome' in summary)
      rows.push(['Total income', rwf(summary.totalIncome)]);
    if ('totalExpense' in summary)
      rows.push(['Total expenses', rwf(summary.totalExpense)]);

    doc.font('Helvetica').fontSize(11);
    for (const [label, value] of rows) {
      doc.fillColor(MUTED).text(label, 50, cursor);
      doc.fillColor(INK).text(String(value), 300, cursor);
      cursor += 18;
    }

    const byCategory = summary.byCategory as
      Record<string, unknown> | undefined;
    if (byCategory && typeof byCategory === 'object') {
      cursor += 8;
      doc
        .fillColor(INK)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('By category', 50, cursor);
      cursor += 18;
      doc.font('Helvetica').fontSize(11);
      for (const [cat, value] of Object.entries(byCategory)) {
        doc.fillColor(MUTED).text(cat, 60, cursor);
        doc.fillColor(INK).text(rwf(value), 300, cursor);
        cursor += 16;
      }
    }
    this.summaryBottom = cursor + 10;
  }

  private summaryBottom = 400;

  private drawVerification(
    doc: PDFKit.PDFDocument,
    report: Report,
    qrPng: Buffer,
    verifyUrl: string,
  ) {
    const y = Math.max(this.summaryBottom, 560);
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor('#DDDDDD')
      .lineWidth(1)
      .stroke();

    doc.image(qrPng, 50, y + 14, { width: 96 });

    const tx = 160;
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('How to verify this report', tx, y + 16);
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text(
        'Scan the QR code, or open the link below and enter the verify code. ' +
          'The page shows the authoritative result from Velo. A report that ' +
          'does not verify, or whose details differ from this page, is not genuine.',
        tx,
        y + 34,
        { width: 385 },
      );
    doc
      .fillColor(BRAND)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(`Verify code: ${report.verifyCode}`, tx, y + 84);
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(verifyUrl, tx, y + 100, { width: 385 });

    // Signature block
    const sy = y + 128;
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Digital signature (Ed25519)', 50, sy);
    doc
      .fillColor(MUTED)
      .font('Courier')
      .fontSize(8)
      .text(report.signature, 50, sy + 14, { width: 495 });
  }

  private drawFooter(doc: PDFKit.PDFDocument) {
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'This document is cryptographically signed by Velo. ' +
          'Its authenticity can be checked independently using Velo’s public key.',
        50,
        800,
        { width: 495, align: 'center' },
      );
  }
}
