import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref } from "vue";
import { useFormStepNavigation } from "../useFormStepNavigation";

describe("useFormStepNavigation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("expands the matching accordion panel for each step (and collapses others)", () => {
    const openPanels = ref<string[]>([]);
    const { navigateToStep } = useFormStepNavigation(openPanels);

    navigateToStep("clientIdentifier");
    expect(openPanels.value).toEqual(["client"]);

    navigateToStep("serviceIdentifier");
    expect(openPanels.value).toEqual(["service"]);

    navigateToStep("endpoint");
    expect(openPanels.value).toEqual(["endpoint"]);

    navigateToStep("queryParameters");
    expect(openPanels.value).toEqual(["queryParams"]);

    navigateToStep("customHeaders");
    expect(openPanels.value).toEqual(["customHeaders"]);

    navigateToStep("certificates");
    expect(openPanels.value).toEqual(["certificates"]);
  });

  it("collapses all panels for securityServer (the SS URL sits above the accordion)", () => {
    const openPanels = ref<string[]>(["client", "service"]);
    const { navigateToStep } = useFormStepNavigation(openPanels);

    navigateToStep("securityServer");
    expect(openPanels.value).toEqual([]);
  });

  it("focuses + selects the configured input id after expanding", () => {
    const input = document.createElement("input");
    input.id = "instanceId";
    input.value = "existing";
    document.body.appendChild(input);

    const focusSpy = vi.spyOn(input, "focus");
    const selectSpy = vi.spyOn(input, "select");

    const openPanels = ref<string[]>([]);
    const { navigateToStep } = useFormStepNavigation(openPanels);

    navigateToStep("clientIdentifier");

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(selectSpy).toHaveBeenCalled();
  });

  it("is a no-op (focus-wise) when the target input is not in the DOM", () => {
    const openPanels = ref<string[]>([]);
    const { navigateToStep } = useFormStepNavigation(openPanels);

    // Should not throw even though #instanceId doesn't exist.
    expect(() => navigateToStep("clientIdentifier")).not.toThrow();
    expect(openPanels.value).toEqual(["client"]); // accordion still moves
  });

  it("does not attempt to focus on steps with no focusId", () => {
    // queryParameters has no focusId — list may be empty.
    const openPanels = ref<string[]>([]);
    const { navigateToStep } = useFormStepNavigation(openPanels);

    expect(() => navigateToStep("queryParameters")).not.toThrow();
    expect(openPanels.value).toEqual(["queryParams"]);
  });

  it("does not break for an unknown step key", () => {
    const openPanels = ref<string[]>(["client"]);
    const { navigateToStep } = useFormStepNavigation(openPanels);

    // Cast to bypass type — defensive runtime check.
    expect(() => navigateToStep("bogus" as "clientIdentifier")).not.toThrow();
    // Untouched.
    expect(openPanels.value).toEqual(["client"]);
  });
});
