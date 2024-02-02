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

/**
 * Basic draw editor in order to generate an Highlight annotation.
 */
class CropEditor extends AnnotationEditor {
  #id = null;

  static _l10nPromise;

  static _type = "crop";

  static _editorType = AnnotationEditorType.CROP;

  constructor(params) {
    super({ ...params, name: "cropeditor" });
    this._isDraggable = false;
  }


  static initialize(l10n, uiManager) {
    AnnotationEditor.initialize(l10n, uiManager);
  }

  /** @inheritdoc */
  translateInPage(x, y) { }



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


    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilting it,
      // hence we must add it to its parent.
      this.parent.add(this);
    }
  }

  setParent(parent) {
    let mustBeSelected = false;
    if (this.parent && !parent) {
    } else if (parent) {
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
  select() {
    super.select();
  }

  /** @inheritdoc */
  unselect() {
    super.unselect();
  }


  /** @inheritdoc */
  static deserialize(data, parent, uiManager) {
    const editor = super.deserialize(data, parent, uiManager);

    return editor;
  }

  /** @inheritdoc */
  serialize(isForCopying = false) {
    // It doesn't make sense to copy/paste a highlight annotation.
    if (this.isEmpty() || isForCopying) {
      return null;
    }

    const rect = this.getRect(0, 0);

    return {
      annotationType: AnnotationEditorType.CROP,
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

export { CropEditor };
