
;// CONCATENATED MODULE: ./web/pdf_attachment_viewer.js

class PDFAttachmentViewer extends BaseTreeViewer {
    constructor(options) {
      super(options);
      this.downloadManager = options.downloadManager;
      this.eventBus._on("fileattachmentannotation", this.#appendAttachment.bind(this));
    }
    reset(keepRenderedCapability = false) {
      super.reset();
      this._attachments = null;
      if (!keepRenderedCapability) {
        this._renderedCapability = new PromiseCapability();
      }
      this._pendingDispatchEvent = false;
    }
    async _dispatchEvent(attachmentsCount) {
      this._renderedCapability.resolve();
      if (attachmentsCount === 0 && !this._pendingDispatchEvent) {
        this._pendingDispatchEvent = true;
        await waitOnEventOrTimeout({
          target: this.eventBus,
          name: "annotationlayerrendered",
          delay: 1000
        });
        if (!this._pendingDispatchEvent) {
          return;
        }
      }
      this._pendingDispatchEvent = false;
      this.eventBus.dispatch("attachmentsloaded", {
        source: this,
        attachmentsCount
      });
    }
    _bindLink(element, {
      content,
      filename
    }) {
      element.onclick = () => {
        this.downloadManager.openOrDownloadData(content, filename);
        return false;
      };
    }
    render({
      attachments,
      keepRenderedCapability = false
    }) {
      if (this._attachments) {
        this.reset(keepRenderedCapability);
      }
      this._attachments = attachments || null;
      if (!attachments) {
        this._dispatchEvent(0);
        return;
      }
      const fragment = document.createDocumentFragment();
      let attachmentsCount = 0;
      for (const name in attachments) {
        const item = attachments[name];
        const content = item.content,
          filename = getFilenameFromUrl(item.filename, true);
        const div = document.createElement("div");
        div.className = "treeItem";
        const element = document.createElement("a");
        this._bindLink(element, {
          content,
          filename
        });
        element.textContent = this._normalizeTextContent(filename);
        div.append(element);
        fragment.append(div);
        attachmentsCount++;
      }
      this._finishRendering(fragment, attachmentsCount);
    }
    #appendAttachment({
      filename,
      content
    }) {
      const renderedPromise = this._renderedCapability.promise;
      renderedPromise.then(() => {
        if (renderedPromise !== this._renderedCapability.promise) {
          return;
        }
        const attachments = this._attachments || Object.create(null);
        for (const name in attachments) {
          if (filename === name) {
            return;
          }
        }
        attachments[filename] = {
          filename,
          content
        };
        this.render({
          attachments,
          keepRenderedCapability: true
        });
      });
    }
  }
  