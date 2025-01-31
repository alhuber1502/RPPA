import PDFDocument from "pdfkit";
import { calculateArcToGeom } from './arcTo';
import { createAOP } from "./aop";
import { color2tuple, rgbToHex } from './colors';
import { defaultFontData, parseFont } from "./fonts";

/*
 *
 *  A canvas to PDF converter. Uses a mock canvas context to build a PDF document.
 */

function isPDFGradient(value) {
  if(value?.constructor?.name === 'PDFLinearGradient' || 
     value?.constructor?.name === 'PDFRadialGradient') {
    return true;
  }
  return false;
}

function fixColor(value) {
  if(isPDFGradient(value))
    return value;
  const [ r, g, b, a ] = color2tuple(value);
  return rgbToHex(r, g, b, a);
}


/**
 *
 * @param stream Stream to write the PDF to.
 * @param options Options passed to PDFDocument constructor.
 * @constructor
 */
const PdfEventProcessor = function(stream, width, height, debug) {
  if (stream == null) {
    throw new Error("Stream must be provided.");
  }

  const doc = new PDFDocument({ autoFirstPage: false });
  
  doc.addPage({ size: [width, height] }); // PDF has 72 'units' per inch

  this.doc = doc;
  this.stream = doc.pipe(stream);

  // Allows properties to be affected by AOP module
  const propProps = { enumerable: true, configurable: true };

  // We have to remember the values of these properties, pdfkit doesn't have getters for these.
  let lineHeight = doc.currentLineHeight(false);
  let fontValue = defaultFontData.family;
  Object.defineProperty(this, "font", { ...propProps,
    get() { return fontValue; },
    set(value) {
      fontValue = value;
      const parsedFont = parseFont(value);
      doc.fontSize(parsedFont.size);
      doc.font(parsedFont.family);
      lineHeight = doc.currentLineHeight(false);
    },
  });
  
  let textBaseline = "alphabetic";
  Object.defineProperty(this, "textBaseline", { ...propProps,
    get() { return textBaseline; },
    set(value) { textBaseline = value; },
  });

  let textAlign = "left";
  Object.defineProperty(this, "textAlign", { ...propProps,
    get() { return textAlign; },
    set(value) { textAlign = value; },
  });

  let fillStyleVal;
  Object.defineProperty(this, "fillStyle", { ...propProps,
    get() { return fillStyleVal; },
    set(value) {
      fillStyleVal = value;
      if(isPDFGradient(value)) {
        doc.fillColor(value, 1);
      } else {
        const { c, a } = fixColor(value);
        doc.fillColor(c, a);
      }
    },
  });

  let strokeStyleVal;
  Object.defineProperty(this, "strokeStyle", { ...propProps,
    get() { return strokeStyleVal; },
    set(value) {
      strokeStyleVal = value;
      if(isPDFGradient(value)) {
        doc.strokeColor(value);
      } else {
        const { c, a } = fixColor(value);
        doc.strokeColor(c, a);
      }
    },
  });

  let lineWidthVal;
  Object.defineProperty(this, "lineWidth", { ...propProps,
    get() { return lineWidthVal; },
    set(value) { doc.lineWidth(lineWidthVal = value); },
  });

  let lineCapVal;
  Object.defineProperty(this, "lineCap", { ...propProps,
    get() { return lineCapVal; },
    set(value) { doc.lineCap(lineCapVal = value); },
  });

  let lineJoinVal;
  Object.defineProperty(this, "lineJoin", { ...propProps,
    get() { return lineJoinVal; },
    set(value) { doc.lineJoin(lineJoinVal = value); },
  });

  let globalAlphaVal;
  Object.defineProperty(this, "globalAlpha", { ...propProps,
    get() { return globalAlphaVal; },
    set(value) {
      globalAlphaVal = value;
      value >= 0.0 && value <= 1.0 && doc.opacity(value);
    },
  });


  if(debug) {
    // Debug tracing for calls to the PDFDocument API
    const pdfkitAop = createAOP();
    pdfkitAop.advice('debug-trace', ({ beforeAll }) => {
      beforeAll((fname, ...args) => {
        if(fname[0] !== '_' && !['emit','read','begin','push','removeListener'].includes(fname)) {
          const printArgs = Array.from(args).map(a => (typeof a === 'string') ? a.slice(0, 100) : a);
          console.log(`... ${fname}(${printArgs})`);
        }
      });
    });
    pdfkitAop.wrapFunctions(doc);
  }

  this.background = function (x, y, width, height, color) {
    const { c } = fixColor(color);
    doc.rect(x, y, width, height);
    doc.fill(c);
  }

  this.save = function () {
    doc.save();
  };

  this.restore = function () {
    doc.restore();
  };

  this.scale = function (x, y) {
    doc.scale(x, y);
  };

  this.rotate = function (angle) {
    const degrees = (angle * 180) / Math.PI;
    doc.rotate(degrees);
  };

  this.translate = function (x, y) {
    doc.translate(x, y);
  };

  this.transform = function (a, b, c, d, e, f) {
    doc.transform(a, b, c, d, e, f);
  };

  this.beginPath = function () {
    // no-op
  };

  this.lineTo = function (x, y) {
    if(isNaN(x) || isNaN(y))
      return;
    doc.lineTo(x, y);
  };


  this.moveTo = function (x, y) {
    if(isNaN(x) || isNaN(y))
      return;
    doc.moveTo(x, y);
  };

  // TODO change px, py to be last two args
  this.arcTo = function (x1, y1, x2, y2, r, px, py) {
    // pdfkit doesn't have an arcTo() function, so we convert arcTo() into lineTo() then arc()
    const { T1, T2, C, a1, a2, ccw } = 
      calculateArcToGeom({
        P0: { x: px, y: py},
        P1: { x: x1, y: y1},
        P2: { x: x2, y: y2},
        r
      });

    doc.lineTo(T1.x, T1.y);

    // the pdfkit arc() function calls moveTo(), which messes up calls to closePath()
    const moveTo = doc.moveTo;
    doc.moveTo = () => null;
    doc.arc(C.x, C.y, r, a1, a2, ccw);
    doc.moveTo = moveTo;
  };


  this.closePath = function () {
    doc.closePath();
  };

  this.stroke = function () {
    doc.stroke();
  };

  this.fill = function () {
    doc.fill();
  };

  this.fillAndStroke = function () {
    doc.fillAndStroke();
  };

  this.ellipse = function (...args) {
    doc.ellipse(...args);
  }

  this.rect = function (x, y, width, height) {
    doc.rect(x, y, width, height);
  };

  this.fillRect = function (x, y, width, height) {
    doc.rect(x, y, width, height);
    doc.fill();
  };

  this.strokeRect = function (x, y, width, height) {
    doc.rect(x, y, width, height);
    doc.stroke();
  };

  /**
   * "Clears" a canvas by just drawing a white rectangle in the current group.
   */
  this.clearRect = function (x, y, width, height) {
    const oldFill = doc.fillColor();
    doc.fillColor("white");
    doc.rect(x, y, width, height);
    doc.fill();
    doc.fillColor(oldFill);
  };

  this.arc = function (x, y, r, a0, a1, ccw) {
    const pi = Math.PI,
      tau = 2 * pi,
      epsilon = 1e-6,
      tauEpsilon = tau - epsilon;
    (x = +x), (y = +y), (r = +r);
    let dx = r * Math.cos(a0),
      dy = r * Math.sin(a0),
      x0 = x + dx,
      y0 = y + dy,
      cw = 1 ^ ccw,
      da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) {
      throw new Error("negative radius: " + r);
    }
    let cmd = "";
    // Is this path empty? Move to (x0,y0).

    cmd += "M" + x0 + "," + y0;

    // // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    // else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
    //   cmd += 'L' + x0 + ',' + y0;
    // }
    // Is this arc empty? We’re done.
    if (!r) {
      return;
    }
    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) {
      da = (da % tau) + tau;
    }
    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      cmd += "A" + r +  "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" +
             r + "," + r +  ",0,1," + cw + "," + x0 + "," + y0;
    }
    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon) {
      cmd += "A" + r + "," + r + ",0," + +(da >= pi) + "," + cw + "," +
             (x + r * Math.cos(a1)) + "," + (y + r * Math.sin(a1));
    }
    doc.path(cmd);
  };

  this.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
    doc.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  };

  this.quadraticCurveTo = function (cpx, cpy, x, y) {
    doc.quadraticCurveTo(cpx, cpy, x, y);
  };

  this.createLinearGradient = function (x1, y1, x2, y2, stops) {
    const gradient = doc.linearGradient(x1, y1, x2, y2);
    for(const [ offset, color ] of stops) {
      const fixedColor = fixColor(color);
      gradient.stop(offset, fixedColor.c, fixedColor.a);
    }
    return gradient;
  };

  this.createRadialGradient = function (x0, y0, r0, x1, y1, r1, stops) {
    const gradient = doc.radialGradient(x0, y0, r0, x1, y1, r1);
    for(const [ offset, color ] of stops) {
      const fixedColor = fixColor(color);
      gradient.stop(offset, fixedColor.c, fixedColor.a);
    }
    return gradient;
  };

  this.adjustTextX = function (text, x) {
    if (textAlign !== "start" || textAlign !== "left") {
      const width = doc.widthOfString(text);
      if (textAlign === "right" || textAlign === "end") {
        x -= width;
      } else if (textAlign === "center") {
        x -= width / 2;
      }
    }
    return x;
  };

  this.adjustTextY = function (text, y) {
    // baseline is top by default
    if (textBaseline === "bottom") {
      y -= lineHeight;
    } else if (textBaseline === "middle") {
      y -= lineHeight / 2;
    } else if (textBaseline === "alphabetic") {
      y -= lineHeight / 2 + 1;
    }
    return y;
  };

  this.fillText = function (text, x, y) {
    x = this.adjustTextX(text, x);
    y = this.adjustTextY(text, y);
    doc.text(text, x, y, {
      lineBreak: false,
      stroke: false,
      fill: true,
    }); 
  };

  this.strokeText = function (text, x, y) {
    x = this.adjustTextX(text, x);
    y = this.adjustTextY(text, y);
    doc.text(text, x, y, { lineBreak: false, stroke: true, fill: false });
  };

  this.measureText = function (text) {
    text = "" + text;
    const width = doc.widthOfString(text);
    return { width: width, height: lineHeight };
  };

  this.clip = function () {
    doc.clip();
  };

  this.drawImage = function (image) {
    const args = Array.prototype.slice.call(arguments);
    image = args[0];
    let dx, dy, dw, dh, sx = 0, sy = 0, sw, sh;
    if (args.length === 3) {
      [ dx, dy ] = args.slice(1);
      sw = image.width;
      sh = image.height;
      dw = sw;
      dh = sh;
    } else if (args.length === 5) {
      [ dx, dy, dw, dh ] = args.slice(1);
      sw = image.width;
      sh = image.height;
    } else if (args.length === 9) {
      [ sx, sy, sw, sh, dx, dy, dw, dh ] = args.slice(1);
    } else {
      throw new Error("Invalid number of arguments passed to drawImage: " + arguments.length);
    }

    if (image.nodeName === "IMG") {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      doc.image(dataURL, dx, dy, { width: dw, height: dh });
    } else {
      doc.image(image, dx, dy, { width: dw, height: dh });
    }
  };

  this.setTransform = function (a, b, c, d, e, f) {
    const ctm = doc._ctm;
    const height = doc.page.height;
    const [a1, b1, c1, d1, e1, f1] = ctm;
    const determinant = a1 * d1 - b1 * c1;
    const inverse = [
      d1 / determinant,
      -b1 / determinant,
      -c1 / determinant,
      a1 / determinant,
      (c1 * f1 - d1 * e1) / determinant,
      (b1 * e1 - a1 * f1) / determinant,
    ];
    doc.transform(...inverse);
    doc.translate(0, height);
    doc.scale(1, -1);
    doc.transform(a, b, c, d, e, f);
  };


  this.setLineDash = function (arr) {
    if(!Array.isArray(arr)) {
      console.log("argument to setLineDash must be an array");
      return;
    }

    if(arr.length === 0) {
      doc.undash();
      return;
    }

    if(arr.length % 2 == 1) {
      arr.push(...arr);
    }

    if(arr.length == 2) {
      const [ dashLength, gapLength ] = arr;
      doc.dash(dashLength, { space: gapLength });
    } else {
      doc.addContent(`[${arr.join(' ')}] 0 d`);
    }
  };


  this.drawSvgLayers = function(svgElements) {
    function drawSvgPath(path) {
      const setColor = (val, rgbcb, alphacb) => {
        if(typeof val === 'string') {
          const tuple = color2tuple(val);
          if(tuple) {
            const rgb = tuple.slice(0, 3);
            const a = tuple[3];
            rgbcb(rgb);
            if(typeof a !== 'undefined') {
              alphacb(a);
            }
          }
        }
      };
    
      const setNum = (val, cb) => {
        const num = Number(val);
        if(!isNaN(num)) {
          cb(num);
        }
      };
    
      const { style } = path;
      if(style) {
        setColor(style.fill, 
          rgb => doc.fillColor(rgb),
          a   => doc.fillOpacity(a)
        );
        setColor(style.stroke, 
          rgb => doc.strokeColor(rgb),
          a   => doc.strokeOpacity(a)
        );
        setNum(style.strokeWidth, 
          w => doc.lineWidth(w)
        );
      }
        
      const svgPathStr = path.getAttribute('d');

      doc.path(svgPathStr);
      doc.fillAndStroke();
    }

    for(const svg of svgElements) {
      const gs = svg.getElementsByTagName('g');
      for(const g of gs) {
        const paths = g.getElementsByTagName('path');
        for(const path of paths) {
          drawSvgPath(path);
        }
      }
    }
  }



  /**
   * Not yet implemented
   */
  this.createPattern = function (image, repetition) {
    console.log("createPattern not implemented");
  };

  this.drawFocusRing = function () {
    console.log("drawFocusRing not implemented");
  };

  this.createImageData = function () {
    console.log("drawFocusRing not implemented");
  };

  this.getImageData = function () {
    console.log("getImageData not implemented");
  };

  this.putImageData = function () {
    console.log("putImageData not implemented");
  };

  this.globalCompositeOperation = function () {
    console.log("globalCompositeOperation not implemented");
  };

  this.end = function () {
    doc.end();
  }

};

export default PdfEventProcessor;
