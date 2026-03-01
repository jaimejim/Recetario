#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const fs = require('fs');
const vm = require('vm');

// Load recipes
const src = fs.readFileSync('./js/data.js', 'utf8').replace(/^const /gm, 'var ');
const ctx = {};
vm.runInNewContext(src, ctx);
const recipes = ctx.RECIPES;
const categories = ctx.CATEGORY_LABELS;

// Page: 5"x8" in points
const W = 5 * 72;
const H = 8 * 72;
const M = { top: 50, bottom: 40, left: 40, right: 40 };
const CW = W - M.left - M.right;

// Site colors
const INK = '#1a1710';
const INK_MID = '#4a4538';
const INK_LIGHT = '#8a8070';
const ACCENT = '#8b1c1c';
const RULE = '#cec5b0';
const RULE_LIGHT = '#e0d8c8';
const CREAM = '#faf8f3';

// Fonts (Special Elite for body, Courier New Bold for headings)
const FONT_BODY = './fonts/SpecialElite-Regular.ttf';
const FONT_MONO = '/System/Library/Fonts/Supplemental/Courier New.ttf';
const FONT_MONO_BOLD = '/System/Library/Fonts/Supplemental/Courier New Bold.ttf';
const FONT_MONO_ITALIC = '/System/Library/Fonts/Supplemental/Courier New Italic.ttf';

const doc = new PDFDocument({ size: [W, H], margins: M, bufferPages: true });
doc.pipe(fs.createWriteStream('recetario.pdf'));

// Paint cream background on every page
function paintBg() {
  doc.save();
  doc.rect(0, 0, W, H).fill(CREAM);
  doc.restore();
  doc.y = M.top;
  doc.x = M.left;
}
paintBg(); // first page
doc.on('pageAdded', paintBg);

// Fractions render small in Special Elite. We render them at 9pt while keeping surrounding text at 7pt.
const FRAC_RE = /([½⅓⅔¼¾⅕⅛⅜⅝⅞])/;
function writeLine(str, x, y, opts, baseSize) {
  if (!FRAC_RE.test(str)) {
    doc.fontSize(baseSize).text(str, x, y, opts);
    return;
  }
  // Render with larger fractions, then force y to what base size would have been
  const fracSize = baseSize + 2;
  // Measure height at base size
  const baseHeight = doc.font(FONT_BODY).fontSize(baseSize).heightOfString(str, { width: opts.width || CW });
  // Render segments
  const parts = str.split(FRAC_RE);
  let first = true;
  parts.forEach((part, i) => {
    if (!part) return;
    const last = i === parts.length - 1;
    const isFrac = FRAC_RE.test(part);
    doc.fontSize(isFrac ? fracSize : baseSize);
    if (first) { doc.text(part, x, y, { ...opts, continued: !last }); first = false; }
    else doc.text(part, { continued: !last });
  });
  doc.fontSize(baseSize);
  // Force y to base-size position to prevent gaps
  doc.y = y + baseHeight;
}

function ensureSpace(needed) {
  if (doc.y + needed > H - M.bottom) {
    doc.addPage();
    return true;
  }
  return false;
}

function drawRule(weight, color) {
  doc.moveTo(M.left, doc.y).lineTo(W - M.right, doc.y)
    .lineWidth(weight || 0.5).strokeColor(color || RULE).stroke();
}

