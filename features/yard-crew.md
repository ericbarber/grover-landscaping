# Yard Care Crew Operations Application

## Product Requirements and Field Service Specification

## 1. Product Vision

The application should help a yard care crew lead consistently deliver contracted services across multiple customer properties.

It should coordinate:

* Daily routes.
* Crew assignments.
* Property-specific service requirements.
* Work execution.
* Quality control.
* Before-and-after documentation.
* Customer requests.
* Additional work approvals.
* Materials and equipment.
* Safety and compliance.
* Service completion records.
* Billing readiness.

The application should answer the following questions throughout the workday:

1. Which properties are we servicing today?
2. What work is included at each property?
3. Who is responsible for each task?
4. Are there any special instructions, hazards, or customer requests?
5. Has the contracted work been completed correctly?
6. Is there evidence that the work was performed?
7. Did the crew discover anything requiring customer approval or follow-up?
8. Is the service record ready for invoicing?

The application should function as a field operations system rather than a basic scheduling application.

---

# 2. Primary User Persona

## Yard Care Crew Lead

The primary user:

* Supervises one or more yard care workers.
* Services several customer properties each day.
* Is accountable for schedule completion and service quality.
* Must understand the scope of each customer contract.
* Assigns work to crew members.
* Ensures the crew has the correct equipment and supplies.
* Communicates with customers or office staff.
* Documents completed services.
* Identifies work outside the contracted scope.
* Responds to weather, access, equipment, staffing, and property-condition changes.
* May work in areas with limited mobile connectivity.
* Needs to minimize administrative work while on the property.

## Secondary Users

The system may also support:

* Crew members.
* Operations managers.
* Dispatchers.
* Customer service representatives.
* Estimators.
* Account managers.
* Business owners.
* Billing administrators.
* Customers or homeowners.

---

# 3. Primary Jobs to Be Done

The crew lead needs the application to help them:

* Plan and execute the day’s route.
* Confirm that every property is ready to be serviced.
* Understand the exact contracted scope.
* Assign work efficiently.
* Track arrival, work, inspection, and departure.
* Document property conditions before work begins.
* Ensure no contracted task is missed.
* Capture problems and additional work opportunities.
* Obtain approval before completing out-of-scope work.
* Document products, materials, and labor used.
* Verify quality before leaving.
* Communicate service results to the customer.
* Create a reliable record for disputes, billing, and future visits.
* Adjust the route when weather or operational issues arise.

---

# 4. Product Design Principles

## 4.1 Field-First

The application should be optimized for outdoor use:

* Large controls.
* Minimal typing.
* High-contrast displays.
* Fast photo capture.
* Voice-to-text notes.
* Glove-friendly interactions where possible.
* Offline support.
* Quick task completion actions.

## 4.2 Contract-Aware

The application must clearly distinguish between:

* Included recurring services.
* Conditionally included services.
* Customer-requested services.
* Recommended additional services.
* Approved additional services.
* Work that must not be performed without approval.

## 4.3 Property-Specific

Each property should maintain its own:

* Contract.
* Service plan.
* Yard zones.
* Access instructions.
* Hazards.
* Preferences.
* Equipment restrictions.
* Product restrictions.
* Historical issues.
* Photographic records.
* Customer communication history.

## 4.4 Evidence-Based

The application should produce reliable proof of service through:

* Arrival and departure records.
* Task completion records.
* Time stamps.
* Zone-level photographs.
* Crew assignments.
* Material usage.
* Inspection results.
* Customer acknowledgments where required.

## 4.5 Exception-Oriented

Routine work should be fast. The application should draw attention to exceptions such as:

* Locked access.
* Vehicles blocking work areas.
* Pets in the yard.
* Irrigation running.
* Hazardous conditions.
* Customer-requested changes.
* Weather delays.
* Equipment failures.
* Existing property damage.
* Out-of-scope conditions.

## 4.6 Quality Before Speed

The system should help the crew complete the route efficiently without encouraging crews to skip safety, inspection, documentation, or quality-control steps.

---

# 5. User Roles and Permissions

## 5.1 Crew Lead

The crew lead should be able to:

* View the daily route.
* Start and complete property visits.
* View contracts and instructions.
* Assign tasks.
* Record attendance.
* Capture photos and notes.
* Create issues.
* Request additional-work approval.
* Record labor and materials.
* Perform quality inspections.
* Submit service records.
* Reorder remaining visits when permitted.

## 5.2 Crew Member

A crew member should be able to:

* View assigned tasks.
* View task instructions.
* Start and complete tasks.
* Capture photos.
* Report issues or hazards.
* Request assistance.
* Record material usage.
* Acknowledge safety instructions.

Crew members should not necessarily have access to:

* Customer pricing.
* Full contract value.
* Billing information.
* Sensitive customer notes.
* Other crews’ schedules.

## 5.3 Dispatcher or Operations Manager

This role should be able to:

* Build schedules.
* Assign crews and vehicles.
* Adjust routes.
* Monitor service progress.
* Respond to delays.
* Reassign jobs.
* Review exceptions.
* Approve schedule changes.
* Review service completion records.

## 5.4 Estimator or Account Manager

This role should be able to:

* Define property scope.
* Maintain service contracts.
* Create proposals.
* Review recommended additional work.
* Obtain customer approval.
* Convert approved work into work orders.

