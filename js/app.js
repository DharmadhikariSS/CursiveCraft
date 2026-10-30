/**
 * Application Controller & Reactive State Manager
 * Handles UI interactions, live A4 preview rendering, presets, and printing
 */

document.addEventListener("DOMContentLoaded", () => {
  const renderer = new WorkbookRenderer();

  // App State with sensible defaults for adults (A4, 8mm, Alternating trace/write)
  const state = {
    paperSize: "A4",
    orientation: "portrait",
    text: "",
    fontFamily: "Cedarville Cursive, cursive",
    fontSize: 28,
    opticalScaling: true,
    baselineNudgePx: 0,
    lineHeightMm: 8.0,
    practiceMode: "alternating",
    fillRemainingLines: true,
    traceOpacity: 0.28,
    traceColor: "#455a64",
    traceStyle: "solid",
    guidelineType: "threeline",
    guidelineColor: "#cfd8dc",
    slantAngle: 55,
    slantFrequencyMm: 14,
    showSeyesMargin: true,
    seyesMarginColor: "#e57373",
    marginTopMm: 15,
    marginBottomMm: 15,
    marginLeftMm: 16,
    marginRightMm: 16,
    bindingMargin: false,
    headerTitle: "Adult Cursive Penmanship Practice",
    showHeader: true,
    showFooter: true,
    zoom: 0.85
  };

  // DOM Elements
  const els = {
    // Tabs
    tabBtns: document.querySelectorAll(".tab-btn"),
    tabContents: document.querySelectorAll(".tab-content"),
    
    // Content Tab
    libraryCategory: document.getElementById("library-category"),
    libraryItem: document.getElementById("library-item"),
    inputText: document.getElementById("input-text"),
    charWordCount: document.getElementById("char-word-count"),
    modeRadios: document.querySelectorAll('input[name="practiceMode"]'),
    fillRemaining: document.getElementById("fill-remaining"),
    
    // Typography Tab
    fontFamily: document.getElementById("font-family"),
    fontSize: document.getElementById("font-size"),
    valFontSize: document.getElementById("val-font-size"),
    btnAutoFitFont: document.getElementById("btn-auto-fit-font"),
    opticalScaling: document.getElementById("optical-scaling"),
    baselineNudge: document.getElementById("baseline-nudge"),
    valBaselineNudge: document.getElementById("val-baseline-nudge"),
    traceOpacity: document.getElementById("trace-opacity"),
    valTraceOpacity: document.getElementById("val-trace-opacity"),
    traceStyleRadios: document.querySelectorAll('input[name="traceStyle"]'),
    traceSwatches: document.querySelectorAll(".color-swatch[data-color]"),
    traceCustomColor: document.getElementById("trace-custom-color"),
    
    // Guidelines Tab
    guidelineType: document.getElementById("guideline-type"),
    lineHeight: document.getElementById("line-height"),
    valLineHeight: document.getElementById("val-line-height"),
    slantAngle: document.getElementById("slant-angle"),
    valSlantAngle: document.getElementById("val-slant-angle"),
    slantFrequency: document.getElementById("slant-frequency"),
    valSlantFreq: document.getElementById("val-slant-freq"),
    sectionSlantControls: document.getElementById("section-slant-controls"),
    gridSwatches: document.querySelectorAll(".color-swatch[data-grid-color]"),
    gridCustomColor: document.getElementById("grid-custom-color"),
    rowSeyesMargin: document.getElementById("row-seyes-margin"),
    seyesMarginToggle: document.getElementById("seyes-margin-toggle"),
    
    // Layout Tab
    paperSize: document.getElementById("paper-size"),
    orientRadios: document.querySelectorAll('input[name="orientation"]'),
    bindingMargin: document.getElementById("binding-margin"),
    marginTb: document.getElementById("margin-tb"),
    valMarginTb: document.getElementById("val-margin-tb"),
    marginLr: document.getElementById("margin-lr"),
    valMarginLr: document.getElementById("val-margin-lr"),
    headerTitle: document.getElementById("header-title"),
    showHeader: document.getElementById("show-header"),
    showFooter: document.getElementById("show-footer"),
    
    // Presets Tab
    presetList: document.getElementById("preset-list"),
    
    // Workspace & Toolbar
    pageCountBadge: document.getElementById("page-count-badge"),
    btnQuickRandom: document.getElementById("btn-quick-random"),
    btnPrint: document.getElementById("btn-print"),
    pagesContainer: document.getElementById("pages-container"),
    previewViewport: document.getElementById("preview-viewport"),
    btnZoomIn: document.getElementById("btn-zoom-in"),
    btnZoomOut: document.getElementById("btn-zoom-out"),
    btnZoomReset: document.getElementById("btn-zoom-reset"),
    zoomValue: document.getElementById("zoom-value")
  };

  // Dynamic Print Stylesheet element
  let printStyleTag = document.getElementById("dynamic-print-style");
  if (!printStyleTag) {
    printStyleTag = document.createElement("style");
    printStyleTag.id = "dynamic-print-style";
    document.head.appendChild(printStyleTag);
  }

  /* ==========================================================================
     INIT & POPULATION
     ========================================================================== */

  function init() {
    initTabs();
    populateCuratedLibrary();
    populatePresets();
    bindEvents();

    // Load initial sample from library
    loadLibraryItem(0, 0);

    // Initial render
    updateFontSizeDisplay();
    updateDynamicPrintStyle();
    renderWorkbook();
    updateZoom();

    // Heartbeat ping to keep local Python server alive while window is open
    if (location.protocol.startsWith("http")) {
      const sendHeartbeat = () => {
        fetch("/heartbeat?t=" + Date.now(), { cache: "no-store" }).catch(() => {});
      };
      sendHeartbeat();
      setInterval(sendHeartbeat, 2500);
    }
  }

  function initTabs() {
    els.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        els.tabBtns.forEach(b => b.classList.remove("active"));
        els.tabContents.forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        const panel = document.getElementById(`tab-${targetTab}`);
        if (panel) panel.classList.add("active");
      });
    });
  }

  function populateCuratedLibrary() {
    els.libraryCategory.innerHTML = "";
    CURATED_LIBRARY.forEach((cat, catIdx) => {
      const opt = document.createElement("option");
      opt.value = catIdx;
      opt.textContent = cat.category;
      els.libraryCategory.appendChild(opt);
    });

    updateLibraryItemsDropdown(0);

    els.libraryCategory.addEventListener("change", (e) => {
      const catIdx = parseInt(e.target.value, 10);
      updateLibraryItemsDropdown(catIdx);
      loadLibraryItem(catIdx, 0);
    });

    els.libraryItem.addEventListener("change", (e) => {
      const catIdx = parseInt(els.libraryCategory.value, 10);
      const itemIdx = parseInt(e.target.value, 10);
      loadLibraryItem(catIdx, itemIdx);
    });
  }

  function updateLibraryItemsDropdown(catIdx) {
    els.libraryItem.innerHTML = "";
    const cat = CURATED_LIBRARY[catIdx];
    if (!cat) return;

    cat.items.forEach((item, itemIdx) => {
      const opt = document.createElement("option");
      opt.value = itemIdx;
      opt.textContent = item.title;
      els.libraryItem.appendChild(opt);
    });
  }

  function loadLibraryItem(catIdx, itemIdx) {
    const cat = CURATED_LIBRARY[catIdx];
    if (!cat) return;
    const item = cat.items[itemIdx];
    if (!item) return;

    state.text = item.text;
    els.inputText.value = item.text;
    state.headerTitle = item.title;
    els.headerTitle.value = item.title;

    updateTextCounts();
    renderWorkbook();
  }

  function populatePresets() {
    els.presetList.innerHTML = "";
    Object.keys(WORKBOOK_PRESETS).forEach(presetKey => {
      const p = WORKBOOK_PRESETS[presetKey];
      const card = document.createElement("div");
      card.className = "preset-card";
      card.innerHTML = `
        <h4>${p.name}</h4>
        <p>${p.description}</p>
      `;
      card.addEventListener("click", () => applyPreset(presetKey));
      els.presetList.appendChild(card);
    });
  }

  function applyPreset(presetKey) {
    const p = WORKBOOK_PRESETS[presetKey];
    if (!p) return;

    Object.assign(state, p);

    // Sync UI elements to state
    els.paperSize.value = state.paperSize;
    document.querySelector(`input[name="orientation"][value="${state.orientation}"]`).checked = true;
    els.fontFamily.value = state.fontFamily;
    els.fontSize.value = state.fontSize;
    if (state.opticalScaling !== undefined) els.opticalScaling.checked = state.opticalScaling;
    if (state.baselineNudgePx !== undefined) {
      els.baselineNudge.value = state.baselineNudgePx;
      els.valBaselineNudge.textContent = `${state.baselineNudgePx > 0 ? "+" : ""}${state.baselineNudgePx} px`;
    }
    updateFontSizeDisplay();
    els.lineHeight.value = state.lineHeightMm;
    els.valLineHeight.textContent = `${state.lineHeightMm.toFixed(1)} mm`;
    els.guidelineType.value = state.guidelineType;
    els.slantAngle.value = state.slantAngle;
    els.valSlantAngle.textContent = `${state.slantAngle}°`;
    els.slantFrequency.value = state.slantFrequencyMm;
    els.valSlantFreq.textContent = `${state.slantFrequencyMm} mm`;
    els.traceOpacity.value = state.traceOpacity;
    els.valTraceOpacity.textContent = `${Math.round(state.traceOpacity * 100)}%`;
    document.querySelector(`input[name="practiceMode"][value="${state.practiceMode}"]`).checked = true;
    document.querySelector(`input[name="traceStyle"][value="${state.traceStyle}"]`).checked = true;
    els.marginTb.value = state.marginTopMm;
    els.valMarginTb.textContent = `${state.marginTopMm} mm`;
    els.marginLr.value = state.marginLeftMm;
    els.valMarginLr.textContent = `${state.marginLeftMm} mm`;
    els.bindingMargin.checked = state.bindingMargin;
    els.headerTitle.value = state.headerTitle;
    els.showHeader.checked = state.showHeader;
    els.showFooter.checked = state.showFooter;

    // Load corresponding preset text if configured
    if (p.contentCategory !== undefined && p.contentIndex !== undefined) {
      const catIdx = CURATED_LIBRARY.findIndex(c => c.category === p.contentCategory);
      if (catIdx !== -1) {
        els.libraryCategory.value = catIdx;
        updateLibraryItemsDropdown(catIdx);
        els.libraryItem.value = p.contentIndex;
        loadLibraryItem(catIdx, p.contentIndex);
      }
    }

    updateControlVisibility();
    updateDynamicPrintStyle();
    renderWorkbook();
  }

  /* ==========================================================================
     EVENT BINDINGS
     ========================================================================== */

  function bindEvents() {
    // Textarea input
    els.inputText.addEventListener("input", (e) => {
      state.text = e.target.value;
      updateTextCounts();
      debounceRender();
    });

    // Practice mode radio buttons
    els.modeRadios.forEach(radio => {
      radio.addEventListener("change", (e) => {
        state.practiceMode = e.target.value;
        renderWorkbook();
      });
    });

    els.fillRemaining.addEventListener("change", (e) => {
      state.fillRemainingLines = e.target.checked;
      renderWorkbook();
    });

    // Typography
    els.fontFamily.addEventListener("change", (e) => {
      state.fontFamily = e.target.value;
      updateFontSizeDisplay();
      renderWorkbook();
    });

    els.fontSize.addEventListener("input", (e) => {
      state.fontSize = parseInt(e.target.value, 10);
      updateFontSizeDisplay();
      debounceRender();
    });

    els.btnAutoFitFont.addEventListener("click", () => {
      const optimal = renderer.calculateOptimalFontSize(
        state.fontFamily,
        state.lineHeightMm,
        state.guidelineType,
        state.opticalScaling
      );
      state.fontSize = optimal;
      els.fontSize.value = optimal;
      updateFontSizeDisplay();
      renderWorkbook();
    });

    els.opticalScaling.addEventListener("change", (e) => {
      state.opticalScaling = e.target.checked;
      updateFontSizeDisplay();
      renderWorkbook();
    });

    els.baselineNudge.addEventListener("input", (e) => {
      state.baselineNudgePx = parseInt(e.target.value, 10);
      els.valBaselineNudge.textContent = `${state.baselineNudgePx > 0 ? "+" : ""}${state.baselineNudgePx} px`;
      debounceRender();
    });

    els.traceOpacity.addEventListener("input", (e) => {
      state.traceOpacity = parseFloat(e.target.value);
      els.valTraceOpacity.textContent = `${Math.round(state.traceOpacity * 100)}%`;
      debounceRender();
    });

    els.traceStyleRadios.forEach(r => {
      r.addEventListener("change", (e) => {
        state.traceStyle = e.target.value;
        renderWorkbook();
      });
    });

    // Trace Color swatches
    els.traceSwatches.forEach(swatch => {
      swatch.addEventListener("click", () => {
        els.traceSwatches.forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        const color = swatch.getAttribute("data-color");
        state.traceColor = color;
        els.traceCustomColor.value = color;
        renderWorkbook();
      });
    });

    els.traceCustomColor.addEventListener("input", (e) => {
      els.traceSwatches.forEach(s => s.classList.remove("active"));
      state.traceColor = e.target.value;
      debounceRender();
    });

    // Guidelines & Ruling
    els.guidelineType.addEventListener("change", (e) => {
      state.guidelineType = e.target.value;
      updateControlVisibility();
      renderWorkbook();
    });

    els.lineHeight.addEventListener("input", (e) => {
      state.lineHeightMm = parseFloat(e.target.value);
      els.valLineHeight.textContent = `${state.lineHeightMm.toFixed(1)} mm`;
      debounceRender();
    });

    els.slantAngle.addEventListener("input", (e) => {
      state.slantAngle = parseFloat(e.target.value);
      els.valSlantAngle.textContent = `${state.slantAngle}°`;
      debounceRender();
    });

    els.slantFrequency.addEventListener("input", (e) => {
      state.slantFrequencyMm = parseFloat(e.target.value);
      els.valSlantFreq.textContent = `${state.slantFrequencyMm} mm`;
      debounceRender();
    });

    // Grid Tone swatches
    els.gridSwatches.forEach(swatch => {
      swatch.addEventListener("click", () => {
        els.gridSwatches.forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        const color = swatch.getAttribute("data-grid-color");
        state.guidelineColor = color;
        els.gridCustomColor.value = color;
        renderWorkbook();
      });
    });

    els.gridCustomColor.addEventListener("input", (e) => {
      els.gridSwatches.forEach(s => s.classList.remove("active"));
      state.guidelineColor = e.target.value;
      debounceRender();
    });

    els.seyesMarginToggle.addEventListener("change", (e) => {
      state.showSeyesMargin = e.target.checked;
      renderWorkbook();
    });

    // Layout
    els.paperSize.addEventListener("change", (e) => {
      state.paperSize = e.target.value;
      updateDynamicPrintStyle();
      renderWorkbook();
    });

    els.orientRadios.forEach(r => {
      r.addEventListener("change", (e) => {
        state.orientation = e.target.value;
        updateDynamicPrintStyle();
        renderWorkbook();
      });
    });

    els.bindingMargin.addEventListener("change", (e) => {
      state.bindingMargin = e.target.checked;
      renderWorkbook();
    });

    els.marginTb.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      state.marginTopMm = val;
      state.marginBottomMm = val;
      els.valMarginTb.textContent = `${val} mm`;
      debounceRender();
    });

    els.marginLr.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      state.marginLeftMm = val;
      state.marginRightMm = val;
      els.valMarginLr.textContent = `${val} mm`;
      debounceRender();
    });

    els.headerTitle.addEventListener("input", (e) => {
      state.headerTitle = e.target.value;
      debounceRender();
    });

    els.showHeader.addEventListener("change", (e) => {
      state.showHeader = e.target.checked;
      renderWorkbook();
    });

    els.showFooter.addEventListener("change", (e) => {
      state.showFooter = e.target.checked;
      renderWorkbook();
    });

    // Quick Actions
    els.btnQuickRandom.addEventListener("click", pickRandomPassage);
    els.btnPrint.addEventListener("click", () => {
      updateDynamicPrintStyle();
      window.print();
    });

    // Zoom Controls
    els.btnZoomIn.addEventListener("click", () => {
      state.zoom = Math.min(1.5, state.zoom + 0.1);
      updateZoom();
    });

    els.btnZoomOut.addEventListener("click", () => {
      state.zoom = Math.max(0.4, state.zoom - 0.1);
      updateZoom();
    });

    els.btnZoomReset.addEventListener("click", () => {
      fitZoomToWidth();
    });
  }

  function updateControlVisibility() {
    const isSeyes = state.guidelineType === "seyes";
    if (els.rowSeyesMargin) {
      els.rowSeyesMargin.style.display = isSeyes ? "flex" : "none";
    }
  }

  function updateFontSizeDisplay() {
    const eff = renderer.getEffectiveFontSize(state);
    if (state.opticalScaling && eff !== state.fontSize) {
      els.valFontSize.textContent = `${state.fontSize} px (Optical: ${eff}px)`;
    } else {
      els.valFontSize.textContent = `${state.fontSize} px`;
    }
  }

  function updateTextCounts() {
    const text = state.text || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    els.charWordCount.textContent = `${words} words (${chars} chars)`;
  }

  function pickRandomPassage() {
    const randomCatIdx = Math.floor(Math.random() * CURATED_LIBRARY.length);
    const cat = CURATED_LIBRARY[randomCatIdx];
    const randomItemIdx = Math.floor(Math.random() * cat.items.length);

    els.libraryCategory.value = randomCatIdx;
    updateLibraryItemsDropdown(randomCatIdx);
    els.libraryItem.value = randomItemIdx;

    loadLibraryItem(randomCatIdx, randomItemIdx);
  }

  function updateDynamicPrintStyle() {
    const sizeName = state.paperSize === "A4" ? "A4" : "letter";
    const orient = state.orientation || "portrait";
    const printHeight = state.paperSize === "A4"
      ? (orient === "portrait" ? "296mm" : "209mm")
      : (orient === "portrait" ? "278mm" : "215mm");

    printStyleTag.innerHTML = `
      @page {
        size: ${sizeName} ${orient};
        margin: 0 !important;
      }
      @media print {
        .workbook-page {
          height: ${printHeight} !important;
          max-height: ${printHeight} !important;
          page-break-after: always !important;
          break-after: page !important;
        }
        .workbook-page:last-child,
        .workbook-page:last-of-type {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
      }
    `;
  }

  /* ==========================================================================
     RENDERING
     ========================================================================== */

  let renderTimeout = null;
  function debounceRender() {
    if (renderTimeout) cancelAnimationFrame(renderTimeout);
    renderTimeout = requestAnimationFrame(() => {
      renderWorkbook();
    });
  }

  function renderWorkbook() {
    const pages = renderer.render(state);
    els.pagesContainer.innerHTML = pages.join("");
    els.pageCountBadge.textContent = `Page 1 of ${pages.length} (${state.paperSize})`;
  }

  function updateZoom() {
    els.pagesContainer.style.transform = `scale(${state.zoom})`;
    els.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function fitZoomToWidth() {
    const viewportWidth = els.previewViewport.clientWidth - 80;
    // A4 width in px at 96 DPI is ~794px
    const pageWidthPx = (state.paperSize === "A4" ? 210 : 215.9) * MM_TO_PX;
    state.zoom = Math.max(0.4, Math.min(1.2, viewportWidth / pageWidthPx));
    updateZoom();
  }

  // Initialize
  init();
});

