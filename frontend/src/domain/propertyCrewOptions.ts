import type { CrewProfile, CustomerPropertyProfile, PropertyCrewAssignment } from './jobs';

export interface PropertyCrewOption {
  crewId: string;
  label: string;
  serviceArea: string;
}

export function getServiceCrewsForProperty(
  property: CustomerPropertyProfile,
  crews: CrewProfile[],
): CrewProfile[] {
  return crews.filter((crew) => crew.enabled && crew.companyId === property.organizationId);
}

export function getCurrentServiceCrewForProperty(
  property: CustomerPropertyProfile,
  crews: CrewProfile[],
  assignments: PropertyCrewAssignment[],
): CrewProfile | undefined {
  const activeAssignment = assignments.find((assignment) => assignment.propertyId === property.id && assignment.active);

  if (!activeAssignment) {
    return undefined;
  }

  return getServiceCrewsForProperty(property, crews).find((crew) => crew.id === activeAssignment.crewId);
}

export function getAlternateServiceCrewsForProperty(
  property: CustomerPropertyProfile,
  crews: CrewProfile[],
  assignments: PropertyCrewAssignment[],
): CrewProfile[] {
  const currentCrew = getCurrentServiceCrewForProperty(property, crews, assignments);

  return getServiceCrewsForProperty(property, crews).filter((crew) => crew.id !== currentCrew?.id);
}

export function toPropertyCrewOption(crew: CrewProfile): PropertyCrewOption {
  return {
    crewId: crew.id,
    label: crew.displayName,
    serviceArea: crew.serviceArea,
  };
}

export function getAlternateServiceCrewOptionsForProperty(
  property: CustomerPropertyProfile,
  crews: CrewProfile[],
  assignments: PropertyCrewAssignment[],
): PropertyCrewOption[] {
  return getAlternateServiceCrewsForProperty(property, crews, assignments).map(toPropertyCrewOption);
}