## 5.5 Billing Administrator

This role should be able to:

* Review completed work.
* Confirm billable services.
* Review approved additions.
* Validate labor and materials.
* Mark service records ready for invoicing.
* Export or integrate with accounting systems.

## 5.6 Customer

A customer-facing portal may allow the homeowner to:

* Review scheduled service.
* View service summaries.
* Review photographs.
* Approve additional work.
* Submit requests.
* Report concerns.
* Rate service quality.
* View invoices or payment status.

---

# 6. Customer and Property Onboarding

## 6.1 Customer Profile

Each customer record should support:

| Field                    | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| Customer name            | Individual, household, business, or property manager |
| Billing contact          | Person responsible for financial decisions           |
| Service contact          | Person responsible for property coordination         |
| Preferred communication  | Text, email, application, or telephone               |
| Notification preferences | Arrival, completion, delays, approvals, or issues    |
| Language preference      | Preferred customer communication language            |
| Account status           | Active, suspended, seasonal, or cancelled            |
| Payment terms            | Contract or billing terms                            |
| Service notes            | Important relationship or account information        |

## 6.2 Property Profile

Each property should include:

* Address.
* Geographical coordinates.
* Property type.
* Lot size.
* Estimated service area.
* Access instructions.
* Gate codes.
* Parking instructions.
* Pet information.
* Noise restrictions.
* HOA or neighborhood restrictions.
* Watering schedule.
* Service time restrictions.
* Known hazards.
* Sensitive areas.
* Customer preferences.
* Preferred mowing height.
* Chemical or product restrictions.
* Photo requirements.
* Signature requirements.
* Primary customer contact.
* Emergency contact.

Sensitive access information should be permission-controlled, encrypted, and visible only when operationally necessary.

## 6.3 Property Zones

The property should be divided into maintainable zones such as:

* Front lawn.
* Backyard lawn.
* Side lawn.
* Flower beds.
* Shrub areas.
* Tree areas.
* Garden.
* Desert landscaping.
* Native plant areas.
* Irrigation zones.
* Drainage areas.
* Driveways.
* Walkways.
* Patios.
* Pool areas.
* Commercial frontage.

Each zone should support:

* Zone name.
* Zone type.
* Approximate area.
* Service tasks.
* Service frequency.
* Estimated labor.
* Required equipment.
* Customer preferences.
* Known issues.
* Before-and-after photo requirements.
* Service exclusions.

---

# 7. Contract and Scope Management

The application must translate a customer agreement into an operational service plan.

## 7.1 Contract Components

A service contract should define:

* Contract start and end dates.
* Renewal conditions.
* Service frequency.
* Scheduled service windows.
* Included services.
* Excluded services.
* Seasonal services.
* Service-level expectations.
* Pricing model.
* Cancellation terms.
* Weather policies.
* Customer responsibilities.
* Approval limits.
* Product restrictions.
* Property access requirements.
* Photo or reporting requirements.

## 7.2 Scope Categories

Every service item should be classified as one of the following:

```text
Included
Included When Needed
Seasonally Included
Customer Requested
Requires Approval
Approved Additional Work
Not Included
Prohibited
```

## 7.3 Service Scope Examples

Typical recurring contract services may include:

* Lawn mowing.
* String trimming.
* Edging.
* Blowing hardscape.
* Light weed removal.
* Leaf and debris cleanup.
* Shrub touch-up.
* Irrigation visual inspection.
* Green waste removal.
* Property condition reporting.

Services that may require separate approval include:

* Irrigation repairs.
* Major pruning.
* Tree work.
* Fertilization.
* Weed treatment.
* Pest treatment.
* Mulch installation.
* Plant replacement.
* Storm cleanup.
* Hauling.
* Soil work.
* Landscape renovation.

## 7.4 Scope Protection

The application should warn the crew when a requested task is outside the active contract.

Example:

```text
Customer request: Remove fallen tree limb.

Contract status: Not included.

Required action:
- Photograph the condition.
- Estimate labor, equipment, disposal, and safety requirements.
- Request approval.
- Do not begin work until approval is recorded.
```

---

# 8. Service Plan Generation

The system should convert the contract and property configuration into recurring work orders.

## 8.1 Service Plan Inputs

The service plan should evaluate:

* Contracted frequency.
* Property size.
* Yard zones.
* Grass and plant types.
* Seasonal growth.
* Customer preferences.
* Historical service duration.
* Crew capability.
* Equipment requirements.
* Local weather.
* Service restrictions.
* Previous unresolved issues.
* Approved additional work.

## 8.2 Service Plan Outputs

For each property visit, the application should generate:

* Planned arrival window.
* Estimated service duration.
* Required crew size.
* Required equipment.
* Required materials.
* Contracted tasks.
* Conditional tasks.
* Known hazards.
* Access instructions.
* Customer requests.
* Required photos.
* Required inspections.
* Quality-control checklist.
* Departure requirements.

---

# 9. Daily Crew Lead Workflow

## 9.1 Pre-Shift Review

Before leaving the yard or shop, the crew lead should review:

* Assigned route.
* Crew attendance.
* Vehicle assignment.
* Weather conditions.
* Property access alerts.
* Special customer requests.
* Equipment requirements.
* Material requirements.
* Chemical or product requirements.
* Open issues.
* Approved additional work.
* Route changes.
* Expected total labor hours.

