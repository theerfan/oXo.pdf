

;// CONCATENATED MODULE: ./web/annotation_editor_layer_builder.js


class AnnotationEditorLayerBuilder {
    #annotationLayer = null;
    #uiManager;
    constructor(options) {
      this.pageDiv = options.pageDiv;
      this.pdfPage = options.pdfPage;
      this.accessibilityManager = options.accessibilityManager;
      this.l10n = options.l10n || NullL10n;
      this.annotationEditorLayer = null;
      this.div = null;
      this._cancelled = false;
      this.#uiManager = options.uiManager;
      this.#annotationLayer = options.annotationLayer || null;
    }
    async render(viewport, intent = "display") {
      if (intent !== "display") {
        return;
      }
      if (this._cancelled) {
        return;
      }
      const clonedViewport = viewport.clone({
        dontFlip: true
      });
      if (this.div) {
        this.annotationEditorLayer.update({
          viewport: clonedViewport
        });
        this.show();
        return;
      }
      const div = this.div = document.createElement("div");
      div.className = "annotationEditorLayer";
      div.tabIndex = 0;
      div.hidden = true;
      div.dir = this.#uiManager.direction;
      this.pageDiv.append(div);
      this.annotationEditorLayer = new AnnotationEditorLayer({
        uiManager: this.#uiManager,
        div,
        accessibilityManager: this.accessibilityManager,
        pageIndex: this.pdfPage.pageNumber - 1,
        l10n: this.l10n,
        viewport: clonedViewport,
        annotationLayer: this.#annotationLayer
      });
      const parameters = {
        viewport: clonedViewport,
        div,
        annotations: null,
        intent
      };
      this.annotationEditorLayer.render(parameters);
      this.show();
    }
    cancel() {
      this._cancelled = true;
      if (!this.div) {
        return;
      }
      this.pageDiv = null;
      this.annotationEditorLayer.destroy();
      this.div.remove();
    }
    hide() {
      if (!this.div) {
        return;
      }
      this.div.hidden = true;
    }
    show() {
      if (!this.div || this.annotationEditorLayer.isEmpty) {
        return;
      }
      this.div.hidden = false;
    }
  }
  