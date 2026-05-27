import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFileDrop } from "../useFileDrop";

function makeTextFile(content: string, name = "test.pem"): File {
  return new File([content], name, { type: "text/plain" });
}

function makeDragEvent(file?: File): DragEvent {
  const event = new Event("drop", { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, "dataTransfer", {
    value: {
      files: file ? [file] : [],
    },
  });
  return event;
}

// FileReader in happy-dom may be async; provide a deterministic stub.
class StubFileReader {
  result: string | null = null;
  onload: ((event: { target: { result: string } }) => void) | null = null;
  readAsText(file: { text?: () => Promise<string> }): void {
    // Synthetic synchronous-ish read for tests.
    const content = (file as unknown as { content: string }).content;
    this.result = content;
    queueMicrotask(() => {
      this.onload?.({ target: { result: content } });
    });
  }
}

describe("useFileDrop", () => {
  let originalFileReader: typeof FileReader;

  beforeEach(() => {
    originalFileReader = global.FileReader;
    // Use a stub that reads a synthetic .content property — we attach it
    // to File objects in the tests below.
    (global as unknown as { FileReader: unknown }).FileReader = StubFileReader;
  });

  afterEach(() => {
    (global as unknown as { FileReader: typeof FileReader }).FileReader = originalFileReader;
  });

  it("starts not dragging", () => {
    const { isDragging } = useFileDrop(() => undefined);
    expect(isDragging.value).toBe(false);
  });

  describe("drag events", () => {
    it("onDragEnter sets isDragging=true and prevents default", () => {
      const { isDragging, onDragEnter } = useFileDrop(() => undefined);
      const event = new Event("dragenter") as DragEvent;
      const prevent = vi.spyOn(event, "preventDefault");
      const stop = vi.spyOn(event, "stopPropagation");

      onDragEnter(event);

      expect(isDragging.value).toBe(true);
      expect(prevent).toHaveBeenCalled();
      expect(stop).toHaveBeenCalled();
    });

    it("onDragLeave sets isDragging=false", () => {
      const { isDragging, onDragEnter, onDragLeave } = useFileDrop(() => undefined);
      onDragEnter(new Event("dragenter") as DragEvent);
      expect(isDragging.value).toBe(true);

      onDragLeave(new Event("dragleave") as DragEvent);
      expect(isDragging.value).toBe(false);
    });

    it("onDragOver prevents default (required for drop to fire)", () => {
      const { onDragOver } = useFileDrop(() => undefined);
      const event = new Event("dragover") as DragEvent;
      const prevent = vi.spyOn(event, "preventDefault");

      onDragOver(event);

      expect(prevent).toHaveBeenCalled();
    });
  });

  describe("onDrop", () => {
    it("reads the dropped file and calls onContent with its text", async () => {
      const onContent = vi.fn();
      const { onDrop } = useFileDrop(onContent);

      const file = makeTextFile("-----BEGIN CERTIFICATE-----");
      Object.defineProperty(file, "content", { value: "-----BEGIN CERTIFICATE-----" });

      onDrop(makeDragEvent(file));
      await Promise.resolve();
      await Promise.resolve();

      expect(onContent).toHaveBeenCalledWith("-----BEGIN CERTIFICATE-----");
    });

    it("clears isDragging after drop", () => {
      const { isDragging, onDragEnter, onDrop } = useFileDrop(() => undefined);
      onDragEnter(new Event("dragenter") as DragEvent);
      onDrop(makeDragEvent());
      expect(isDragging.value).toBe(false);
    });

    it("does nothing when the drop has no files", () => {
      const onContent = vi.fn();
      const { onDrop } = useFileDrop(onContent);
      onDrop(makeDragEvent());
      expect(onContent).not.toHaveBeenCalled();
    });
  });

  describe("onFileInputChange", () => {
    it("reads the selected file", async () => {
      const onContent = vi.fn();
      const { onFileInputChange } = useFileDrop(onContent);

      const file = makeTextFile("hello");
      Object.defineProperty(file, "content", { value: "hello" });

      const event = {
        target: { files: [file] },
      } as unknown as Event;

      onFileInputChange(event);
      await Promise.resolve();
      await Promise.resolve();

      expect(onContent).toHaveBeenCalledWith("hello");
    });

    it("does nothing when no file selected", () => {
      const onContent = vi.fn();
      const { onFileInputChange } = useFileDrop(onContent);

      const event = { target: { files: [] } } as unknown as Event;
      onFileInputChange(event);

      expect(onContent).not.toHaveBeenCalled();
    });
  });

  describe("openPicker", () => {
    it("clicks the file input ref", () => {
      const { fileInputRef, openPicker } = useFileDrop(() => undefined);
      const click = vi.fn();
      fileInputRef.value = { click } as unknown as HTMLInputElement;

      openPicker();
      expect(click).toHaveBeenCalled();
    });

    it("is a no-op when the ref is null", () => {
      const { openPicker } = useFileDrop(() => undefined);
      expect(() => openPicker()).not.toThrow();
    });
  });
});

// `afterEach` import — keep import-order at the bottom to avoid shadowing inside the test body.
import { afterEach } from "vitest";
