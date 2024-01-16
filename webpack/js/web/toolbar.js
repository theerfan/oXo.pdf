
;// CONCATENATED MODULE: ./web/toolbar.js


const PAGE_NUMBER_LOADING_INDICATOR = "visiblePageIsLoading";
class Toolbar {
  constructor(options, eventBus) {
    this.toolbar = options.container;
    this.eventBus = eventBus;
    this.buttons = [{
      element: options.previous,
      eventName: "previouspage"
    }, {
      element: options.next,
      eventName: "nextpage"
    }, {
      element: options.zoomIn,
      eventName: "zoomin"
    }, {
      element: options.zoomOut,
      eventName: "zoomout"
    }, {
      element: options.print,
      eventName: "print"
    },
    {
      element: options.crop,
      eventName: "crop"
    }, {
      element: options.download,
      eventName: "download"
    }, {
      element: options.editorFreeTextButton,
      eventName: "switchannotationeditormode",
      eventDetails: {
        get mode() {
          const {
            classList
          } = options.editorFreeTextButton;
          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.FREETEXT;
        }
      }
    }, {
      element: options.editorInkButton,
      eventName: "switchannotationeditormode",
      eventDetails: {
        get mode() {
          const {
            classList
          } = options.editorInkButton;
          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.INK;
        }
      }
    }, {
      element: options.editorStampButton,
      eventName: "switchannotationeditormode",
      eventDetails: {
        get mode() {
          const {
            classList
          } = options.editorStampButton;
          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.STAMP;
        }
      }
    }];
    this.items = {
      numPages: options.numPages,
      pageNumber: options.pageNumber,
      scaleSelect: options.scaleSelect,
      customScaleOption: options.customScaleOption,
      previous: options.previous,
      next: options.next,
      zoomIn: options.zoomIn,
      zoomOut: options.zoomOut
    };
    this.#bindListeners(options);
    this.reset();
  }
  setPageNumber(pageNumber, pageLabel) {
    this.pageNumber = pageNumber;
    this.pageLabel = pageLabel;
    this.#updateUIState(false);
  }
  setPagesCount(pagesCount, hasPageLabels) {
    this.pagesCount = pagesCount;
    this.hasPageLabels = hasPageLabels;
    this.#updateUIState(true);
  }
  setPageScale(pageScaleValue, pageScale) {
    this.pageScaleValue = (pageScaleValue || pageScale).toString();
    this.pageScale = pageScale;
    this.#updateUIState(false);
  }
  reset() {
    this.pageNumber = 0;
    this.pageLabel = null;
    this.hasPageLabels = false;
    this.pagesCount = 0;
    this.pageScaleValue = DEFAULT_SCALE_VALUE;
    this.pageScale = DEFAULT_SCALE;
    this.#updateUIState(true);
    this.updateLoadingIndicatorState();
    this.eventBus.dispatch("toolbarreset", {
      source: this
    });
  }
  #bindListeners(options) {
    const {
      pageNumber,
      scaleSelect
    } = this.items;
    const self = this;
    for (const {
      element,
      eventName,
      eventDetails
    } of this.buttons) {
      element.addEventListener("click", evt => {
        if (eventName !== null) {
          this.eventBus.dispatch(eventName, {
            source: this,
            ...eventDetails,
            isFromKeyboard: evt.detail === 0
          });
        }
      });
    }
    pageNumber.addEventListener("click", function () {
      this.select();
    });
    pageNumber.addEventListener("change", function () {
      self.eventBus.dispatch("pagenumberchanged", {
        source: self,
        value: this.value
      });
    });
    scaleSelect.addEventListener("change", function () {
      if (this.value === "custom") {
        return;
      }
      self.eventBus.dispatch("scalechanged", {
        source: self,
        value: this.value
      });
    });
    scaleSelect.addEventListener("click", function (evt) {
      const target = evt.target;
      if (this.value === self.pageScaleValue && target.tagName.toUpperCase() === "OPTION") {
        this.blur();
      }
    });
    scaleSelect.oncontextmenu = noContextMenu;
    this.#bindEditorToolsListener(options);
  }
  #bindEditorToolsListener({
    editorFreeTextButton,
    editorFreeTextParamsToolbar,
    editorInkButton,
    editorInkParamsToolbar,
    editorStampButton,
    editorStampParamsToolbar
  }) {
    const editorModeChanged = ({
      mode
    }) => {
      toggleCheckedBtn(editorFreeTextButton, mode === AnnotationEditorType.FREETEXT, editorFreeTextParamsToolbar);
      toggleCheckedBtn(editorInkButton, mode === AnnotationEditorType.INK, editorInkParamsToolbar);
      toggleCheckedBtn(editorStampButton, mode === AnnotationEditorType.STAMP, editorStampParamsToolbar);
      const isDisable = mode === AnnotationEditorType.DISABLE;
      editorFreeTextButton.disabled = isDisable;
      editorInkButton.disabled = isDisable;
      editorStampButton.disabled = isDisable;
    };
    this.eventBus._on("annotationeditormodechanged", editorModeChanged);
    this.eventBus._on("toolbarreset", evt => {
      if (evt.source === this) {
        editorModeChanged({
          mode: AnnotationEditorType.DISABLE
        });
      }
    });
  }
  #updateUIState(resetNumPages = false) {
    const {
      pageNumber,
      pagesCount,
      pageScaleValue,
      pageScale,
      items
    } = this;
    if (resetNumPages) {
      if (this.hasPageLabels) {
        items.pageNumber.type = "text";
        items.numPages.setAttribute("data-l10n-id", "pdfjs-page-of-pages");
      } else {
        items.pageNumber.type = "number";
        items.numPages.setAttribute("data-l10n-id", "pdfjs-of-pages");
        items.numPages.setAttribute("data-l10n-args", JSON.stringify({
          pagesCount
        }));
      }
      items.pageNumber.max = pagesCount;
    }
    if (this.hasPageLabels) {
      items.pageNumber.value = this.pageLabel;
      items.numPages.setAttribute("data-l10n-args", JSON.stringify({
        pageNumber,
        pagesCount
      }));
    } else {
      items.pageNumber.value = pageNumber;
    }
    items.previous.disabled = pageNumber <= 1;
    items.next.disabled = pageNumber >= pagesCount;
    items.zoomOut.disabled = pageScale <= MIN_SCALE;
    items.zoomIn.disabled = pageScale >= MAX_SCALE;
    let predefinedValueFound = false;
    for (const option of items.scaleSelect.options) {
      if (option.value !== pageScaleValue) {
        option.selected = false;
        continue;
      }
      option.selected = true;
      predefinedValueFound = true;
    }
    if (!predefinedValueFound) {
      items.customScaleOption.selected = true;
      items.customScaleOption.setAttribute("data-l10n-args", JSON.stringify({
        scale: Math.round(pageScale * 10000) / 100
      }));
    }
  }
  updateLoadingIndicatorState(loading = false) {
    const {
      pageNumber
    } = this.items;
    pageNumber.classList.toggle(PAGE_NUMBER_LOADING_INDICATOR, loading);
  }
}
