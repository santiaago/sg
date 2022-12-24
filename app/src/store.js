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