The application should create a consolidated loading checklist.

## 9.2 Crew and Vehicle Check-In

The crew lead should confirm:

* Crew members present.
* Crew member roles.
* Required certifications.
* Vehicle condition.
* Trailer connection.
* Fuel level.
* Equipment loaded.
* Batteries charged.
* Safety equipment available.
* First-aid supplies available.
* Materials loaded.
* Chemicals secured and documented.

## 9.3 Travel to Property

The application should provide:

* Route order.
* Navigation handoff.
* Expected arrival time.
* Customer notification options.
* Delay reporting.
* Parking instructions.
* Entry instructions.

## 9.4 Property Arrival

Upon arrival, the crew lead should:

1. Confirm the correct property.
2. Record arrival.
3. Review access and safety instructions.
4. Confirm that the property can be serviced.
5. Photograph pre-existing damage or unusual conditions.
6. Perform the initial inspection.
7. Assign work to crew members.
8. Start the service visit.

## 9.5 Work Execution

During service, the crew lead should:

* Monitor task progress.
* Review exceptions.
* Reassign tasks as needed.
* Capture required documentation.
* Confirm product and material use.
* Respond to customer interactions.
* Ensure safety procedures are followed.
* Prevent unauthorized additional work.

## 9.6 Quality-Control Inspection

Before departure, the crew lead should inspect:

* Lawn mowing consistency.
* Mowing height.
* Missed areas.
* Trim quality.
* Edge quality.
* Clippings on hardscape.
* Gates.
* Irrigation components.
* Plant damage.
* Property damage.
* Tools or debris left behind.
* Completion of customer requests.
* Completion-photo requirements.

## 9.7 Departure

The crew lead should:

* Confirm all workers and equipment are accounted for.
* Close gates.
* Remove debris.
* Record departure.
* Submit the service record.
* Send the customer completion notification where configured.
* Confirm the next route destination.

---

# 10. Initial Property Inspection

Every visit should begin with a brief inspection.

## 10.1 Inspection Categories

The crew should check for:

* Locked or blocked access.
* Pets.
* Vehicles or objects in service areas.
* Irrigation currently running.
* Standing water.
* Excessive mud.
* Broken sprinklers.
* Fallen branches.
* Storm damage.
* Existing property damage.
* Utility hazards.
* Construction activity.
* Pest or wildlife hazards.
* Chemical exposure risks.
* Unsafe slopes.
* Customer belongings in the work area.

## 10.2 Inspection Outcomes

The inspection should result in one of the following:

```text
Ready for Service
Ready with Caution
Partially Serviceable
Blocked
Unsafe
Customer Decision Required
```

## 10.3 Blocked Service Reasons

Examples include:

* Gate inaccessible.
* Aggressive or loose pet.
* Hazardous weather.
* Standing water.
* Customer vehicle blocking service.
* Active construction.
* Irrigation running.
* Unsafe debris.
* Chemical exposure.
* Utility work.
* Property address mismatch.

The crew lead should be able to document the condition and notify dispatch or the customer.

---

# 11. Task Assignment and Crew Coordination

## 11.1 Task Assignment

The crew lead should be able to assign tasks based on:

* Crew member skill.
* Certification.
* Equipment qualification.
* Zone.
* Task dependency.
* Estimated duration.
* Workload.
* Safety restrictions.

## 11.2 Example Assignment

```text
Crew Member 1:
- Mow front lawn.
- Mow backyard lawn.

Crew Member 2:
- String trim property perimeter.
- Edge driveway and sidewalks.

Crew Member 3:
- Remove weeds from flower beds.
- Inspect drip irrigation.

Crew Lead:
- Initial inspection.
- Customer-request review.
- Quality-control inspection.
- Completion documentation.
```

## 11.3 Task Dependencies

The system should support dependencies such as:

```text
Inspect lawn before mowing.
Remove large debris before mowing.
Mow before final trimming inspection.
Edge before blowing hardscape.
Complete all zone tasks before final photographs.
Obtain approval before additional work begins.
```

## 11.4 Crew Communication

The application should support:

* Task notifications.
* In-app messages.
* Quick alerts.
* Assistance requests.
* Hazard alerts.
* Supervisor review requests.
* Voice notes.
* Photo-based issue reporting.

---

# 12. Work Order Model

Each property visit should generate a work order.

## 12.1 Work Order Fields

| Field                | Description                      |
| -------------------- | -------------------------------- |
| Work order ID        | Unique operational identifier    |
| Customer             | Contracting customer             |
| Property             | Service location                 |
| Service date         | Planned service date             |
| Service window       | Expected arrival range           |
| Crew                 | Assigned team                    |
| Crew lead            | Responsible supervisor           |
| Contract reference   | Governing service agreement      |
| Planned tasks        | Included work                    |
| Conditional tasks    | Tasks completed only when needed |
| Additional work      | Approved extras                  |
| Estimated duration   | Planned labor time               |
| Actual duration      | Recorded work time               |
| Required equipment   | Equipment needed                 |
| Required materials   | Materials needed                 |
| Special instructions | Property-specific guidance       |
| Hazards              | Known safety conditions          |
| Photo requirements   | Required evidence                |
| Status               | Current workflow state           |
| Billing status       | Invoice readiness                |

## 12.2 Work Order Statuses

