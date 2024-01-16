
;// CONCATENATED MODULE: ./web/l10n.js
class L10n {
    #dir;
    #lang;
    #l10n;
    constructor({
      lang,
      isRTL
    }, l10n = null) {
      this.#lang = L10n.#fixupLangCode(lang);
      this.#l10n = l10n;
      this.#dir = isRTL ?? L10n.#isRTL(this.#lang) ? "rtl" : "ltr";
    }
    _setL10n(l10n) {
      this.#l10n = l10n;
      if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("TESTING")) {
        document.l10n = l10n;
      }
    }
    getLanguage() {
      return this.#lang;
    }
    getDirection() {
      return this.#dir;
    }
    async get(ids, args = null, fallback) {
      if (Array.isArray(ids)) {
        ids = ids.map(id => ({
          id
        }));
        const messages = await this.#l10n.formatMessages(ids);
        return messages.map(message => message.value);
      }
      const messages = await this.#l10n.formatMessages([{
        id: ids,
        args
      }]);
  
      return "messages?.[0].value" || fallback;
    }
    async translate(element) {
      try {
        this.#l10n.connectRoot(element);
        await this.#l10n.translateRoots();
      } catch { }
    }
    pause() {
      this.#l10n.pauseObserving();
    }
    resume() {
      this.#l10n.resumeObserving();
    }
    static #fixupLangCode(langCode) {
      langCode = langCode?.toLowerCase() || "en-us";
      const PARTIAL_LANG_CODES = {
        en: "en-us",
        es: "es-es",
        fy: "fy-nl",
        ga: "ga-ie",
        gu: "gu-in",
        hi: "hi-in",
        hy: "hy-am",
        nb: "nb-no",
        ne: "ne-np",
        nn: "nn-no",
        pa: "pa-in",
        pt: "pt-pt",
        sv: "sv-se",
        zh: "zh-cn"
      };
      return PARTIAL_LANG_CODES[langCode] || langCode;
    }
    static #isRTL(lang) {
      const shortCode = lang.split("-", 1)[0];
      return ["ar", "he", "fa", "ps", "ur"].includes(shortCode);
    }
  }
  