import type { Ref } from 'vue';

export type StepKey =
  | 'securityServer'
  | 'clientIdentifier'
  | 'serviceIdentifier'
  | 'endpoint'
  | 'queryParameters'
  | 'customHeaders'
  | 'certificates';

// Focus an input by id and select its content so the user can type
// immediately after clicking a step chip. preventScroll: true keeps
// the browser from auto-scrolling the field into view — the chip
// click is supposed to be a quiet accordion expand, not a page jump.
function focusAndSelect(inputId: string): void {
  const el = document.getElementById(inputId) as HTMLInputElement | null;
  if (!el) return;
  el.focus({ preventScroll: true });
  el.select?.();
}

// Each step entry: what to expand and (optionally) which input to focus.
interface StepDestination {
  /** Accordion values to leave open after navigation; [] collapses all. */
  openPanels: string[];
  /** Optional DOM id of an input to focus + select after expansion. */
  focusId?: string;
}

const STEP_DESTINATIONS: Record<StepKey, StepDestination> = {
  securityServer: {
    openPanels: [], // SS URL is above the accordions
    focusId: 'securityServerUrl',
  },
  clientIdentifier: {
    openPanels: ['client'],
    focusId: 'instanceId',
  },
  serviceIdentifier: {
    openPanels: ['service'],
    focusId: 'serviceinstanceId',
  },
  endpoint: {
    openPanels: ['endpoint'],
    focusId: 'path',
  },
  queryParameters: {
    openPanels: ['queryParams'],
    // no focus — list may be empty
  },
  customHeaders: {
    openPanels: ['customHeaders'],
  },
  certificates: {
    openPanels: ['certificates'],
    // no auto-focus — cert textareas are large and easy to overwrite
  },
};

/**
 * Owns the chip-click behavior: collapses other accordion sections,
 * expands the target, and focuses its first input. No scroll —
 * the chip is a quiet accordion driver, not a page-jump trigger.
 */
export function useFormStepNavigation(openPanels: Ref<string[]>) {
  function navigateToStep(stepKey: StepKey): void {
    const dest = STEP_DESTINATIONS[stepKey];
    if (!dest) return;
    openPanels.value = dest.openPanels;
    if (dest.focusId) focusAndSelect(dest.focusId);
  }

  return { navigateToStep };
}
