
;// CONCATENATED MODULE: ./web/grab_to_pan.js
const CSS_CLASS_GRAB = "grab-to-pan-grab";
class GrabToPan {
  constructor({
    element
  }) {
    this.element = element;
    this.document = element.ownerDocument;
    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.toggle = this.toggle.bind(this);
    this._onMouseDown = this.#onMouseDown.bind(this);
    this._onMouseMove = this.#onMouseMove.bind(this);
    this._endPan = this.#endPan.bind(this);
    const overlay = this.overlay = document.createElement("div");
    overlay.className = "grab-to-pan-grabbing";
  }
  activate() {
    if (!this.active) {
      this.active = true;
      this.element.addEventListener("mousedown", this._onMouseDown, true);
      this.element.classList.add(CSS_CLASS_GRAB);
    }
  }
  deactivate() {
    if (this.active) {
      this.active = false;
      this.element.removeEventListener("mousedown", this._onMouseDown, true);
      this._endPan();
      this.element.classList.remove(CSS_CLASS_GRAB);
    }
  }
  toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
  ignoreTarget(node) {
    return node.matches("a[href], a[href] *, input, textarea, button, button *, select, option");
  }
  #onMouseDown(event) {
    if (event.button !== 0 || this.ignoreTarget(event.target)) {
      return;
    }
    if (event.originalTarget) {
      try {
        event.originalTarget.tagName;
      } catch {
        return;
      }
    }
    this.scrollLeftStart = this.element.scrollLeft;
    this.scrollTopStart = this.element.scrollTop;
    this.clientXStart = event.clientX;
    this.clientYStart = event.clientY;
    this.document.addEventListener("mousemove", this._onMouseMove, true);
    this.document.addEventListener("mouseup", this._endPan, true);
    this.element.addEventListener("scroll", this._endPan, true);
    event.preventDefault();
    event.stopPropagation();
    const focusedElement = document.activeElement;
    if (focusedElement && !focusedElement.contains(event.target)) {
      focusedElement.blur();
    }
  }
  #onMouseMove(event) {
    this.element.removeEventListener("scroll", this._endPan, true);
    if (!(event.buttons & 1)) {
      this._endPan();
      return;
    }
    const xDiff = event.clientX - this.clientXStart;
    const yDiff = event.clientY - this.clientYStart;
    this.element.scrollTo({
      top: this.scrollTopStart - yDiff,
      left: this.scrollLeftStart - xDiff,
      behavior: "instant"
    });
    if (!this.overlay.parentNode) {
      document.body.append(this.overlay);
    }
  }
  #endPan() {
    this.element.removeEventListener("scroll", this._endPan, true);
    this.document.removeEventListener("mousemove", this._onMouseMove, true);
    this.document.removeEventListener("mouseup", this._endPan, true);
    this.overlay.remove();
  }
}
