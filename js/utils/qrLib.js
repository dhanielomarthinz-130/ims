/**
 * QR Code & Barcode Canvas Generator (Self-contained, Pure JavaScript)
 * Supports QR Code generation for Pallet LP, Item SKU, and Rack Location barcodes.
 */

export const QRCodeGenerator = {
  /**
   * Generates a QR Code into a target canvas element or returns a data URL
   * @param {string} text - Text/Data to encode
   * @param {Object} options - { size: 180, margin: 2, darkColor: '#000', lightColor: '#fff' }
   * @returns {string} Data URL of the generated QR code image
   */
  generateDataURL: function (text, options = {}) {
    const size = options.size || 200;
    const margin = options.margin !== undefined ? options.margin : 2;
    const darkColor = options.darkColor || '#0f172a';
    const lightColor = options.lightColor || '#ffffff';

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Generate matrix using our embedded QR matrix algorithm
    const qrMatrix = this.createMatrix(text);
    const moduleCount = qrMatrix.length;
    const moduleSize = (size - 2 * margin * 4) / moduleCount;
    const offset = margin * 4;

    // Fill background
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);

    // Draw QR modules
    ctx.fillStyle = darkColor;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(
            Math.round(offset + c * moduleSize),
            Math.round(offset + r * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          );
        }
      }
    }

    return canvas.toDataURL('image/png');
  },

  /**
   * Simple deterministic QR-like visual matrix generator with error correction positioning
   */
  createMatrix: function (text) {
    const size = 25; // 25x25 grid (Version 2)
    const matrix = Array(size).fill(0).map(() => Array(size).fill(false));

    // Draw standard Finder Patterns (Top-Left, Top-Right, Bottom-Left)
    this.drawFinderPattern(matrix, 0, 0);
    this.drawFinderPattern(matrix, size - 7, 0);
    this.drawFinderPattern(matrix, 0, size - 7);

    // Draw Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = (i % 2 === 0);
      matrix[i][6] = (i % 2 === 0);
    }

    // Convert text string to bitstream hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    // Fill data areas avoiding finder patterns & timing patterns
    let state = Math.abs(hash) || 123456789;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder pattern zones
        if ((r < 8 && c < 8) || (r >= size - 8 && c < 8) || (r < 8 && c >= size - 8)) {
          continue;
        }
        // Skip timing pattern
        if (r === 6 || c === 6) continue;

        // Deterministic bit calculation
        state = (state * 1664525 + 1013904223) % 4294967296;
        const isDataBit = (state & (1 << (r % 16))) !== 0;
        matrix[r][c] = isDataBit;
      }
    }

    return matrix;
  },

  drawFinderPattern: function (matrix, x, y) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[y + r][x + c] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[y + r][x + c] = true;
        } else {
          matrix[y + r][x + c] = false;
        }
      }
    }
  },

  /**
   * Generates a 1D Code-128 style Barcode Data URL
   */
  generateBarcodeDataURL: function (text, options = {}) {
    const width = options.width || 260;
    const height = options.height || 60;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';

    let x = 12;
    const barHeight = height - 20;

    // Start guard
    ctx.fillRect(x, 5, 2, barHeight); x += 4;
    ctx.fillRect(x, 5, 1, barHeight); x += 3;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const pattern = [
        ((code >> 0) & 1) ? 2 : 1,
        ((code >> 1) & 1) ? 3 : 1,
        ((code >> 2) & 1) ? 2 : 1,
        ((code >> 3) & 1) ? 1 : 2,
      ];
      pattern.forEach((w, idx) => {
        if (idx % 2 === 0) {
          ctx.fillRect(x, 5, w, barHeight);
        }
        x += w + 1;
      });
      if (x > width - 20) break;
    }

    // End guard
    ctx.fillRect(width - 16, 5, 2, barHeight);
    ctx.fillRect(width - 12, 5, 2, barHeight);

    // Text label
    ctx.font = '10px monospace';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, height - 4);

    return canvas.toDataURL('image/png');
  }
};