```text
Draft
Scheduled
Assigned
Crew En Route
Arrived
Inspection In Progress
Ready for Service
In Progress
Paused
Blocked
Quality Review
Completed
Submitted
Approved
Ready for Billing
Invoiced
Cancelled
```

---

# 13. Route and Dispatch Management

## 13.1 Route Planning Inputs

Route planning should consider:

* Property locations.
* Service windows.
* Estimated work duration.
* Crew availability.
* Crew skill requirements.
* Vehicle capacity.
* Equipment requirements.
* Material requirements.
* Weather.
* Traffic.
* Customer priorities.
* Contract commitments.
* Crew shift limits.

## 13.2 Route Planning Features

The application should support:

* Daily route generation.
* Manual route reordering.
* Route optimization.
* Map view.
* Travel-time estimates.
* Arrival-time projections.
* Schedule conflict warnings.
* Lunch and fuel stops.
* Depot departure and return.
* Route progress tracking.
* Emergency reassignment.
* Carryover work.

## 13.3 Route Exception Handling

When a property is blocked or delayed, the system should allow the crew lead or dispatcher to:

* Contact the customer.
* Wait for a defined period.
* Partially service the property.
* Skip the property.
* Reschedule the visit.
* Move another property earlier.
* Reassign the work to another crew.
* Document the reason.
* Apply the contract’s missed-service policy.

---

# 14. Weather-Aware Operations

The application should evaluate weather at both route and property levels.

## 14.1 Weather Conditions

Relevant conditions include:

* Rain.
* Lightning.
* Extreme heat.
* High wind.
* Frost.
* Snow or ice.
* Poor air quality.
* Excessive soil moisture.
* Storm warnings.

## 14.2 Weather Behaviors

The system should:

* Flag tasks that are unsafe or ineffective.
* Recommend route changes.
* Suggest indoor maintenance work.
* Reschedule chemical applications.
* Delay mowing in saturated conditions.
* Warn about heat exposure.
* Recommend additional breaks and hydration.
* Document weather-related service interruptions.
* Apply weather clauses from the customer contract.

## 14.3 Example Rules

```text
WHEN lightning is detected within the configured safety radius
THEN pause exposed outdoor work
AND notify all active crew members.

WHEN soil conditions are too wet for mowing
THEN mark mowing as blocked
AND allow non-turf work to continue where safe.

WHEN high wind is forecast
THEN postpone spraying and selected tree work.

WHEN extreme heat conditions are present
THEN recommend earlier service windows
AND enforce configured hydration reminders.
```

---

# 15. Before-and-After Documentation

Photographic evidence should be integrated into the service workflow.

## 15.1 Photo Categories

* Arrival condition.
* Pre-existing damage.
* Before-service zone photo.
* After-service zone photo.
* Problem or issue.
* Irrigation condition.
* Customer-requested work.
* Additional-work estimate.
* Material application.
* Safety hazard.
* Final property condition.

## 15.2 Photo Requirements

Photo requirements may be configured by:

* Customer.
* Property.
* Contract.
* Task.
* Yard zone.
* Issue type.
* Crew performance plan.

## 15.3 Photo Metadata

Each photo should record:

* Work order.
* Property.
* Zone.
* Task.
* Crew member.
* Timestamp.
* Photo category.
* Caption.
* Offline synchronization state.

Location metadata may be captured when appropriate, with privacy controls and a clear business purpose.

## 15.4 Completion Protection

The application should prevent final submission when mandatory evidence is missing unless the crew lead enters an authorized exception.

---

# 16. Issue and Exception Management

The application should distinguish between service tasks and property issues.

## 16.1 Issue Categories

* Broken irrigation component.
* Irrigation leak.
* Dry turf.
* Standing water.
* Weed outbreak.
* Pest activity.
* Disease.
* Dead plant.
* Damaged tree limb.
* Storm damage.
* Drainage issue.
* Property damage.
* Access issue.
* Customer item blocking service.
* Equipment damage.
* Safety hazard.
* Out-of-scope request.
* Service complaint.
* Unknown condition.

## 16.2 Issue Workflow

```text
Observed
Documented
Needs Review
Customer Contact Required
Estimate Required
Approval Pending
Approved
Scheduled
In Progress
Monitoring
Resolved
Declined
Closed
```

## 16.3 Issue Record

Each issue should include:

* Property.
* Zone.
* Work order.
* Date and time.
* Reporting crew member.
* Category.
* Severity.
* Description.
* Photographs.
* Immediate action.
* Safety impact.
* Service impact.
* Recommended action.
* Estimated labor.
* Estimated materials.
* Customer communication.
* Approval status.
* Follow-up date.
* Resolution notes.

---

# 17. Additional Work and Customer Approval

The application should provide a structured process for work outside the recurring contract.

## 17.1 Additional Work Workflow

```text
Condition Identified
Scope Documented
Estimate Prepared
Customer Approval Requested
Approved or Declined
Work Scheduled
Work Completed
Billing Record Created
```

## 17.2 Estimate Components

An additional-work estimate should support:

* Description.
* Photographs.
* Labor estimate.
* Crew size.
* Equipment requirements.
* Material quantities.
* Disposal fees.
* Travel or delivery costs.
* Tax.
* Expected duration.
* Earliest available date.
* Expiration date.
* Customer approval method.

## 17.3 Approval Methods

