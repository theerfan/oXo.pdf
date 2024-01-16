
;// CONCATENATED MODULE: ./web/struct_tree_layer_builder.js

const PDF_ROLE_TO_HTML_ROLE = {
    Document: null,
    DocumentFragment: null,
    Part: "group",
    Sect: "group",
    Div: "group",
    Aside: "note",
    NonStruct: "none",
    P: null,
    H: "heading",
    Title: null,
    FENote: "note",
    Sub: "group",
    Lbl: null,
    Span: null,
    Em: null,
    Strong: null,
    Link: "link",
    Annot: "note",
    Form: "form",
    Ruby: null,
    RB: null,
    RT: null,
    RP: null,
    Warichu: null,
    WT: null,
    WP: null,
    L: "list",
    LI: "listitem",
    LBody: null,
    Table: "table",
    TR: "row",
    TH: "columnheader",
    TD: "cell",
    THead: "columnheader",
    TBody: null,
    TFoot: null,
    Caption: null,
    Figure: "figure",
    Formula: null,
    Artifact: null
  };
  const HEADING_PATTERN = /^H(\d+)$/;
  class StructTreeLayerBuilder {
    #treeDom = undefined;
    get renderingDone() {
      return this.#treeDom !== undefined;
    }
    render(structTree) {
      if (this.#treeDom !== undefined) {
        return this.#treeDom;
      }
      const treeDom = this.#walk(structTree);
      treeDom?.classList.add("structTree");
      return this.#treeDom = treeDom;
    }
    hide() {
      if (this.#treeDom && !this.#treeDom.hidden) {
        this.#treeDom.hidden = true;
      }
    }
    show() {
      if (this.#treeDom?.hidden) {
        this.#treeDom.hidden = false;
      }
    }
    #setAttributes(structElement, htmlElement) {
      const {
        alt,
        id,
        lang
      } = structElement;
      if (alt !== undefined) {
        htmlElement.setAttribute("aria-label", removeNullCharacters(alt));
      }
      if (id !== undefined) {
        htmlElement.setAttribute("aria-owns", id);
      }
      if (lang !== undefined) {
        htmlElement.setAttribute("lang", removeNullCharacters(lang, true));
      }
    }
    #walk(node) {
      if (!node) {
        return null;
      }
      const element = document.createElement("span");
      if ("role" in node) {
        const {
          role
        } = node;
        const match = role.match(HEADING_PATTERN);
        if (match) {
          element.setAttribute("role", "heading");
          element.setAttribute("aria-level", match[1]);
        } else if (PDF_ROLE_TO_HTML_ROLE[role]) {
          element.setAttribute("role", PDF_ROLE_TO_HTML_ROLE[role]);
        }
      }
      this.#setAttributes(node, element);
      if (node.children) {
        if (node.children.length === 1 && "id" in node.children[0]) {
          this.#setAttributes(node.children[0], element);
        } else {
          for (const kid of node.children) {
            element.append(this.#walk(kid));
          }
        }
      }
      return element;
    }
  }
  