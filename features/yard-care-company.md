# Multi-Crew Yard Care Operations Platform

## Product Requirements for Yard Care Companies Managing Multiple Crews and Routes

## 1. Product Vision

The application should help a yard care company coordinate many crews, routes, vehicles, properties, contracts, and service areas from a single operational platform.

The platform should provide a consistent operating model from the company office to the individual crew member.

It should answer the following questions:

1. Which properties must be serviced today?
2. Which crew should service each property?
3. Does each crew have enough time, people, equipment, and materials?
4. Are routes balanced and geographically efficient?
5. Which crews are ahead, delayed, blocked, or over capacity?
6. Have all contracted services been completed?
7. Is proof of service complete?
8. Are customer issues and additional-work requests being handled?
9. Are completed work orders ready for billing?
10. Which routes, properties, and contracts are profitable?

The application should operate as a multi-crew field service, dispatch, quality-control, and service-delivery platform.

---

# 2. Primary User Personas

## 2.1 Operations Manager

The operations manager is responsible for:

* Daily service delivery.
* Crew productivity.
* Route capacity.
* Customer commitments.
* Escalations.
* Quality.
* Staffing.
* Equipment allocation.
* Operational profitability.

## 2.2 Dispatcher

The dispatcher is responsible for:

* Building daily routes.
* Assigning work orders.
* Monitoring progress.
* Responding to delays.
* Reassigning work.
* Coordinating customer access.
* Managing weather-related changes.

## 2.3 Branch or Service Area Manager

The branch manager is responsible for:

* A defined geographic region.
* Local crews.
* Local equipment.
* Regional customers.
* Service-level performance.
* Regional cost and revenue.

## 2.4 Crew Lead

The crew lead is responsible for:

* Executing the assigned route.
* Supervising crew members.
* Completing work orders.
* Documenting service.
* Reporting exceptions.
* Performing quality inspections.

## 2.5 Crew Member

The crew member is responsible for:

* Completing assigned tasks.
* Following safety and service procedures.
* Reporting issues.
* Recording task completion.

## 2.6 Fleet and Equipment Manager

This user is responsible for:

* Vehicle availability.
* Trailer availability.
* Equipment assignments.
* Preventive maintenance.
* Repair status.
* Replacement planning.

## 2.7 Account Manager

The account manager is responsible for:

* Customer relationships.
* Contract scope.
* Renewals.
* Service changes.
* Complaints.
* Additional-work proposals.

## 2.8 Billing and Finance User

This user is responsible for:

* Billing readiness.
* Invoice generation.
* Service validation.
* Job costing.
* Contract profitability.
* Revenue recognition.

---

# 3. Organizational Hierarchy

The platform should support the following operational hierarchy:

```text
Company
  └── Region
       └── Branch or Service Area
            └── Crew
                 └── Route
                      └── Work Order
                           └── Task
```

Each level should have its own configuration, permissions, performance metrics, and operational responsibilities.

## 3.1 Company

The company level should manage:

* Global policies.
* Service catalog.
* Customer contracts.
* Pricing standards.
* Reporting.
* Branding.
* Role permissions.
* Quality standards.
* Safety standards.
* Integrations.

## 3.2 Region

The region level should support:

* Geographic oversight.
* Regional management.
* Performance comparisons.
* Capacity planning.
* Regional weather and seasonality.
* Cross-branch support.

## 3.3 Branch or Service Area

A branch should manage:

* Local crews.
* Vehicles.
* Equipment.
* Inventory.
* Service territories.
* Daily dispatch.
* Local customer accounts.
* Local operating schedules.

## 3.4 Crew

A crew should include:

* Crew identifier.
* Crew lead.
* Crew members.
* Skills.
* Certifications.
* Default vehicle.
* Default trailer.
* Default equipment.
* Home branch.
* Working hours.
* Capacity.

## 3.5 Route

A route should represent a sequence of work orders assigned to a crew for a shift or operational period.

---

# 4. Service Territory Management

## 4.1 Territory Definition

The company should be able to define service territories using:

* Postal codes.
* Cities.
* Counties.
* Radius from a branch.
* Custom map polygons.
* Neighborhoods.
* Customer-defined service areas.
* Travel-time boundaries.

## 4.2 Territory Assignment

Territories may be assigned to:

* Branches.
* Crews.
* Crew types.
* Specialized service teams.
* Account managers.
* Seasonal teams.

