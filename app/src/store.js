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
