import { ref } from 'vue';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

/**
 * Reactive list of {key, value} rows with add/remove/update/clear plus
 * helpers to round-trip with a `Record<string, string>` (used for
 * query-param and custom-header form sections).
 *
 * `idPrefix` distinguishes generated row ids — pass e.g. 'qp' or 'ch'
 * so query-param and header rows can be told apart in DOM keys.
 */
export function useKeyValueList(idPrefix: string) {
  const items = ref<KeyValuePair[]>([]);

  function generateId(seedIndex: number): string {
    return `${idPrefix}-${Date.now()}-${seedIndex}`;
  }

  function add(): void {
    items.value.push({ id: generateId(items.value.length), key: '', value: '' });
  }

  function remove(index: number): void {
    items.value.splice(index, 1);
  }

  function update(index: number, field: 'key' | 'value', value: string): void {
    items.value[index][field] = value;
  }

  function clear(): void {
    items.value = [];
  }

  function setFromRecord(record: Record<string, string> | undefined): void {
    if (!record) {
      items.value = [];
      return;
    }
    items.value = Object.entries(record).map(([key, value], i) => ({
      id: generateId(i),
      key,
      value,
    }));
  }

  // Collapse non-empty rows into a Record. Returns undefined if nothing
  // would survive — XRoadRequest omits empty headers/queryParams entirely.
  function toRecord(): Record<string, string> | undefined {
    if (items.value.length === 0) return undefined;
    const record: Record<string, string> = {};
    for (const item of items.value) {
      if (item.key && item.value) record[item.key] = item.value;
    }
    return Object.keys(record).length > 0 ? record : undefined;
  }

  return { items, add, remove, update, clear, setFromRecord, toRecord };
}
