import type {
  ProviderDisclosureAccess,
  ProviderInvitationProgress,
} from '../api/providerInvitationClient';
import type { OwnerProviderFirstVisit } from './initialServiceProposals';

export type ProviderConnectionStageStatus = 'complete' | 'current' | 'upcoming' | 'closed';

export interface ProviderConnectionStage {
  id: 'invitation' | 'organization' | 'disclosure' | 'assessment' | 'proposal' | 'first_visit';
  label: string;
  detail: string;
  status: ProviderConnectionStageStatus;
  href?: string;
}

export function providerConnectionJourney(
  progress: ProviderInvitationProgress,
  disclosure: ProviderDisclosureAccess | null,
  firstVisit: OwnerProviderFirstVisit | null,
): ProviderConnectionStage[] {
  const closed = progress.closed && progress.progressStage !== 'relationship_activated';
  const relationshipActive = progress.progressStage === 'relationship_activated';
  const organizationComplete = progress.organizationRelationshipChecked || relationshipActive;
  const disclosureReady = progress.progressStage === 'assessment_access_ready' || relationshipActive;
  const disclosureEnded = progress.progressStage === 'assessment_access_closed';
  const assessment = disclosure?.assessment;
  const assessmentComplete = assessment?.status === 'completed' || relationshipActive;
  const proposal = disclosure?.currentInitialServiceProposal;
  const firstVisitComplete = firstVisit?.status === 'confirmed';

  const invitationStatus: ProviderConnectionStageStatus = closed ? 'closed' : 'complete';
  const organizationStatus: ProviderConnectionStageStatus = closed ? 'closed'
    : organizationComplete ? 'complete' : 'current';
  const disclosureStatus: ProviderConnectionStageStatus = closed || disclosureEnded ? 'closed'
    : disclosureReady ? 'complete'
      : organizationComplete ? 'current' : 'upcoming';
  const assessmentStatus: ProviderConnectionStageStatus = closed || disclosureEnded ? 'closed'
    : assessmentComplete ? 'complete'
      : disclosureReady ? 'current' : 'upcoming';
  const proposalStatus: ProviderConnectionStageStatus = closed || disclosureEnded ? 'closed'
    : relationshipActive ? 'complete'
      : assessmentComplete ? 'current' : 'upcoming';
  const firstVisitStatus: ProviderConnectionStageStatus = closed || disclosureEnded ? 'closed'
    : firstVisitComplete ? 'complete'
      : relationshipActive ? 'current' : 'upcoming';

  return [
    { id: 'invitation', label: 'Invitation', detail: closed ? 'Invitation closed' : 'Recipient confirmed', status: invitationStatus, href: '#provider-invitation-status' },
    { id: 'organization', label: 'Organization', detail: organizationComplete ? 'Provider connected' : 'Connection required', status: organizationStatus, href: organizationComplete ? '#provider-invitation-status' : '#provider-connection-step' },
    { id: 'disclosure', label: 'Disclosure', detail: disclosureEnded ? 'Owner access ended' : disclosureReady ? 'Owner-approved details' : progress.progressStage === 'response_recorded' ? 'Waiting for owner' : 'Bounded response first', status: disclosureStatus, href: disclosureReady ? '#provider-assessment-access' : '#provider-connection-step' },
    { id: 'assessment', label: 'Assessment', detail: assessmentComplete ? 'Assessment completed' : assessment ? assessment.status.split('_').join(' ') : 'Not started', status: assessmentStatus, href: disclosureReady ? '#provider-assessment-access' : undefined },
    { id: 'proposal', label: 'Proposal & setup', detail: relationshipActive ? 'Relationship active' : proposal ? `Proposal ${proposal.status}` : assessmentComplete ? 'Proposal is next' : 'After assessment', status: proposalStatus, href: disclosureReady ? '#provider-assessment-access' : undefined },
    { id: 'first_visit', label: 'First visit', detail: firstVisitComplete ? 'Owner confirmed' : firstVisit ? firstVisit.status.split('_').join(' ') : 'After activation', status: firstVisitStatus, href: relationshipActive ? '#provider-first-visit' : undefined },
  ];
}
