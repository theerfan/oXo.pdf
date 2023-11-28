let pdfDoc = null;

document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
        console.error(file.name, 'is not a pdf file.');
        return;
    }

    const fileReader = new FileReader();

    fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);

        // Load the PDF file
        pdfjsLib.getDocument({ data: typedArray }).promise.then(pdf => {
            console.log('PDF loaded');

            // Save the PDF file into a global object
            pdfDoc = pdf;

            // iterate through all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                // Fetch the page
                pdf.getPage(i).then(page => {
                    console.log('Page loaded');

                    const scale = 1.5;
                    const viewport = page.getViewport({ scale: scale });

                    // Prepare canvas using PDF page dimensions
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    // Center canvas
                    canvas.style.marginLeft = 'auto';
                    canvas.style.marginRight = 'auto';
                    canvas.style.display = 'block';


                    // Render PDF page into canvas context
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    const renderTask = page.render(renderContext);
                    renderTask.promise.then(() => {
                        console.log('Page rendered');
                        document.getElementById('pdf-container').appendChild(canvas);
                    });
                });
            }


        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
    };

    fileReader.readAsArrayBuffer(file);
});

document.getElementById('delete-page').addEventListener('click', async () => {
    const pageNumber = parseInt(document.getElementById('page-number').value);
    if (pageNumber > 0 && pageNumber <= pdfDoc.getPageCount()) {
        pdfDoc.removePage(pageNumber - 1);
        const pdfBytes = await pdfDoc.save();

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.getElementById('download-link');
        downloadLink.href = url;
        downloadLink.download = 'modified_document.pdf';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Download Modified PDF';
    } else {
        alert('Invalid page number');
    }
});

// const file = event.target.files[0];
//     if (file.type !== 'application/pdf') {
//         console.error(file.name, 'is not a pdf file.');
//         return;
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);