function renderRecipe(r, lang) {
  const t = (field) => {
    const enKey = field + 'En';
    return (lang === 'en' && r[enKey] !== undefined) ? r[enKey] : r[field];
  };

  const title = t('title');
  const subtitle = t('subtitle');
  const groups = t('ingredientGroups');
  const steps = t('steps');
  const tipData = t('tip');
  const servingsLabel = lang === 'en'
    ? `${r.servings} serving${r.servings !== 1 ? 's' : ''}`
    : `${r.servings} persona${r.servings !== 1 ? 's' : ''}`;

  // Category label - more breathing room
  const catLabel = lang === 'en'
    ? { aperitivos: 'Starters', pasta: 'Pasta', pescados: 'Fish', carnes: 'Meat', arroces: 'Rice', sopas: 'Soups', verduras: 'Vegetables', basicos: 'Basics', bebidas: 'Drinks' }[r.category]
    : categories[r.category];
  doc.font(FONT_MONO).fontSize(6).fillColor(ACCENT)
    .text(catLabel.toUpperCase(), { align: 'center', characterSpacing: 3 });
  doc.moveDown(0.5);

  // Title with servings inline
  doc.font(FONT_BODY).fontSize(14).fillColor(INK)
    .text(title, { align: 'center' });
  doc.moveDown(0.15);
  // Servings as pill next to title
  doc.font(FONT_MONO).fontSize(6).fillColor(INK_LIGHT)
    .text(`[ ${servingsLabel} ]`, { align: 'center', characterSpacing: 1 });
  doc.moveDown(0.3);

  // Subtitle
  doc.font(FONT_BODY).fontSize(7.5).fillColor(INK_MID)
    .text(subtitle, { align: 'center' });
  doc.moveDown(0.5);

  // Rule
  drawRule(1.5, INK);
  doc.moveDown(0.5);

  // Section: Ingredients
  const ingLabel = lang === 'en' ? 'INGREDIENTS' : 'INGREDIENTES';
  doc.font(FONT_MONO).fontSize(7).fillColor(INK)
    .text(ingLabel, { characterSpacing: 2.5 });
  doc.moveDown(0.1);
  drawRule(0.5, INK);
  doc.moveDown(0.35);

  groups.forEach((g, gi) => {
    if (g.name && g.name !== 'Ingredientes' && g.name !== 'Ingredients') {
      ensureSpace(18);
      if (gi > 0) doc.moveDown(0.3);
      drawRule(0.3, RULE_LIGHT);
      doc.moveDown(0.25);
      doc.font(FONT_MONO).fontSize(6).fillColor(INK_LIGHT)
        .text(g.name.toUpperCase(), M.left + 14, doc.y, { characterSpacing: 1.5 });
      doc.moveDown(0.3);
    }
    g.items.forEach(item => {
      ensureSpace(12);
      const y = doc.y;
      // Small bullet dot instead of dash
      doc.font(FONT_MONO).fontSize(4).fillColor(INK_LIGHT).text('\u2022', M.left + 3, y + 1);
      doc.font(FONT_BODY).fillColor(INK);
      writeLine(item, M.left + 14, y, { width: CW - 14 }, 7);
    });
    doc.moveDown(0.15);
  });

  doc.moveDown(0.5);

  // Section: Steps
  const stepsLabel = lang === 'en' ? 'METHOD' : 'ELABORACIÓN';
  doc.font(FONT_MONO).fontSize(7).fillColor(INK)
    .text(stepsLabel, { characterSpacing: 2.5 });
  doc.moveDown(0.1);
  drawRule(0.5, INK);
  doc.moveDown(0.4);

  steps.forEach((step, i) => {
    ensureSpace(20);
    const y = doc.y;
    doc.font(FONT_MONO).fontSize(7).fillColor(ACCENT).text(`${i + 1}.`, M.left, y);
    doc.font(FONT_BODY).fillColor(INK);
    writeLine(step, M.left + 16, y, { width: CW - 16 }, 7);
    doc.moveDown(0.2);
    // Dotted rule between steps
    if (i < steps.length - 1) {
      drawRule(0.3, RULE_LIGHT);
      doc.moveDown(0.25);
    }
  });

  // Tip - left border accent line
  if (tipData && tipData.text) {
    doc.moveDown(0.5);
    ensureSpace(35);
    const tipTop = doc.y;
    // Indent tip content
    const tipLeft = M.left + 8;
    const tipWidth = CW - 8;
    doc.font(FONT_BODY).fontSize(6.5).fillColor(INK_MID)
      .text(tipData.text, tipLeft, tipTop, { width: tipWidth });
    if (tipData.author) {
      doc.moveDown(0.2);
      doc.font(FONT_MONO).fontSize(6).fillColor(ACCENT)
        .text(tipData.author, tipLeft, doc.y, { width: tipWidth, align: 'right', characterSpacing: 1.5 });
    }
    const tipBottom = doc.y + 4;
    // Left accent border
    doc.moveTo(M.left + 2, tipTop - 2).lineTo(M.left + 2, tipBottom)
      .lineWidth(1.5).strokeColor(ACCENT).stroke();
    doc.y = tipBottom + 4;
  }
}

