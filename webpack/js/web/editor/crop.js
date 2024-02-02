/* Copyright 2022 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  Util,
} from "../util.js";
import { AnnotationEditor } from "./editor.js";
import { bindEvents } from "./tools.js";

/**
 * Basic draw editor in order to generate an Highlight annotation.
 */
class CropEditor extends AnnotationEditor {
  #id = null;
  #startingMouseX = null;
  #startingMouseY = null;
  #startWidth = null;
  #startHeight = null;

  PDFViewerApplication = window.PDFViewerApplication;

  static _l10nPromise;

  static _type = "crop";

  static _editorType = AnnotationEditorType.CROP;

  constructor(params) {
    super({ ...params, name: "cropeditor" });
    this._isDraggable = false;

    const handles = this.getCropHandles();

    // Add mousedown event listeners to each handle
    Object.keys(handles).forEach((handle) => {
      handles[handle].addEventListener(
        "mousedown",
        function (e) {
          initDrag(e, handle);
        },
        false
      );
    });
  }

  static initialize(l10n, uiManager) {
    AnnotationEditor.initialize(l10n, uiManager);
  }

  doDrag(e) {
    e.preventDefault();
    const cropOverlay = this.getCropOverlay();
    let newWidth, newHeight, newLeft, newTop;
    switch (handle) {
      case "left":
        newWidth = this.#startWidth + (this.#startingMouseX - e.clientX);
        newLeft = initialLeft - (this.#startingMouseX - e.clientX);
        if (newWidth > 0) {
          cropOverlay.style.width = newWidth + "px";
          cropOverlay.style.left = newLeft + "px";
        }
        break;
      case "right":
        newWidth = this.#startWidth + (e.clientX - this.#startingMouseX);
        if (newWidth > 0) {
          cropOverlay.style.width = newWidth + "px";
        }
        break;
      case "top":
        newHeight = this.#startHeight + (this.#startingMouseY - e.clientY);
        if (newHeight > 0) {
          cropOverlay.style.height = newHeight + "px";
          cropOverlay.style.top = e.clientY + "px";
        }
        break;
      case "bottom":
        newHeight = this.#startHeight + (e.clientY - this.#startingMouseY);
        if (newHeight > 0) {
          cropOverlay.style.height = newHeight + "px";
        }
        break;
    }
  }

  stopDrag() {
    document.documentElement.removeEventListener("mousemove", doDrag, false);
    document.documentElement.removeEventListener("mouseup", stopDrag, false);
  }

  // Function to start the resizing
  initDrag(e, handle) {
    const cropOverlay = document.getElementById("crop-overlay");
    this.#startingMouseX = e.clientX;
    this.#startingMouseY = e.clientY;
    this.#startWidth = parseInt(
      document.defaultView.getComputedStyle(cropOverlay).width,
      10
    );
    this.#startHeight = parseInt(
      document.defaultView.getComputedStyle(cropOverlay).height,
      10
    );

