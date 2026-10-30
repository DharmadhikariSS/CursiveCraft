/**
 * Workbook Page Generator & Vector SVG Guideline Renderer
 * Specifically optimized for ISO A4 (210mm x 297mm) and US Letter paper.
 */

const PAGE_DIMENSIONS = {
  A4: {
    widthMm: 210,
    heightMm: 297,
    name: "A4 (210 × 297 mm)"
  },
  Letter: {
    widthMm: 215.9,
    heightMm: 279.4,
    name: "US Letter (8.5 × 11 in)"
  }
};

// 1 mm in standard CSS pixels at 96 DPI
const MM_TO_PX = 3.779527559;

// Optical scaling factors to equalize lowercase x-heights across cursive fonts
const FONT_OPTICAL_SCALES = {
  "Cedarville Cursive, cursive": 1.45,
  "Alex Brush, cursive": 1.40,
  "Great Vibes, cursive": 1.35,
  "Allura, cursive": 1.30,
  "Marck Script, cursive": 1.15,
  "Caveat, cursive": 1.0,
  "Dancing Script, cursive": 0.95,
  "'Segoe Script', 'Lucida Handwriting', cursive": 1.10
};

class WorkbookRenderer {
  constructor() {
    this.measureCanvas = document.createElement("canvas");
    this.measureCtx = this.measureCanvas.getContext("2d");
  }

  /**
   * Returns optical font size taking into account per-font compensation
   */
  getEffectiveFontSize(options) {
    const raw = options.fontSize || 28;
    if (options.opticalScaling === false) {
      return raw;
    }
    const factor = FONT_OPTICAL_SCALES[options.fontFamily] || 1.0;
    return Math.round(raw * factor);
  }

  /**
   * Calculates ideal base font size for the current line height and ruling style
   */
  calculateOptimalFontSize(fontFamily, lineHeightMm, guidelineType, opticalScaling = true) {
    const lineHeightPx = (lineHeightMm || 8.0) * MM_TO_PX;
    // Ratio of font size to line height: for adult cursive, font em box is typically ~0.9 to 1.1 of ruling height
    let targetPx = lineHeightPx * 0.95;
    
    if (opticalScaling) {
      const factor = FONT_OPTICAL_SCALES[fontFamily] || 1.0;
      targetPx = targetPx / factor;
    }
    return Math.max(14, Math.min(72, Math.round(targetPx)));
  }

