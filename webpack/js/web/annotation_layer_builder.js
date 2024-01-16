
;// CONCATENATED MODULE: ./web/annotation_layer_builder.js


class AnnotationLayerBuilder {
    #onPresentationModeChanged = null;
    constructor({
      pageDiv,
      pdfPage,
      linkService,
      downloadManager,
      annotationStorage = null,
      imageResourcesPath = "",
      renderForms = true,
      enableScripting = false,
      hasJSActionsPromise = null,
      fieldObjectsPromise = null,
      annotationCanvasMap = null,
      accessibilityManager = null
    }) {
      this.pageDiv = pageDiv;
      this.pdfPage = pdfPage;
      this.linkService = linkService;
      this.downloadManager = downloadManager;
      this.imageResourcesPath = imageResourcesPath;
      this.renderForms = renderForms;
      this.annotationStorage = annotationStorage;
      this.enableScripting = enableScripting;
      this._hasJSActionsPromise = hasJSActionsPromise || Promise.resolve(false);
      this._fieldObjectsPromise = fieldObjectsPromise || Promise.resolve(null);
      this._annotationCanvasMap = annotationCanvasMap;
      this._accessibilityManager = accessibilityManager;
      this.annotationLayer = null;
      this.div = null;
      this._cancelled = false;
      this._eventBus = linkService.eventBus;
    }
    async render(viewport, intent = "display") {
      if (this.div) {
        if (this._cancelled || !this.annotationLayer) {
          return;
        }
        this.annotationLayer.update({
          viewport: viewport.clone({
            dontFlip: true
          })
        });
        return;
      }
      const [annotations, hasJSActions, fieldObjects] = await Promise.all([this.pdfPage.getAnnotations({
        intent
      }), this._hasJSActionsPromise, this._fieldObjectsPromise]);
      if (this._cancelled) {
        return;
      }
      const div = this.div = document.createElement("div");
      div.className = "annotationLayer";
      this.pageDiv.append(div);
      if (annotations.length === 0) {
        this.hide();
        return;
      }
      this.annotationLayer = new AnnotationLayer({
        div,
        accessibilityManager: this._accessibilityManager,
        annotationCanvasMap: this._annotationCanvasMap,
        page: this.pdfPage,
        viewport: viewport.clone({
          dontFlip: true
        })
      });
      await this.annotationLayer.render({
        annotations,
        imageResourcesPath: this.imageResourcesPath,
        renderForms: this.renderForms,
        linkService: this.linkService,
        downloadManager: this.downloadManager,
        annotationStorage: this.annotationStorage,
        enableScripting: this.enableScripting,
        hasJSActions,
        fieldObjects
      });
      if (this.linkService.isInPresentationMode) {
        this.#updatePresentationModeState(PresentationModeState.FULLSCREEN);
      }
      if (!this.#onPresentationModeChanged) {
        this.#onPresentationModeChanged = evt => {
          this.#updatePresentationModeState(evt.state);
        };
        this._eventBus?._on("presentationmodechanged", this.#onPresentationModeChanged);
      }
    }
    cancel() {
      this._cancelled = true;
      if (this.#onPresentationModeChanged) {
        this._eventBus?._off("presentationmodechanged", this.#onPresentationModeChanged);
        this.#onPresentationModeChanged = null;
      }
    }
    hide() {
      if (!this.div) {
        return;
      }
      this.div.hidden = true;
    }
    #updatePresentationModeState(state) {
      if (!this.div) {
        return;
      }
      let disableFormElements = false;
      switch (state) {
        case PresentationModeState.FULLSCREEN:
          disableFormElements = true;
          break;
        case PresentationModeState.NORMAL:
          break;
        default:
          return;
      }
      for (const section of this.div.childNodes) {
        if (section.hasAttribute("data-internal-link")) {
          continue;
        }
        section.inert = disableFormElements;
      }
    }
  }
  