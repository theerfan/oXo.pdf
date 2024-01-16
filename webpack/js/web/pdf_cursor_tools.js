
;// CONCATENATED MODULE: ./web/pdf_cursor_tools.js

class PDFCursorTools {
    #active = CursorTool.SELECT;
    #prevActive = null;
    constructor({
      container,
      eventBus,
      cursorToolOnLoad = CursorTool.SELECT
    }) {
      this.container = container;
      this.eventBus = eventBus;
      this.#addEventListeners();
      Promise.resolve().then(() => {
        this.switchTool(cursorToolOnLoad);
      });
    }
    get activeTool() {
      return this.#active;
    }
    switchTool(tool) {
      if (this.#prevActive !== null) {
        return;
      }
      if (tool === this.#active) {
        return;
      }
      const disableActiveTool = () => {
        switch (this.#active) {
          case CursorTool.SELECT:
            break;
          case CursorTool.HAND:
            this._handTool.deactivate();
            break;
          case CursorTool.ZOOM:
        }
      };
      switch (tool) {
        case CursorTool.SELECT:
          disableActiveTool();
          break;
        case CursorTool.HAND:
          disableActiveTool();
          this._handTool.activate();
          break;
        case CursorTool.ZOOM:
        default:
          console.error(`switchTool: "${tool}" is an unsupported value.`);
          return;
      }
      this.#active = tool;
      this.eventBus.dispatch("cursortoolchanged", {
        source: this,
        tool
      });
    }
    #addEventListeners() {
      this.eventBus._on("switchcursortool", evt => {
        this.switchTool(evt.tool);
      });
      let annotationEditorMode = AnnotationEditorType.NONE,
        presentationModeState = PresentationModeState.NORMAL;
      const disableActive = () => {
        const prevActive = this.#active;
        this.switchTool(CursorTool.SELECT);
        this.#prevActive ??= prevActive;
      };
      const enableActive = () => {
        const prevActive = this.#prevActive;
        if (prevActive !== null && annotationEditorMode === AnnotationEditorType.NONE && presentationModeState === PresentationModeState.NORMAL) {
          this.#prevActive = null;
          this.switchTool(prevActive);
        }
      };
      this.eventBus._on("secondarytoolbarreset", evt => {
        if (this.#prevActive !== null) {
          annotationEditorMode = AnnotationEditorType.NONE;
          presentationModeState = PresentationModeState.NORMAL;
          enableActive();
        }
      });
      this.eventBus._on("annotationeditormodechanged", ({
        mode
      }) => {
        annotationEditorMode = mode;
        if (mode === AnnotationEditorType.NONE) {
          enableActive();
        } else {
          disableActive();
        }
      });
      this.eventBus._on("presentationmodechanged", ({
        state
      }) => {
        presentationModeState = state;
        if (state === PresentationModeState.NORMAL) {
          enableActive();
        } else if (state === PresentationModeState.FULLSCREEN) {
          disableActive();
        }
      });
    }
    get _handTool() {
      return shadow(this, "_handTool", new GrabToPan({
        element: this.container
      }));
    }
  }
  