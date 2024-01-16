;// CONCATENATED MODULE: ./web/annotation_editor_params.js

class AnnotationEditorParams {
    constructor(options, eventBus) {
      this.eventBus = eventBus;
      this.#bindListeners(options);
    }
    #bindListeners({
      editorFreeTextFontSize,
      editorFreeTextColor,
      editorInkColor,
      editorInkThickness,
      editorInkOpacity,
      editorStampAddImage
    }) {
      const dispatchEvent = (typeStr, value) => {
        this.eventBus.dispatch("switchannotationeditorparams", {
          source: this,
          type: AnnotationEditorParamsType[typeStr],
          value
        });
      };
      editorFreeTextFontSize.addEventListener("input", function () {
        dispatchEvent("FREETEXT_SIZE", this.valueAsNumber);
      });
      editorFreeTextColor.addEventListener("input", function () {
        dispatchEvent("FREETEXT_COLOR", this.value);
      });
      editorInkColor.addEventListener("input", function () {
        dispatchEvent("INK_COLOR", this.value);
      });
      editorInkThickness.addEventListener("input", function () {
        dispatchEvent("INK_THICKNESS", this.valueAsNumber);
      });
      editorInkOpacity.addEventListener("input", function () {
        dispatchEvent("INK_OPACITY", this.valueAsNumber);
      });
      editorStampAddImage.addEventListener("click", () => {
        dispatchEvent("CREATE");
      });
      this.eventBus._on("annotationeditorparamschanged", evt => {
        for (const [type, value] of evt.details) {
          switch (type) {
            case AnnotationEditorParamsType.FREETEXT_SIZE:
              editorFreeTextFontSize.value = value;
              break;
            case AnnotationEditorParamsType.FREETEXT_COLOR:
              editorFreeTextColor.value = value;
              break;
            case AnnotationEditorParamsType.INK_COLOR:
              editorInkColor.value = value;
              break;
            case AnnotationEditorParamsType.INK_THICKNESS:
              editorInkThickness.value = value;
              break;
            case AnnotationEditorParamsType.INK_OPACITY:
              editorInkOpacity.value = value;
              break;
          }
        }
      });
    }
  }
  