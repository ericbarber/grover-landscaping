import type { OperationalActivity } from '../api/client';
import type { ManagerActivityItem } from './managerActivity';

const activityPresentation: Partial<Record<
  OperationalActivity['eventKind'],
  Pick<ManagerActivityItem, 'title' | 'tone' | 'source' | 'recommendedAction'>
>> = {
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
  job_reassigned: {
    title: 'Scheduled job moved',
    tone: 'warning',
    source: 'route',
  },
  dispatch_customer_notified: {
    title: 'Dispatch customer notified',
    tone: 'success',
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
  photo_erasure_deletion_retried: {
    title: 'Photo erasure deletion retried',
    tone: 'info',
    source: 'photo',
    recommendedAction: 'Monitor the deletion recovery item until storage cleanup succeeds.',
  },
  photo_erasure_deletion_resolved: {
    title: 'Photo erasure deletion resolved',
    tone: 'success',
    source: 'photo',
  },
};

const unknownActivityPresentation: Pick<
  ManagerActivityItem,
  'title' | 'tone' | 'source' | 'recommendedAction'
> = {
  title: 'Operational activity recorded',
  tone: 'info',
  source: 'job',
};

export function operationalToManagerActivity(activity: OperationalActivity): ManagerActivityItem {
  const presentation = activityPresentation[activity.eventKind] ?? unknownActivityPresentation;
  const metadata = activity.metadata ?? {};
  const stopId = typeof metadata.stop_id === 'string' ? metadata.stop_id : undefined;
  const jobId = typeof metadata.job_id === 'string' ? metadata.job_id : undefined;
  const stopCount = typeof metadata.stop_count === 'number' ? metadata.stop_count : undefined;
  const oldCrewId = typeof metadata.old_crew_id === 'string' ? metadata.old_crew_id : 'unassigned';
  const newCrewId = typeof metadata.new_crew_id === 'string' ? metadata.new_crew_id : 'unassigned';
  const oldScheduledDate = typeof metadata.old_scheduled_date === 'string'
    ? metadata.old_scheduled_date
    : undefined;
  const newScheduledDate = typeof metadata.new_scheduled_date === 'string'
    ? metadata.new_scheduled_date
    : undefined;
  const customerNotificationRequired = metadata.customer_notification_required === true;
  const notificationChannel = typeof metadata.channel === 'string' ? metadata.channel : undefined;
  const details = activity.eventKind === 'route_stop_assigned' && stopId && jobId
    ? ` Assigned ${jobId} as ${stopId}.`
    : activity.eventKind === 'route_stop_removed' && stopId
      ? ` Removed ${stopId}.`
      : activity.eventKind === 'route_stops_reordered' && stopCount !== undefined
        ? ` Reordered ${stopCount} stops.`
        : activity.eventKind === 'job_reassigned'
          ? ` Moved ${oldCrewId} → ${newCrewId}${oldScheduledDate && newScheduledDate
            ? ` · ${oldScheduledDate} → ${newScheduledDate}`
            : ''}.`
          : activity.eventKind === 'dispatch_customer_notified' && notificationChannel
            ? ` Customer contacted by ${notificationChannel}.`
        : '';
  return {
    id: `operational_${activity.id}`,
    title: presentation.title,
    message: `${activity.targetId} · recorded by ${activity.actorLabel ?? activity.actorUserId}.${details}`,
    tone: presentation.tone,
    source: presentation.source,
    occurredAt: activity.occurredAt,
    recommendedAction: activity.eventKind === 'job_reassigned' && customerNotificationRequired
      ? 'Notify the customer about the changed service schedule and record delivery follow-up.'
      : presentation.recommendedAction,
    actionKind: activity.eventKind === 'job_reassigned' && customerNotificationRequired
      ? 'complete_dispatch_notification'
      : undefined,
    actionTargetId: activity.eventKind === 'job_reassigned' && customerNotificationRequired
      ? activity.targetId
      : undefined,
  };
}

export function operationsToManagerActivity(
  activity: OperationalActivity[],
): ManagerActivityItem[] {
  const completedReassignmentIds = new Set(activity.flatMap((item) => {
    if (item.eventKind !== 'dispatch_customer_notified') return [];
    const reassignmentId = item.metadata?.reassignment_audit_id;
    return typeof reassignmentId === 'string' ? [reassignmentId] : [];
  }));
  return activity.map((item) => {
    const mapped = operationalToManagerActivity(item);
    if (item.eventKind === 'job_reassigned' && completedReassignmentIds.has(item.id)) {
      return { ...mapped, actionKind: undefined, actionTargetId: undefined };
    }
    return mapped;
  });
}
