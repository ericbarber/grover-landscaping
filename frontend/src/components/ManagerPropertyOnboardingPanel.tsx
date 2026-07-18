import { useEffect, useState } from 'react';
import {
  fetchPropertyOnboarding,
  savePropertyOnboarding,
  type PropertyOnboardingProfile,
  type PropertyOnboardingStatus,
  type SavePropertyOnboardingRequest,
} from '../api/client';

export type PropertyOnboardingOption = {
  propertyId: string;
  accountId: string;
  organizationId: string;
  displayName: string;
  serviceAddress: string;
};

type Props = {
  properties: PropertyOnboardingOption[];
  onSaved?: (profile: PropertyOnboardingProfile) => void;
};

const statuses: PropertyOnboardingStatus[] = ['incomplete', 'active', 'blocked', 'archived'];

function emptyForm(property: PropertyOnboardingOption): SavePropertyOnboardingRequest {
  return {
    accountId: property.accountId,
    organizationId: property.organizationId,
    serviceAddress: property.serviceAddress,
    accessNotes: '',
    billingContactName: '',
    billingContactEmail: '',
    notificationContactName: '',
    notificationEmail: '',
    notificationPhone: '',
    onboardingStatus: 'incomplete',
  };
}

export function validatePropertyOnboardingForm(
  form: SavePropertyOnboardingRequest,
): string | null {
  if (form.serviceAddress.trim().length < 5) return 'Enter a complete service address.';
  if (!form.billingContactName.trim()) return 'Enter the billing contact name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billingContactEmail.trim())) {
    return 'Enter a valid billing contact email.';
  }
  if (!form.notificationContactName.trim()) return 'Enter the notification contact name.';
  if (!form.notificationEmail.trim() && !form.notificationPhone.trim()) {
    return 'Enter a notification email or E.164 phone number.';
  }
  if (
    form.notificationEmail.trim()
    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notificationEmail.trim())
  ) {
    return 'Enter a valid notification email.';
  }
  if (form.notificationPhone.trim() && !/^\+[1-9]\d{7,14}$/.test(form.notificationPhone.trim())) {
    return 'Enter the notification phone in E.164 format, such as +16025550123.';
  }
  if (form.accessNotes.trim().length > 1000) return 'Access notes cannot exceed 1000 characters.';
  return null;
}

function profileToForm(profile: PropertyOnboardingProfile): SavePropertyOnboardingRequest {
  const { propertyId: _propertyId, persisted: _persisted, ...form } = profile;
  return form;
}

export function ManagerPropertyOnboardingPanel({ properties, onSaved }: Props) {
  const [propertyId, setPropertyId] = useState(properties[0]?.propertyId ?? '');
  const selectedProperty = properties.find((property) => property.propertyId === propertyId);
  const [form, setForm] = useState<SavePropertyOnboardingRequest | null>(
    selectedProperty ? emptyForm(selectedProperty) : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Select a property to load its onboarding profile.');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    const property = properties.find((item) => item.propertyId === propertyId);
    if (!property) {
      setForm(null);
      return;
    }
    let active = true;
    setIsLoading(true);
    setValidationMessage(null);
    fetchPropertyOnboarding(property.propertyId)
      .then((profile) => {
        if (!active) return;
        setForm(profileToForm(profile));
        setMessage(profile.persisted ? 'Loaded persisted onboarding profile.' : 'Loaded local onboarding profile.');
      })
      .catch(() => {
        if (!active) return;
        setForm(emptyForm(property));
        setMessage('No saved profile was found. Complete the fields below to create one.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [properties, propertyId]);

  function update<K extends keyof SavePropertyOnboardingRequest>(
    field: K,
    value: SavePropertyOnboardingRequest[K],
  ) {
    setForm((current) => current ? { ...current, [field]: value } : current);
    setValidationMessage(null);
  }

  async function submit() {
    if (!form || !selectedProperty) return;
    const error = validatePropertyOnboardingForm(form);
    if (error) {
      setValidationMessage(error);
      return;
    }
    setIsLoading(true);
    try {
      const saved = await savePropertyOnboarding(selectedProperty.propertyId, form);
      setForm(profileToForm(saved));
      setMessage(saved.persisted ? 'Onboarding profile saved to PostgreSQL.' : 'Saved in local fallback mode.');
      onSaved?.(saved);
    } catch {
      setValidationMessage('The onboarding profile could not be saved. Check access and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Property onboarding</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Operational profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Capture the address, access instructions, billing contact, and service notifications required before scheduling.
        </p>
      </div>

      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Property
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          disabled={isLoading}
          onChange={(event) => setPropertyId(event.target.value)}
          value={propertyId}
        >
          {properties.map((property) => (
            <option key={property.propertyId} value={property.propertyId}>
              {property.displayName}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-xs text-slate-500">{isLoading ? 'Loading onboarding profile…' : message}</p>

      {form ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Service address
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.serviceAddress} onChange={(event) => update('serviceAddress', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Access notes
            <textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" maxLength={1000} value={form.accessNotes} onChange={(event) => update('accessNotes', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Billing contact
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.billingContactName} onChange={(event) => update('billingContactName', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Billing email
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" inputMode="email" value={form.billingContactEmail} onChange={(event) => update('billingContactEmail', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Notification contact
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.notificationContactName} onChange={(event) => update('notificationContactName', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Notification email
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" inputMode="email" value={form.notificationEmail} onChange={(event) => update('notificationEmail', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Notification phone
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" inputMode="tel" placeholder="+16025550123" value={form.notificationPhone} onChange={(event) => update('notificationPhone', event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Onboarding status
            <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 capitalize" value={form.onboardingStatus} onChange={(event) => update('onboardingStatus', event.target.value as PropertyOnboardingStatus)}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          {validationMessage ? (
            <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2" role="alert">
              {validationMessage}
            </p>
          ) : null}
          <button className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 sm:col-span-2" disabled={isLoading} onClick={() => void submit()} type="button">
            {isLoading ? 'Saving…' : 'Save onboarding profile'}
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No properties are available for onboarding.</p>
      )}
    </section>
  );
}
