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


class CropEditor {
  #startingMouseX = null;
  #startingMouseY = null;
  #startWidth = null;
  #startHeight = null;

  #initialLeft = null;

  #lastBottom = null;
  #lastLeft = null;
  // #lastWidth = null;
  // #lastHeight = null;

  #initialMismatch = null;

  #boundInitDrag = this.initDrag.bind(this);
  #boundDoDrag = this.doDrag.bind(this);
  #boundStopDrag = this.stopDrag.bind(this);
  #boundConfirmCrop = this.confirmCrop.bind(this);

  constructor(params) {
    this.createCropOverlay();
    const handles = this.getCropHandles();

    // Add mousedown event listeners to each handle
    Object.keys(handles).forEach((handle) => {
      handles[handle].addEventListener(
        "mousedown",
        (e) => {
          this.#boundInitDrag(e, handle);
        },
        false
      );
    });

    // Get the initial mismatch between the page and the overlay
    this.#initialMismatch = this.getInitialMismatch();
    const [_, __, pageRect] = this.getPageRect(window.PDFViewerApplication);
    this.#lastBottom = pageRect.bottom;
  }

  doDrag(e, handle) {
    e.preventDefault();
    const cropOverlay = this.getCropOverlay();
    const [_, __, pageRect] = this.getPageRect(window.PDFViewerApplication);
    let newWidth, newHeight, newLeft, newTop;
    switch (handle) {
      case "left":
        newWidth = this.#startWidth + (this.#startingMouseX - e.clientX);
        newLeft = this.#initialLeft - (this.#startingMouseX - e.clientX);
        this.#lastLeft = e.clientX;
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
          cropOverlay.style.top = (e.clientY - pageRect.top) + "px";
        }
        break;
      case "bottom":
        newHeight = this.#startHeight + (e.clientY - this.#startingMouseY);
        this.#lastBottom = e.clientY;
        if (newHeight > 0) {
          cropOverlay.style.height = newHeight + "px";
        }
        break;
    }
  }

  stopDrag() {
    document.documentElement.removeEventListener("mousemove", this.doDragWithHandle, false);
    document.documentElement.removeEventListener("mouseup", this.#boundStopDrag, false);
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
    if (cropOverlay.offsetLeft === "0px") {
      this.#initialLeft = rect.left + window.scrollX;
    } else {
      this.#initialLeft = parseInt(cropOverlay.offsetLeft, 10);
    }

    this.doDragWithHandle = (event) => this.#boundDoDrag(event, handle);
    document.documentElement.addEventListener('mousemove', this.doDragWithHandle, false);
    document.documentElement.addEventListener('mouseup', this.#boundStopDrag, false);
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
    cropConfirmButton.addEventListener("click", this.#boundConfirmCrop, false);
    cropOverlay.appendChild(cropConfirmButton);

    const PDFViewerApplication = window.PDFViewerApplication;

    const currentPageNumber = PDFViewerApplication.pdfViewer.currentPageNumber;
    const pageDiv = document.querySelector(`div.page[data-page-number="${currentPageNumber}"]`);
    pageDiv.appendChild(cropOverlay);

    return cropOverlay;
  }

  hasBeenCroppedAlready(pdfLibPage) {
    const cropBox = pdfLibPage.getCropBox();
    const mediaBox = pdfLibPage.getMediaBox();
    const properties = ["x", "y", "width", "height"];
    properties.forEach((prop) => {
      if (cropBox[prop] !== mediaBox[prop]) {
        return false;
      }
    });
    return true;
  }

  addDOMRects(rect1, rect2, sign = 1) {
    const properties = ['left', 'top', 'right', 'bottom', 'width', 'height'];
    let result = {};
    properties.forEach(prop => {
      result[prop] = rect1[prop] + sign * rect2[prop];
    });
    return result;
  }

  getPageRect(PDFViewerApplication) {
    const currentPageNumber = PDFViewerApplication.pdfViewer.currentPageNumber;
    const currentPageDiv = document.querySelector(`div.page[data-page-number="${currentPageNumber}"]`);
    return [
      currentPageNumber,
      currentPageDiv,
      currentPageDiv.getBoundingClientRect()
    ]
  }

  getInitialMismatch() {
    const [_, __, pageRect] = this.getPageRect(window.PDFViewerApplication);
    const cropOverlay = this.getCropOverlay();
    const overlayRect = cropOverlay.getBoundingClientRect();
    return this.addDOMRects(pageRect, overlayRect, -1);
  }

  async confirmCrop() {
    const PDFViewerApplication = window.PDFViewerApplication;

    const [currentPageNumber, currentPageDiv, pageRect] = this.getPageRect(PDFViewerApplication);

    // PDFViewerApplication.pdfDoc is the loaded PDFLib document
    const libPdfDoc = PDFViewerApplication.pdfDoc;

    // Get the current page
    const pdfLibPage = libPdfDoc.getPages()[currentPageNumber - 1];
    const initialCropBox = pdfLibPage.getCropBox();

    // Calculate the scale factor between the displayed page and the original PDF page size
    const scaleX = initialCropBox.width / pageRect.width;
    const scaleY = initialCropBox.height / pageRect.height;

    if (this.#lastLeft === null) {
      this.#lastLeft = initialCropBox.x;
    }
    if (this.#lastBottom === null) {
      this.#lastBottom = pageRect.bottom;
    }

    const cropOverlayRect = this.getCropOverlay().getBoundingClientRect();


    // Calculate the crop box dimensions based on the overlay's position and size
    const cropBox = {
      x: (cropOverlayRect.left + this.#initialMismatch.left - pageRect.left) * scaleX,
      y: (pageRect.bottom - this.#lastBottom) * scaleY,
      // x: handleRects.left.left - pageRect.left,
      // y: pageRect.bottom - handleRects.bottom.bottom,
      width: (cropOverlayRect.width + this.#initialMismatch.width) * scaleX,
      height: (cropOverlayRect.height + this.#initialMismatch.height) * scaleY
    };

    // If it has already been cropped, the cropbox and the mediabox aren't the same
    // and we need to add the initial cropbox values to the new cropbox values
    if (this.hasBeenCroppedAlready(pdfLibPage)) {
      cropBox.x += initialCropBox.x;
      cropBox.y += initialCropBox.y;
    }

    // Set the crop box for the current page (this part depends on how your PDF library handles cropping)
    pdfLibPage.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

    const pdfBytes = await libPdfDoc.save();

    PDFViewerApplication.open({
      data: pdfBytes,
    });

    currentPageDiv.scrollIntoView({ behavior: 'smooth' });

    // Self-destruct the crop editor
    PDFViewerApplication.CropEditor = null;
  }

}

export { CropEditor };
