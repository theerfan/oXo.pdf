
;// CONCATENATED MODULE: ./web/pdf_presentation_mode.js


const DELAY_BEFORE_HIDING_CONTROLS = 3000;
const ACTIVE_SELECTOR = "pdfPresentationMode";
const CONTROLS_SELECTOR = "pdfPresentationModeControls";
const MOUSE_SCROLL_COOLDOWN_TIME = 50;
const PAGE_SWITCH_THRESHOLD = 0.1;
const SWIPE_MIN_DISTANCE_THRESHOLD = 50;
const SWIPE_ANGLE_THRESHOLD = Math.PI / 6;
class PDFPresentationMode {
  #state = PresentationModeState.UNKNOWN;
  #args = null;
  constructor({
    container,
    pdfViewer,
    eventBus
  }) {
    this.container = container;
    this.pdfViewer = pdfViewer;
    this.eventBus = eventBus;
    this.contextMenuOpen = false;
    this.mouseScrollTimeStamp = 0;
    this.mouseScrollDelta = 0;
    this.touchSwipeState = null;
  }
  async request() {
    const {
      container,
      pdfViewer
    } = this;
    if (this.active || !pdfViewer.pagesCount || !container.requestFullscreen) {
      return false;
    }
    this.#addFullscreenChangeListeners();
    this.#notifyStateChange(PresentationModeState.CHANGING);
    const promise = container.requestFullscreen();
    this.#args = {
      pageNumber: pdfViewer.currentPageNumber,
      scaleValue: pdfViewer.currentScaleValue,
      scrollMode: pdfViewer.scrollMode,
      spreadMode: null,
      annotationEditorMode: null
    };
    if (pdfViewer.spreadMode !== SpreadMode.NONE && !(pdfViewer.pageViewsReady && pdfViewer.hasEqualPageSizes)) {
      console.warn("Ignoring Spread modes when entering PresentationMode, " + "since the document may contain varying page sizes.");
      this.#args.spreadMode = pdfViewer.spreadMode;
    }
    if (pdfViewer.annotationEditorMode !== AnnotationEditorType.DISABLE) {
      this.#args.annotationEditorMode = pdfViewer.annotationEditorMode;
    }
    try {
      await promise;
      pdfViewer.focus();
      return true;
    } catch {
      this.#removeFullscreenChangeListeners();
      this.#notifyStateChange(PresentationModeState.NORMAL);
    }
    return false;
  }
  get active() {
    return this.#state === PresentationModeState.CHANGING || this.#state === PresentationModeState.FULLSCREEN;
  }
  #mouseWheel(evt) {
    if (!this.active) {
      return;
    }
    evt.preventDefault();
    const delta = normalizeWheelEventDelta(evt);
    const currentTime = Date.now();
    const storedTime = this.mouseScrollTimeStamp;
    if (currentTime > storedTime && currentTime - storedTime < MOUSE_SCROLL_COOLDOWN_TIME) {
      return;
    }
    if (this.mouseScrollDelta > 0 && delta < 0 || this.mouseScrollDelta < 0 && delta > 0) {
      this.#resetMouseScrollState();
    }
    this.mouseScrollDelta += delta;
    if (Math.abs(this.mouseScrollDelta) >= PAGE_SWITCH_THRESHOLD) {
      const totalDelta = this.mouseScrollDelta;
      this.#resetMouseScrollState();
      const success = totalDelta > 0 ? this.pdfViewer.previousPage() : this.pdfViewer.nextPage();
      if (success) {
        this.mouseScrollTimeStamp = currentTime;
      }
    }
  }
  #notifyStateChange(state) {
    this.#state = state;
    this.eventBus.dispatch("presentationmodechanged", {
      source: this,
      state
    });
  }
  #enter() {
    this.#notifyStateChange(PresentationModeState.FULLSCREEN);
    this.container.classList.add(ACTIVE_SELECTOR);
    setTimeout(() => {
      this.pdfViewer.scrollMode = ScrollMode.PAGE;
      if (this.#args.spreadMode !== null) {
        this.pdfViewer.spreadMode = SpreadMode.NONE;
      }
      this.pdfViewer.currentPageNumber = this.#args.pageNumber;
      this.pdfViewer.currentScaleValue = "page-fit";
      if (this.#args.annotationEditorMode !== null) {
        this.pdfViewer.annotationEditorMode = {
          mode: AnnotationEditorType.NONE
        };
      }
    }, 0);
    this.#addWindowListeners();
    this.#showControls();
    this.contextMenuOpen = false;
    window.getSelection().removeAllRanges();
  }
  #exit() {
    const pageNumber = this.pdfViewer.currentPageNumber;
    this.container.classList.remove(ACTIVE_SELECTOR);
    setTimeout(() => {
      this.#removeFullscreenChangeListeners();
      this.#notifyStateChange(PresentationModeState.NORMAL);
      this.pdfViewer.scrollMode = this.#args.scrollMode;
      if (this.#args.spreadMode !== null) {
        this.pdfViewer.spreadMode = this.#args.spreadMode;
      }
      this.pdfViewer.currentScaleValue = this.#args.scaleValue;
      this.pdfViewer.currentPageNumber = pageNumber;
      if (this.#args.annotationEditorMode !== null) {
        this.pdfViewer.annotationEditorMode = {
          mode: this.#args.annotationEditorMode
        };
      }
      this.#args = null;
    }, 0);
    this.#removeWindowListeners();
    this.#hideControls();
    this.#resetMouseScrollState();
    this.contextMenuOpen = false;
  }
  #mouseDown(evt) {
    if (this.contextMenuOpen) {
      this.contextMenuOpen = false;
      evt.preventDefault();
      return;
    }
    if (evt.button !== 0) {
      return;
    }
    if (evt.target.href && evt.target.parentNode?.hasAttribute("data-internal-link")) {
      return;
    }
    evt.preventDefault();
    if (evt.shiftKey) {
      this.pdfViewer.previousPage();
    } else {
      this.pdfViewer.nextPage();
    }
  }
  #contextMenu() {
    this.contextMenuOpen = true;
  }
  #showControls() {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    } else {
      this.container.classList.add(CONTROLS_SELECTOR);
    }
    this.controlsTimeout = setTimeout(() => {
      this.container.classList.remove(CONTROLS_SELECTOR);
      delete this.controlsTimeout;
    }, DELAY_BEFORE_HIDING_CONTROLS);
  }
  #hideControls() {
    if (!this.controlsTimeout) {
      return;
    }
    clearTimeout(this.controlsTimeout);
    this.container.classList.remove(CONTROLS_SELECTOR);
    delete this.controlsTimeout;
  }
  #resetMouseScrollState() {
    this.mouseScrollTimeStamp = 0;
    this.mouseScrollDelta = 0;
  }
  #touchSwipe(evt) {
    if (!this.active) {
      return;
    }
    if (evt.touches.length > 1) {
      this.touchSwipeState = null;
      return;
    }
    switch (evt.type) {
      case "touchstart":
        this.touchSwipeState = {
          startX: evt.touches[0].pageX,
          startY: evt.touches[0].pageY,
          endX: evt.touches[0].pageX,
          endY: evt.touches[0].pageY
        };
        break;
      case "touchmove":
        if (this.touchSwipeState === null) {
          return;
        }
        this.touchSwipeState.endX = evt.touches[0].pageX;
        this.touchSwipeState.endY = evt.touches[0].pageY;
        evt.preventDefault();
        break;
      case "touchend":
        if (this.touchSwipeState === null) {
          return;
        }
        let delta = 0;
        const dx = this.touchSwipeState.endX - this.touchSwipeState.startX;
        const dy = this.touchSwipeState.endY - this.touchSwipeState.startY;
        const absAngle = Math.abs(Math.atan2(dy, dx));
        if (Math.abs(dx) > SWIPE_MIN_DISTANCE_THRESHOLD && (absAngle <= SWIPE_ANGLE_THRESHOLD || absAngle >= Math.PI - SWIPE_ANGLE_THRESHOLD)) {
          delta = dx;
        } else if (Math.abs(dy) > SWIPE_MIN_DISTANCE_THRESHOLD && Math.abs(absAngle - Math.PI / 2) <= SWIPE_ANGLE_THRESHOLD) {
          delta = dy;
        }
        if (delta > 0) {
          this.pdfViewer.previousPage();
        } else if (delta < 0) {
          this.pdfViewer.nextPage();
        }
        break;
    }
  }
  #addWindowListeners() {
    this.showControlsBind = this.#showControls.bind(this);
    this.mouseDownBind = this.#mouseDown.bind(this);
    this.mouseWheelBind = this.#mouseWheel.bind(this);
    this.resetMouseScrollStateBind = this.#resetMouseScrollState.bind(this);
    this.contextMenuBind = this.#contextMenu.bind(this);
    this.touchSwipeBind = this.#touchSwipe.bind(this);
    window.addEventListener("mousemove", this.showControlsBind);
    window.addEventListener("mousedown", this.mouseDownBind);
    window.addEventListener("wheel", this.mouseWheelBind, {
      passive: false
    });
    window.addEventListener("keydown", this.resetMouseScrollStateBind);
    window.addEventListener("contextmenu", this.contextMenuBind);
    window.addEventListener("touchstart", this.touchSwipeBind);
    window.addEventListener("touchmove", this.touchSwipeBind);
    window.addEventListener("touchend", this.touchSwipeBind);
  }
  #removeWindowListeners() {
    window.removeEventListener("mousemove", this.showControlsBind);
    window.removeEventListener("mousedown", this.mouseDownBind);
    window.removeEventListener("wheel", this.mouseWheelBind, {
      passive: false
    });
    window.removeEventListener("keydown", this.resetMouseScrollStateBind);
    window.removeEventListener("contextmenu", this.contextMenuBind);
    window.removeEventListener("touchstart", this.touchSwipeBind);
    window.removeEventListener("touchmove", this.touchSwipeBind);
    window.removeEventListener("touchend", this.touchSwipeBind);
    delete this.showControlsBind;
    delete this.mouseDownBind;
    delete this.mouseWheelBind;
    delete this.resetMouseScrollStateBind;
    delete this.contextMenuBind;
    delete this.touchSwipeBind;
  }
  #fullscreenChange() {
    if (document.fullscreenElement) {
      this.#enter();
    } else {
      this.#exit();
    }
  }
  #addFullscreenChangeListeners() {
    this.fullscreenChangeBind = this.#fullscreenChange.bind(this);
    window.addEventListener("fullscreenchange", this.fullscreenChangeBind);
  }
  #removeFullscreenChangeListeners() {
    window.removeEventListener("fullscreenchange", this.fullscreenChangeBind);
    delete this.fullscreenChangeBind;
  }
}