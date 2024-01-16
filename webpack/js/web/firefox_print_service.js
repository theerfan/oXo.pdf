
;// CONCATENATED MODULE: ./web/firefox_print_service.js

function composePage(pdfDocument, pageNumber, size, printContainer, printResolution, optionalContentConfigPromise, printAnnotationStoragePromise) {
    const canvas = document.createElement("canvas");
    const PRINT_UNITS = printResolution / PixelsPerInch.PDF;
    canvas.width = Math.floor(size.width * PRINT_UNITS);
    canvas.height = Math.floor(size.height * PRINT_UNITS);
    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "printedPage";
    canvasWrapper.append(canvas);
    printContainer.append(canvasWrapper);
    let currentRenderTask = null;
    canvas.mozPrintCallback = function (obj) {
      const ctx = obj.context;
      ctx.save();
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      let thisRenderTask = null;
      Promise.all([pdfDocument.getPage(pageNumber), printAnnotationStoragePromise]).then(function ([pdfPage, printAnnotationStorage]) {
        if (currentRenderTask) {
          currentRenderTask.cancel();
          currentRenderTask = null;
        }
        const renderContext = {
          canvasContext: ctx,
          transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
          viewport: pdfPage.getViewport({
            scale: 1,
            rotation: size.rotation
          }),
          intent: "print",
          annotationMode: AnnotationMode.ENABLE_STORAGE,
          optionalContentConfigPromise,
          printAnnotationStorage
        };
        currentRenderTask = thisRenderTask = pdfPage.render(renderContext);
        return thisRenderTask.promise;
      }).then(function () {
        if (currentRenderTask === thisRenderTask) {
          currentRenderTask = null;
        }
        obj.done();
      }, function (reason) {
        if (!(reason instanceof RenderingCancelledException)) {
          console.error(reason);
        }
        if (currentRenderTask === thisRenderTask) {
          currentRenderTask.cancel();
          currentRenderTask = null;
        }
        if ("abort" in obj) {
          obj.abort();
        } else {
          obj.done();
        }
      });
    };
  }
  class FirefoxPrintService {
    constructor(pdfDocument, pagesOverview, printContainer, printResolution, optionalContentConfigPromise = null, printAnnotationStoragePromise = null) {
      this.pdfDocument = pdfDocument;
      this.pagesOverview = pagesOverview;
      this.printContainer = printContainer;
      this._printResolution = printResolution || 150;
      this._optionalContentConfigPromise = optionalContentConfigPromise || pdfDocument.getOptionalContentConfig();
      this._printAnnotationStoragePromise = printAnnotationStoragePromise || Promise.resolve();
    }
    layout() {
      const {
        pdfDocument,
        pagesOverview,
        printContainer,
        _printResolution,
        _optionalContentConfigPromise,
        _printAnnotationStoragePromise
      } = this;
      const body = document.querySelector("body");
      body.setAttribute("data-pdfjsprinting", true);
      const {
        width,
        height
      } = this.pagesOverview[0];
      const hasEqualPageSizes = this.pagesOverview.every(size => size.width === width && size.height === height);
      if (!hasEqualPageSizes) {
        console.warn("Not all pages have the same size. The printed result may be incorrect!");
      }
      this.pageStyleSheet = document.createElement("style");
      this.pageStyleSheet.textContent = `@page { size: ${width}pt ${height}pt;}`;
      body.append(this.pageStyleSheet);
      if (pdfDocument.isPureXfa) {
        getXfaHtmlForPrinting(printContainer, pdfDocument);
        return;
      }
      for (let i = 0, ii = pagesOverview.length; i < ii; ++i) {
        composePage(pdfDocument, i + 1, pagesOverview[i], printContainer, _printResolution, _optionalContentConfigPromise, _printAnnotationStoragePromise);
      }
    }
    destroy() {
      this.printContainer.textContent = "";
      const body = document.querySelector("body");
      body.removeAttribute("data-pdfjsprinting");
      if (this.pageStyleSheet) {
        this.pageStyleSheet.remove();
        this.pageStyleSheet = null;
      }
    }
  }
  PDFPrintServiceFactory.instance = {
    get supportsPrinting() {
      const canvas = document.createElement("canvas");
      const value = ("mozPrintCallback" in canvas);
      return shadow(this, "supportsPrinting", value);
    },
    createPrintService(pdfDocument, pagesOverview, printContainer, printResolution, optionalContentConfigPromise, printAnnotationStoragePromise) {
      return new FirefoxPrintService(pdfDocument, pagesOverview, printContainer, printResolution, optionalContentConfigPromise, printAnnotationStoragePromise);
    }
  };
  