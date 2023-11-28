document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
        console.error(file.name, 'is not a pdf file.');
        return;
    }

    const fileReader = new FileReader();

    fileReader.onload = function() {
        const typedArray = new Uint8Array(this.result);

        // Load the PDF file
        pdfjsLib.getDocument({data: typedArray}).promise.then(pdf => {
            console.log('PDF loaded');
            
            // Fetch the first page
            pdf.getPage(1).then(page => {
                console.log('Page loaded');
                
                const scale = 1.5;
                const viewport = page.getViewport({scale: scale});

                // Prepare canvas using PDF page dimensions
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

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
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
    };

    fileReader.readAsArrayBuffer(file);
});
