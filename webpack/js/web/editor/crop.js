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

import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  Util,
} from "../util.js";
import { AnnotationEditor } from "./editor.js";
import { bindEvents } from "./tools.js";
import { ColorPicker } from "./color_picker.js";
import { Outliner } from "./outliner.js";

/**
 * Basic draw editor in order to generate an Highlight annotation.
 */
class CropEditor extends AnnotationEditor {

  #highlightDiv = null;

  #id = null;

  #opacity;

  static _l10nPromise;

  static _type = "crop";

  static _editorType = AnnotationEditorType.HIGHLIGHT;

  constructor(params) {
    super({ ...params, name: "highlightEditor" });
    this.color = params.color || HighlightEditor._defaultColor;
    this.#opacity = params.opacity || HighlightEditor._defaultOpacity;
    this.#boxes = params.boxes || null;
    this._isDraggable = false;

    this.#addToDrawLayer();
    this.rotate(this.rotation);
  }


  static initialize(l10n, uiManager) {
    AnnotationEditor.initialize(l10n, uiManager);
    HighlightEditor._defaultColor ||=
      uiManager.highlightColors?.values().next().value || "#fff066";
  }

  static updateDefaultParams(type, value) {
    switch (type) {
      case AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR:
        HighlightEditor._defaultColor = value;
        break;
    }
  }

  /** @inheritdoc */
  translateInPage(x, y) {}

  /** @inheritdoc */
  get toolbarPosition() {
    return this.#lastPoint;
  }

  /** @inheritdoc */
  updateParams(type, value) {
    switch (type) {
      case AnnotationEditorParamsType.HIGHLIGHT_COLOR:
        // this.#updateColor(value);
        break;
    }
  }

  static get defaultPropertiesToUpdate() {
    return [
      [
        AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR,
        HighlightEditor._defaultColor,
      ],
    ];
  }

  /** @inheritdoc */
  get propertiesToUpdate() {
    return [
      [
        AnnotationEditorParamsType.HIGHLIGHT_COLOR,
        this.color || HighlightEditor._defaultColor,
      ],
    ];
  }



  /** @inheritdoc */
  disableEditing() {
    super.disableEditing();
    this.div.classList.toggle("disabled", true);
  }

  /** @inheritdoc */
  enableEditing() {
    super.enableEditing();
    this.div.classList.toggle("disabled", false);
  }

  /** @inheritdoc */
  fixAndSetPosition() {
    return super.fixAndSetPosition(0);
  }

  /** @inheritdoc */
  getRect(tx, ty) {
    return super.getRect(tx, ty, 0);
  }

  /** @inheritdoc */
  onceAdded() {
    this.parent.addUndoableEditor(this);
    this.div.focus();
  }

  /** @inheritdoc */
  remove() {
    super.remove();
    this.#cleanDrawLayer();
  }

