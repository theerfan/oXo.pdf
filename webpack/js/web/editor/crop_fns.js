
function getCropHandles() {
  return {
    left: document.getElementById('crop-left-handle'),
    right: document.getElementById('crop-right-handle'),
    top: document.getElementById('crop-top-handle'),
    bottom: document.getElementById('crop-bottom-handle')
  };
}

function getCropHandleRects() {
  const handles = getCropHandles();
  return {
    left: handles.left.getBoundingClientRect(),
    right: handles.right.getBoundingClientRect(),
    top: handles.top.getBoundingClientRect(),
    bottom: handles.bottom.getBoundingClientRect()
  };
}


// Function to initialize drag functionality
function initializeDrag() {
  const cropOverlay = document.getElementById('crop-overlay');
  const handles = getCropHandles();

  let startingMouseX, startingMouseY, startWidth, startHeight;

  // Function to start the resizing
  function initDrag(e, handle) {
    startingMouseX = e.clientX;
    startingMouseY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(cropOverlay).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(cropOverlay).height, 10);

    // Capture the initial left and top positions
    const rect = cropOverlay.getBoundingClientRect();
    var initialLeft;
    if (cropOverlay.offsetLeft === "0px") {
      initialLeft = rect.left + window.scrollX;
    }
    else {
      initialLeft = parseInt(cropOverlay.offsetLeft, 10);
    }

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);

    function doDrag(e) {
      e.preventDefault();
      let newWidth, newHeight, newLeft, newTop;
      switch (handle) {
        case 'left':
          newWidth = startWidth + (startingMouseX - e.clientX);
          newLeft = initialLeft - (startingMouseX - e.clientX);
          if (newWidth > 0) {
            cropOverlay.style.width = newWidth + 'px';
            cropOverlay.style.left = newLeft + 'px';
          }
          break;
        case 'right':
          newWidth = startWidth + (e.clientX - startingMouseX);
          if (newWidth > 0) {
            cropOverlay.style.width = newWidth + 'px';
          }
          break;
        case 'top':
          newHeight = startHeight + (startingMouseY - e.clientY);
          if (newHeight > 0) {
            cropOverlay.style.height = newHeight + 'px';
            cropOverlay.style.top = e.clientY + 'px';
          }
          break;
        case 'bottom':
          newHeight = startHeight + (e.clientY - startingMouseY);
          if (newHeight > 0) {
            cropOverlay.style.height = newHeight + 'px';
          }
          break;
      }
    }

    function stopDrag() {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }
  }

  // Add mousedown event listeners to each handle
  Object.keys(handles).forEach(handle => {
    handles[handle].addEventListener('mousedown', function (e) {
      initDrag(e, handle);
    }, false);
  });
}


function createCropOverlay() {
  if (document.getElementById("crop-overlay")) {
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

async function confirmCrop() {
  const currentPageNumber = PDFViewerApplication.pdfViewer.currentPageNumber;
  const currentPageDiv = document.querySelector(`div.page[data-page-number="${currentPageNumber}"]`);
  const pageRect = currentPageDiv.getBoundingClientRect();

  // PDFViewerApplication.pdfDoc is the loaded PDFLib document
  const libPdfDoc = PDFViewerApplication.pdfDoc;
  const jsPdfDoc = await PDFViewerApplication.pdfDocument;

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

  PDFViewerApplication.open({
    data: pdfBytes,
  });

  currentPageDiv.scrollIntoView({ behavior: 'smooth' });
}


function webViewerCrop() {
  const currentPageNumber = PDFViewerApplication.pdfViewer.currentPageNumber;

  // get the div with class="page" and data-page-number=current page number
  const pageDiv = document.querySelector(`div.page[data-page-number="${currentPageNumber}"]`);
  const cropOverlay = createCropOverlay();

  if (cropOverlay) {
    // Add the overlay to the page
    pageDiv.appendChild(cropOverlay);
  }

  initializeDrag();
}