Customer approval may be captured through:

* In-app approval.
* Customer portal.
* Text-message link.
* Email link.
* Digital signature.
* Recorded verbal approval with manager authorization.
* Pre-authorized spending threshold.

## 17.4 Field Approval Limits

The application should support company policies such as:

```text
Crew leads may recommend additional work.

Crew leads may not approve work on behalf of a customer.

Crew leads may perform approved work up to a configured dollar or labor limit.

Work exceeding the field approval limit requires operations-manager review.
```

---

# 18. Quality-Control Management

## 18.1 Property Quality Checklist

The crew lead should confirm:

* All contracted zones were serviced.
* Mowing height is correct.
* Turf appearance is consistent.
* Trim lines are complete.
* Edges are clean.
* Clippings were removed from hardscape.
* Plant beds were not damaged.
* Irrigation equipment was not damaged.
* Gates are closed.
* Customer property was returned to its prior location.
* No tools or debris remain.
* Required photographs are complete.
* Customer requests were addressed.
* Issues were documented.
* Additional work was not performed without approval.

## 18.2 Quality Scoring

The application may calculate a service quality score based on:

* Task completion.
* Photo compliance.
* Inspection completion.
* Rework.
* Customer complaints.
* Crew lead review.
* Arrival-window compliance.
* Property damage.
* Missed tasks.
* Documentation completeness.

Quality scores should be used for coaching and process improvement rather than as the sole measure of worker performance.

## 18.3 Rework Workflow

When quality does not meet the standard:

```text
Defect Identified
Rework Required
Task Assigned
Rework Completed
Supervisor Verified
Issue Closed
```

The system should track whether rework occurred:

* Before the crew left.
* During a return visit.
* After a customer complaint.
* At company expense.
* As billable additional work.

---

# 19. Customer Communication

## 19.1 Automated Notifications

The system may notify the customer when:

* Service is scheduled.
* The crew is approaching.
* The crew has arrived.
* Access is blocked.
* Service is delayed.
* Weather requires rescheduling.
* An issue is discovered.
* Approval is requested.
* Service is completed.
* A service summary is available.

## 19.2 Completion Summary

A customer completion message may include:

```text
Your yard service was completed today.

Completed:
- Front and backyard mowing.
- Perimeter trimming.
- Driveway and sidewalk edging.
- Hardscape cleanup.
- Irrigation visual inspection.

Observation:
- One sprinkler in zone 4 appears damaged.

Recommended follow-up:
- Replace and retest the sprinkler.

Photos:
- Four completion photos are available.
```

## 19.3 Customer Requests

Customer requests should be associated with:

* Customer.
* Property.
* Requested completion date.
* Contract status.
* Approval status.
* Assigned work order.
* Customer communication history.
* Completion outcome.

---

# 20. Time and Labor Tracking

## 20.1 Time Categories

The application should distinguish:

* Shift time.
* Travel time.
* Property service time.
* Task time.
* Break time.
* Loading time.
* Fueling time.
* Equipment repair time.
* Weather delay.
* Customer delay.
* Rework time.
* Non-billable administrative time.

## 20.2 Time Tracking Principles

Time tracking should:

* Support operational planning.
* Support job costing.
* Minimize manual entry.
* Allow correction with an audit history.
* Avoid unnecessary off-shift employee tracking.
* Use location only during configured work activities where legally and operationally appropriate.

## 20.3 Job Cost Comparison

For each work order, the system should compare:

```text
Estimated Labor vs. Actual Labor
Estimated Duration vs. Actual Duration
Estimated Materials vs. Actual Materials
Expected Travel vs. Actual Travel
Contract Revenue vs. Estimated Service Cost
```

---

# 21. Equipment Management

## 21.1 Equipment Records

The company should be able to register:

* Mowers.
* Trimmers.
* Edgers.
* Blowers.
* Hedge trimmers.
* Chainsaws.
* Sprayers.
* Spreaders.
* Aerators.
* Trailers.
* Vehicles.
* Batteries.
* Hand tools.
* Safety equipment.

Each asset should include:

* Asset ID.
* Type.
* Manufacturer.
* Model.
* Serial number.
* Assigned vehicle or crew.
* Current condition.
* Service hours.
* Last maintenance.
* Next maintenance.
* Inspection checklist.
* Warranty.
* Replacement parts.
* Repair history.
* Out-of-service status.

## 21.2 Pre-Shift Equipment Inspection

The crew should verify:

* Equipment is present.
* Guards are installed.
* Blades and cutting components are serviceable.
* Fuel or charge is sufficient.
* Leaks are absent.
* Tires and wheels are safe.
* Safety switches function.
* Required protective equipment is available.

## 21.3 Equipment Failure Workflow

```text
Failure Reported
Equipment Marked Unavailable
Replacement Requested
Route Impact Evaluated
Repair Work Order Created
Equipment Repaired
Safety Inspection Completed
Returned to Service
```

---

# 22. Materials and Inventory

## 22.1 Inventory Categories

* Trimmer line.
* Blades.
* Fuel.
* Oil.
* Batteries.
* Irrigation fittings.
* Sprinkler heads.
* Drip emitters.
* Mulch.
* Soil.
* Seed.
* Fertilizer.
* Weed-control products.
* Pest-control products.
* Plant materials.
* Yard waste bags.
* Safety supplies.

