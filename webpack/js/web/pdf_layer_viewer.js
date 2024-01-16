
;// CONCATENATED MODULE: ./web/pdf_layer_viewer.js

class PDFLayerViewer extends BaseTreeViewer {
    constructor(options) {
      super(options);
      this.eventBus._on("optionalcontentconfigchanged", evt => {
        this.#updateLayers(evt.promise);
      });
      this.eventBus._on("resetlayers", () => {
        this.#updateLayers();
      });
      this.eventBus._on("togglelayerstree", this._toggleAllTreeItems.bind(this));
    }
    reset() {
      super.reset();
      this._optionalContentConfig = null;
      this._optionalContentHash = null;
    }
    _dispatchEvent(layersCount) {
      this.eventBus.dispatch("layersloaded", {
        source: this,
        layersCount
      });
    }
    _bindLink(element, {
      groupId,
      input
    }) {
      const setVisibility = () => {
        this._optionalContentConfig.setVisibility(groupId, input.checked);
        this._optionalContentHash = this._optionalContentConfig.getHash();
        this.eventBus.dispatch("optionalcontentconfig", {
          source: this,
          promise: Promise.resolve(this._optionalContentConfig)
        });
      };
      element.onclick = evt => {
        if (evt.target === input) {
          setVisibility();
          return true;
        } else if (evt.target !== element) {
          return true;
        }
        input.checked = !input.checked;
        setVisibility();
        return false;
      };
    }
    async _setNestedName(element, {
      name = null
    }) {
      if (typeof name === "string") {
        element.textContent = this._normalizeTextContent(name);
        return;
      }
      element.textContent = await this._l10n.get("pdfjs-additional-layers");
      element.style.fontStyle = "italic";
    }
    _addToggleButton(div, {
      name = null
    }) {
      super._addToggleButton(div, name === null);
    }
    _toggleAllTreeItems() {
      if (!this._optionalContentConfig) {
        return;
      }
      super._toggleAllTreeItems();
    }
    render({
      optionalContentConfig,
      pdfDocument
    }) {
      if (this._optionalContentConfig) {
        this.reset();
      }
      this._optionalContentConfig = optionalContentConfig || null;
      this._pdfDocument = pdfDocument || null;
      const groups = optionalContentConfig?.getOrder();
      if (!groups) {
        this._dispatchEvent(0);
        return;
      }
      this._optionalContentHash = optionalContentConfig.getHash();
      const fragment = document.createDocumentFragment(),
        queue = [{
          parent: fragment,
          groups
        }];
      let layersCount = 0,
        hasAnyNesting = false;
      while (queue.length > 0) {
        const levelData = queue.shift();
        for (const groupId of levelData.groups) {
          const div = document.createElement("div");
          div.className = "treeItem";
          const element = document.createElement("a");
          div.append(element);
          if (typeof groupId === "object") {
            hasAnyNesting = true;
            this._addToggleButton(div, groupId);
            this._setNestedName(element, groupId);
            const itemsDiv = document.createElement("div");
            itemsDiv.className = "treeItems";
            div.append(itemsDiv);
            queue.push({
              parent: itemsDiv,
              groups: groupId.order
            });
          } else {
            const group = optionalContentConfig.getGroup(groupId);
            const input = document.createElement("input");
            this._bindLink(element, {
              groupId,
              input
            });
            input.type = "checkbox";
            input.checked = group.visible;
            const label = document.createElement("label");
            label.textContent = this._normalizeTextContent(group.name);
            label.append(input);
            element.append(label);
            layersCount++;
          }
          levelData.parent.append(div);
        }
      }
      this._finishRendering(fragment, layersCount, hasAnyNesting);
    }
    async #updateLayers(promise = null) {
      if (!this._optionalContentConfig) {
        return;
      }
      const pdfDocument = this._pdfDocument;
      const optionalContentConfig = await (promise || pdfDocument.getOptionalContentConfig());
      if (pdfDocument !== this._pdfDocument) {
        return;
      }
      if (promise) {
        if (optionalContentConfig.getHash() === this._optionalContentHash) {
          return;
        }
      } else {
        this.eventBus.dispatch("optionalcontentconfig", {
          source: this,
          promise: Promise.resolve(optionalContentConfig)
        });
      }
      this.render({
        optionalContentConfig,
        pdfDocument: this._pdfDocument
      });
    }
  }
  