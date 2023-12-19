// Global variables
// This one is the proxy for showing and pdf.js
let pdfDoc = null;
// This one contains the actual bytes of the PDF file, using pdf-lib
let pdfFile = null;

// Render the PDF file using pdf.js
async function renderPDF(pdfBytes) {
    // Convert the byte array to a Uint8Array
    const typedArray = new Uint8Array(pdfBytes);

    // Load the PDF file using pdf.js
    pdfjsLib.getDocument({ data: typedArray }).promise.then(pdf => {
        pdfFile = pdf;
        document.getElementById('pdf-container').innerHTML = ''; // Clear existing content

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            

            renderPage(pageNum);

            // pdf.getPage(pageNum).then(page => {
            //     const scale = 1.5;
            //     const viewport = page.getViewport({ scale: scale });
            //     const canvas = document.createElement('canvas');
            //     const context = canvas.getContext('2d');
            //     canvas.id = `page-${pageNum}`;
            //     canvas.height = viewport.height;
            //     canvas.width = viewport.width;


            //     // Center canvas
            //     canvas.style.marginLeft = 'auto';
            //     canvas.style.marginRight = 'auto';
            //     canvas.style.display = 'block';

            //     pageContainer.appendChild(canvas);

            //     const renderContext = {
            //         canvasContext: context,
            //         viewport: viewport
            //     };
            //     page.render(renderContext);
            // });
        }

        pdf.getOutline().then(outline => {
            const bookmarksContainer = document.getElementById('bookmarks-container');
            // const toggleButton = document.getElementById('toggle-button');
            bookmarksContainer.innerHTML = ''; // Clear previous bookmarks
            // bookmarksContainer.appendChild(toggleButton); // Add the toggle button back
            renderBookmarks(outline, bookmarksContainer, pdf);
        });
    });
}

// Assuming you have a PDF file loaded as `pdfFile`

async function renderPage(pageNumber) {
    const pageContainer = document.createElement('div');
    pageContainer.className = 'page-container';
    pageContainer.id = `page-container-${pageNumber}`;
    document.getElementById('pdf-container').appendChild(pageContainer);

    // Add the page number element
    const pageNumberElement = document.createElement('div');
    pageNumberElement.className = 'page-number';
    pageNumberElement.innerText = `Page ${pageNumber}`;
    pageContainer.appendChild(pageNumberElement);

    pdfFile.getPage(pageNumber).then(page => {
        // Prepare canvas for PDF page
        var viewport = page.getViewport({ scale: 1.5 });
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.id = `page-${pageNumber}`;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page into the canvas
        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        var renderTask = page.render(renderContext);

        // Append the canvas to your page container
        pageContainer.appendChild(canvas);

        // Render text layer
        renderTask.promise.then(() => {
            return page.getTextContent();
        }).then(textContent => {
            // Create a new div for the text layer
            var textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'text-layer';
            // textLayerDiv.style.position = 'relative';
            textLayerDiv.style.top = 0;
            textLayerDiv.style.left = 0;
            textLayerDiv.style.height = `${viewport.height}px`;
            textLayerDiv.style.width = `${viewport.width}px`;
            pageContainer.appendChild(textLayerDiv);

            // Render the text items in the text layer div
            pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: textLayerDiv,
                viewport: viewport,
                textDivs: []
            });
        });
    });
}


// Gets the PDF file from the input element and renders it to the page
document.getElementById('file-input').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
        console.error(file.name, 'is not a pdf file.');
        return;
    }

    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pdfBytes = await pdfDoc.save();
    renderPDF(pdfBytes);
});

// Deletes the page specified by the user
document.getElementById('delete-page').addEventListener('click', async () => {
    const pageNumber = parseInt(document.getElementById('delete-page-number').value);
    if (pageNumber > 0 && pageNumber <= pdfDoc.getPageCount()) {
        pdfDoc.removePage(pageNumber - 1);
        const pdfBytes = await pdfDoc.save();

        // Render the new PDF
        renderPDF(pdfBytes);

    } else {
        alert('Invalid page number');
    }
});

