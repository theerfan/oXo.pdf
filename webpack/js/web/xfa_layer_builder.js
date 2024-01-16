
;// CONCATENATED MODULE: ./web/xfa_layer_builder.js

class XfaLayerBuilder {
    constructor({
      pdfPage,
      annotationStorage = null,
      linkService,
      xfaHtml = null
    }) {
      this.pdfPage = pdfPage;
      this.annotationStorage = annotationStorage;
      this.linkService = linkService;
      this.xfaHtml = xfaHtml;
      this.div = null;
      this._cancelled = false;
    }
    async render(viewport, intent = "display") {
      if (intent === "print") {
        const parameters = {
          viewport: viewport.clone({
            dontFlip: true
          }),
          div: this.div,
          xfaHtml: this.xfaHtml,
          annotationStorage: this.annotationStorage,
          linkService: this.linkService,
          intent
        };
        this.div = document.createElement("div");
        parameters.div = this.div;
        return XfaLayer.render(parameters);
      }
      const xfaHtml = await this.pdfPage.getXfa();
      if (this._cancelled || !xfaHtml) {
        return {
          textDivs: []
        };
      }
      const parameters = {
        viewport: viewport.clone({
          dontFlip: true
        }),
        div: this.div,
        xfaHtml,
        annotationStorage: this.annotationStorage,
        linkService: this.linkService,
        intent
      };
      if (this.div) {
        return XfaLayer.update(parameters);
      }
      this.div = document.createElement("div");
      parameters.div = this.div;
      return XfaLayer.render(parameters);
    }
    cancel() {
      this._cancelled = true;
    }
    hide() {
      if (!this.div) {
        return;
      }
      this.div.hidden = true;
    }
  }
  