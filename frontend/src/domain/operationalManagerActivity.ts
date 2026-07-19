import type { OperationalActivity } from '../api/client';
import type { ManagerActivityItem } from './managerActivity';

const activityPresentation: Record<
  OperationalActivity['eventKind'],
  Pick<ManagerActivityItem, 'title' | 'tone' | 'source' | 'recommendedAction'>
> = {
  route_draft_saved: {
    title: 'Route draft persisted',
    tone: 'info',
    source: 'route',
    recommendedAction: 'Review route capacity and stop order before publishing.',
  },
  route_published: {
    title: 'Route published',
    tone: 'success',
    source: 'route',
  },
  route_completed: {
    title: 'Route completed',
    tone: 'success',
    source: 'route',
  },
  route_stop_assigned: {
    title: 'Route stop assigned',
    tone: 'info',
    source: 'route',
    recommendedAction: 'Review route capacity and stop order before publishing.',
  },
  route_stop_removed: {
    title: 'Route stop removed',
    tone: 'warning',
    source: 'route',
    recommendedAction: 'Confirm the removed work is reassigned or intentionally unscheduled.',
  },
  route_stops_reordered: {
    title: 'Route stops reordered',
    tone: 'info',
    source: 'route',
  },
  report_review_started: {
    title: 'Completion report review started',
    tone: 'info',
    source: 'job',
  },
  report_changes_requested: {
    title: 'Completion report changes requested',
    tone: 'warning',
    source: 'job',
    recommendedAction: 'Track the report until the crew resubmits the requested corrections.',
  },
  report_resubmitted: {
    title: 'Completion report resubmitted',
    tone: 'success',
    source: 'job',
    recommendedAction: 'Review the corrected report and approve it for customer delivery.',
  },
  report_delivered: {
    title: 'Completion report delivered',
    tone: 'success',
    source: 'job',
  },
  bid_approved: {
    title: 'Project bid approved',
    tone: 'success',
    source: 'job',
    recommendedAction: 'Convert approved work into scheduled job add-ons when the crew is ready.',
  },
  bid_rejected: {
    title: 'Project bid rejected',
    tone: 'warning',
    source: 'job',
    recommendedAction: 'Review the rejected scope before revising or closing the proposal.',
  },
  bid_converted: {
    title: 'Approved bid converted to work',
    tone: 'success',
    source: 'job',
  },
  photo_processing_retried: {
    title: 'Photo processing retried',
    tone: 'info',
    source: 'photo',
  },
  photo_processing_resolved: {
    title: 'Photo processing manually resolved',
    tone: 'success',
    source: 'photo',
  },
  customer_photo_evidence_erased: {
    title: 'Customer photo evidence erased',
    tone: 'warning',
    source: 'photo',
    recommendedAction: 'Confirm customer-facing reports and privacy records reflect the erasure.',
  },
};

export function operationalToManagerActivity(activity: OperationalActivity): ManagerActivityItem {
  const presentation = activityPresentation[activity.eventKind];
  return {
    id: `operational_${activity.id}`,
    title: presentation.title,
    message: `${activity.targetId} · recorded by ${activity.actorUserId}`,
    tone: presentation.tone,
    source: presentation.source,
    occurredAt: activity.occurredAt,
    recommendedAction: presentation.recommendedAction,
  };
}

export function operationsToManagerActivity(
  activity: OperationalActivity[],
): ManagerActivityItem[] {
  return activity.map(operationalToManagerActivity);
}