## 4.3 Territory Rules

The system should support rules such as:

```text
Recurring mowing properties in Territory A default to Crew 1.

Tree-related work in Territory A defaults to the specialized tree crew.

Properties outside a branch's normal territory require manager approval.

New properties should be assigned to the branch with the lowest estimated travel and available capacity.
```

## 4.4 Overlapping Territories

The platform should allow overlapping territories when:

* Multiple crews can cover the same area.
* Specialized services use different boundaries.
* Seasonal capacity requires temporary reassignment.
* Another branch provides backup coverage.

---

# 5. Crew Capacity Management

## 5.1 Capacity Inputs

The application should calculate crew capacity based on:

* Crew size.
* Shift length.
* Member skills.
* Certifications.
* Historical productivity.
* Property service estimates.
* Travel time.
* Equipment availability.
* Weather conditions.
* Break requirements.
* Overtime rules.
* Customer service windows.

## 5.2 Capacity Outputs

The system should identify:

* Available crew hours.
* Scheduled crew hours.
* Travel burden.
* Route utilization.
* Over-capacity crews.
* Underutilized crews.
* Unassigned work.
* Overtime risk.
* Required temporary staffing.

## 5.3 Capacity Warnings

Examples include:

```text
Crew 4 is scheduled for 11.2 hours of work in a 9-hour shift.

Crew 7 lacks a certified applicator for one assigned treatment.

Crew 2 does not have the required mower for Property 182.

Branch North has 18 unassigned service hours on Thursday.

Branch South has 12 available service hours on Thursday.
```

---

# 6. Master Scheduling

## 6.1 Schedule Sources

The master schedule should combine:

* Recurring contract services.
* Seasonal work.
* Approved additional work.
* Customer-requested work.
* Rework.
* Weather carryover.
* Emergency service.
* Equipment maintenance.
* Crew training.
* Staff absence.
* Company closures.

## 6.2 Recurring Work Generation

The system should generate work orders from service plans according to:

* Weekly frequency.
* Biweekly frequency.
* Monthly frequency.
* Seasonal windows.
* Condition-based requirements.
* Customer-specific calendars.
* Local weather and growth patterns.

## 6.3 Schedule Horizons

The platform should support:

* Daily dispatch planning.
* Weekly workload planning.
* Monthly capacity forecasting.
* Seasonal planning.
* Annual contract forecasting.

## 6.4 Scheduling Constraints

The scheduling engine should consider:

* Property service windows.
* Customer blackout dates.
* Crew qualifications.
* Equipment requirements.
* Vehicle capacity.
* Geographic proximity.
* Traffic.
* Weather.
* Contract priority.
* Customer service-level agreements.
* Crew shift limits.
* Branch boundaries.

---

# 7. Route Planning and Optimization

## 7.1 Route Inputs

Route planning should use:

* Work order locations.
* Estimated service durations.
* Crew starting location.
* Crew ending location.
* Customer time windows.
* Road travel estimates.
* Vehicle restrictions.
* Equipment requirements.
* Material capacity.
* Weather.
* Service priority.
* Crew skill requirements.

## 7.2 Route Outputs

The system should produce:

* Ordered work orders.
* Expected arrival times.
* Expected departure times.
* Travel durations.
* Shift utilization.
* Overtime projection.
* Route risk indicators.
* Loading requirements.

## 7.3 Route Planning Modes

The application should support:

* Fully optimized route.
* Dispatcher-managed route.
* Fixed recurring route.
* Customer-priority route.
* Emergency route.
* Specialized-service route.
* Partial-day route.
* Overflow route.

## 7.4 Route Balancing

The dispatcher should be able to:

* Move work orders between crews.
* Split a route.
* Combine routes.
* Assign overflow work.
* Reassign a property after a blocked visit.
* Transfer work between branches.
* Preserve recurring crew-to-property relationships when possible.

## 7.5 Route Stability

The system should avoid changing routes unnecessarily.

A configuration should allow the company to prioritize:

* Lowest travel time.
* Highest crew familiarity.
* Customer continuity.
* Least overtime.
* Earliest completion.
* Highest contract priority.

---

# 8. Crew Assignment Engine

The application should match work with crews based on:

* Geographic territory.
* Available time.
* Crew size.
* Required skills.
* Required certifications.
* Required equipment.
* Historical property familiarity.
* Customer preference.
* Performance history.
* Language needs.
* Safety requirements.