## 22.2 Inventory Locations

Inventory should be managed by:

* Warehouse.
* Shop.
* Vehicle.
* Trailer.
* Crew.
* Property.
* Supplier order.

## 22.3 Inventory Transactions

The system should record:

* Loaded onto vehicle.
* Transferred between crews.
* Used at property.
* Returned to shop.
* Damaged.
* Lost.
* Expired.
* Disposed.
* Reordered.

## 22.4 Materials Used at a Property

Material usage should capture:

* Product.
* Quantity.
* Unit.
* Application zone.
* Application task.
* Crew member.
* Date and time.
* Reason for use.
* Customer approval where necessary.
* Safety record where applicable.

---

# 23. Chemical and Treatment Records

Where treatments are part of the company’s services, the application should support configurable compliance records.

## 23.1 Treatment Record

A treatment record may include:

* Property.
* Zone.
* Target condition.
* Product.
* Product registration information.
* Quantity.
* Dilution or application rate.
* Application method.
* Applicator.
* Required certification.
* Weather conditions.
* Start and completion time.
* Restricted-entry guidance.
* Customer notification.
* Safety documentation.
* Photos.
* Follow-up inspection date.

The application should not independently invent treatment instructions. Product labels, company procedures, local requirements, and qualified personnel should govern treatment work.

---

# 24. Safety Management

## 24.1 Safety Information

Each property should support:

* Known hazards.
* Animal concerns.
* Electrical risks.
* Slopes.
* Traffic exposure.
* Pool hazards.
* Utility locations.
* Chemical restrictions.
* Heat exposure.
* Emergency access.
* Nearest urgent-care information if configured by the company.

## 24.2 Safety Checklists

The application should support:

* Pre-shift safety check.
* Property hazard review.
* Equipment safety inspection.
* Personal protective equipment acknowledgment.
* Heat and hydration reminders.
* Incident reporting.
* Near-miss reporting.
* Emergency escalation.

## 24.3 Incident Workflow

```text
Incident Occurs
Work Secured
Emergency Action Taken
Supervisor Notified
Incident Documented
Evidence Collected
Follow-Up Assigned
Corrective Action Completed
Incident Closed
```

---

# 25. Offline Operation

The mobile application should continue operating when connectivity is poor.

## 25.1 Offline Capabilities

The crew should be able to:

* View the assigned route.
* View property instructions.
* View work orders.
* Start and complete tasks.
* Capture photos.
* Record notes.
* Report issues.
* Record materials.
* Perform quality inspections.
* Capture customer acknowledgment where supported.

## 25.2 Synchronization Requirements

The application should:

* Queue updates securely.
* Display synchronization status.
* Avoid duplicate submissions.
* Preserve original timestamps.
* Resolve conflicts.
* Notify the crew lead when required records fail to synchronize.
* Prevent data loss if the device closes unexpectedly.

---

# 26. Core Application Screens

The field application should include:

1. **Today’s Route**

   * Properties, service windows, travel status, and route progress.

2. **Crew Check-In**

   * Attendance, roles, vehicle, equipment, and supplies.

3. **Property Arrival**

   * Access instructions, hazards, customer requests, and initial inspection.

4. **Work Order**

   * Contracted tasks, additional work, status, and estimated duration.

5. **Crew Assignments**

   * Tasks by crew member and zone.

6. **Task Detail**

   * Instructions, equipment, materials, photos, and completion controls.

7. **Issues**

   * Problems, hazards, estimates, approvals, and follow-up.

8. **Photos**

   * Required and optional service documentation.

9. **Quality Review**

   * Completion checklist and corrective work.

10. **Materials**

    * Product and quantity usage.

11. **Equipment**

    * Loaded assets, inspections, failures, and replacements.

12. **Customer Communication**

    * Notifications, requests, approvals, and completion summary.

13. **Service Submission**

    * Final review and billing readiness.

14. **End-of-Day Review**

    * Completed visits, skipped visits, hours, equipment, and unresolved exceptions.

---

# 27. Suggested Data Model

## 27.1 Customer

```text
customer_id
customer_type
name
billing_contact
service_contact
communication_preferences
account_status
payment_terms
```

## 27.2 Property

```text
property_id
customer_id
address
coordinates
property_type
lot_size
access_instructions
service_restrictions
hazards
customer_preferences
```

## 27.3 PropertyZone

```text
zone_id
property_id
name
zone_type
area
service_requirements
equipment_requirements
photo_requirements
known_conditions
```

## 27.4 ServiceContract

```text
contract_id
customer_id
property_id
start_date
end_date
service_frequency
service_window
pricing_model
weather_policy
status
```

## 27.5 ContractServiceItem

```text
contract_service_item_id
contract_id
service_type
scope_category
frequency
applicable_zones
estimated_duration
price
approval_requirement
```

## 27.6 Crew

```text
crew_id
name
home_location
vehicle_id
status
```

## 27.7 CrewMember

```text
crew_member_id
crew_id
employee_id
role
skills
certifications
status
```

## 27.8 WorkOrder

```text
work_order_id
contract_id
property_id
scheduled_date
service_window_start
service_window_end
crew_id
crew_lead_id
estimated_duration
actual_duration
status
billing_status
```

## 27.9 WorkOrderTask

```text
work_order_task_id
work_order_id
service_item_id
zone_id
assigned_crew_member_id
scope_category
estimated_duration
status
completion_requirement
```

