/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import Koa, {Context} from 'koa';
import Router from 'koa-router';
import serve from 'koa-static';
import koaBody from 'koa-body';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';

const app = new Koa();
const router = new Router();

// Serve static files
app.use(serve('./public'));

// Routes will be defined here

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// ... previous imports

// Route to upload PDF
router.post('/upload', koaBody({ multipart: true }), async (ctx: Context) => {
    const file = ctx.request.files?.file;

    if (file) {
        // Assuming file is uploaded to 'public/uploads'
        const filePath = `/mnt/c/Users/TheRe/Desktop/oxo.js/public/uploads/${file.originalFilename}`;
        const tempPath = file.filepath;
        await fs.copyFile(tempPath, filePath, (err) => {
            if (err) {
                console.log(err);
            }
        });
        await fs.unlink(tempPath, (err) => {
            if (err) {
                console.log(err);
            }
        });
        ctx.redirect(`/view-pdf?file=${filePath}`);
    } else {
        ctx.status = 400;
        ctx.body = 'No file uploaded';
    }
});

async function displayPDF(url: string): Promise<void> {
    // Ensure the workerSrc is set
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/mnt/c/Users/TheRe/Desktop/oxo.js/node_modules/pdfjs-dist/build/pdf.worker.mjs';
  
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
  
      // Example: Display the first page
      const page = await pdf.getPage(1);
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: 1.5 });
  
      canvas.height = viewport.height;
      canvas.width = viewport.width;
  
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (error) {
      console.error('Error loading PDF: ', error);
    }
  }
  

// Route to display PDF
router.get('/view-pdf', async (ctx: Context) => {
    // Get filepath from query string
    const filePath = ctx.query.file as string;
    if (filePath) {
        ctx.type = 'html';
        displayPDF(filePath);
        // ctx.body = `<embed src="${filePath}" width="100%" height="100%">`;
    } else {
        ctx.status = 400;
        ctx.body = 'File not specified';
    }
});

// ... rest of the server code

