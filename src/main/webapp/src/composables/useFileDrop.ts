import { ref } from "vue";

/**
 * Drag-and-drop + file-input plumbing for "paste a text file into a
 * textarea" UX. Reads the dropped/picked file as UTF-8 text and hands
 * the contents to `onContent`.
 *
 * Returns:
 *  - `isDragging` — toggle for dropzone hover styling
 *  - `fileInputRef` — attach to the hidden `<input type="file">` as a
 *    template ref
 *  - `onDragEnter` / `onDragLeave` / `onDragOver` / `onDrop` — wire to
 *    the dropzone element
 *  - `onFileInputChange` — wire to the hidden input's @change
 *  - `openPicker` — invoke from your "browse" button to trigger the
 *    hidden input
 */
export function useFileDrop(onContent: (text: string) => void) {
  const isDragging = ref(false);
  const fileInputRef = ref<HTMLInputElement | null>(null);

  function readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onContent(content);
    };
    reader.readAsText(file);
  }

  function onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) readFile(file);
  }

  function onDragEnter(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = true;
  }

  function onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = false;
  }

  function onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  function onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  }

  function openPicker(): void {
    fileInputRef.value?.click();
  }

  return {
    isDragging,
    fileInputRef,
    onFileInputChange,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    openPicker,
  };
}