## 27.10 ServiceVisit

```text
service_visit_id
work_order_id
arrival_time
work_start_time
work_end_time
departure_time
arrival_status
service_outcome
submission_status
```

## 27.11 Inspection

```text
inspection_id
service_visit_id
inspection_type
performed_by
performed_at
outcome
notes
```

## 27.12 Issue

```text
issue_id
property_id
work_order_id
zone_id
reported_by
category
severity
description
status
approval_status
follow_up_date
```

## 27.13 AdditionalWorkEstimate

```text
estimate_id
issue_id
customer_id
labor_estimate
material_estimate
equipment_estimate
disposal_estimate
total_estimate
approval_status
expiration_date
```

## 27.14 Photo

```text
photo_id
property_id
work_order_id
task_id
issue_id
zone_id
captured_by
captured_at
photo_category
file_location
sync_status
```

## 27.15 MaterialUsage

```text
material_usage_id
work_order_id
task_id
inventory_item_id
quantity
unit
recorded_by
recorded_at
```

## 27.16 EquipmentAsset

```text
equipment_id
asset_type
manufacturer
model
serial_number
assigned_vehicle_id
service_hours
condition
availability_status
```

## 27.17 CustomerCommunication

```text
communication_id
customer_id
property_id
work_order_id
communication_type
channel
direction
sent_at
status
content_reference
```

---

# 28. Primary User Stories

## Daily Operations

* As a crew lead, I want to see the full route so that I can prepare the crew for the day.
* As a crew lead, I want a combined equipment and materials checklist so that nothing is left at the shop.
* As a crew lead, I want property-specific access instructions so that the crew can enter without delays.
* As a crew lead, I want to know the expected duration of each visit so that I can keep the route on schedule.

## Scope Management

* As a crew lead, I want to see exactly what the contract includes so that the crew does not miss required work.
* As a crew lead, I want out-of-scope work clearly identified so that unauthorized services are not performed.
* As a crew lead, I want to request customer approval from the property so that additional work can be handled efficiently.

## Crew Coordination

* As a crew lead, I want to assign tasks to individual workers so that work is divided clearly.
* As a crew member, I want to see only my assigned tasks so that I know what I am responsible for.
* As a crew lead, I want to see task progress so that I can reassign work when necessary.

## Documentation

* As a crew lead, I want to record pre-existing damage so that the company is protected from incorrect claims.
* As a crew lead, I want required before-and-after photos so that service completion can be verified.
* As a crew lead, I want the system to identify missing documentation before departure.

## Quality

* As a crew lead, I want a final inspection checklist so that the crew does not leave unfinished work.
* As an operations manager, I want to review quality records so that recurring performance issues can be corrected.
* As a customer, I want a clear completion summary so that I know what was done.

## Exceptions

* As a crew lead, I want to report blocked access so that dispatch and the customer can respond.
* As a crew lead, I want weather-related tasks rescheduled appropriately.
* As a dispatcher, I want delayed or blocked visits visible immediately so that I can adjust the route.

## Billing

* As a billing administrator, I want completed service records connected to contract items so that invoices are accurate.
* As an account manager, I want approved additional work linked to the work order so that it is not omitted from billing.
* As a business owner, I want estimated and actual job costs so that I can understand profitability.

---

# 29. MVP Scope

The minimum viable product should include:

* Customer and property records.
* Property zones.
* Access instructions and hazard notes.
* Contracted service definitions.
* Recurring work-order generation.
* Daily crew routes.
* Crew and vehicle assignments.
* Property arrival and departure records.
* Initial property inspection.
* Crew task assignment.
* Task completion.
* Before-and-after photos.
* Issue reporting.
* Additional-work approval requests.
* Final quality-control checklist.
* Customer completion notifications.
* Equipment loading checklist.
* Basic material usage.
* Offline operation.
* Service history.
* Billing-ready service records.
* Operations dashboard.

## MVP Exclusions

The initial release may defer:

* Fully automated route optimization.
* Payroll processing.
* Full accounting functionality.
* Automated dynamic pricing.
* Advanced chemical compliance.
* Smart irrigation control.
* Artificial intelligence plant diagnosis.
* Automated image-based quality scoring.
* Customer payment processing.
* Supplier ordering.
* Predictive equipment maintenance.
* Full fleet telematics.
* Contractor marketplace functionality.

---

# 30. MVP Acceptance Criteria

The MVP should be considered successful when a crew lead can:

1. Sign in and view the assigned daily route.
2. Check crew members into the shift.
3. Confirm the vehicle, equipment, and materials.
4. Open a property work order.
5. View access instructions, hazards, and contract scope.
6. Record arrival at the property.
7. Complete the initial inspection.
8. Assign work to crew members.
9. Track individual task completion.
10. Capture required before-and-after photographs.
11. Report a property issue.
12. Identify whether requested work is included or outside scope.
13. Submit an additional-work approval request.
14. Complete a final quality inspection.
15. Record labor and materials.
16. Send or queue a customer completion summary.
17. Submit the service record.
18. Operate during temporary loss of connectivity.
19. Synchronize the completed visit without duplicating records.
20. Produce a service record suitable for billing review.

---

# 31. Product Success Metrics

The development team should track:

