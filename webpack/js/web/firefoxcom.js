
;// CONCATENATED MODULE: ./web/firefoxcom.js


;
class FirefoxCom {
  static requestSync(action, data) {
    const request = document.createTextNode("");
    document.documentElement.append(request);
    const sender = new CustomEvent("pdf.js.message", {
      bubbles: true,
      cancelable: false,
      detail: {
        action,
        data,
        sync: true
      }
    });
    request.dispatchEvent(sender);
    const response = sender.detail.response;
    request.remove();
    return response;
  }
  static requestAsync(action, data) {
    return new Promise(resolve => {
      this.request(action, data, resolve);
    });
  }
  static request(action, data, callback = null) {
    const request = document.createTextNode("");
    if (callback) {
      request.addEventListener("pdf.js.response", event => {
        const response = event.detail.response;
        event.target.remove();
        callback(response);
      }, {
        once: true
      });
    }
    document.documentElement.append(request);
    const sender = new CustomEvent("pdf.js.message", {
      bubbles: true,
      cancelable: false,
      detail: {
        action,
        data,
        sync: false,
        responseExpected: !!callback
      }
    });
    request.dispatchEvent(sender);
  }
}
class DownloadManager {
  #openBlobUrls = new WeakMap();
  downloadUrl(url, filename, options = {}) {
    FirefoxCom.request("download", {
      originalUrl: url,
      filename,
      options
    });
  }
  downloadData(data, filename, contentType) {
    const blobUrl = URL.createObjectURL(new Blob([data], {
      type: contentType
    }));
    FirefoxCom.request("download", {
      blobUrl,
      originalUrl: blobUrl,
      filename,
      isAttachment: true
    });
  }
  openOrDownloadData(data, filename, dest = null) {
    const isPdfData = isPdfFile(filename);
    const contentType = isPdfData ? "application/pdf" : "";
    if (isPdfData) {
      let blobUrl = this.#openBlobUrls.get(data);
      if (!blobUrl) {
        blobUrl = URL.createObjectURL(new Blob([data], {
          type: contentType
        }));
        this.#openBlobUrls.set(data, blobUrl);
      }
      let viewerUrl = blobUrl + "?filename=" + encodeURIComponent(filename);
      if (dest) {
        viewerUrl += `#${escape(dest)}`;
      }
      try {
        window.open(viewerUrl);
        return true;
      } catch (ex) {
        console.error(`openOrDownloadData: ${ex}`);
        URL.revokeObjectURL(blobUrl);
        this.#openBlobUrls.delete(data);
      }
    }
    this.downloadData(data, filename, contentType);
    return false;
  }
  download(blob, url, filename, options = {}) {
    const blobUrl = URL.createObjectURL(blob);
    FirefoxCom.request("download", {
      blobUrl,
      originalUrl: url,
      filename,
      options
    });
  }
}
class FirefoxPreferences extends BasePreferences {
  async _readFromStorage(prefObj) {
    return FirefoxCom.requestAsync("getPreferences", prefObj);
  }
}
(function listenFindEvents() {
  const events = ["find", "findagain", "findhighlightallchange", "findcasesensitivitychange", "findentirewordchange", "findbarclose", "finddiacriticmatchingchange"];
  const findLen = "find".length;
  const handleEvent = function ({
    type,
    detail
  }) {
    if (!PDFViewerApplication.initialized) {
      return;
    }
    if (type === "findbarclose") {
      PDFViewerApplication.eventBus.dispatch(type, {
        source: window
      });
      return;
    }
    PDFViewerApplication.eventBus.dispatch("find", {
      source: window,
      type: type.substring(findLen),
      query: detail.query,
      caseSensitive: !!detail.caseSensitive,
      entireWord: !!detail.entireWord,
      highlightAll: !!detail.highlightAll,
      findPrevious: !!detail.findPrevious,
      matchDiacritics: !!detail.matchDiacritics
    });
  };
  for (const event of events) {
    window.addEventListener(event, handleEvent);
  }
})();
(function listenZoomEvents() {
  const events = ["zoomin", "zoomout", "zoomreset"];
  const handleEvent = function ({
    type,
    detail
  }) {
    if (!PDFViewerApplication.initialized) {
      return;
    }
    if (type === "zoomreset" && PDFViewerApplication.pdfViewer.currentScaleValue === DEFAULT_SCALE_VALUE) {
      return;
    }
    PDFViewerApplication.eventBus.dispatch(type, {
      source: window
    });
  };
  for (const event of events) {
    window.addEventListener(event, handleEvent);
  }
})();
(function listenSaveEvent() {
  const handleEvent = function ({
    type,
    detail
  }) {
    if (!PDFViewerApplication.initialized) {
      return;
    }
    PDFViewerApplication.eventBus.dispatch("download", {
      source: window
    });
  };
  window.addEventListener("save", handleEvent);
})();
(function listenEditingEvent() {
  const handleEvent = function ({
    detail
  }) {
    if (!PDFViewerApplication.initialized) {
      return;
    }
    PDFViewerApplication.eventBus.dispatch("editingaction", {
      source: window,
      name: detail.name
    });
  };
  window.addEventListener("editingaction", handleEvent);
})();
;
class FirefoxComDataRangeTransport extends PDFDataRangeTransport {
  requestDataRange(begin, end) {
    FirefoxCom.request("requestDataRange", {
      begin,
      end
    });
  }
  abort() {
    FirefoxCom.requestSync("abortLoading", null);
  }
}
class FirefoxScripting {
  static async createSandbox(data) {
    const success = await FirefoxCom.requestAsync("createSandbox", data);
    if (!success) {
      throw new Error("Cannot create sandbox.");
    }
  }
  static async dispatchEventInSandbox(event) {
    FirefoxCom.request("dispatchEventInSandbox", event);
  }
  static async destroySandbox() {
    FirefoxCom.request("destroySandbox", null);
  }
}
class FirefoxExternalServices extends DefaultExternalServices {
  static updateFindControlState(data) {
    FirefoxCom.request("updateFindControlState", data);
  }
  static updateFindMatchesCount(data) {
    FirefoxCom.request("updateFindMatchesCount", data);
  }
  static initPassiveLoading(callbacks) {
    let pdfDataRangeTransport;
    window.addEventListener("message", function windowMessage(e) {
      if (e.source !== null) {
        console.warn("Rejected untrusted message from " + e.origin);
        return;
      }
      const args = e.data;
      if (typeof args !== "object" || !("pdfjsLoadAction" in args)) {
        return;
      }
      switch (args.pdfjsLoadAction) {
        case "supportsRangedLoading":
          if (args.done && !args.data) {
            callbacks.onError();
            break;
          }
          pdfDataRangeTransport = new FirefoxComDataRangeTransport(args.length, args.data, args.done, args.filename);
          callbacks.onOpenWithTransport(pdfDataRangeTransport);
          break;
        case "range":
          pdfDataRangeTransport.onDataRange(args.begin, args.chunk);
          break;
        case "rangeProgress":
          pdfDataRangeTransport.onDataProgress(args.loaded);
          break;
        case "progressiveRead":
          pdfDataRangeTransport.onDataProgressiveRead(args.chunk);
          pdfDataRangeTransport.onDataProgress(args.loaded, args.total);
          break;
        case "progressiveDone":
          pdfDataRangeTransport?.onDataProgressiveDone();
          break;
        case "progress":
          callbacks.onProgress(args.loaded, args.total);
          break;
        case "complete":
          if (!args.data) {
            callbacks.onError(args.errorCode);
            break;
          }
          callbacks.onOpenWithData(args.data, args.filename);
          break;
      }
    });
    FirefoxCom.requestSync("initPassiveLoading", null);
  }
  static reportTelemetry(data) {
    FirefoxCom.request("reportTelemetry", JSON.stringify(data));
  }
  static createDownloadManager() {
    return new DownloadManager();
  }
  static createPreferences() {
    return new FirefoxPreferences();
  }
  static updateEditorStates(data) {
    FirefoxCom.request("updateEditorStates", data);
  }
  static async createL10n() {
    const [localeProperties] = await Promise.all([FirefoxCom.requestAsync("getLocaleProperties", null), document.l10n.ready]);
    return new L10n(localeProperties, document.l10n);
  }
  static createScripting(options) {
    return FirefoxScripting;
  }
  static async getNimbusExperimentData() {
    const nimbusData = await FirefoxCom.requestAsync("getNimbusExperimentData", null);
    return nimbusData && JSON.parse(nimbusData);
  }
}
PDFViewerApplication.externalServices = FirefoxExternalServices;
