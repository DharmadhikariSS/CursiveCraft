# CursiveCraft Studio ✍️
### Adult Cursive Tracing & Penmanship Workbook Generator (A4 Compatible)

A dedicated, customizable desktop web application designed specifically for adults practicing cursive handwriting, calligraphy, and penmanship. Generate elegant, printable worksheets with faint cursive paragraphs, customizable penmanship grids, adult literature excerpts, and high-yield training formats (like alternating trace-and-write lines).

---

## 🚀 Quick Start

You can launch the app in any of these three ways:

### 1. One-Click Windows Launcher
Double-click **`run_app.bat`**.

### 2. Python Desktop App Mode
Run in PowerShell or Command Prompt:
```bash
python app.py
```
> This automatically starts the local server and launches the app in a **standalone desktop window** using Chrome or Microsoft Edge (with no browser address bar or tabs).

### 3. Direct Browser Launch
Double-click **`index.html`** in File Explorer to open directly in your favorite browser.

---

## ✨ Features Built for Adults

Unlike elementary school worksheet generators with 24mm kindergarten lines, CursiveCraft is tailored for adults:

### 1. 📄 ISO A4 Compatibility & Exact Vector Grids
- **Default ISO A4 (210 × 297 mm)** dimensions (and US Letter toggle).
- **Exact millimeter scaling**: 6.0mm, 7.1mm (college rule), 8.0mm, or custom ruling heights.
- Vector SVG rendering ensures guidelines and faint cursive text print at **1200+ DPI** with zero pixelation or blurriness.
- **Left Binding Allowance**: Optional +12mm left margin for 3-ring binders, clipboards, or spiral binding.

### 2. 📐 Specialized Penmanship Ruling Grids
- **French Ruled (Grille Seyès)**: The classic 8×8mm squares with 2mm sub-lines and optional vertical red margin line beloved by fountain pen and cursive enthusiasts.
- **Spencerian & Copperplate 55° Slanted Grid**: Waistline, ascender, descender, and diagonal slant angle guidelines (adjustable 50°–65°).
- **Classic 3-Line & 4-Line Ruling**: Topline, dashed midline (waistline), baseline, and descender line.
- **Minimalist Baseline Only**: Clean single-line ruling for advanced writers.
- **5mm Dot Grid**: Bullet-journal style dotted grid.

### 3. ✒️ Authentic Adult Cursive Fonts
- **Palmer Business Cursive** (*Cedarville Cursive*): Clean, monoline, continuous, and highly legible for everyday writing.
- **Classic Slanted Script** (*Alex Brush* / *Allura*): Elegant cursive with natural slant and smooth connecting strokes.
- **Spencerian & Calligraphic Flourishes** (*Great Vibes*): High-elegance script with decorative capitals and loops.
- **Fountain Pen Flow** (*Caveat* / *Marck Script*): Natural, expressive handwriting with organic weight.

### 4. 🎯 High-Yield Tracing Modes
- **Trace & Write (Alternating Lines)**: Line 1 provides a faint cursive model to trace; Line 2 provides empty guidelines to reproduce the letters immediately from muscle memory.
- **Full Trace**: Every line is rendered in faint cursive with guidelines.
- **First Word Only**: Traces the starting word of each sentence, letting you write the remainder freehand.
- **Custom Faintness Slider**: Set opacity from 10% (barely visible ghost guide) to 70% (bold guide).
- **Ink Tones**: Soft Pencil Graphite, Non-Photo Cyan (ideal for fountain pen inks), Warm Sepia, and Charcoal Black.
- **Tracing Styles**: Solid Faint, Dotted / Dashed, and Hollow Outline.

### 5. 📚 Curated Adult Practice Library
Includes pre-loaded adult literature and exercises:
- **Philosophy & Stoic Reflections**: Marcus Aurelius (*Meditations*), Seneca, Epictetus, Lao Tzu.
- **Classic Literature & Poetry**: Jane Austen, Ralph Waldo Emerson, Henry David Thoreau, Emily Dickinson, Shakespeare Sonnets, Robert Frost.
- **Pangrams & Warmup Drills**: Complete alphabet pangrams and fluid ligature drills (`minimum aluminum autumn...`).
- **Mindful Affirmations**: Calming, reflective prose for evening unwinding and stress relief.
- **Custom Input**: Paste any speech, article, or favorite passage with automatic word wrapping and multi-page pagination.

---

## 🖨️ Printing & PDF Export Tips

1. Click the green **Print / Save PDF (A4)** button in the top navbar (or press `Ctrl+P`).
2. In the print dialog:
   - **Destination**: Choose your printer or select **"Save as PDF"**.
   - **Paper Size**: Ensure **A4** is selected.
   - **Margins**: Set to **"None"** or **"Default"** (the app provides exact printable margins).
   - **Options**: Check **"Background graphics"** so guidelines and subtle grid colors appear on paper.
3. The printed page will match exact millimeter measurements on physical paper.

---

## 📁 File Structure

```
Vibe Coding/
├── index.html          # Main application interface
├── app.py              # Desktop window launcher & HTTP server
├── run_app.bat         # 1-Click Windows shortcut
├── css/
│   └── styles.css      # Modern UI & print stylesheets (@page A4 rules)
├── js/
│   ├── app.js          # Controller, reactive events, and zoom engine
│   ├── library.js      # Curated adult literature & pangram library
│   ├── presets.js      # 1-click penmanship presets (Seyès, Spencerian, etc.)
│   └── renderer.js     # Vector SVG ruling generator & text pagination engine
└── README.md           # Documentation & user manual
```

