3/**
 * Vuetify wraps items as `ListItem<T>` in the autocomplete/combobox
 * `#item` slot, exposing the original under `.raw`. Vuetify's TS types
 * don't reach the slot scope cleanly, so we narrow via unknown.
 *
 * Usage:
 *   <template #item="{ props, item }">
 *     {{ rawOf<MyType>(item).raw.someField }}
 *   </template>
 */
export type RawItem<T> = { raw: T };

export function rawOf<T>(item: unknown): RawItem<T> {
  return item as RawItem<T>;
}
