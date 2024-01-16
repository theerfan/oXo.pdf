;// CONCATENATED MODULE: ./web/print_utils.js

function getXfaHtmlForPrinting(printContainer, pdfDocument) {
    const xfaHtml = pdfDocument.allXfaHtml;
    const linkService = new SimpleLinkService();
    const scale = Math.round(PixelsPerInch.PDF_TO_CSS_UNITS * 100) / 100;
    for (const xfaPage of xfaHtml.children) {
      const page = document.createElement("div");
      page.className = "xfaPrintedPage";
      printContainer.append(page);
      const builder = new XfaLayerBuilder({
        pdfPage: null,
        annotationStorage: pdfDocument.annotationStorage,
        linkService,
        xfaHtml: xfaPage
      });
      const viewport = getXfaPageViewport(xfaPage, {
        scale
      });
      builder.render(viewport, "print");
      page.append(builder.div);
    }
  }