#!/usr/bin/env node

// Read-only local-review fixture probe. It reports counts and states, never
// customer names, addresses, messages, tokens, or protected record bodies.
const apiBase = (process.env.YARDFOLIO_STUDY_API_URL ?? 'http://127.0.0.1:8081').replace(/\/+$/, '');
const asOf = process.env.YARDFOLIO_STUDY_AS_OF ?? new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Phoenix', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
  throw new Error('YARDFOLIO_STUDY_AS_OF must be YYYY-MM-DD.');
}

async function read(path, reviewer) {
  try {
    const response = await fetch(new URL(path, `${apiBase}/`), {
      headers: {
        accept: 'application/json',
        ...(reviewer ? { 'x-yardfolio-local-reviewer': reviewer } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
  } catch {
    return { status: 'unavailable', payload: null };
  }
}

function errorCode(result) {
  return typeof result.payload?.error === 'string' ? result.payload.error : undefined;
}

function count(value) {
  return Array.isArray(value) ? value.length : undefined;
}

const config = await read('/auth/config');
if (config.status !== 200 || config.payload?.mode !== 'local_review') {
  throw new Error('Fixture probe requires a reachable API in local_review mode.');
}

const studyOwners = [
  { key: 'canyon', reviewer: 'property-owner-canyon' },
  { key: 'sage', reviewer: 'property-owner-sage' },
];

const [ownerPortal, managerPortal, crewRoute, exceptions, ...studyOwnerProperties] = await Promise.all([
  read('/customer-portal/visits', 'property-owner'),
  read('/customer-portal/visits', 'property-manager'),
  read('/crews/crew_1001/day-plan/today', 'crew-lead'),
  read('/operational-exceptions?limit=25', 'manager'),
  ...studyOwners.map(({ reviewer }) => read('/owner-properties', reviewer)),
]);

const studyOwnerReports = await Promise.all(studyOwners.map(async ({ key, reviewer }, index) => {
  const propertiesResult = studyOwnerProperties[index];
  const properties = Array.isArray(propertiesResult.payload) ? propertiesResult.payload
    : propertiesResult.payload?.properties;
  const proposalReads = propertiesResult.status === 200 && Array.isArray(properties)
    ? await Promise.all(properties.slice(0, 10).map((property) => {
      const id = property.property_id ?? property.id;
      return id ? read(`/owner-properties/${encodeURIComponent(id)}/initial-service-proposals`, reviewer)
        : Promise.resolve({ status: 'invalid_property', payload: null });
    }))
    : [];
  const proposals = proposalReads.flatMap((result) => (
    Array.isArray(result.payload) ? result.payload : []
  ));
  const portalResult = await read('/customer-portal/visits', reviewer);
  const visits = portalResult.payload?.visits;
  return {
    key,
    status: propertiesResult.status,
    error: errorCode(propertiesResult),
    properties: count(properties),
    proposalReads: proposalReads.map((result) => ({
      status: result.status,
      error: errorCode(result),
    })),
    currentVersionThreeProposals: proposals.filter((proposal) => (
      (proposal.proposal_version ?? proposal.proposalVersion) === 3
      && (proposal.status === 'sent' || proposal.status === 'accepted')
    )).length,
    customerPortal: {
      status: portalResult.status,
      error: errorCode(portalResult),
      properties: count(portalResult.payload?.properties),
      visits: count(visits),
      deliveredProofAvailable: Array.isArray(visits)
        ? visits.filter((visit) => visit.delivered_proof_available === true).length
        : undefined,
    },
  };
}));
const route = crewRoute.payload;
const managerVisits = managerPortal.payload?.visits;
const managerExceptionRecords = Array.isArray(exceptions.payload) ? exceptions.payload : [];

const report = {
  checkedAt: new Date().toISOString(),
  asOf,
  mode: 'local_review',
  ownerPortal: {
    status: ownerPortal.status,
    error: errorCode(ownerPortal),
    properties: count(ownerPortal.payload?.properties),
    visits: count(ownerPortal.payload?.visits),
  },
  propertyManagerPortal: {
    status: managerPortal.status,
    error: errorCode(managerPortal),
    properties: count(managerPortal.payload?.properties),
    visits: count(managerVisits),
    deliveredProofAvailable: Array.isArray(managerVisits)
      ? managerVisits.filter((visit) => visit.delivered_proof_available === true).length
      : undefined,
  },
  ownerAcquisition: {
    records: studyOwnerReports,
  },
  crewRoute: {
    status: crewRoute.status,
    error: errorCode(crewRoute),
    serviceDate: typeof route?.service_date === 'string' ? route.service_date : undefined,
    isAsOfDate: typeof route?.service_date === 'string' ? route.service_date === asOf : undefined,
    stops: count(route?.stops),
  },
  managerExceptions: {
    status: exceptions.status,
    error: errorCode(exceptions),
    open: managerExceptionRecords.filter((exception) => exception.status === 'open').length,
    inProgress: managerExceptionRecords.filter((exception) => exception.status === 'in_progress').length,
    resolved: managerExceptionRecords.filter((exception) => exception.status === 'resolved').length,
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
