;// CONCATENATED MODULE: ./web/password_prompt.js

class PasswordPrompt {
    #activeCapability = null;
    #updateCallback = null;
    #reason = null;
    constructor(options, overlayManager, isViewerEmbedded = false) {
      this.dialog = options.dialog;
      this.label = options.label;
      this.input = options.input;
      this.submitButton = options.submitButton;
      this.cancelButton = options.cancelButton;
      this.overlayManager = overlayManager;
      this._isViewerEmbedded = isViewerEmbedded;
      this.submitButton.addEventListener("click", this.#verify.bind(this));
      this.cancelButton.addEventListener("click", this.close.bind(this));
      this.input.addEventListener("keydown", e => {
        if (e.keyCode === 13) {
          this.#verify();
        }
      });
      this.overlayManager.register(this.dialog, true);
      this.dialog.addEventListener("close", this.#cancel.bind(this));
    }
    async open() {
      if (this.#activeCapability) {
        await this.#activeCapability.promise;
      }
      this.#activeCapability = new PromiseCapability();
      try {
        await this.overlayManager.open(this.dialog);
      } catch (ex) {
        this.#activeCapability.resolve();
        throw ex;
      }
      const passwordIncorrect = this.#reason === PasswordResponses.INCORRECT_PASSWORD;
      if (!this._isViewerEmbedded || passwordIncorrect) {
        this.input.focus();
      }
      this.label.setAttribute("data-l10n-id", `pdfjs-password-${passwordIncorrect ? "invalid" : "label"}`);
    }
    async close() {
      if (this.overlayManager.active === this.dialog) {
        this.overlayManager.close(this.dialog);
      }
    }
    #verify() {
      const password = this.input.value;
      if (password?.length > 0) {
        this.#invokeCallback(password);
      }
    }
    #cancel() {
      this.#invokeCallback(new Error("PasswordPrompt cancelled."));
      this.#activeCapability.resolve();
    }
    #invokeCallback(password) {
      if (!this.#updateCallback) {
        return;
      }
      this.close();
      this.input.value = "";
      this.#updateCallback(password);
      this.#updateCallback = null;
    }
    async setUpdateCallback(updateCallback, reason) {
      if (this.#activeCapability) {
        await this.#activeCapability.promise;
      }
      this.#updateCallback = updateCallback;
      this.#reason = reason;
    }
  }
  