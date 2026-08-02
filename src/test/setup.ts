import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Radix UI relies on these in jsdom
if (!window.ResizeObserver) {
  // @ts-expect-error test shim
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  // @ts-expect-error test shim
  Element.prototype.hasPointerCapture = () => false;
  // @ts-expect-error test shim
  Element.prototype.setPointerCapture = () => {};
  // @ts-expect-error test shim
  Element.prototype.releasePointerCapture = () => {};
}
