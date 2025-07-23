class SigmaUtils {
  constructor() {
    this.delta = 0.05; // used for zooming
    this.zoomSensitivity = 2; // used for zooming
    this.colorShadeHash = {}; // cache for shadeColor
  }

  // Zoom controls for Sigma.js
  zoomIn(sigma) {
    if (!sigma) {
      return;
    }
    const camera = sigma.getCamera();
    const currentRatio = camera.ratio;
    const ratioOut = 1 / (1 - this.delta * this.zoomSensitivity);
    const newRatio = currentRatio / ratioOut;
    
    // Respect zoom limits
    if (newRatio < 0.01) {
      return;
    }
    camera.animatedZoom({ ratio: newRatio }, { duration: 200 });
  }

  zoomOut(sigma) {
    if (!sigma) {
      return;
    }
    const camera = sigma.getCamera();
    const currentRatio = camera.ratio;
    const ratioIn = 1 - this.delta * this.zoomSensitivity;
    const newRatio = currentRatio / ratioIn;
    
    // Respect zoom limits
    if (newRatio > 10) {
      return;
    }
    camera.animatedZoom({ ratio: newRatio }, { duration: 200 });
  }

  fitToView(sigma) {
    if (!sigma) {
      return;
    }
    const camera = sigma.getCamera();
    camera.animatedReset({ duration: 500 });
  }

  actualSize(sigma) {
    if (!sigma) {
      return;
    }
    const camera = sigma.getCamera();
    camera.animatedZoom({ ratio: 1 }, { duration: 300 });
  }

  calcStrLen(str) {
    let len = 0;
    for (let i = 0; i < str.length; ++i) {
      if (str.charCodeAt(i) > 0 && str.charCodeAt(i) < 128) {
        len += 1;
      } else {
        len += 2;
      }
    }
    return len;
  }

  calcTextWidth(str, fontSize) {
    const fontWidth = fontSize * 1.3;
    return this.calcStrLen(str) * fontWidth;
  }

  fittingString(str, maxWidth, fontSize) {
    maxWidth = maxWidth * 2;
    const fontWidth = fontSize * 1.3;
    const width = this.calcTextWidth(str, fontSize);
    const ellipsis = "…";
    if (width > maxWidth) {
      const actualLen = Math.floor((maxWidth - 10) / fontWidth);
      const result = str.substring(0, actualLen) + ellipsis;
      return result;
    }
    return str;
  }

  shadeColor(color, percent = -20) {
    if (this.colorShadeHash[color] && this.colorShadeHash[color][percent]) {
      return this.colorShadeHash[color][percent];
    }

    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt((R * (100 + percent)) / 100);
    G = parseInt((G * (100 + percent)) / 100);
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    let RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
    let GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
    let BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

    if (!this.colorShadeHash[color]) {
      this.colorShadeHash[color] = {};
    }
    this.colorShadeHash[color][percent] = "#" + RR + GG + BB;

    return "#" + RR + GG + BB;
  }

  // Helper to convert screen coordinates to graph coordinates
  getGraphCoordinates(sigma, clientX, clientY) {
    const container = sigma.getContainer();
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return sigma.viewportToGraph({ x, y });
  }

  // Helper to get readable text color based on background
  getReadableTextColor(bgColor) {
    const color = bgColor.charAt(0) === '#' ? bgColor.substring(1) : bgColor;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
  }
}

const sigmaUtils = new SigmaUtils();
export default sigmaUtils;