  /**
   * Main rendering function: generates HTML/SVG pages based on options
   */
  render(options) {
    const paper = PAGE_DIMENSIONS[options.paperSize] || PAGE_DIMENSIONS.A4;
    const isLandscape = options.orientation === "landscape";
    const pageWidthMm = isLandscape ? paper.heightMm : paper.widthMm;
    const pageHeightMm = isLandscape ? paper.widthMm : paper.heightMm;

    // Margins (including optional binder margin on left)
    const extraLeft = options.bindingMargin ? 12 : 0;
    const marginLeftMm = (options.marginLeftMm || 15) + extraLeft;
    const marginRightMm = options.marginRightMm || 15;
    const marginTopMm = options.marginTopMm || 15;
    const marginBottomMm = options.marginBottomMm || 15;

    const headerHeightMm = options.showHeader ? 16 : 4;
    const footerHeightMm = options.showFooter ? 12 : 4;

    const contentWidthMm = pageWidthMm - marginLeftMm - marginRightMm;
    // 2mm safety buffer prevents fractional sub-pixel overflow during physical print
    const contentHeightMm = Math.max(20, pageHeightMm - marginTopMm - marginBottomMm - headerHeightMm - footerHeightMm - 2);

    const contentWidthPx = contentWidthMm * MM_TO_PX;

    // Line height calculations
    const lineHeightMm = options.lineHeightMm || 8.0;
    const lineHeightPx = lineHeightMm * MM_TO_PX;

    // Effective Font size
    const effectiveFontSize = this.getEffectiveFontSize(options);

    // Word wrap the text lines using effective font size
    const textLines = this.wrapText(options.text || "", options.fontFamily, effectiveFontSize, contentWidthPx);

    // Build the line layout according to practice mode
    const practiceLines = this.buildPracticeLines(textLines, options.practiceMode);

    // Calculate lines per page
    const linesPerPage = Math.max(1, Math.floor(contentHeightMm / lineHeightMm));
    
    // Group lines into pages
    const pagesData = [];
    if (practiceLines.length === 0) {
      // Empty page with blank guidelines
      pagesData.push(new Array(linesPerPage).fill({ text: "", isBlank: true }));
    } else {
      for (let i = 0; i < practiceLines.length; i += linesPerPage) {
        const slice = practiceLines.slice(i, i + linesPerPage);

        // If this page slice contains no actual text and we already have at least 1 page, don't create a blank page
        const hasText = slice.some(item => item.text && item.text.trim().length > 0);
        if (!hasText && pagesData.length > 0) {
          continue;
        }

        // Fill remaining lines on page if desired
        while (slice.length < linesPerPage && options.fillRemainingLines) {
          slice.push({ text: "", isBlank: true });
        }
        pagesData.push(slice);
      }
    }

    const totalPages = pagesData.length;

    // Render each page as SVG / HTML
    const renderedPages = pagesData.map((pageLines, pageIdx) => {
      return this.renderPage({
        pageNumber: pageIdx + 1,
        totalPages,
        pageWidthMm,
        pageHeightMm,
        marginLeftMm,
        marginRightMm,
        marginTopMm,
        marginBottomMm,
        headerHeightMm,
        footerHeightMm,
        contentWidthMm,
        contentHeightMm,
        lineHeightMm,
        lines: pageLines,
        options
      });
    });

    return renderedPages;
  }

