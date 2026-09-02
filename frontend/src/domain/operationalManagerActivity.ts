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
  operational_exception_created: {
    title: 'Operational exception created',
    tone: 'warning',
    source: 'recovery',
    recommendedAction: 'Open the Recovery item, confirm ownership, and choose the next action.',
  },
  operational_exception_assign: {
    title: 'Operational exception assigned',
    tone: 'info',
    source: 'recovery',
  },
  operational_exception_start: {
    title: 'Operational exception started',
    tone: 'info',
    source: 'recovery',
  },
  operational_exception_resolve: {
    title: 'Operational exception resolved',
    tone: 'success',
    source: 'recovery',
  },
  operational_exception_reopen: {
    title: 'Operational exception reopened',
    tone: 'warning',
    source: 'recovery',
    recommendedAction: 'Open the Recovery item and confirm its owner and next response.',
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
  const exceptionTitle = typeof metadata.title === 'string' ? metadata.title : undefined;
  const exceptionCategory = typeof metadata.category === 'string' ? metadata.category : undefined;
  const exceptionPriority = typeof metadata.priority === 'string' ? metadata.priority : undefined;
  const previousStatus = typeof metadata.previous_status === 'string' ? metadata.previous_status : undefined;
  const exceptionStatus = typeof metadata.status === 'string' ? metadata.status : undefined;
  const previousAssignee = typeof metadata.previous_assigned_user_id === 'string'
    ? metadata.previous_assigned_user_id
    : 'unassigned';
  const assignedUser = typeof metadata.assigned_user_id === 'string'
    ? metadata.assigned_user_id
    : 'unassigned';
  const resolutionNote = typeof metadata.resolution_note === 'string' ? metadata.resolution_note : undefined;
  const isOperationalException = activity.eventKind.startsWith('operational_exception_');
  const targetLabel = isOperationalException && exceptionTitle
    ? `${exceptionTitle} (${activity.targetId})`
    : activity.targetId;
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
            : activity.eventKind === 'operational_exception_created'
              ? ` ${exceptionCategory ? `${exceptionLabel(exceptionCategory)} · ` : ''}${exceptionPriority ? `${exceptionLabel(exceptionPriority)} priority · ` : ''}${exceptionLabel(exceptionStatus ?? 'open')}${assignedUser === 'unassigned' ? ' · unassigned' : ` · assigned to ${assignedUser}`}.`
              : activity.eventKind === 'operational_exception_assign'
                ? ` Assignment ${previousAssignee} → ${assignedUser}.`
                : activity.eventKind === 'operational_exception_start'
                  ? ` Status ${exceptionLabel(previousStatus ?? 'open')} → ${exceptionLabel(exceptionStatus ?? 'in_progress')}.`
                  : activity.eventKind === 'operational_exception_resolve'
                    ? ` Status ${exceptionLabel(previousStatus ?? 'in_progress')} → ${exceptionLabel(exceptionStatus ?? 'resolved')}.${resolutionNote ? ` Resolution: ${resolutionNote}` : ''}`
                    : activity.eventKind === 'operational_exception_reopen'
                      ? ` Status ${exceptionLabel(previousStatus ?? 'resolved')} → ${exceptionLabel(exceptionStatus ?? 'open')}.`
                      : '';
  return {
    id: `operational_${activity.id}`,
    title: presentation.title,
    message: `${targetLabel} · recorded by ${activity.actorLabel ?? activity.actorUserId}.${details}`,
    tone: presentation.tone,
    source: presentation.source,
    occurredAt: activity.occurredAt,
    recommendedAction: activity.eventKind === 'job_reassigned' && customerNotificationRequired
      ? 'Notify the customer about the changed service schedule and record delivery follow-up.'
      : presentation.recommendedAction,
    actionTargetId: activity.eventKind === 'job_reassigned' && customerNotificationRequired
      ? activity.targetId
      : isOperationalException
        ? activity.targetId
        : undefined,
    actionKind: isOperationalException
      ? 'open_operational_exception'
      : activity.eventKind === 'job_reassigned' && customerNotificationRequired
        ? 'complete_dispatch_notification'
        : undefined,
  };
}

function exceptionLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
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
