import { writable, derived } from "svelte/store";

export const items = writable({});
export const store = {
  subscribe: items.subscribe,
  add: (k, o) =>
    items.update((old) => {
      return {
        ...old,
        [k]: o,
      };
    }),
  update: (k, o) => store.add(k, o),
};