## 8.1 Assignment Eligibility

A crew should be marked ineligible when:

* A required certification is missing.
* Required equipment is unavailable.
* The property is outside the permitted territory.
* The work would exceed shift limits.
* A customer has excluded that crew.
* The crew has an unresolved safety restriction.

## 8.2 Crew Continuity

The platform should track the crew that normally services each property.

Benefits include:

* Familiarity with access.
* Familiarity with customer expectations.
* Improved service consistency.
* Reduced property learning time.

The system should still support temporary reassignment.

---

# 9. Daily Operations Command Center

The operations dashboard should provide a real-time view of all active crews.

## 9.1 Dashboard Statuses

Each crew should appear as:

```text
Not Checked In
Loading
En Route
At Property
Working
Quality Review
Delayed
Blocked
On Break
Returning to Branch
Shift Complete
```

## 9.2 Dashboard Information

For each crew, the system should display:

* Current location or route position where permitted.
* Current work order.
* Route progress.
* Completed properties.
* Remaining properties.
* Estimated route completion.
* Delay duration.
* Open issues.
* Equipment problems.
* Customer escalations.
* Overtime risk.

## 9.3 Operational Alerts

The dashboard should alert staff when:

* A crew is significantly behind schedule.
* A customer service window may be missed.
* A crew reports unsafe conditions.
* A route cannot be completed.
* Equipment failure affects service.
* Required evidence is missing.
* A customer complaint is received.
* Additional work requires approval.
* A crew exceeds configured work-hour limits.

---

# 10. Cross-Crew Work Reassignment

The system should support controlled reassignment of:

* Entire routes.
* Individual work orders.
* Specific tasks.
* Specialized work.
* Rework.
* Weather carryover.
* Emergency requests.

## 10.1 Reassignment Workflow

```text
Work At Risk
Capacity Evaluated
Alternative Crew Identified
Equipment and Skills Confirmed
Route Impact Calculated
Work Reassigned
Customer Notification Updated
Audit Record Created
```

## 10.2 Reassignment Decision Support

The application should show:

* Added travel.
* New expected arrival.
* Impact on both crews.
* Equipment conflicts.
* Overtime impact.
* Customer continuity impact.
* Service-level risk.

---

# 11. Multi-Crew Equipment and Vehicle Allocation

## 11.1 Vehicle Assignment

The company should manage:

* Trucks.
* Vans.
* Trailers.
* Specialized vehicles.
* Rental vehicles.
* Backup vehicles.

Each vehicle should have:

* Branch.
* Capacity.
* Crew assignment.
* Availability.
* Maintenance status.
* Inspection status.
* Fuel status.
* Insurance or registration records.

## 11.2 Equipment Pooling

Equipment may be:

* Permanently assigned to a crew.
* Assigned to a vehicle.
* Shared by a branch.
* Reserved for specialized work.
* Temporarily transferred.

## 11.3 Allocation Warnings

The system should prevent:

* Double-booking equipment.
* Assigning unavailable equipment.
* Dispatching unsafe equipment.
* Assigning insufficient trailer capacity.
* Assigning specialized work without required assets.

---

# 12. Multi-Location Inventory Management

Inventory should be tracked by:

* Central warehouse.
* Branch.
* Vehicle.
* Trailer.
* Crew.
* Temporary job site.

## 12.1 Inventory Forecasting

The application should forecast required materials from upcoming work orders.

Example:

```text
Next week's scheduled work requires:

- 320 feet of trimmer line.
- 18 sprinkler heads.
- 24 bags of mulch.
- 12 gallons of approved treatment product.

Branch inventory shortage:
- Six sprinkler heads.
- Four bags of mulch.
```

## 12.2 Material Reservation

Materials may be reserved for:

* A route.
* A work order.
* A customer project.
* A specialized crew.
* A future service date.

---

# 13. Standardized Work Execution

All crews should operate from common task templates.

Each task template should define:

* Service standard.
* Completion criteria.
* Estimated duration.
* Required equipment.
* Required materials.
* Required certification.
* Safety instructions.
* Required photos.
* Quality-control checks.
* Billable classification.
* Customer-facing description.

## 13.1 Company Service Catalog

The company should maintain a central catalog including:

* Lawn mowing.
* Trimming.
* Edging.
* Blowing.
* Weed removal.
* Shrub pruning.
* Tree services.
* Irrigation inspection.
* Irrigation repair.
* Fertilization.
* Pest treatment.
* Mulch installation.
* Seasonal cleanup.
* Storm cleanup.
* Landscape installation.