// Inserts a blank page at the specified position
document.getElementById('insert-blank-page').addEventListener('click', async () => {
    const insertAt = parseInt(document.getElementById('insert-page-number').value);
    if (insertAt > 0 && insertAt <= pdfDoc.getPageCount() + 1) {
        // Create a blank page. You can set the size as needed 
        // Get the page size of the page after which you want to insert the blank page
        // If there is no page after the specified position, get the page size of the first page
        const pageSize = insertAt === pdfDoc.getPageCount() + 1 ?
            pdfDoc.getPage(0).getSize() : pdfDoc.getPage(insertAt).getSize();
        const pagesizeList = [pageSize.width, pageSize.height]
        const blankPage = pdfDoc.insertPage(insertAt - 1, pagesizeList);
        const pdfBytes = await pdfDoc.save();

        // render the new PDF
        renderPDF(pdfBytes);
    } else {
        alert('Invalid page number for insertion');
    }
});

// Rotates the page in view by the specified degrees
document.getElementById('rotate-page').addEventListener('click', async () => {
    const rotationDegrees = parseInt(document.getElementById('rotation-degree').value);
    const currentPageNumber = getCurrentPageinView();
    console.log(currentPageNumber);

    if (currentPageNumber > 0 && currentPageNumber <= pdfDoc.getPageCount()) {
        const page = pdfDoc.getPage(currentPageNumber - 1);
        const currentRotation = page.getRotation().angle;
        page.setRotation(PDFLib.degrees(currentRotation + rotationDegrees));

        const pdfBytes = await pdfDoc.save();
        renderPDF(pdfBytes);
    } else {
        alert('Invalid page number for rotation');
    }
});

// Function to get the current page in view
function getCurrentPageinView() {
    const container = document.getElementById('pdf-container');
    const children = container.children;
    let maxVisibleHeight = 0;
    let mostVisiblePage = 0;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const rect = child.getBoundingClientRect();

        // Calculate the visible height of the page
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

        // Update the most visible page
        if (visibleHeight > maxVisibleHeight) {
            mostVisiblePage = i + 1
        }
    }
    return mostVisiblePage;
}

// Function to render the bookmarks
function renderBookmarks(bookmarks, container, pdfDoc, level = 0) {
    if (!bookmarks || bookmarks.length === 0) {
        container.style.display = 'none';
        return;
    }

    const list = document.createElement('ul');
    list.style.paddingLeft = `${level * 20}px`; // Indentation for nested bookmarks
    container.appendChild(list);

    bookmarks.forEach(bookmark => {
        const item = document.createElement('li');
        item.textContent = bookmark.title;
        list.appendChild(item);

        // Make the bookmark item clickable
        item.style.cursor = 'pointer';
        item.onclick = async () => {
            if (bookmark.dest) {
                const pageRef = bookmark.dest[0];
                // Resolve the destination and navigate to the specific page
                // const destination = await pdfDoc.getDestination(dest);
                const pageIndex = await pdfDoc.getPageIndex(pageRef);
                document.getElementById('page-' + (pageIndex + 1)).scrollIntoView({ behavior: 'smooth' });
            }
        };

        // Render any child bookmarks
        if (bookmark.items && bookmark.items.length > 0) {
            renderBookmarks(bookmark.items, container, pdfDoc, level + 1);
        }
    });

    container.style.display = 'block';
    // Call this function when showing the bookmarks-container or updating its content
    resetBookmarkScroll();
}

