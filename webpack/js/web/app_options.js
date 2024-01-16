
;// CONCATENATED MODULE: ./web/app_options.js
const compatibilityParams = Object.create(null);
;
const OptionKind = {
  BROWSER: 0x01,
  VIEWER: 0x02,
  API: 0x04,
  WORKER: 0x08,
  PREFERENCE: 0x80
};
const defaultOptions = {
  canvasMaxAreaInBytes: {
    value: -1,
    kind: OptionKind.BROWSER + OptionKind.API
  },
  isInAutomation: {
    value: false,
    kind: OptionKind.BROWSER
  },
  supportsDocumentFonts: {
    value: true,
    kind: OptionKind.BROWSER
  },
  supportsIntegratedFind: {
    value: false,
    kind: OptionKind.BROWSER
  },
  supportsMouseWheelZoomCtrlKey: {
    value: true,
    kind: OptionKind.BROWSER
  },
  supportsMouseWheelZoomMetaKey: {
    value: true,
    kind: OptionKind.BROWSER
  },
  supportsPinchToZoom: {
    value: true,
    kind: OptionKind.BROWSER
  },
  annotationEditorMode: {
    value: 0,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  annotationMode: {
    value: 2,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  cursorToolOnLoad: {
    value: 0,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  defaultZoomDelay: {
    value: 400,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  defaultZoomValue: {
    value: "",
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  disableHistory: {
    value: false,
    kind: OptionKind.VIEWER
  },
  disablePageLabels: {
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  enablePermissions: {
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  enablePrintAutoRotate: {
    value: true,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  enableScripting: {
    value: true,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  externalLinkRel: {
    value: "noopener noreferrer nofollow",
    kind: OptionKind.VIEWER
  },
  externalLinkTarget: {
    value: 0,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  historyUpdateUrl: {
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  ignoreDestinationZoom: {
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  imageResourcesPath: {
    value: "resource://pdf.js/web/images/",
    kind: OptionKind.VIEWER
  },
  maxCanvasPixels: {
    value: 16777216,
    kind: OptionKind.VIEWER
  },
  forcePageColors: {
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  pageColorsBackground: {
    value: "Canvas",
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  pageColorsForeground: {
    value: "CanvasText",
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  pdfBugEnabled: {
    value: false,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  printResolution: {
    value: 150,
    kind: OptionKind.VIEWER
  },
  sidebarViewOnLoad: {
    value: -1,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  scrollModeOnLoad: {
    value: -1,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  spreadModeOnLoad: {
    value: -1,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  textLayerMode: {
    value: 1,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  viewOnLoad: {
    value: 0,
    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
  },
  cMapPacked: {
    value: true,
    kind: OptionKind.API
  },
  cMapUrl: {
    value: "resource://pdf.js/web/cmaps/",
    kind: OptionKind.API
  },
  disableAutoFetch: {
    value: false,
    kind: OptionKind.API + OptionKind.PREFERENCE
  },
  disableFontFace: {
    value: false,
    kind: OptionKind.API + OptionKind.PREFERENCE
  },
  disableRange: {
    value: false,
    kind: OptionKind.API + OptionKind.PREFERENCE
  },
  disableStream: {
    value: false,
    kind: OptionKind.API + OptionKind.PREFERENCE
  },
  docBaseUrl: {
    value: "",
    kind: OptionKind.API
  },
  enableXfa: {
    value: true,
    kind: OptionKind.API + OptionKind.PREFERENCE
  },
  fontExtraProperties: {
    value: false,
    kind: OptionKind.API
  },
  isEvalSupported: {
    value: true,
    kind: OptionKind.API
  },
  isOffscreenCanvasSupported: {
    value: true,
    kind: OptionKind.API
  },
  maxImageSize: {
    value: -1,
    kind: OptionKind.API
  },
  pdfBug: {
    value: false,
    kind: OptionKind.API
  },
  standardFontDataUrl: {
    value: "resource://pdf.js/web/standard_fonts/",
    kind: OptionKind.API
  },
  verbosity: {
    value: 1,
    kind: OptionKind.API
  },
  workerPort: {
    value: null,
    kind: OptionKind.WORKER
  },
  workerSrc: {
    value: "js/pdf.worker.mjs",
    kind: OptionKind.WORKER
  }
};
;
const userOptions = Object.create(null);
class AppOptions {
  constructor() {
    throw new Error("Cannot initialize AppOptions.");
  }
  static get(name) {
    const userOption = userOptions[name];
    if (userOption !== undefined) {
      return userOption;
    }
    const defaultOption = defaultOptions[name];
    if (defaultOption !== undefined) {
      return compatibilityParams[name] ?? defaultOption.value;
    }
    return undefined;
  }
  static getAll(kind = null) {
    const options = Object.create(null);
    for (const name in defaultOptions) {
      const defaultOption = defaultOptions[name];
      if (kind) {
        if (!(kind & defaultOption.kind)) {
          continue;
        }
      }
      const userOption = userOptions[name];
      options[name] = userOption !== undefined ? userOption : compatibilityParams[name] ?? defaultOption.value;
    }
    return options;
  }
  static set(name, value) {
    userOptions[name] = value;
  }
  static setAll(options, init = false) {
    for (const name in options) {
      userOptions[name] = options[name];
    }
  }
  static remove(name) {
    delete userOptions[name];
  }
}
