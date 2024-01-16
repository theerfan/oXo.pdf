
;// CONCATENATED MODULE: ./web/pdf_scripting_manager.js


class PDFScriptingManager {
    #closeCapability = null;
    #destroyCapability = null;
    #docProperties = null;
    #eventBus = null;
    #externalServices = null;
    #pdfDocument = null;
    #pdfViewer = null;
    #ready = false;
    #sandboxBundleSrc = null;
    #scripting = null;
    #willPrintCapability = null;
    constructor({
      eventBus,
      sandboxBundleSrc = null,
      externalServices = null,
      docProperties = null
    }) {
      this.#eventBus = eventBus;
      this.#externalServices = externalServices;
      this.#docProperties = docProperties;
    }
    setViewer(pdfViewer) {
      this.#pdfViewer = pdfViewer;
    }
    async setDocument(pdfDocument) {
      if (this.#pdfDocument) {
        await this.#destroyScripting();
      }
      this.#pdfDocument = pdfDocument;
      if (!pdfDocument) {
        return;
      }
      const [objects, calculationOrder, docActions] = await Promise.all([pdfDocument.getFieldObjects(), pdfDocument.getCalculationOrderIds(), pdfDocument.getJSActions()]);
      if (!objects && !docActions) {
        await this.#destroyScripting();
        return;
      }
      if (pdfDocument !== this.#pdfDocument) {
        return;
      }
      try {
        this.#scripting = this.#initScripting();
      } catch (error) {
        console.error(`setDocument: "${error.message}".`);
        await this.#destroyScripting();
        return;
      }
      this._internalEvents.set("updatefromsandbox", event => {
        if (event?.source === window) {
          this.#updateFromSandbox(event.detail);
        }
      });
      this._internalEvents.set("dispatcheventinsandbox", event => {
        this.#scripting?.dispatchEventInSandbox(event.detail);
      });
      this._internalEvents.set("pagechanging", ({
        pageNumber,
        previous
      }) => {
        if (pageNumber === previous) {
          return;
        }
        this.#dispatchPageClose(previous);
        this.#dispatchPageOpen(pageNumber);
      });
      this._internalEvents.set("pagerendered", ({
        pageNumber
      }) => {
        if (!this._pageOpenPending.has(pageNumber)) {
          return;
        }
        if (pageNumber !== this.#pdfViewer.currentPageNumber) {
          return;
        }
        this.#dispatchPageOpen(pageNumber);
      });
      this._internalEvents.set("pagesdestroy", async () => {
        await this.#dispatchPageClose(this.#pdfViewer.currentPageNumber);
        await this.#scripting?.dispatchEventInSandbox({
          id: "doc",
          name: "WillClose"
        });
        this.#closeCapability?.resolve();
      });
      for (const [name, listener] of this._internalEvents) {
        this.#eventBus._on(name, listener);
      }
      try {
        const docProperties = await this.#docProperties(pdfDocument);
        if (pdfDocument !== this.#pdfDocument) {
          return;
        }
        await this.#scripting.createSandbox({
          objects,
          calculationOrder,
          appInfo: {
            platform: navigator.platform,
            language: navigator.language
          },
          docInfo: {
            ...docProperties,
            actions: docActions
          }
        });
        this.#eventBus.dispatch("sandboxcreated", {
          source: this
        });
      } catch (error) {
        console.error(`setDocument: "${error.message}".`);
        await this.#destroyScripting();
        return;
      }
      await this.#scripting?.dispatchEventInSandbox({
        id: "doc",
        name: "Open"
      });
      await this.#dispatchPageOpen(this.#pdfViewer.currentPageNumber, true);
      Promise.resolve().then(() => {
        if (pdfDocument === this.#pdfDocument) {
          this.#ready = true;
        }
      });
    }
    async dispatchWillSave() {
      return this.#scripting?.dispatchEventInSandbox({
        id: "doc",
        name: "WillSave"
      });
    }
    async dispatchDidSave() {
      return this.#scripting?.dispatchEventInSandbox({
        id: "doc",
        name: "DidSave"
      });
    }
    async dispatchWillPrint() {
      if (!this.#scripting) {
        return;
      }
      await this.#willPrintCapability?.promise;
      this.#willPrintCapability = new PromiseCapability();
      try {
        await this.#scripting.dispatchEventInSandbox({
          id: "doc",
          name: "WillPrint"
        });
      } catch (ex) {
        this.#willPrintCapability.resolve();
        this.#willPrintCapability = null;
        throw ex;
      }
      await this.#willPrintCapability.promise;
    }
    async dispatchDidPrint() {
      return this.#scripting?.dispatchEventInSandbox({
        id: "doc",
        name: "DidPrint"
      });
    }
    get destroyPromise() {
      return this.#destroyCapability?.promise || null;
    }
    get ready() {
      return this.#ready;
    }
    get _internalEvents() {
      return shadow(this, "_internalEvents", new Map());
    }
    get _pageOpenPending() {
      return shadow(this, "_pageOpenPending", new Set());
    }
    get _visitedPages() {
      return shadow(this, "_visitedPages", new Map());
    }
    async #updateFromSandbox(detail) {
      const pdfViewer = this.#pdfViewer;
      const isInPresentationMode = pdfViewer.isInPresentationMode || pdfViewer.isChangingPresentationMode;
      const {
        id,
        siblings,
        command,
        value
      } = detail;
      if (!id) {
        switch (command) {
          case "clear":
            console.clear();
            break;
          case "error":
            console.error(value);
            break;
          case "layout":
            if (!isInPresentationMode) {
              const modes = apiPageLayoutToViewerModes(value);
              pdfViewer.spreadMode = modes.spreadMode;
            }
            break;
          case "page-num":
            pdfViewer.currentPageNumber = value + 1;
            break;
          case "print":
            await pdfViewer.pagesPromise;
            this.#eventBus.dispatch("print", {
              source: this
            });
            break;
          case "println":
            console.log(value);
            break;
          case "zoom":
            if (!isInPresentationMode) {
              pdfViewer.currentScaleValue = value;
            }
            break;
          case "SaveAs":
            this.#eventBus.dispatch("download", {
              source: this
            });
            break;
          case "FirstPage":
            pdfViewer.currentPageNumber = 1;
            break;
          case "LastPage":
            pdfViewer.currentPageNumber = pdfViewer.pagesCount;
            break;
          case "NextPage":
            pdfViewer.nextPage();
            break;
          case "PrevPage":
            pdfViewer.previousPage();
            break;
          case "ZoomViewIn":
            if (!isInPresentationMode) {
              pdfViewer.increaseScale();
            }
            break;
          case "ZoomViewOut":
            if (!isInPresentationMode) {
              pdfViewer.decreaseScale();
            }
            break;
          case "WillPrintFinished":
            this.#willPrintCapability?.resolve();
            this.#willPrintCapability = null;
            break;
        }
        return;
      }
      if (isInPresentationMode && detail.focus) {
        return;
      }
      delete detail.id;
      delete detail.siblings;
      const ids = siblings ? [id, ...siblings] : [id];
      for (const elementId of ids) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
          element.dispatchEvent(new CustomEvent("updatefromsandbox", {
            detail
          }));
        } else {
          this.#pdfDocument?.annotationStorage.setValue(elementId, detail);
        }
      }
    }
    async #dispatchPageOpen(pageNumber, initialize = false) {
      const pdfDocument = this.#pdfDocument,
        visitedPages = this._visitedPages;
      if (initialize) {
        this.#closeCapability = new PromiseCapability();
      }
      if (!this.#closeCapability) {
        return;
      }
      const pageView = this.#pdfViewer.getPageView(pageNumber - 1);
      if (pageView?.renderingState !== RenderingStates.FINISHED) {
        this._pageOpenPending.add(pageNumber);
        return;
      }
      this._pageOpenPending.delete(pageNumber);
      const actionsPromise = (async () => {
        const actions = await (!visitedPages.has(pageNumber) ? pageView.pdfPage?.getJSActions() : null);
        if (pdfDocument !== this.#pdfDocument) {
          return;
        }
        await this.#scripting?.dispatchEventInSandbox({
          id: "page",
          name: "PageOpen",
          pageNumber,
          actions
        });
      })();
      visitedPages.set(pageNumber, actionsPromise);
    }
    async #dispatchPageClose(pageNumber) {
      const pdfDocument = this.#pdfDocument,
        visitedPages = this._visitedPages;
      if (!this.#closeCapability) {
        return;
      }
      if (this._pageOpenPending.has(pageNumber)) {
        return;
      }
      const actionsPromise = visitedPages.get(pageNumber);
      if (!actionsPromise) {
        return;
      }
      visitedPages.set(pageNumber, null);
      await actionsPromise;
      if (pdfDocument !== this.#pdfDocument) {
        return;
      }
      await this.#scripting?.dispatchEventInSandbox({
        id: "page",
        name: "PageClose",
        pageNumber
      });
    }
    #initScripting() {
      this.#destroyCapability = new PromiseCapability();
      if (this.#scripting) {
        throw new Error("#initScripting: Scripting already exists.");
      }
      return this.#externalServices.createScripting({
        sandboxBundleSrc: this.#sandboxBundleSrc
      });
    }
    async #destroyScripting() {
      if (!this.#scripting) {
        this.#pdfDocument = null;
        this.#destroyCapability?.resolve();
        return;
      }
      if (this.#closeCapability) {
        await Promise.race([this.#closeCapability.promise, new Promise(resolve => {
          setTimeout(resolve, 1000);
        })]).catch(() => { });
        this.#closeCapability = null;
      }
      this.#pdfDocument = null;
      try {
        await this.#scripting.destroySandbox();
      } catch { }
      this.#willPrintCapability?.reject(new Error("Scripting destroyed."));
      this.#willPrintCapability = null;
      for (const [name, listener] of this._internalEvents) {
        this.#eventBus._off(name, listener);
      }
      this._internalEvents.clear();
      this._pageOpenPending.clear();
      this._visitedPages.clear();
      this.#scripting = null;
      this.#ready = false;
      this.#destroyCapability?.resolve();
    }
  }
  