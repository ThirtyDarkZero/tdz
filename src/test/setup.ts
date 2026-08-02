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

// Radix UI relies on these APIs which jsdom does not implement.
const w = window as any;
if (!w.ResizeObserver) {
  w.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const proto = Element.prototype as any;
if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
if (!proto.hasPointerCapture) {
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
}