  /** @inheritdoc */
  rebuild() {
    if (!this.parent) {
      return;
    }
    super.rebuild();
    if (this.div === null) {
      return;
    }

    this.#addToDrawLayer();

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilting it,
      // hence we must add it to its parent.
      this.parent.add(this);
    }
  }

  setParent(parent) {
    let mustBeSelected = false;
    if (this.parent && !parent) {
      this.#cleanDrawLayer();
    } else if (parent) {
      this.#addToDrawLayer(parent);
      // If mustBeSelected is true it means that this editor was selected
      // when its parent has been destroyed, hence we must select it again.
      mustBeSelected =
        !this.parent && this.div?.classList.contains("selectedEditor");
    }
    super.setParent(parent);
    if (mustBeSelected) {
      // We select it after the parent has been set.
      this.select();
    }
  }

  #cleanDrawLayer() {
    if (this.#id === null || !this.parent) {
      return;
    }
    this.parent.drawLayer.remove(this.#id);
    this.#id = null;
    this.parent.drawLayer.remove(this.#outlineId);
    this.#outlineId = null;
  }

  #addToDrawLayer(parent = this.parent) {
    if (this.#id !== null) {
      return;
    }
    ({ id: this.#id, clipPathId: this.#clipPathId } =
      parent.drawLayer.highlight(
        this.#highlightOutlines,
        this.color,
        this.#opacity
      ));
    if (this.#highlightDiv) {
      this.#highlightDiv.style.clipPath = this.#clipPathId;
    }
    this.#outlineId = parent.drawLayer.highlightOutline(this.#focusOutlines);
  }

  static #rotateBbox({ x, y, width, height }, angle) {
    switch (angle) {
      case 90:
        return {
          x: 1 - y - height,
          y: x,
          width: height,
          height: width,
        };
      case 180:
        return {
          x: 1 - x - width,
          y: 1 - y - height,
          width,
          height,
        };
      case 270:
        return {
          x: y,
          y: 1 - x - width,
          width: height,
          height: width,
        };
    }
    return {
      x,
      y,
      width,
      height,
    };
  }

  /** @inheritdoc */
  rotate(angle) {
    const { drawLayer } = this.parent;
    drawLayer.rotate(this.#id, angle);
    drawLayer.rotate(this.#outlineId, angle);
    drawLayer.updateBox(this.#id, HighlightEditor.#rotateBbox(this, angle));
    drawLayer.updateBox(
      this.#outlineId,
      HighlightEditor.#rotateBbox(this.#focusOutlines.box, angle)
    );
  }

  /** @inheritdoc */
  render() {
    if (this.div) {
      return this.div;
    }

    const div = super.render();
    const highlightDiv = (this.#highlightDiv = document.createElement("div"));
    div.append(highlightDiv);
    highlightDiv.className = "internal";
    highlightDiv.style.clipPath = this.#clipPathId;
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.setDims(this.width * parentWidth, this.height * parentHeight);

    bindEvents(this, this.#highlightDiv, ["pointerover", "pointerleave"]);
    this.enableEditing();

    return div;
  }

  pointerover() {
    this.parent.drawLayer.addClass(this.#outlineId, "hovered");
  }

  pointerleave() {
    this.parent.drawLayer.removeClass(this.#outlineId, "hovered");
  }

  /** @inheritdoc */
  select() {
    super.select();
    this.parent?.drawLayer.removeClass(this.#outlineId, "hovered");
    this.parent?.drawLayer.addClass(this.#outlineId, "selected");
  }

  /** @inheritdoc */
  unselect() {
    super.unselect();
    this.parent?.drawLayer.removeClass(this.#outlineId, "selected");
  }

  #serializeBoxes(rect) {
    const [pageWidth, pageHeight] = this.pageDimensions;
    const boxes = this.#boxes;
    const quadPoints = new Array(boxes.length * 8);
    const [tx, ty] = rect;
    let i = 0;
    for (const { x, y, width, height } of boxes) {
      const sx = tx + x * pageWidth;
      const sy = ty + (1 - y - height) * pageHeight;
      // The specifications say that the rectangle should start from the bottom
      // left corner and go counter-clockwise.
      // But when opening the file in Adobe Acrobat it appears that this isn't
      // correct hence the 4th and 6th numbers are just swapped.
      quadPoints[i] = quadPoints[i + 4] = sx;
      quadPoints[i + 1] = quadPoints[i + 3] = sy;
      quadPoints[i + 2] = quadPoints[i + 6] = sx + width * pageWidth;
      quadPoints[i + 5] = quadPoints[i + 7] = sy + height * pageHeight;
      i += 8;
    }
    return quadPoints;
  }

  #serializeOutlines(rect) {
    return this.#highlightOutlines.serialize(rect, 0);
  }

  /** @inheritdoc */
  static deserialize(data, parent, uiManager) {
    const editor = super.deserialize(data, parent, uiManager);

    const {
      rect: [blX, blY, trX, trY],
      color,
      quadPoints,
    } = data;
    editor.color = Util.makeHexColor(...color);
    editor.#opacity = data.opacity;

    const [pageWidth, pageHeight] = editor.pageDimensions;
    editor.width = (trX - blX) / pageWidth;
    editor.height = (trY - blY) / pageHeight;
    const boxes = (editor.#boxes = []);
    for (let i = 0; i < quadPoints.length; i += 8) {
      boxes.push({
        x: (quadPoints[4] - trX) / pageWidth,
        y: (trY - (1 - quadPoints[i + 5])) / pageHeight,
        width: (quadPoints[i + 2] - quadPoints[i]) / pageWidth,
        height: (quadPoints[i + 5] - quadPoints[i + 1]) / pageHeight,
      });
    }
    editor.#createOutlines();

    return editor;
  }

  /** @inheritdoc */
  serialize(isForCopying = false) {
    // It doesn't make sense to copy/paste a highlight annotation.
    if (this.isEmpty() || isForCopying) {
      return null;
    }

    const rect = this.getRect(0, 0);
    const color = AnnotationEditor._colorManager.convert(this.color);

    return {
      annotationType: AnnotationEditorType.HIGHLIGHT,
      color,
      opacity: this.#opacity,
      quadPoints: this.#serializeBoxes(rect),
      outlines: this.#serializeOutlines(rect),
      pageIndex: this.pageIndex,
      rect,
      rotation: 0,
      structTreeParentId: this._structTreeParentId,
    };
  }

  static canCreateNewEmptyEditor() {
    return false;
  }
}

export { HighlightEditor };