Branches may have regional variations while retaining a common service identifier.

---

# 14. Centralized Quality Management

## 14.1 Quality Standards

The company should define standard inspection requirements for:

* Mowing.
* Trimming.
* Edging.
* Cleanup.
* Irrigation.
* Pruning.
* Product application.
* Customer-requested work.

## 14.2 Quality Audits

Managers should be able to conduct:

* Remote photo audits.
* Random work-order audits.
* On-site inspections.
* Crew ride-alongs.
* Customer complaint reviews.
* Rework reviews.

## 14.3 Quality Sampling

The application should support rules such as:

```text
Audit 5 percent of routine work orders.

Audit all first-time property visits.

Audit all work orders completed by newly formed crews.

Audit all work orders associated with a customer complaint.

Audit all high-value additional work.
```

## 14.4 Corrective Action

Quality issues should support:

* Coaching.
* Rework assignment.
* Process review.
* Task-template changes.
* Crew retraining.
* Equipment investigation.
* Customer remediation.

---

# 15. Customer and Contract Management

The platform should support customers with:

* One property.
* Multiple properties.
* Multiple contracts.
* Multiple service areas.
* Central billing.
* Property-level billing.
* Different service standards by property.
* Regional account managers.

## 15.1 Contract Allocation

A single customer contract may generate work across:

* Multiple branches.
* Multiple crews.
* Multiple service types.
* Multiple billing groups.

## 15.2 Contract Performance

The application should track:

* Scheduled visits.
* Completed visits.
* Missed visits.
* Service-level compliance.
* Customer complaints.
* Rework.
* Additional revenue.
* Contract cost.
* Gross margin.
* Renewal risk.

---

# 16. Centralized Exception Management

Exceptions should be categorized as:

* Route delay.
* Staffing shortage.
* Equipment failure.
* Vehicle failure.
* Weather interruption.
* Access failure.
* Customer request.
* Safety concern.
* Quality concern.
* Billing concern.
* Contract scope concern.

## 16.1 Escalation Rules

Examples include:

```text
Access issue unresolved after 10 minutes:
Notify dispatcher.

Route delay greater than 30 minutes:
Notify operations manager.

Unsafe property condition:
Stop service and notify safety manager.

Customer complaint on a priority account:
Notify account manager immediately.

Crew cannot complete route:
Begin cross-crew capacity evaluation.
```

---

# 17. Multi-Crew Communication

The application should support:

* Company announcements.
* Branch announcements.
* Crew messages.
* Route updates.
* Work-order messages.
* Safety alerts.
* Weather alerts.
* Equipment alerts.
* Customer-specific instructions.

Communications should be attached to the appropriate operational entity to avoid relying on unstructured group messages.

---

# 18. Labor and Productivity Management

## 18.1 Productivity Measures

The application may calculate:

* Properties serviced per shift.
* Labor hours per property.
* Labor hours per service type.
* Travel percentage.
* Route utilization.
* Estimated-versus-actual duration.
* Rework hours.
* Overtime.
* Revenue per crew hour.
* Gross margin per route.

## 18.2 Fair Use of Metrics

Productivity measures should account for:

* Property size.
* Service complexity.
* Weather.
* Travel.
* Equipment problems.
* Customer delays.
* Training assignments.
* Safety requirements.

Metrics should not be used without operational context.

---

# 19. Billing Readiness Across Crews

A completed work order should become billing-ready only after:

* Required tasks are complete.
* Required photos are present.
* Quality inspection is complete.
* Labor is recorded.
* Materials are recorded.
* Additional-work approval is attached.
* Customer signature is captured when required.
* Exceptions are resolved or documented.

## 19.1 Billing Batches

Billing staff should be able to group records by:

* Customer.
* Contract.
* Property.
* Branch.
* Service period.
* Billing cycle.
* Service type.

---

# 20. Suggested Data Model Additions

## Company

```text
company_id
name
operating_timezone
service_catalog_id
quality_policy_id
safety_policy_id
```

## Region

```text
region_id
company_id
name
manager_id
timezone
```

## Branch

```text
branch_id
region_id
name
address
service_area_id
manager_id
operating_hours
```

## ServiceArea

```text
service_area_id
branch_id
name
boundary_type
boundary_definition
priority
```

## Crew

