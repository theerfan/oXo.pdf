;// CONCATENATED MODULE: ./web/overlay_manager.js
class OverlayManager {
    #overlays = new WeakMap();
    #active = null;
    get active() {
      return this.#active;
    }
    async register(dialog, canForceClose = false) {
      if (typeof dialog !== "object") {
        throw new Error("Not enough parameters.");
      } else if (this.#overlays.has(dialog)) {
        throw new Error("The overlay is already registered.");
      }
      this.#overlays.set(dialog, {
        canForceClose
      });
      dialog.addEventListener("cancel", evt => {
        this.#active = null;
      });
    }
    async open(dialog) {
      if (!this.#overlays.has(dialog)) {
        throw new Error("The overlay does not exist.");
      } else if (this.#active) {
        if (this.#active === dialog) {
          throw new Error("The overlay is already active.");
        } else if (this.#overlays.get(dialog).canForceClose) {
          await this.close();
        } else {
          throw new Error("Another overlay is currently active.");
        }
      }
      this.#active = dialog;
      dialog.showModal();
    }
    async close(dialog = this.#active) {
      if (!this.#overlays.has(dialog)) {
        throw new Error("The overlay does not exist.");
      } else if (!this.#active) {
        throw new Error("The overlay is currently not active.");
      } else if (this.#active !== dialog) {
        throw new Error("Another overlay is currently active.");
      }
      dialog.close();
      this.#active = null;
    }
  }