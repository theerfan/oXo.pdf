
;// CONCATENATED MODULE: ./web/event_utils.js
const WaitOnType = {
    EVENT: "event",
    TIMEOUT: "timeout"
  };
  function waitOnEventOrTimeout({
    target,
    name,
    delay = 0
  }) {
    return new Promise(function (resolve, reject) {
      if (typeof target !== "object" || !(name && typeof name === "string") || !(Number.isInteger(delay) && delay >= 0)) {
        throw new Error("waitOnEventOrTimeout - invalid parameters.");
      }
      function handler(type) {
        if (target instanceof EventBus) {
          target._off(name, eventHandler);
        } else {
          target.removeEventListener(name, eventHandler);
        }
        if (timeout) {
          clearTimeout(timeout);
        }
        resolve(type);
      }
      const eventHandler = handler.bind(null, WaitOnType.EVENT); 
      if (target instanceof EventBus) {
        target._on(name, eventHandler);
      } else {
        target.addEventListener(name, eventHandler);
      }
      const timeoutHandler = handler.bind(null, WaitOnType.TIMEOUT);
      const timeout = setTimeout(timeoutHandler, delay);
    });
  }
  class EventBus {
    #listeners = Object.create(null);
    on(eventName, listener, options = null) {
      this._on(eventName, listener, {
        external: true,
        once: options?.once
      });
    }
    off(eventName, listener, options = null) {
      this._off(eventName, listener, {
        external: true,
        once: options?.once
      });
    }
    dispatch(eventName, data) {
      const eventListeners = this.#listeners[eventName];
      if (!eventListeners || eventListeners.length === 0) {
        return;
      }
      let externalListeners;
      for (const {
        listener,
        external,
        once
      } of eventListeners.slice(0)) {
        if (once) {
          this._off(eventName, listener);
        }
        if (external) {
          (externalListeners ||= []).push(listener);
          continue;
        }
        listener(data);
      }
      if (externalListeners) {
        for (const listener of externalListeners) {
          listener(data);
        }
        externalListeners = null;
      }
    }
    _on(eventName, listener, options = null) {
      const eventListeners = this.#listeners[eventName] ||= [];
      eventListeners.push({
        listener,
        external: options?.external === true,
        once: options?.once === true
      });
    }
    _off(eventName, listener, options = null) {
      const eventListeners = this.#listeners[eventName];
      if (!eventListeners) {
        return;
      }
      for (let i = 0, ii = eventListeners.length; i < ii; i++) {
        if (eventListeners[i].listener === listener) {
          eventListeners.splice(i, 1);
          return;
        }
      }
    }
  }
  class AutomationEventBus extends EventBus {
    dispatch(eventName, data) {
      super.dispatch(eventName, data);
      const detail = Object.create(null);
      if (data) {
        for (const key in data) {
          const value = data[key];
          if (key === "source") {
            if (value === window || value === document) {
              return;
            }
            continue;
          }
          detail[key] = value;
        }
      }
      const event = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail
      });
      document.dispatchEvent(event);
    }
  }
  