import type { SubsystemId } from '@/types';

/** A SubsystemId with all four fields empty. */
export function emptySubsystem(): SubsystemId {
  return {
    instanceId: '',
    memberClass: '',
    memberCode: '',
    subsystemCode: '',
  };
}

/**
 * Is the subsystem fully filled? True when all four identifier fields
 * are non-empty. Used by form-completeness checks, service-fetch
 * gating, and the cURL-import "is the form dirty?" probe.
 */
export function isSubsystemFilled(s: Partial<SubsystemId> | undefined): boolean {
  return !!(s?.instanceId && s.memberClass && s.memberCode && s.subsystemCode);
}

/** True when the subsystem has at least one non-empty field. */
export function hasAnySubsystemField(s: Partial<SubsystemId> | undefined): boolean {
  return !!(s?.instanceId || s?.memberClass || s?.memberCode || s?.subsystemCode);
}
