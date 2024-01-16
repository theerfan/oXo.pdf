
;// CONCATENATED MODULE: ./web/preferences.js

class BasePreferences {
    #defaults = Object.freeze({
      "annotationEditorMode": 0,
      "annotationMode": 2,
      "cursorToolOnLoad": 0,
      "defaultZoomDelay": 400,
      "defaultZoomValue": "",
      "disablePageLabels": false,
      "enablePermissions": false,
      "enablePrintAutoRotate": true,
      "enableScripting": true,
      "externalLinkTarget": 0,
      "historyUpdateUrl": false,
      "ignoreDestinationZoom": false,
      "forcePageColors": false,
      "pageColorsBackground": "Canvas",
      "pageColorsForeground": "CanvasText",
      "pdfBugEnabled": false,
      "sidebarViewOnLoad": -1,
      "scrollModeOnLoad": -1,
      "spreadModeOnLoad": -1,
      "textLayerMode": 1,
      "viewOnLoad": 0,
      "disableAutoFetch": false,
      "disableFontFace": false,
      "disableRange": false,
      "disableStream": false,
      "enableXfa": true
    });
    #prefs = Object.create(null);
    #initializedPromise = null;
    constructor() {
      if (this.constructor === BasePreferences) {
        throw new Error("Cannot initialize BasePreferences.");
      }
      this.#initializedPromise = this._readFromStorage(this.#defaults).then(({
        browserPrefs,
        prefs
      }) => {
        const BROWSER_PREFS = {
          "canvasMaxAreaInBytes": -1,
          "isInAutomation": false,
          "supportsDocumentFonts": true,
          "supportsIntegratedFind": false,
          "supportsMouseWheelZoomCtrlKey": true,
          "supportsMouseWheelZoomMetaKey": true,
          "supportsPinchToZoom": true
        };
        const options = Object.create(null);
        for (const [name, defaultVal] of Object.entries(BROWSER_PREFS)) {
          const prefVal = browserPrefs?.[name];
          options[name] = typeof prefVal === typeof defaultVal ? prefVal : defaultVal;
        }
        for (const [name, defaultVal] of Object.entries(this.#defaults)) {
          const prefVal = prefs?.[name];
          options[name] = this.#prefs[name] = typeof prefVal === typeof defaultVal ? prefVal : defaultVal;
        }
        AppOptions.setAll(options, true);
      });
    }
    async _writeToStorage(prefObj) {
      throw new Error("Not implemented: _writeToStorage");
    }
    async _readFromStorage(prefObj) {
      throw new Error("Not implemented: _readFromStorage");
    }
    async reset() {
      throw new Error("Please use `about:config` to change preferences.");
    }
    async set(name, value) {
      throw new Error("Please use `about:config` to change preferences.");
    }
    async get(name) {
      await this.#initializedPromise;
      const defaultValue = this.#defaults[name];
      if (defaultValue === undefined) {
        throw new Error(`Get preference: "${name}" is undefined.`);
      }
      return this.#prefs[name] ?? defaultValue;
    }
    get initializedPromise() {
      return this.#initializedPromise;
    }
  }
  