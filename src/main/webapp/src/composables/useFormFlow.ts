import { computed } from 'vue';
import { useFormCompleteness, type FormCompletenessInput } from './useFormCompleteness';
import type { StepKey } from './useFormStepNavigation';

/**
 * Per-step state:
 *   - 'done'     — required and complete (or optional and filled)
 *   - 'next'     — the next required step the user should fill
 *   - 'pending'  — required, not yet complete, not the current next
 *   - 'optional' — optional and not filled
 */
export type StepState = 'done' | 'next' | 'pending' | 'optional';

export const REQUIRED_STEPS: readonly StepKey[] = [
  'securityServer',
  'clientIdentifier',
  'serviceIdentifier',
  'endpoint',
];

export const OPTIONAL_STEPS: readonly StepKey[] = [
  'queryParameters',
  'customHeaders',
  'certificates',
];

const REQUIRED_SET = new Set<StepKey>(REQUIRED_STEPS);

/**
 * Computes "what is the next required step the user should fill" plus a
 * per-step state map, so chips, accordions, and breadcrumbs can all
 * render from a single source of truth.
 *
 * Wraps `useFormCompleteness` — pass the same input getter.
 */
export function useFormFlow(input: () => FormCompletenessInput) {
  const c = useFormCompleteness(input);

  function isStepComplete(step: StepKey): boolean {
    switch (step) {
      case 'securityServer': return c.securityServerComplete.value;
      case 'clientIdentifier': return c.clientComplete.value;
      case 'serviceIdentifier': return c.serviceSubsystemComplete.value && c.serviceCodeComplete.value;
      case 'endpoint': return c.endpointComplete.value;
      case 'queryParameters': return c.queryParametersComplete.value;
      case 'customHeaders': return c.customHeadersComplete.value;
      case 'certificates': return c.certificatesComplete.value;
    }
  }

  /** Next required step the user should fill, or null if all done. */
  const nextStep = computed<StepKey | null>(() => {
    for (const step of REQUIRED_STEPS) {
      if (!isStepComplete(step)) return step;
    }
    return null;
  });

  function stateFor(step: StepKey): StepState {
    if (isStepComplete(step)) return 'done';
    if (nextStep.value === step) return 'next';
    if (REQUIRED_SET.has(step)) return 'pending';
    return 'optional';
  }

  return {
    ...c,
    isStepComplete,
    nextStep,
    stateFor,
  };
}