// === FRONT MATTER ===

// Page 1: blank
doc.addPage();

// Page 2: half title
doc.moveDown(10);
doc.font(FONT_BODY).fontSize(28).fillColor(INK)
  .text('Recetario', { align: 'center' });
doc.moveDown(0.6);
doc.font(FONT_BODY).fontSize(11).fillColor(INK_MID)
  .text('Recuerdos y sabores de los Jiménez-Torno', { align: 'center' });

// Page 3: blank
doc.addPage();

// Page 4: dedication
doc.moveDown(10);
doc.font(FONT_BODY).fontSize(9).fillColor(INK_MID)
  .text('Para la familia,', { align: 'center' });
doc.moveDown(0.2);
doc.text('que siempre se reúne alrededor de la mesa.', { align: 'center' });
doc.moveDown(1.5);
doc.text('For the family,', { align: 'center' });
doc.moveDown(0.2);
doc.text('who always gather around the table.', { align: 'center' });

// Page 5: blank
doc.addPage();

// === TABLE OF CONTENTS ===
doc.addPage();
doc.font(FONT_BODY).fontSize(14).fillColor(INK)
  .text('Índice / Index', { align: 'center' });
doc.moveDown(0.4);
drawRule(1.5, INK);
doc.moveDown(0.8);

const catOrder = ['aperitivos', 'pasta', 'pescados', 'carnes', 'arroces', 'sopas', 'verduras', 'basicos', 'bebidas'];
const catLabelsEn = {
  aperitivos: 'Starters', pasta: 'Pasta', pescados: 'Fish', carnes: 'Meat',
  arroces: 'Rice', sopas: 'Soups', verduras: 'Vegetables', basicos: 'Basics', bebidas: 'Drinks'
};

catOrder.forEach(cat => {
  const catRecipes = recipes.filter(r => r.category === cat);
  if (catRecipes.length === 0) return;
  ensureSpace(20);
  doc.font(FONT_MONO).fontSize(7).fillColor(ACCENT)
    .text(`${categories[cat]} / ${catLabelsEn[cat]}`.toUpperCase(), { characterSpacing: 2 });
  doc.moveDown(0.15);
  drawRule(0.5, RULE);
  doc.moveDown(0.2);
  catRecipes.forEach(r => {
    ensureSpace(12);
    const enTitle = r.titleEn && r.titleEn !== r.title ? ` / ${r.titleEn}` : '';
    doc.font(FONT_BODY).fontSize(7.5).fillColor(INK).text(`${r.title}${enTitle}`);
    doc.moveDown(0.05);
  });
  doc.moveDown(0.4);
});

// === RECIPES ===
catOrder.forEach(cat => {
  const catRecipes = recipes.filter(r => r.category === cat);
  catRecipes.forEach(r => {
    doc.addPage();
    renderRecipe(r, 'es');
    doc.addPage();
    renderRecipe(r, 'en');
  });
});

// === BACK MATTER: Notes ===
for (let i = 0; i < 4; i++) {
  doc.addPage();
  if (i === 0) {
    doc.font(FONT_BODY).fontSize(14).fillColor(INK)
      .text('Notas / Notes', { align: 'center' });
    doc.moveDown(0.4);
    drawRule(1.5, INK);
    doc.moveDown(1);
  }
  let y = Math.max(doc.y, M.top + 30);
  while (y < H - M.bottom) {
    doc.moveTo(M.left, y).lineTo(W - M.right, y).lineWidth(0.2).strokeColor(RULE_LIGHT).stroke();
    y += 22;
  }
}

// === PAGE NUMBERS ===
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  if (i < 5) continue;
  doc.font(FONT_MONO).fontSize(6).fillColor(INK_LIGHT)
    .text(`${i - 4}`, M.left, H - M.bottom + 15, { width: CW, align: 'center' });
}

// === FOOTER on last content page ===
doc.switchToPage(range.start + range.count - 1);
doc.font(FONT_MONO).fontSize(6).fillColor(INK_LIGHT)
  .text('Familia Jiménez-Torno \u00b7 2018\u20132026', M.left, H - M.bottom + 25, { width: CW, align: 'center' });

doc.end();
console.log(`✓ Generated recetario.pdf (${recipes.length} recipes, ${range.count} pages)`);
