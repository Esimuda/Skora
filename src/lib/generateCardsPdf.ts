import jsPDF from 'jspdf';

interface CardData {
  pin: string;
  schoolName: string;
  term: string;
  academicYear: string;
  portalUrl: string;
}

// Card dimensions in mm — standard business card proportions
const CARD_W = 90;
const CARD_H = 55;
const COLS = 2;
const ROWS = 4;
const MARGIN = 10;       // page margin
const GAP_X = 8;         // horizontal gap between cards
const GAP_Y = 6;         // vertical gap between cards

// A4 dimensions: 210 × 297 mm
const PAGE_W = 210;
const PAGE_H = 297;

// How many cards fit per page
const CARDS_PER_PAGE = COLS * ROWS; // 8

function drawCard(
  doc: jsPDF,
  card: CardData,
  x: number,
  y: number,
) {
  const { pin, schoolName, term, academicYear, portalUrl } = card;

  // ── Card background ──────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, CARD_W, CARD_H, 3, 3, 'FD');

  // ── Top accent bar ───────────────────────────────────────────────────────
  doc.setFillColor(0, 17, 68); // Skora navy #001144
  doc.roundedRect(x, y, CARD_W, 10, 3, 3, 'F');
  // Cover bottom-rounded corners of the top bar
  doc.rect(x, y + 7, CARD_W, 3, 'F');

  // ── School name (top bar) ────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const truncatedName = schoolName.length > 38
    ? schoolName.slice(0, 35) + '...'
    : schoolName;
  doc.text(truncatedName, x + CARD_W / 2, y + 6.5, { align: 'center' });

  // ── "Result Access Card" label ───────────────────────────────────────────
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('RESULT ACCESS CARD', x + CARD_W / 2, y + 14.5, { align: 'center' });

  // ── Term + Academic Year ─────────────────────────────────────────────────
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  const termLabel = `${term.charAt(0).toUpperCase() + term.slice(1)} Term  ·  ${academicYear}`;
  doc.text(termLabel, x + CARD_W / 2, y + 19.5, { align: 'center' });

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(x + 8, y + 22, x + CARD_W - 8, y + 22);

  // ── PIN ──────────────────────────────────────────────────────────────────
  // Scratch-off label
  doc.setTextColor(130, 130, 130);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('SCRATCH TO REVEAL PIN', x + CARD_W / 2, y + 26.5, { align: 'center' });

  // PIN box
  doc.setFillColor(245, 246, 250);
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + 12, y + 28, CARD_W - 24, 10, 2, 2, 'FD');

  // PIN text
  doc.setTextColor(0, 17, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(pin, x + CARD_W / 2, y + 35, { align: 'center' });

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(x + 8, y + 40, x + CARD_W - 8, y + 40);

  // ── Portal URL ───────────────────────────────────────────────────────────
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('Visit:', x + CARD_W / 2, y + 44, { align: 'center' });
  doc.setTextColor(0, 17, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text(portalUrl, x + CARD_W / 2, y + 48, { align: 'center' });

  // ── Footer note ──────────────────────────────────────────────────────────
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text(
    'Valid for 5 uses only  ·  Do not share your PIN',
    x + CARD_W / 2,
    y + CARD_H - 3,
    { align: 'center' },
  );

  // ── Dashed cut border ────────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([1, 1], 0);
  doc.roundedRect(x - 1, y - 1, CARD_W + 2, CARD_H + 2, 3, 3, 'S');
  doc.setLineDashPattern([], 0); // reset dash
}

export function generateCardsPdf(opts: {
  pins: string[];
  schoolName: string;
  term: string;
  academicYear: string;
  portalUrl?: string;
}): void {
  const {
    pins,
    schoolName,
    term,
    academicYear,
    portalUrl = 'skora-rms.com.ng/portal',
  } = opts;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate card starting positions
  // Total width used by cards: 2 × 90 + 1 × 8 = 188mm
  // Remaining: 210 - 188 = 22mm → 11mm left margin each side
  const startX = (PAGE_W - (COLS * CARD_W + (COLS - 1) * GAP_X)) / 2;

  // Total height used by cards: 4 × 55 + 3 × 6 = 238mm
  // Remaining: 297 - 238 = 59mm → ~10mm top + footer space
  const startY = MARGIN + 8;

  let pageCardIndex = 0;
  let isFirstPage = true;

  for (let i = 0; i < pins.length; i++) {
    // New page needed
    if (pageCardIndex === CARDS_PER_PAGE) {
      doc.addPage();
      pageCardIndex = 0;
      isFirstPage = false;
    }

    // Add page header on first card of each page
    if (pageCardIndex === 0) {
      // Page header
      doc.setTextColor(0, 17, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Skora RMS — Result Access Cards', PAGE_W / 2, MARGIN, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${schoolName}  ·  ${term.charAt(0).toUpperCase() + term.slice(1)} Term  ·  ${academicYear}`,
        PAGE_W / 2,
        MARGIN + 5,
        { align: 'center' },
      );
    }

    const col = pageCardIndex % COLS;
    const row = Math.floor(pageCardIndex / COLS);

    const x = startX + col * (CARD_W + GAP_X);
    const y = startY + row * (CARD_H + GAP_Y);

    drawCard(doc, {
      pin: pins[i],
      schoolName,
      term,
      academicYear,
      portalUrl,
    }, x, y);

    // Card number (small, bottom right of card) — useful for tracking
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.text(
      `#${String(i + 1).padStart(3, '0')}`,
      x + CARD_W - 2,
      y + CARD_H - 1,
      { align: 'right' },
    );

    pageCardIndex++;
  }

  // ── Page footer on every page ─────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(
      `Page ${p} of ${totalPages}  ·  ${pins.length} cards total  ·  Generated by Skora RMS`,
      PAGE_W / 2,
      PAGE_H - 5,
      { align: 'center' },
    );
  }

  // ── Download ──────────────────────────────────────────────────────────────
  const termSlug = term.charAt(0).toUpperCase() + term.slice(1);
  const yearSlug = academicYear.replace('/', '-');
  const nameSlug = schoolName.replace(/\s+/g, '-').slice(0, 30);
  const filename = `${nameSlug}-${termSlug}-Term-${yearSlug}-Cards.pdf`;

  doc.save(filename);
}