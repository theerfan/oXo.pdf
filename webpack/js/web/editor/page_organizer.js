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


class PageOrganizer {
    constructor(params) {
        // this.createPageNumberInput();

        // Add undo and redo stack
        this.undoStack = [];
        this.redoStack = [];

        document.addEventListener('keydown', async (event) => {
            if (event.ctrlKey && event.key === 'z') { // Undo
                if (this.undoStack.length > 0) {
                    // const [currentPageNumber, currentPageDiv, pageRect] = this.getPageRect(window.PDFViewerApplication);
                    // const libPdfDoc = window.PDFViewerApplication.pdfDoc;
                    // const pdfLibPage = libPdfDoc.getPages()[currentPageNumber - 1];
                    // const initialCropBox = this.undoStack.pop();
                    // this.redoStack.push(pdfLibPage.getCropBox());
                    // pdfLibPage.setCropBox(initialCropBox.x, initialCropBox.y, initialCropBox.width, initialCropBox.height);
                    // const pdfBytes = await libPdfDoc.save();
                    // window.PDFViewerApplication.open({
                    //     data: pdfBytes,
                    // });
                    // currentPageDiv.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (event.ctrlKey && event.key === 'y') { // Redo
                if (this.redoStack.length > 0) {
                    // const [currentPageNumber, currentPageDiv, pageRect] = this.getPageRect(window.PDFViewerApplication);
                    // const libPdfDoc = window.PDFViewerApplication.pdfDoc;
                    // const pdfLibPage = libPdfDoc.getPages()[currentPageNumber - 1];
                    // const initialCropBox = this.redoStack.pop();
                    // this.undoStack.push(pdfLibPage.getCropBox());
                    // pdfLibPage.setCropBox(initialCropBox.x, initialCropBox.y, initialCropBox.width, initialCropBox.height);
                    // const pdfBytes = await libPdfDoc.save();
                    // window.PDFViewerApplication.open({
                    //     data: pdfBytes,
                    // });
                    // currentPageDiv.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

    }

    copyAndPushToStack(originalArray, stack) {
        // Copy the original Uint8Array
        const newArray = new Uint8Array(originalArray.length);
        newArray.set(originalArray);

        // Alternatively, use slice for a more concise approach
        // const newArray = originalArray.slice();

        // Push the copied array onto the stack
        stack.push(newArray);

        // Return the new array for reference, if needed
        return newArray;
    }


    async insertPage(insertAt) {
        const PDFViewerApplication = window.PDFViewerApplication;
        const libPdfDoc = PDFViewerApplication.pdfDoc;
        const pageSize = libPdfDoc.getPage(insertAt - 1).getSize();
        const pagesizeList = [pageSize.width, pageSize.height]
        const blankPage = libPdfDoc.insertPage(insertAt - 1, pagesizeList);
        const pdfBytes = await libPdfDoc.save();
        this.copyAndPushToStack(pdfBytes, this.undoStack);
        this.redoStack = [];
        PDFViewerApplication.open({
            data: pdfBytes,
        });
    }

    async deletePage(deleteAt) {
        const PDFViewerApplication = window.PDFViewerApplication;
        const libPdfDoc = PDFViewerApplication.pdfDoc;
        libPdfDoc.removePage(deleteAt - 1);
        const pdfBytes = await libPdfDoc.save();
        this.copyAndPushToStack(pdfBytes, this.undoStack);
        this.redoStack = [];
        PDFViewerApplication.open({
            data: pdfBytes,
        });
    }

    createPageNumberInput(event) {
        let button;
        if (event.name === "insertpage") {
            button = document.getElementById("insertPage");
        }
        else if (event.name === "deletepage") {
            button = document.getElementById("deletePage");
        }
        else {
            return;
        }

        // If there's no input field, add one
        if (button.getElementsByTagName("input").length > 0) {
            return;
        }

        // Add a small input field to the button
        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = window.PDFViewerApplication.pagesCount;
        input.value = "1";
        input.style.width = "3em";
        input.style.marginLeft = "5px";
        button.appendChild(input);

        // Add event listener to the input field
        // to read the value when the user presses enter
        input.addEventListener("keyup", async (keyboardEvent) => {
            if (keyboardEvent.key === "Enter") {
                const pageNumber = parseInt(input.value);
                if (pageNumber < 1 || pageNumber > window.PDFViewerApplication.pagesCount) {
                    return;
                }
                if (event.name === "insertpage") {
                    await this.insertPage(pageNumber);
                }
                else if (event.name === "deletepage") {
                    await this.deletePage(pageNumber);
                }
                // Remove the input field
                button.removeChild(input);
            }
        });
    }


    async confirmCrop() {
        const PDFViewerApplication = window.PDFViewerApplication;

    }

}

export { PageOrganizer };
