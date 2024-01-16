
;// CONCATENATED MODULE: ./web/text_layer_builder.js


class TextLayerBuilder {
    #enablePermissions = false;
    #rotation = 0;
    #scale = 0;
    #textContentSource = null;
    constructor({
      highlighter = null,
      accessibilityManager = null,
      isOffscreenCanvasSupported = true,
      enablePermissions = false
    }) {
      this.textContentItemsStr = [];
      this.renderingDone = false;
      this.textDivs = [];
      this.textDivProperties = new WeakMap();
      this.textLayerRenderTask = null;
      this.highlighter = highlighter;
      this.accessibilityManager = accessibilityManager;
      this.isOffscreenCanvasSupported = isOffscreenCanvasSupported;
      this.#enablePermissions = enablePermissions === true;
      this.onAppend = null;
      this.div = document.createElement("div");
      this.div.className = "textLayer";
    }
    #finishRendering() {
      this.renderingDone = true;
      const endOfContent = document.createElement("div");
      endOfContent.className = "endOfContent";
      this.div.append(endOfContent);
      this.#bindMouse();
    }
    get numTextDivs() {
      return this.textDivs.length;
    }
    async render(viewport) {
      if (!this.#textContentSource) {
        throw new Error('No "textContentSource" parameter specified.');
      }
      const scale = viewport.scale * (globalThis.devicePixelRatio || 1);
      const {
        rotation
      } = viewport;
      if (this.renderingDone) {
        const mustRotate = rotation !== this.#rotation;
        const mustRescale = scale !== this.#scale;
        if (mustRotate || mustRescale) {
          this.hide();
          updateTextLayer({
            container: this.div,
            viewport,
            textDivs: this.textDivs,
            textDivProperties: this.textDivProperties,
            isOffscreenCanvasSupported: this.isOffscreenCanvasSupported,
            mustRescale,
            mustRotate
          });
          this.#scale = scale;
          this.#rotation = rotation;
        }
        this.show();
        return;
      }
      this.cancel();
      this.highlighter?.setTextMapping(this.textDivs, this.textContentItemsStr);
      this.accessibilityManager?.setTextMapping(this.textDivs);
      this.textLayerRenderTask = renderTextLayer({
        textContentSource: this.#textContentSource,
        container: this.div,
        viewport,
        textDivs: this.textDivs,
        textDivProperties: this.textDivProperties,
        textContentItemsStr: this.textContentItemsStr,
        isOffscreenCanvasSupported: this.isOffscreenCanvasSupported
      });
      await this.textLayerRenderTask.promise;
      this.#finishRendering();
      this.#scale = scale;
      this.#rotation = rotation;
      this.onAppend(this.div);
      this.highlighter?.enable();
      this.accessibilityManager?.enable();
    }
    hide() {
      if (!this.div.hidden && this.renderingDone) {
        this.highlighter?.disable();
        this.div.hidden = true;
      }
    }
    show() {
      if (this.div.hidden && this.renderingDone) {
        this.div.hidden = false;
        this.highlighter?.enable();
      }
    }
    cancel() {
      if (this.textLayerRenderTask) {
        this.textLayerRenderTask.cancel();
        this.textLayerRenderTask = null;
      }
      this.highlighter?.disable();
      this.accessibilityManager?.disable();
      this.textContentItemsStr.length = 0;
      this.textDivs.length = 0;
      this.textDivProperties = new WeakMap();
    }
    setTextContentSource(source) {
      this.cancel();
      this.#textContentSource = source;
    }
    #bindMouse() {
      const {
        div
      } = this;
      div.addEventListener("mousedown", evt => {
        const end = div.querySelector(".endOfContent");
        if (!end) {
          return;
        }
        end.classList.add("active");
      });
      div.addEventListener("mouseup", () => {
        const end = div.querySelector(".endOfContent");
        if (!end) {
          return;
        }
        end.classList.remove("active");
      });
      div.addEventListener("copy", event => {
        if (!this.#enablePermissions) {
          const selection = document.getSelection();
          event.clipboardData.setData("text/plain", removeNullCharacters(normalizeUnicode(selection.toString())));
        }
        event.preventDefault();
        event.stopPropagation();
      });
    }
  }
  