export type PropertyActivationReadiness = {
  profileReady: boolean;
  crewReady: boolean;
  ready: boolean;
};

export function getPropertyActivationReadiness(
  profileReady: boolean,
  crewReady: boolean,
): PropertyActivationReadiness {
  return {
    profileReady,
    crewReady,
    ready: profileReady && crewReady,
  };
}
