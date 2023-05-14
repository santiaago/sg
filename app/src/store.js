import { writable, derived } from "svelte/store";

export const items = writable({});
export const store = {
  subscribe: items.subscribe,
  add: (name, element, type) =>
    items.update((old) => {
      return {
        ...old,
        [name]: {
          name,
          element,
          selected: false,
          type,
        },
      };
    }),
  update: (k, o) =>
    items.update((old) => {
      return {
        ...old,
        [k]: {
          ...o,
        },
      };
    }),
};

export const itemsv2 = writable({});
export const storev2 = {
  subscribe: itemsv2.subscribe,
  add: (shape, element) =>
    itemsv2.update((old) => {
      return {
        ...old,
        [shape.name]: {
          name,
          element,
          selected: false,
          type: shape.type,
        },
      };
    }),
  update: (k, o) =>
    itemsv2.update((old) => {
      return {
        ...old,
        [k]: {
          ...o,
        },
      };
    }),
};

export const itemsv3 = writable({});
export const storev3 = {
  subscribe: itemsv3.subscribe,
  add: (shape, element) =>
    itemsv3.update((old) => {
      return {
        ...old,
        [shape.name]: {
          name,
          element,
          selected: false,
          type: shape.type,
        },
      };
    }),
  update: (k, o) =>
    itemsv3.update((old) => {
      return {
        ...old,
        [k]: {
          ...o,
        },
      };
    }),
};

export const itemsv4 = writable({});
export const storev4 = {
  subscribe: itemsv4.subscribe,
  add: (shape, element) =>
    itemsv4.update((old) => {
      return {
        ...old,
        [shape.name]: {
          name: shape.name,
          element,
          selected: false,
          type: shape.type,
          context: shape.context,
        },
      };
    }),
  update: (k, o) =>
    itemsv4.update((old) => {
      return {
        ...old,
        [k]: {
          ...o,
        },
      };
    }),
};
