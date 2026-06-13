import type { PhantomUiAttributes } from "@aejkatappaja/phantom-ui";

// Mendaftarkan custom element <phantom-ui> ke JSX (React).
declare module "react/jsx-runtime" {
  export namespace JSX {
    interface IntrinsicElements {
      "phantom-ui": PhantomUiAttributes;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "phantom-ui": PhantomUiAttributes;
    }
  }
}
