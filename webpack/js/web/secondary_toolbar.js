
;// CONCATENATED MODULE: ./web/secondary_toolbar.js


class SecondaryToolbar {
    constructor(options, eventBus) {
      this.toolbar = options.toolbar;
      this.toggleButton = options.toggleButton;
      this.buttons = [{
        element: options.presentationModeButton,
        eventName: "presentationmode",
        close: true
      }, {
        element: options.printButton,
        eventName: "print",
        close: true
      },
      {
        element: options.downloadButton,
        eventName: "download",
        close: true
      }, {
        element: options.viewBookmarkButton,
        eventName: null,
        close: true
      }, {
        element: options.firstPageButton,
        eventName: "firstpage",
        close: true
      }, {
        element: options.lastPageButton,
        eventName: "lastpage",
        close: true
      }, {
        element: options.pageRotateCwButton,
        eventName: "rotatecw",
        close: false
      }, {
        element: options.pageRotateCcwButton,
        eventName: "rotateccw",
        close: false
      }, {
        element: options.cursorSelectToolButton,
        eventName: "switchcursortool",
        eventDetails: {
          tool: CursorTool.SELECT
        },
        close: true
      }, {
        element: options.cursorHandToolButton,
        eventName: "switchcursortool",
        eventDetails: {
          tool: CursorTool.HAND
        },
        close: true
      }, {
        element: options.scrollPageButton,
        eventName: "switchscrollmode",
        eventDetails: {
          mode: ScrollMode.PAGE
        },
        close: true
      }, {
        element: options.scrollVerticalButton,
        eventName: "switchscrollmode",
        eventDetails: {
          mode: ScrollMode.VERTICAL
        },
        close: true
      }, {
        element: options.scrollHorizontalButton,
        eventName: "switchscrollmode",
        eventDetails: {
          mode: ScrollMode.HORIZONTAL
        },
        close: true
      }, {
        element: options.scrollWrappedButton,
        eventName: "switchscrollmode",
        eventDetails: {
          mode: ScrollMode.WRAPPED
        },
        close: true
      }, {
        element: options.spreadNoneButton,
        eventName: "switchspreadmode",
        eventDetails: {
          mode: SpreadMode.NONE
        },
        close: true
      }, {
        element: options.spreadOddButton,
        eventName: "switchspreadmode",
        eventDetails: {
          mode: SpreadMode.ODD
        },
        close: true
      }, {
        element: options.spreadEvenButton,
        eventName: "switchspreadmode",
        eventDetails: {
          mode: SpreadMode.EVEN
        },
        close: true
      }, {
        element: options.documentPropertiesButton,
        eventName: "documentproperties",
        close: true
      }];
      this.items = {
        firstPage: options.firstPageButton,
        lastPage: options.lastPageButton,
        pageRotateCw: options.pageRotateCwButton,
        pageRotateCcw: options.pageRotateCcwButton
      };
      this.eventBus = eventBus;
      this.opened = false;
      this.#bindClickListeners();
      this.#bindCursorToolsListener(options);
      this.#bindScrollModeListener(options);
      this.#bindSpreadModeListener(options);
      this.reset();
    }
    get isOpen() {
      return this.opened;
    }
    setPageNumber(pageNumber) {
      this.pageNumber = pageNumber;
      this.#updateUIState();
    }
    setPagesCount(pagesCount) {
      this.pagesCount = pagesCount;
      this.#updateUIState();
    }
    reset() {
      this.pageNumber = 0;
      this.pagesCount = 0;
      this.#updateUIState();
      this.eventBus.dispatch("secondarytoolbarreset", {
        source: this
      });
    }
    #updateUIState() {
      this.items.firstPage.disabled = this.pageNumber <= 1;
      this.items.lastPage.disabled = this.pageNumber >= this.pagesCount;
      this.items.pageRotateCw.disabled = this.pagesCount === 0;
      this.items.pageRotateCcw.disabled = this.pagesCount === 0;
    }
    #bindClickListeners() {
      this.toggleButton.addEventListener("click", this.toggle.bind(this));
      for (const {
        element,
        eventName,
        close,
        eventDetails
      } of this.buttons) {
        element.addEventListener("click", evt => {
          if (eventName !== null) {
            this.eventBus.dispatch(eventName, {
              source: this,
              ...eventDetails
            });
          }
          if (close) {
            this.close();
          }
          this.eventBus.dispatch("reporttelemetry", {
            source: this,
            details: {
              type: "buttons",
              data: {
                id: element.id
              }
            }
          });
        });
      }
    }
    #bindCursorToolsListener({
      cursorSelectToolButton,
      cursorHandToolButton
    }) {
      this.eventBus._on("cursortoolchanged", ({
        tool
      }) => {
        toggleCheckedBtn(cursorSelectToolButton, tool === CursorTool.SELECT);
        toggleCheckedBtn(cursorHandToolButton, tool === CursorTool.HAND);
      });
    }
    #bindScrollModeListener({
      scrollPageButton,
      scrollVerticalButton,
      scrollHorizontalButton,
      scrollWrappedButton,
      spreadNoneButton,
      spreadOddButton,
      spreadEvenButton
    }) {
      const scrollModeChanged = ({
        mode
      }) => {
        toggleCheckedBtn(scrollPageButton, mode === ScrollMode.PAGE);
        toggleCheckedBtn(scrollVerticalButton, mode === ScrollMode.VERTICAL);
        toggleCheckedBtn(scrollHorizontalButton, mode === ScrollMode.HORIZONTAL);
        toggleCheckedBtn(scrollWrappedButton, mode === ScrollMode.WRAPPED);
        const forceScrollModePage = this.pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE;
        scrollPageButton.disabled = forceScrollModePage;
        scrollVerticalButton.disabled = forceScrollModePage;
        scrollHorizontalButton.disabled = forceScrollModePage;
        scrollWrappedButton.disabled = forceScrollModePage;
        const isHorizontal = mode === ScrollMode.HORIZONTAL;
        spreadNoneButton.disabled = isHorizontal;
        spreadOddButton.disabled = isHorizontal;
        spreadEvenButton.disabled = isHorizontal;
      };
      this.eventBus._on("scrollmodechanged", scrollModeChanged);
      this.eventBus._on("secondarytoolbarreset", evt => {
        if (evt.source === this) {
          scrollModeChanged({
            mode: ScrollMode.VERTICAL
          });
        }
      });
    }
    #bindSpreadModeListener({
      spreadNoneButton,
      spreadOddButton,
      spreadEvenButton
    }) {
      const spreadModeChanged = ({
        mode
      }) => {
        toggleCheckedBtn(spreadNoneButton, mode === SpreadMode.NONE);
        toggleCheckedBtn(spreadOddButton, mode === SpreadMode.ODD);
        toggleCheckedBtn(spreadEvenButton, mode === SpreadMode.EVEN);
      };
      this.eventBus._on("spreadmodechanged", spreadModeChanged);
      this.eventBus._on("secondarytoolbarreset", evt => {
        if (evt.source === this) {
          spreadModeChanged({
            mode: SpreadMode.NONE
          });
        }
      });
    }
    open() {
      if (this.opened) {
        return;
      }
      this.opened = true;
      toggleExpandedBtn(this.toggleButton, true, this.toolbar);
    }
    close() {
      if (!this.opened) {
        return;
      }
      this.opened = false;
      toggleExpandedBtn(this.toggleButton, false, this.toolbar);
    }
    toggle() {
      if (this.opened) {
        this.close();
      } else {
        this.open();
      }
    }
  }
  