// Function to crop a page in a PDF
// pageToCrop: the 0-indexed page number to crop
// cropRect: { x, y, width, height } defines the crop rectangle
// pdfDoc: an instance of PDFDocument from pdf-lib
async function cropPage(pageToCrop, cropRect, pdfDoc) {
    // Get the page
    const page = pdfDoc.getPages()[pageToCrop];

    // Set the crop box
    page.setCropBox(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

    // Serialize the PDFDocument to bytes (a Uint8Array)
    return await pdfDoc.save();
}

// Event listener for the crop button
document.getElementById('crop-page').addEventListener('click', async () => {
    // Retrieve values from form
    const pageNumber = parseInt(document.getElementById('crop-page-number').value, 10) - 1; // Convert to 0-index
    const x = parseFloat(document.getElementById('crop-x').value);
    const y = parseFloat(document.getElementById('crop-y').value);
    const width = parseFloat(document.getElementById('crop-width').value);
    const height = parseFloat(document.getElementById('crop-height').value);

    // Ensure valid inputs
    if (pageNumber >= 0 && x >= 0 && y >= 0 && width > 0 && height > 0) {
        // Call the cropPage function (assuming pdfDoc is your loaded PDFDocument instance)
        try {
            const croppedPdfBytes = await cropPage(pageNumber, { x, y, width, height }, pdfDoc);
            // Render the cropped PDF
            renderPDF(croppedPdfBytes);
        } catch (error) {
            console.error('Error cropping page:', error);
        }
    } else {
        alert('Please enter valid crop dimensions.');
    }
});

// Add more PDF input fields for the merge function
document.getElementById('add-pdf-input').addEventListener('click', () => {
    const container = document.getElementById('pdf-inputs-container');
    const inputContainer = document.createElement('div');
    inputContainer.className = 'pdf-input-container';

    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.className = 'pdf-input';
    newInput.accept = 'application/pdf';
    inputContainer.appendChild(newInput);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.type = 'button';
    removeButton.onclick = function () {
        // Remove this input container
        container.removeChild(inputContainer);
    };
    inputContainer.appendChild(removeButton);

    container.appendChild(inputContainer);
});

// Merge PDFs from all file inputs
async function mergeMultiplePdfs(pdfBytesArray) {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const pdfBytes of pdfBytesArray) {
        const pdf = await PDFLib.PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
}

// Event listener for the merge button
document.getElementById('merge-pdfs').addEventListener('click', async () => {
    const pdfInputs = document.querySelectorAll('.pdf-input');
    const files = Array.from(pdfInputs)
        .map(input => input.files[0])
        .filter(Boolean); // Filter out any undefined or null entries

    if (files.length > 1) {
        // Convert the files to byte arrays
        const pdfBytesArray = await Promise.all(files.map(file => file.arrayBuffer()));

        // Call the mergeMultiplePdfs function
        try {
            const mergedPdfBytes = await mergeMultiplePdfs(pdfBytesArray);
            pdfDoc = await PDFLib.PDFDocument.load(mergedPdfBytes);
            // Render the merged PDF
            renderPDF(mergedPdfBytes);
        } catch (error) {
            console.error('Error merging PDFs:', error);
        }
    } else {
        alert('Please select at least two PDF files to merge.');
    }
});

// Extract a page from a PDF and download it as an image
document.getElementById('extract-page').addEventListener('click', async () => {
    const pageNumber = parseInt(document.getElementById('extract-page-number').value);
    if (isNaN(pageNumber) || pageNumber < 1) {
        alert('Please enter a valid page number.');
        return;
    }

    // Assuming `pdfDoc` is the PDFDocumentProxy object from pdf.js
    // and is already loaded elsewhere in your script.
    try {
        const page = await pdfFile.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale as needed
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // Convert canvas to an image
        const img = document.getElementById('extracted-page-img');
        img.src = canvas.toDataURL('image/png');
        // Download the image
        const link = document.createElement('a');
        link.textContent = 'Download Image';
        link.href = img.src;
        link.download = 'page.png';
        link.click();
        // img.style.display = 'block';


    } catch (error) {
        console.error('Error extracting page:', error);
    }
});


document.getElementById('download-page').addEventListener('click', async () => {
    // Get the bytes of the PDF document
    if (!pdfDoc) {
        alert('Please load a PDF file.');
        return;
    }
    const pdfBytes = await pdfDoc.save();
    const link = document.createElement('a');
    link.textContent = 'Download PDF';
    link.href = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    link.download = 'document.pdf';
    link.click();
});


// Visual cropping stuff
let cropMode = false;

document.getElementById('start-crop').addEventListener('click', function () {
    cropMode = true;
    setCropOverlayPosition();
});


// Confirm crop button logic
document.getElementById('confirm-crop').addEventListener('click', async () => {
    const currentPageNumber = getCurrentPageinView() - 1;
    const currentPage = pdfDoc.getPage(currentPageNumber);
    const { x, y, width: actualWidth, height: actualHeight } = currentPage.getMediaBox();
    const currentPageElement = document.getElementById(`page-${currentPageNumber + 1}`);
    const pageRect = currentPageElement.getBoundingClientRect();

    // We use the position of the handles to determine the crop rectangle
    const leftHandle = document.getElementById('left-handle');
    const rightHandle = document.getElementById('right-handle');
    const topHandle = document.getElementById('top-handle');
    const bottomHandle = document.getElementById('bottom-handle');

    const scaleX = currentPageElement.width / actualWidth;
    const scaleY = currentPageElement.height / actualHeight;

    const cropRect = {
        x: leftHandle.getBoundingClientRect().left - pageRect.left,
        y: topHandle.getBoundingClientRect().top - pageRect.top,
        width: (rightHandle.getBoundingClientRect().left - leftHandle.getBoundingClientRect().left) / scaleX,
        height: (bottomHandle.getBoundingClientRect().top - topHandle.getBoundingClientRect().top) / scaleY
    };

    const pdfBytes = await cropPage(currentPageNumber, cropRect, pdfDoc);

    renderPDF(pdfBytes);

    // Scroll back down to the current page element
    currentPageElement.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('crop-overlay').style.display = 'none';

    cropMode = false;
    previousPageforOverlay = -1;
});

// Make shit draggable

let browserZoomLevel = Math.round(window.devicePixelRatio * 100);

// Adjust the position of the crop-overlay when window is resized (zoom changes)
window.addEventListener('resize', function () {
    if (cropMode) {
        setCropOverlayPosition();
    }
});

window.addEventListener('scroll', function () {
    if (cropMode) {
        setCropOverlayPosition();
    }
});

let previousPageforOverlay = -1;

function setCropOverlayPosition() {
    const currentPage = getCurrentPageinView();
    let newZoomLevel = Math.round(window.devicePixelRatio * 100);
    if (previousPageforOverlay != currentPage || newZoomLevel != browserZoomLevel) {
        browserZoomLevel = newZoomLevel;
        const cropOverlay = document.getElementById('crop-overlay');
        const pdfContainer = document.getElementById('pdf-container');
        const pdfViewerContainer = document.getElementById('pdf-viewer-container');
        // Change the crop area to match the current page size of the PDF container
        // Get the element for the current page
        const page = document.getElementById(`page-${currentPage}`);
        const rect = page.getBoundingClientRect();
        cropOverlay.style.width = rect.width + 'px';
        cropOverlay.style.height = rect.height + 'px';
        cropOverlay.style.left = (rect.left + window.scrollX - pdfViewerContainer.offsetLeft) + 'px';
        cropOverlay.style.top = (rect.top + window.scrollY - pdfViewerContainer.offsetTop) + 'px';
        cropOverlay.style.display = 'block';
        previousPageforOverlay = currentPage;
    }
}

let resizing = false;
let resizeDirection = '';

// Function to update the overlay's size
function resizeOverlay(mouseX, mouseY) {
    const cropOverlay = document.getElementById('crop-overlay');
    const scrollY = window.scrollY;
    // const rect = cropOverlay.getBoundingClientRect();

    if (resizeDirection === 'left') {
        const oldWidth = parseInt(cropOverlay.style.width.replace('px', ''));
        const oldLeft = parseInt(cropOverlay.style.left.replace('px', ''));
        const newWidth = oldWidth + (oldLeft - mouseX);
        if (newWidth > 0) {
            cropOverlay.style.width = newWidth + 'px';
            cropOverlay.style.left = mouseX + 'px';
        }
    }
    else if (resizeDirection === 'right') {
        const newWidth = mouseX - parseInt(cropOverlay.style.left.replace('px', ''));
        if (newWidth > 0) {
            cropOverlay.style.width = newWidth + 'px';
        }
    }
    else if (resizeDirection === 'top') {
        const oldHeight = parseInt(cropOverlay.style.height.replace('px', ''));
        const oldTop = parseInt(cropOverlay.style.top.replace('px', ''));
        const newHeight = oldHeight + (oldTop - (mouseY + scrollY));
        if (newHeight > 0) {
            cropOverlay.style.height = newHeight + 'px';
            cropOverlay.style.top = (mouseY + scrollY) + 'px';
        }
    }
    else if (resizeDirection === 'bottom') {
        const newHeight = (mouseY + scrollY) - parseInt(cropOverlay.style.top.replace('px', ''));
        if (newHeight > 0) {
            cropOverlay.style.height = newHeight + 'px';
        }
    }
}

function handleMouseDown(resizeDir) {
    return function (e) {
        resizing = true;
        resizeDirection = resizeDir;
        e.stopPropagation();
    };
}

document.getElementById('left-handle').addEventListener('mousedown', handleMouseDown('left'));
document.getElementById('right-handle').addEventListener('mousedown', handleMouseDown('right'));
document.getElementById('top-handle').addEventListener('mousedown', handleMouseDown('top'));
document.getElementById('bottom-handle').addEventListener('mousedown', handleMouseDown('bottom'));



// Mouse move event to handle resizing
document.addEventListener('mousemove', function (e) {
    if (resizing && cropMode) {
        resizeOverlay(e.clientX, e.clientY);
    }
});

// Mouse up event to stop resizing
document.addEventListener('mouseup', function () {
    resizing = false;
    resizeDirection = '';
});

function getTotalOffset(element) {
    let totalOffsetX = 0;
    let totalOffsetY = 0;
    while (element) {
        totalOffsetX += element.offsetLeft + element.clientLeft - element.scrollLeft;
        totalOffsetY += element.offsetTop + element.clientTop - element.scrollTop;
        element = element.offsetParent;
    }
    return { x: totalOffsetX, y: totalOffsetY };
}

function resetBookmarkScroll() {
    const bookmarksContainer = document.getElementById('bookmarks-container');
    bookmarksContainer.scrollTop = 0; // Resets the scroll position to the top
}


document.getElementById('toggle-button').addEventListener('click', function () {
    var toggleButton = document.getElementById('toggle-button');

    var bookmarksContainer = document.getElementById('bookmarks-container');
    var isVisible = bookmarksContainer.style.display !== 'none';

    if (isVisible) {
        bookmarksContainer.style.display = 'none';
        toggleButton.classList.add('hidden-bookmarks');
    } else {
        bookmarksContainer.style.display = 'block'; // Or 'flex', 'grid' etc. depending on your layout
        toggleButton.classList.remove('hidden-bookmarks');
    }
});

window.onload = function () {
    var bookmarksContainer = document.getElementById('bookmarks-container');
    var toggleButton = document.getElementById('toggle-button');

    // Initially hide bookmarks
    bookmarksContainer.style.display = 'none';
    toggleButton.classList.add('hidden-bookmarks');
}


let isBookmarksResizing = false;

const bookmarksContainer = document.getElementById('bookmarks-super-container');
const resizeGrip = document.getElementById('resize-grip');

resizeGrip.addEventListener('mousedown', function(e) {
    e.preventDefault();
    isBookmarksResizing = true;
});

document.addEventListener('mousemove', function(e) {
    if (isBookmarksResizing) {
        let newWidth = e.clientX - bookmarksContainer.getBoundingClientRect().left;
        bookmarksContainer.style.width = newWidth + 'px';
    }
});

document.addEventListener('mouseup', function(e) {
    isBookmarksResizing = false;
});