* Percentage of scheduled visits completed.
* On-time arrival rate.
* Average service duration.
* Estimated-versus-actual service time.
* Route completion rate.
* Blocked visit rate.
* Documentation completion rate.
* Required-photo compliance.
* Quality-control completion rate.
* Rework rate.
* Customer complaint rate.
* Customer approval conversion rate.
* Additional work identified.
* Additional work approved.
* Additional revenue captured.
* Material variance.
* Equipment failure frequency.
* Service records ready for billing.
* Time between service completion and billing readiness.
* Offline synchronization failure rate.
* Customer satisfaction.
* Crew application adoption.

---

# 32. Example Crew Lead Daily Experience

## 6:30 A.M. — Shift Preparation

The crew lead opens the application.

```text
Crew 4 Route

Properties: 12
Estimated property service time: 7 hours 20 minutes
Estimated travel time: 1 hour 35 minutes
Crew members: 4
Vehicle: Truck 7
Trailer: Trailer 3

Alerts:
- Property 4 has a locked side gate. Gate code updated yesterday.
- Property 7 requested an estimate for shrub removal.
- Property 9 requires arrival before 2:00 P.M.
- High heat is expected after 1:00 P.M.
```

The application generates a loading checklist:

```text
Required equipment:
- Two commercial mowers.
- Three string trimmers.
- Two edgers.
- Two blowers.
- Hedge trimmer.
- Irrigation repair kit.

Required materials:
- Trimmer line.
- Two replacement sprinkler heads.
- Yard waste bags.
- Fuel.
- Drinking water.
```

## 8:10 A.M. — Property Arrival

The crew arrives at the third property.

The crew lead records arrival and performs the inspection.

Observed conditions:

* Backyard gate is accessible.
* One vehicle partially blocks the driveway edge.
* Irrigation zone 2 is running.
* A broken sprinkler is creating standing water.
* The lawn is serviceable except for the saturated area.

The crew lead records the issue and photographs it.

The application recommends:

```text
Proceed with:
- Front lawn mowing.
- Dry portions of backyard mowing.
- Trimming.
- Edging.
- Hardscape cleanup.

Do not perform:
- Mowing in the saturated area.

Additional action:
- Document broken sprinkler.
- Request customer approval for repair.
- Schedule a follow-up inspection.
```

## 8:20 A.M. — Crew Assignment

```text
Crew Member A:
- Front lawn mowing.
- Dry backyard mowing.

Crew Member B:
- String trimming.
- Fence-line cleanup.

Crew Member C:
- Edging.
- Hardscape cleanup.

Crew Lead:
- Irrigation issue documentation.
- Customer approval request.
- Final quality inspection.
```

## 8:55 A.M. — Additional Work Approval

The customer approves replacement of the sprinkler within the crew lead’s authorized field limit.

The application adds:

```text
Approved additional work:
- Replace one sprinkler head.
- Retest irrigation zone 2.
- Record material and labor usage.
- Capture completion photo.
```

## 9:15 A.M. — Quality Review

The crew lead performs the final inspection.

```text
Contracted tasks: Complete
Additional work: Complete
Required photographs: Complete
Gates: Closed
Hardscape: Clear
Property damage: None observed
Follow-up required: Recheck saturated turf during next visit
```

## 9:20 A.M. — Service Submission

The customer receives:

```text
Your scheduled yard service was completed.

Completed:
- Lawn mowing.
- String trimming.
- Edging.
- Hardscape cleanup.
- Irrigation visual inspection.

Additional approved work:
- Replaced one damaged sprinkler.
- Retested irrigation zone 2.

Follow-up:
- The saturated lawn area will be reviewed during the next service visit.

Six service photographs are available.
```

The completed work order is marked ready for billing.

---

# 33. End-of-Day Crew Lead Workflow

At the end of the shift, the application should guide the crew lead through:

* Confirming all assigned properties.
* Reviewing skipped or partially completed visits.
* Verifying that all photos synchronized.
* Reviewing unresolved issues.
* Confirming equipment returned.
* Reporting damaged or missing equipment.
* Recording remaining materials.
* Submitting time records.
* Confirming vehicle condition.
* Documenting incidents or near misses.
* Reviewing the next day’s known requirements.

The end-of-day summary should show:

```text
Scheduled properties: 12
Completed: 10
Partially completed: 1
Rescheduled: 1

Contracted tasks completed: 94
Additional work completed: 2
Issues reported: 4
Customer approvals received: 2
Rework required: 0
Photos awaiting synchronization: 0
Equipment problems: 1
Service records ready for billing: 11
```

---

# 34. Relationship to the Homeowner Application

The homeowner and crew applications should share a common property and service history while presenting different experiences.

The homeowner application should emphasize:

* Visibility.
* Service requests.
* Approvals.
* Property condition.
* Photos.
* Recommendations.
* Communication.
* Billing information.

The crew application should emphasize:

* Route execution.
* Contract scope.
* Crew assignments.
* Operational efficiency.
* Safety.
* Documentation.
* Quality control.
* Exceptions.
* Billing readiness.

Shared entities may include:

* Customer.
* Property.
* Yard zone.
* Service plan.
* Work order.
* Task.
* Issue.
* Photo.
* Estimate.
* Approval.
* Service history.
* Customer communication.

This shared domain model would allow the homeowner to see an understandable service summary while the crew receives the detailed operational instructions required to perform the work.