    // Capture the initial left and top positions
    const rect = cropOverlay.getBoundingClientRect();
    var initialLeft;
    if (cropOverlay.offsetLeft === "0px") {
      initialLeft = rect.left + window.scrollX;
    } else {
      initialLeft = parseInt(cropOverlay.offsetLeft, 10);
    }
  }

  getCropOverlay() {
    return document.getElementById("crop-overlay");
  }

  getCropHandles() {
    return {
      left: document.getElementById("crop-left-handle"),
      right: document.getElementById("crop-right-handle"),
      top: document.getElementById("crop-top-handle"),
      bottom: document.getElementById("crop-bottom-handle"),
    };
  }

  getCropHandleRects() {
    const handles = this.getCropHandles();
    return {
      left: handles.left.getBoundingClientRect(),
      right: handles.right.getBoundingClientRect(),
      top: handles.top.getBoundingClientRect(),
      bottom: handles.bottom.getBoundingClientRect(),
    };
  }

  createCropOverlay() {
    if (this.getCropOverlay()) {
      return null;
    }

    const cropOverlay = document.createElement("div");
    cropOverlay.id = "crop-overlay";
    cropOverlay.style.position = "absolute";
    cropOverlay.style.top = "0";
    cropOverlay.style.left = "0";
    cropOverlay.style.width = "100%";
    cropOverlay.style.height = "100%";
    cropOverlay.style.zIndex = "1000";

    // Add the handles to the overlay
    const cropLeft = document.createElement("div");
    cropLeft.id = "crop-left-handle";
    cropLeft.classList.add("crop-resize-handle");
    cropOverlay.appendChild(cropLeft);

    const cropRight = document.createElement("div");
    cropRight.id = "crop-right-handle";
    cropRight.classList.add("crop-resize-handle");
    cropOverlay.appendChild(cropRight);

    const cropTop = document.createElement("div");
    cropTop.id = "crop-top-handle";
    cropTop.classList.add("crop-resize-handle");
    cropOverlay.appendChild(cropTop);

    const cropBottom = document.createElement("div");
    cropBottom.id = "crop-bottom-handle";
    cropBottom.classList.add("crop-resize-handle");
    cropOverlay.appendChild(cropBottom);

    const cropConfirmButton = document.createElement("button");
    cropConfirmButton.id = "crop-confirm-button";
    cropConfirmButton.style.position = "absolute";
    cropConfirmButton.style.bottom = "10px";
    cropConfirmButton.style.right = "10px";
    cropConfirmButton.style.zIndex = "1001";
    cropConfirmButton.innerText = "Confirm Crop";
    cropConfirmButton.addEventListener("click", confirmCrop);
    cropOverlay.appendChild(cropConfirmButton);

    return cropOverlay;
  }

  async confirmCrop() {
    const currentPageNumber = this.PDFViewerApplication.pdfViewer.currentPageNumber;
    const currentPageDiv = document.querySelector(`div.page[data-page-number="${currentPageNumber}"]`);
    const pageRect = currentPageDiv.getBoundingClientRect();

    // PDFViewerApplication.pdfDoc is the loaded PDFLib document
    const libPdfDoc = this.PDFViewerApplication.pdfDoc;

    const handleRects = getCropHandleRects();

    // Get the current page
    const pdfLibPage = libPdfDoc.getPages()[currentPageNumber - 1];
    const initialCropBox = pdfLibPage.getCropBox();

    // Calculate the scale factor between the displayed page and the original PDF page size
    const scaleX = initialCropBox.width / pageRect.width;
    const scaleY = initialCropBox.height / pageRect.height;


    // Calculate the crop box dimensions based on the overlay's position and size
    const cropBox = {
      x: handleRects.left.left - pageRect.left,
      y: pageRect.bottom - handleRects.bottom.bottom,
      width: (handleRects.right.left - (handleRects.left.left + handleRects.left.width)) * scaleX,
      height: (handleRects.bottom.top - handleRects.top.top) * scaleY
    };


    console.log(cropBox);

    // Set the crop box for the current page (this part depends on how your PDF library handles cropping)
    pdfLibPage.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

    const pdfBytes = await libPdfDoc.save();

    this.PDFViewerApplication.open({
      data: pdfBytes,
    });

    currentPageDiv.scrollIntoView({ behavior: 'smooth' });
  }

  /** @inheritdoc */
  translateInPage(x, y) { }

  /** @inheritdoc */
  disableEditing() {
    super.disableEditing();
    this.div.classList.toggle("disabled", true);
  }

  /** @inheritdoc */
  enableEditing() {
    super.enableEditing();
    this.div.classList.toggle("disabled", false);
  }

  /** @inheritdoc */
  fixAndSetPosition() {
    return super.fixAndSetPosition(0);
  }

  /** @inheritdoc */
  getRect(tx, ty) {
    return super.getRect(tx, ty, 0);
  }

  /** @inheritdoc */
  onceAdded() {
    this.parent.addUndoableEditor(this);
    this.div.focus();
  }

  /** @inheritdoc */
  remove() {
    super.remove();
  }

  /** @inheritdoc */
  rebuild() {
    if (!this.parent) {
      return;
    }
    super.rebuild();
    if (this.div === null) {
      return;
    }

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilting it,
      // hence we must add it to its parent.
      this.parent.add(this);
    }
  }

  setParent(parent) {
    let mustBeSelected = false;
    if (this.parent && !parent) {
    } else if (parent) {
      // If mustBeSelected is true it means that this editor was selected
      // when its parent has been destroyed, hence we must select it again.
      mustBeSelected =
        !this.parent && this.div?.classList.contains("selectedEditor");
    }
    super.setParent(parent);
    if (mustBeSelected) {
      // We select it after the parent has been set.
      this.select();
    }
  }

  /** @inheritdoc */
  select() {
    super.select();
  }

  /** @inheritdoc */
  unselect() {
    super.unselect();
  }

  /** @inheritdoc */
  static deserialize(data, parent, uiManager) {
    const editor = super.deserialize(data, parent, uiManager);

    return editor;
  }

  /** @inheritdoc */
  serialize(isForCopying = false) {
    // It doesn't make sense to copy/paste a highlight annotation.
    if (this.isEmpty() || isForCopying) {
      return null;
    }

    const rect = this.getRect(0, 0);

    return {
      annotationType: AnnotationEditorType.CROP,
      pageIndex: this.pageIndex,
      rect,
      rotation: 0,
      structTreeParentId: this._structTreeParentId,
    };
  }

  static canCreateNewEmptyEditor() {
    return false;
  }
}

export { CropEditor };