```text
crew_id
branch_id
crew_lead_id
default_vehicle_id
default_trailer_id
capacity_hours
status
```

## Route

```text
route_id
crew_id
service_date
planned_start
planned_end
actual_start
actual_end
status
estimated_travel
actual_travel
```

## RouteStop

```text
route_stop_id
route_id
work_order_id
sequence
planned_arrival
estimated_duration
actual_arrival
actual_departure
status
```

## CapacityRecord

```text
capacity_record_id
crew_id
service_date
available_hours
scheduled_hours
travel_hours
overtime_risk
```

## EquipmentReservation

```text
reservation_id
equipment_id
crew_id
route_id
start_time
end_time
status
```

## OperationalException

```text
exception_id
branch_id
crew_id
route_id
work_order_id
exception_type
severity
status
reported_at
resolved_at
```

---

# 21. Management Screens

The administrative platform should include:

1. **Operations Command Center**

   * Live view of all routes and crews.

2. **Master Schedule**

   * Weekly and monthly workload planning.

3. **Route Planner**

   * Route creation, optimization, and balancing.

4. **Capacity Planner**

   * Crew, branch, equipment, and labor capacity.

5. **Crew Management**

   * Crew assignments, skills, attendance, and performance.

6. **Territory Management**

   * Service boundaries and branch coverage.

7. **Fleet and Equipment**

   * Availability, assignments, inspections, and maintenance.

8. **Inventory**

   * Stock by branch, vehicle, and route.

9. **Quality Management**

   * Audits, rework, complaints, and coaching.

10. **Exceptions**

    * Operational issues requiring intervention.

11. **Contract Performance**

    * Service levels, cost, revenue, and renewal risk.

12. **Billing Readiness**

    * Completed records awaiting financial processing.

---

# 22. MVP Scope

The multi-crew MVP should include:

* Company, region, and branch configuration.
* Crew and crew-member management.
* Service territories.
* Recurring work-order generation.
* Daily route creation.
* Manual route optimization.
* Crew capacity calculations.
* Crew and work-order assignment.
* Equipment allocation.
* Operations dashboard.
* Route progress tracking.
* Cross-crew reassignment.
* Centralized photo review.
* Quality audits.
* Exception escalation.
* Labor and material tracking.
* Billing-readiness validation.
* Branch and crew performance reporting.

---

# 23. MVP Acceptance Criteria

The MVP should be successful when an operations manager can:

1. Configure multiple branches.
2. Create multiple crews within each branch.
3. Define service territories.
4. Generate recurring work orders.
5. Assign work orders to routes.
6. View crew capacity before dispatch.
7. Detect overbooked routes.
8. Move work between crews.
9. Assign required vehicles and equipment.
10. Monitor all active crews.
11. See delayed or blocked work orders.
12. Reassign work during the day.
13. Review photos from all crews.
14. perform centralized quality audits.
15. Confirm billing readiness.
16. Compare planned and actual crew performance.
17. Report performance by crew, branch, route, customer, and contract.

---

# 24. Example Multi-Crew Operating Day

## 6:00 A.M.

The operations dashboard shows:

```text
Active branches: 3
Crews scheduled: 14
Properties scheduled: 176
Estimated labor: 118 crew hours
Estimated travel: 24 hours
Unassigned work orders: 4
Routes at overtime risk: 2
Equipment conflicts: 1
Weather-risk properties: 12
```

## 7:45 A.M.

Crew 6 reports a mower failure.

The application identifies:

* Five remaining mowing properties.
* Two nearby crews.
* One available mower at the branch.
* The effect of each reassignment option.

The dispatcher assigns three properties to Crew 8 and sends a replacement mower to Crew 6.

## 11:30 A.M.

A storm begins affecting the western service area.

The application:

* Pauses unsafe work.
* Identifies 18 affected properties.
* Moves two indoor equipment-maintenance tasks into the schedule.
* Recommends rescheduling seven properties.
* Identifies four properties that can receive non-mowing service safely.
* Notifies affected customers.

## 4:30 P.M.

The operations summary shows:

```text
Scheduled properties: 176
Completed: 163
Partially completed: 4
Rescheduled: 9
Billing-ready: 157
Quality review pending: 6
Customer escalations: 2
Equipment failures: 1
Overtime routes: 0
```

This workflow demonstrates the primary value of the multi-crew platform: balancing service demand, crews, routes, equipment, evidence, quality, and customer commitments in a single operating system.
