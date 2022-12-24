import { writable, derived } from "svelte/store";

export const items = writable({});
export const store = {
  subscribe: items.subscribe,
  add: (k, o) =>
    items.update((old) => {
      return {
        ...old,
        [k]: {
          name: k,
          element: o,
          selected: false,
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