  /**
   * Word wrap text into lines fitting the available width
   */
  wrapText(text, fontFamily, fontSize, maxWidthPx) {
    if (!text || !text.trim()) return [];

    this.measureCtx.font = `${fontSize}px ${fontFamily}`;

    const paragraphs = text.split(/\r?\n/);
    const wrappedLines = [];

    for (let p of paragraphs) {
      const trimmedP = p.trim();
      if (!trimmedP) {
        // preserve blank line paragraph break
        wrappedLines.push("");
        continue;
      }

      const words = trimmedP.split(/\s+/);
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + " " + word;
        const metrics = this.measureCtx.measureText(testLine);
        if (metrics.width <= maxWidthPx) {
          currentLine = testLine;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }

    // Trim trailing empty lines so trailing newlines never trigger an unwanted extra blank page
    while (wrappedLines.length > 0 && wrappedLines[wrappedLines.length - 1] === "") {
      wrappedLines.pop();
    }

    return wrappedLines;
  }

  /**
   * Organizes text lines according to the chosen practice mode:
   * - 'full': every line is faint trace
   * - 'alternating': one faint trace line followed by an empty guideline line
   * - 'first-word': faint trace for first word, blank rest
   * - 'split': top half trace, bottom half blank
   */
  buildPracticeLines(textLines, mode) {
    const result = [];

    if (mode === "alternating") {
      for (const line of textLines) {
        if (line === "") {
          result.push({ text: "", isBlank: true });
        } else {
          result.push({ text: line, isBlank: false });
          result.push({ text: "", isBlank: true, isPracticeTarget: true });
        }
      }
    } else if (mode === "first-word") {
      for (const line of textLines) {
        if (!line) {
          result.push({ text: "", isBlank: true });
        } else {
          const firstWord = line.split(" ")[0] || "";
          result.push({ text: firstWord, isBlank: false, partial: true });
        }
      }
    } else {
      // 'full' mode
      for (const line of textLines) {
        result.push({ text: line, isBlank: !line });
      }
    }

    return result;
  }

  /**
   * Render an individual page container
   */
  renderPage(params) {
    const {
      pageNumber,
      totalPages,
      pageWidthMm,
      pageHeightMm,
      marginLeftMm,
      marginRightMm,
      marginTopMm,
      marginBottomMm,
      headerHeightMm,
      footerHeightMm,
      contentWidthMm,
      contentHeightMm,
      lineHeightMm,
      lines,
      options
    } = params;

    const svgWidth = contentWidthMm * MM_TO_PX;
    const svgHeight = (lines.length * lineHeightMm) * MM_TO_PX;

    // SVG elements for guidelines & text
    const svgContent = this.generatePageSVG({
      width: svgWidth,
      height: svgHeight,
      widthMm: contentWidthMm,
      lineHeightMm,
      lines,
      options
    });

    const headerHtml = options.showHeader ? `
      <div class="workbook-page-header" style="height: ${headerHeightMm}mm; padding: 0 ${marginLeftMm}mm 0 ${marginLeftMm}mm;">
        <div class="header-left">
          <span class="header-title">${this.escapeHtml(options.headerTitle || "Cursive Penmanship Practice")}</span>
        </div>
        <div class="header-right">
          <span class="header-meta">Date: ____________</span>
          <span class="header-meta">Name: ____________</span>
        </div>
      </div>
    ` : "";

    const footerHtml = options.showFooter ? `
      <div class="workbook-page-footer" style="height: ${footerHeightMm}mm; padding: 0 ${marginLeftMm}mm 0 ${marginLeftMm}mm;">
        <span class="footer-left">Adult Cursive Handwriting Workbook</span>
        <span class="footer-center">Slant & Proportion Guide</span>
        <span class="footer-right">Page ${pageNumber} of ${totalPages}</span>
      </div>
    ` : "";

    const pageWrapper = `
      <div class="workbook-page" 
           data-page="${pageNumber}"
           style="width: ${pageWidthMm}mm; height: ${pageHeightMm}mm; max-height: ${pageHeightMm}mm; box-sizing: border-box; padding-top: ${marginTopMm}mm; padding-bottom: ${marginBottomMm}mm; overflow: hidden;">
        ${headerHtml}
        <div class="workbook-page-content" style="margin-left: ${marginLeftMm}mm; margin-right: ${marginRightMm}mm; width: ${contentWidthMm}mm;">
          ${svgContent}
        </div>
        ${footerHtml}
      </div>
    `;

    return pageWrapper;
  }

  /**
   * Generates pure Vector SVG for guidelines, slants, and faint cursive text
   */
  generatePageSVG({ width, height, widthMm, lineHeightMm, lines, options }) {
    const lineHeightPx = lineHeightMm * MM_TO_PX;
    const guidelineType = options.guidelineType || "threeline";
    const guidelineColor = options.guidelineColor || "#cfd8dc";
    const slantAngle = parseFloat(options.slantAngle) || 0;
    const slantFreqMm = parseFloat(options.slantFrequencyMm) || 14;
    const slantFreqPx = slantFreqMm * MM_TO_PX;

    let guidelinesMarkup = "";

    // Guideline generators
    if (guidelineType === "seyes") {
      guidelinesMarkup = this.renderSeyesGrid(width, height, lineHeightPx, options);
    } else {
      // Line by line horizontal ruling
      for (let i = 0; i < lines.length; i++) {
        const topY = i * lineHeightPx;
        guidelinesMarkup += this.renderLineGuide(topY, width, lineHeightPx, guidelineType, guidelineColor, options);
      }

      // Add slant guides if slantAngle > 0
      if (slantAngle > 0 && slantFreqPx > 5) {
        guidelinesMarkup += this.renderSlantGuides(width, height, slantAngle, slantFreqPx, guidelineColor);
      }
    }

    // Text markup
    let textMarkup = "";
    const traceOpacity = options.traceOpacity !== undefined ? options.traceOpacity : 0.3;
    const traceColor = options.traceColor || "#37474f";
    const traceStyle = options.traceStyle || "solid";
    const fontFamily = options.fontFamily || "Cedarville Cursive, cursive";
    const effectiveFontSize = this.getEffectiveFontSize(options);
    const baselineNudge = parseFloat(options.baselineNudgePx) || 0;

    // Stroke / dash properties for different tracing styles
    let textStyleAttr = "";
    if (traceStyle === "dotted") {
      textStyleAttr = `fill="${traceColor}" fill-opacity="${traceOpacity * 0.7}" stroke="${traceColor}" stroke-opacity="${traceOpacity}" stroke-width="0.8" stroke-dasharray="2,2"`;
    } else if (traceStyle === "outline") {
      textStyleAttr = `fill="none" stroke="${traceColor}" stroke-opacity="${traceOpacity}" stroke-width="0.9"`;
    } else {
      // solid faint
      textStyleAttr = `fill="${traceColor}" fill-opacity="${traceOpacity}"`;
    }

    for (let i = 0; i < lines.length; i++) {
      const lineObj = lines[i];
      if (!lineObj.text) continue;

      const topY = i * lineHeightPx;
      // Position baseline:
      // Typically at 75% of line height for standard 3-line/4-line, or aligned with Seyes major line
      let baselineY = topY + lineHeightPx * 0.75;
      if (guidelineType === "seyes") {
        baselineY = topY + lineHeightPx; // Seyès sits directly on the bottom major line of the row
      } else if (guidelineType === "baseline") {
        baselineY = topY + lineHeightPx * 0.85;
      }

      // Apply vertical baseline nudge
      baselineY += baselineNudge;

      // Small left indent so text doesn't touch the edge
      const indentX = 4;

      textMarkup += `
        <text x="${indentX}" y="${baselineY}" 
              font-family="${fontFamily}" 
              font-size="${effectiveFontSize}px" 
              ${textStyleAttr}
              dominant-baseline="alphabetic"
              class="cursive-trace-text"
              xml:space="preserve">${this.escapeXml(lineObj.text)}</text>
      `;
    }

    return `
      <svg class="workbook-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <g class="guidelines-group">
          ${guidelinesMarkup}
        </g>
        <g class="text-group">
          ${textMarkup}
        </g>
      </svg>
    `;
  }

  /**
   * Render French Seyès Ruling (Grille Seyès)
   * 8mm major lines, 2mm intermediate sublines, 8mm vertical lines, red left margin line
   */
  renderSeyesGrid(width, height, majorLinePx, options) {
    const sublinePx = majorLinePx / 4; // 2mm sublines when major is 8mm
    const majorColor = options.guidelineColor || "#7986cb";
    const subColor = options.guidelineSubColor || "#c5cae9";
    const marginColor = options.seyesMarginColor || "#e57373";
    const showMargin = options.showSeyesMargin !== false;

    let markup = "";

    // Horizontal lines
    let y = 0;
    let lineCount = 0;
    while (y <= height + 1) {
      const isMajor = lineCount % 4 === 0;
      const strokeColor = isMajor ? majorColor : subColor;
      const strokeWidth = isMajor ? "1.0" : "0.5";
      const opacity = isMajor ? "0.85" : "0.55";

      markup += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" />`;
      y += sublinePx;
      lineCount++;
    }

    // Vertical lines (8mm spacing)
    let x = 0;
    while (x <= width) {
      markup += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${subColor}" stroke-width="0.5" stroke-opacity="0.45" />`;
      x += majorLinePx;
    }

    // Classic French Red Margin Line (at approx 24mm or 3 major squares)
    if (showMargin && width > majorLinePx * 3) {
      const marginX = majorLinePx * 3;
      markup += `<line x1="${marginX}" y1="0" x2="${marginX}" y2="${height}" stroke="${marginColor}" stroke-width="1.2" stroke-opacity="0.8" />`;
    }

    return markup;
  }

  /**
   * Render individual horizontal guideline row
   */
  renderLineGuide(topY, width, height, type, color, options) {
    let markup = "";

    if (type === "baseline") {
      // Just a clean baseline
      const baseY = topY + height * 0.85;
      markup += `<line x1="0" y1="${baseY}" x2="${width}" y2="${baseY}" stroke="${color}" stroke-width="0.8" stroke-opacity="0.7" />`;
    } else if (type === "threeline") {
      // Ascender (top), Midline / Waistline (dashed), Baseline
      const topGuideY = topY + height * 0.2;
      const midGuideY = topY + height * 0.48;
      const baseGuideY = topY + height * 0.75;

      // Top line
      markup += `<line x1="0" y1="${topGuideY}" x2="${width}" y2="${topGuideY}" stroke="${color}" stroke-width="0.6" stroke-opacity="0.5" />`;
      // Waistline (dashed for x-height)
      markup += `<line x1="0" y1="${midGuideY}" x2="${width}" y2="${midGuideY}" stroke="${color}" stroke-width="0.7" stroke-dasharray="3,3" stroke-opacity="0.75" />`;
      // Baseline
      markup += `<line x1="0" y1="${baseGuideY}" x2="${width}" y2="${baseGuideY}" stroke="${color}" stroke-width="1.0" stroke-opacity="0.85" />`;
    } else if (type === "fourline" || type === "spencerian") {
      // 4-line complete: Ascender, Midline, Baseline, Descender
      const ascenderY = topY + height * 0.15;
      const waistlineY = topY + height * 0.45;
      const baselineY = topY + height * 0.75;
      const descenderY = topY + height * 0.98;

      markup += `<line x1="0" y1="${ascenderY}" x2="${width}" y2="${ascenderY}" stroke="${color}" stroke-width="0.6" stroke-opacity="0.45" />`;
      markup += `<line x1="0" y1="${waistlineY}" x2="${width}" y2="${waistlineY}" stroke="${color}" stroke-width="0.7" stroke-dasharray="3,2.5" stroke-opacity="0.7" />`;
      markup += `<line x1="0" y1="${baselineY}" x2="${width}" y2="${baselineY}" stroke="${color}" stroke-width="1.0" stroke-opacity="0.9" />`;
      markup += `<line x1="0" y1="${descenderY}" x2="${width}" y2="${descenderY}" stroke="${color}" stroke-width="0.6" stroke-opacity="0.45" />`;
    } else if (type === "dotgrid") {
      // 5mm dot grid
      const dotSpacing = 5 * MM_TO_PX;
      let dy = topY;
      while (dy < topY + height) {
        let dx = 0;
        while (dx < width) {
          markup += `<circle cx="${dx}" cy="${dy}" r="0.7" fill="${color}" fill-opacity="0.6" />`;
          dx += dotSpacing;
        }
        dy += dotSpacing;
      }
    }

    return markup;
  }

  /**
   * Render diagonal slant guidelines (e.g. 52° or 55° for Spencerian / Copperplate)
   */
  renderSlantGuides(width, height, angleDeg, freqPx, color) {
    let markup = "";
    const rad = (angleDeg * Math.PI) / 180;
    // Slope: dy/dx = tan(rad) => deltaX for full height is height / tan(rad)
    const cotan = 1 / Math.tan(rad);
    const deltaX = height * cotan;

    // Start lines back far enough to cover the bottom-left corner
    const startX = -deltaX;
    const endX = width + deltaX;

    for (let x = startX; x < endX; x += freqPx) {
      const x1 = x;
      const y1 = height;
      const x2 = x + deltaX;
      const y2 = 0;

      markup += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="0.5" stroke-opacity="0.4" />`;
    }

    return markup;
  }

  escapeXml(unsafe) {
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  escapeHtml(unsafe) {
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WorkbookRenderer, PAGE_DIMENSIONS };
}

