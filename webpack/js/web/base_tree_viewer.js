
;// CONCATENATED MODULE: ./web/base_tree_viewer.js

const TREEITEM_OFFSET_TOP = -100;
const TREEITEM_SELECTED_CLASS = "selected";
class BaseTreeViewer {
  constructor(options) {
    if (this.constructor === BaseTreeViewer) {
      throw new Error("Cannot initialize BaseTreeViewer.");
    }
    this.container = options.container;
    this.eventBus = options.eventBus;
    this._l10n = options.l10n;
    this.reset();
  }
  reset() {
    this._pdfDocument = null;
    this._lastToggleIsShow = true;
    this._currentTreeItem = null;
    this.container.textContent = "";
    this.container.classList.remove("treeWithDeepNesting");
  }
  _dispatchEvent(count) {
    throw new Error("Not implemented: _dispatchEvent");
  }
  _bindLink(element, params) {
    throw new Error("Not implemented: _bindLink");
  }
  _normalizeTextContent(str) {
    return removeNullCharacters(str, true) || "\u2013";
  }
  _addToggleButton(div, hidden = false) {
    const toggler = document.createElement("div");
    toggler.className = "treeItemToggler";
    if (hidden) {
      toggler.classList.add("treeItemsHidden");
    }
    toggler.onclick = evt => {
      evt.stopPropagation();
      toggler.classList.toggle("treeItemsHidden");
      if (evt.shiftKey) {
        const shouldShowAll = !toggler.classList.contains("treeItemsHidden");
        this._toggleTreeItem(div, shouldShowAll);
      }
    };
    div.prepend(toggler);
  }
  _toggleTreeItem(root, show = false) {
    this._l10n.pause();
    this._lastToggleIsShow = show;
    for (const toggler of root.querySelectorAll(".treeItemToggler")) {
      toggler.classList.toggle("treeItemsHidden", !show);
    }
    this._l10n.resume();
  }
  _toggleAllTreeItems() {
    this._toggleTreeItem(this.container, !this._lastToggleIsShow);
  }
  _finishRendering(fragment, count, hasAnyNesting = false) {
    if (hasAnyNesting) {
      this.container.classList.add("treeWithDeepNesting");
      this._lastToggleIsShow = !fragment.querySelector(".treeItemsHidden");
    }
    this._l10n.pause();
    this.container.append(fragment);
    this._l10n.resume();
    this._dispatchEvent(count);
  }
  render(params) {
    throw new Error("Not implemented: render");
  }
  _updateCurrentTreeItem(treeItem = null) {
    if (this._currentTreeItem) {
      this._currentTreeItem.classList.remove(TREEITEM_SELECTED_CLASS);
      this._currentTreeItem = null;
    }
    if (treeItem) {
      treeItem.classList.add(TREEITEM_SELECTED_CLASS);
      this._currentTreeItem = treeItem;
    }
  }
  _scrollToCurrentTreeItem(treeItem) {
    if (!treeItem) {
      return;
    }
    this._l10n.pause();
    let currentNode = treeItem.parentNode;
    while (currentNode && currentNode !== this.container) {
      if (currentNode.classList.contains("treeItem")) {
        const toggler = currentNode.firstElementChild;
        toggler?.classList.remove("treeItemsHidden");
      }
      currentNode = currentNode.parentNode;
    }
    this._l10n.resume();
    this._updateCurrentTreeItem(treeItem);
    this.container.scrollTo(treeItem.offsetLeft, treeItem.offsetTop + TREEITEM_OFFSET_TOP);
  }
}
