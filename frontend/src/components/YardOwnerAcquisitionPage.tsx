import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { ApiRequestError, isApiErrorCode } from '../api/apiError';
import {
  createOwnerProperty,
  fetchOwnerProperties,
  fetchOwnerWorkspace,
  saveOwnerWorkspace,
  type CreateOwnerPropertyInput,
  type OwnerProperty,
  type OwnerWorkspace,
} from '../api/ownerAcquisitionClient';
import { useAuth } from '../auth/AuthProvider';

type PropertyDraft = Omit<CreateOwnerPropertyInput, 'addressConfirmed' | 'authorityAttested'>;

const emptyProperty: PropertyDraft = {
  displayName: 'Home',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  countryCode: 'US',
  coarseArea: '',
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required = false,
  hint,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="text-sm font-bold text-slate-800">
        {label}{required ? <span className="text-rose-700"> *</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-xs leading-5 text-slate-500">{hint}</span> : null}
      <input
        autoComplete={autoComplete}
        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function Progress({ workspace, propertyCount }: { workspace: boolean; propertyCount: number }) {
  const steps = [
    { label: 'Your details', complete: workspace },
    { label: 'Property', complete: propertyCount > 0 },
    { label: 'Yard brief', complete: false },
    { label: 'Connect care', complete: false },
  ];
  const current = workspace ? (propertyCount > 0 ? 2 : 1) : 0;
  return (
    <ol aria-label="Yard setup progress" className="grid grid-cols-4 gap-1">
      {steps.map((step, index) => (
        <li
          aria-current={index === current ? 'step' : undefined}
          className="min-w-0 text-center"
          key={step.label}
        >
          <span
            aria-hidden="true"
            className={`mx-auto mb-2 block h-1.5 rounded-full ${
              step.complete ? 'bg-emerald-600' : index === current ? 'bg-amber-500' : 'bg-slate-200'
            }`}
          />
          <span className={`text-[0.68rem] font-black uppercase tracking-wide sm:text-xs ${
            index === current ? 'text-slate-900' : 'text-slate-500'
          }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function YardOwnerAcquisitionPage() {
  const auth = useAuth();
  const prefix = useId();
  const [workspace, setWorkspace] = useState<OwnerWorkspace | null>(null);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [profileName, setProfileName] = useState('');
  const [property, setProperty] = useState<PropertyDraft>(emptyProperty);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [authorityAttested, setAuthorityAttested] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedWorkspace, loadedProperties] = await Promise.all([
        fetchOwnerWorkspace().catch((loadError: unknown) => {
          if (isApiErrorCode(loadError, 'owner_workspace_not_found')) return null;
          throw loadError;
        }),
        fetchOwnerProperties(),
      ]);
      setWorkspace(loadedWorkspace);
      setProperties(loadedProperties);
      setProfileName(loadedWorkspace?.displayName ?? '');
      setShowPropertyForm(Boolean(loadedWorkspace) && loadedProperties.length === 0);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Your private yard setup could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileName.trim().length < 2) {
      setError('Enter the name you want providers to see.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await saveOwnerWorkspace(profileName.trim());
      setWorkspace(saved);
      setShowPropertyForm(true);
      setNotice('Your private profile is saved. Add the yard you want cared for.');
    } catch (saveError) {
      setError(errorMessage(saveError, 'Your private profile could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  function changeAddressField(field: keyof PropertyDraft, value: string) {
    setProperty((current) => ({ ...current, [field]: value }));
    setAddressConfirmed(false);
    setNotice(null);
  }

  async function submitProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!addressConfirmed) {
      setError('Review the address and confirm it is correct before saving.');
      return;
    }
    if (!authorityAttested) {
      setError('Confirm that you are authorized to request care for this property.');
      return;
    }
    setSaving(true);
    try {
      const saved = await createOwnerProperty({
        ...property,
        addressConfirmed,
        authorityAttested,
      });
      setProperties((current) => [saved, ...current]);
      setProperty(emptyProperty);
      setAddressConfirmed(false);
      setAuthorityAttested(false);
      setShowPropertyForm(false);
      setNotice(`${saved.displayName} is saved privately. No provider can see it yet.`);
    } catch (saveError) {
      setError(errorMessage(saveError, 'Your property could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  const inputId = (name: string) => `${prefix}-${name}`;

  return (
    <main className="min-h-[calc(100vh-2.6rem)] bg-[#f4f1e9] text-slate-950">
      <header className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_80%_10%,#fbbf24,transparent_35%)]" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a className="flex min-h-11 items-center gap-3 rounded-lg font-black tracking-tight focus:outline-none focus:ring-2 focus:ring-amber-300" href="/">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-emerald-950">G</span>
            <span className="text-lg">Grover</span>
          </a>
          <a className="rounded-lg px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-white/10 hover:text-white" href="/app">
            My workspace
          </a>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Private yard setup</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Tell us about the yard. You choose who sees it.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-100 sm:text-lg">
            Start with your property, then build a clear care brief and connect a yard-care company when you are ready.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8">
        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8" aria-labelledby="yard-setup-title">
          <Progress workspace={Boolean(workspace)} propertyCount={properties.length} />
          <div aria-live="polite" className="mt-6">
            {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">{notice}</p> : null}
          </div>
          {error ? (
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4" role="alert">
              <p className="font-bold text-rose-950">We couldn’t complete that step.</p>
              <p className="mt-1 text-sm text-rose-900">{error}</p>
              {loading ? null : (
                <button className="mt-3 min-h-11 rounded-lg border border-rose-400 px-4 text-sm font-bold text-rose-950 hover:bg-rose-100" onClick={() => void load()} type="button">
                  Reload my setup
                </button>
              )}
            </div>
          ) : null}

          {loading ? (
            <div className="grid min-h-64 place-items-center" role="status">
              <p className="font-bold text-slate-600">Loading your private yard setup…</p>
            </div>
          ) : !auth.verifiedEmail ? (
            <div className="py-8" id="yard-setup-title">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Email verification needed</p>
              <h2 className="mt-3 text-2xl font-black">Verify your email before adding a property.</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                We use a verified email to protect your private address and return you to this setup safely. Verify through your sign-in account, then refresh access here.
              </p>
              <button className="mt-5 min-h-12 rounded-xl bg-emerald-800 px-5 font-bold text-white hover:bg-emerald-700" onClick={() => void auth.refreshAccess()} type="button">
                I verified my email
              </button>
            </div>
          ) : !workspace ? (
            <form className="mt-7" onSubmit={(event) => void submitWorkspace(event)}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Step 1 of 4</p>
              <h2 className="mt-2 text-2xl font-black" id="yard-setup-title">Create your private profile</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                Your email is verified as <strong className="text-slate-800">{auth.verifiedEmail}</strong>. A provider will see your name only after you approve a connection.
              </p>
              <Field
                autoComplete="name"
                className="mt-6 max-w-xl"
                id={inputId('profile-name')}
                label="Your name"
                onChange={setProfileName}
                required
                value={profileName}
              />
              <button className="mt-6 min-h-12 rounded-xl bg-emerald-800 px-6 font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60" disabled={saving} type="submit">
                {saving ? 'Saving…' : 'Save and add my property'}
              </button>
            </form>
          ) : (
            <div className="mt-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Step 2 of 4</p>
                  <h2 className="mt-2 text-2xl font-black" id="yard-setup-title">Your properties</h2>
                  <p className="mt-2 text-sm text-slate-600">Private to {workspace.displayName} until a provider connection is approved.</p>
                </div>
                {properties.length > 0 && !showPropertyForm ? (
                  <button className="min-h-11 rounded-xl border border-emerald-800 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-50" onClick={() => setShowPropertyForm(true)} type="button">
                    Add another property
                  </button>
                ) : null}
              </div>

              {properties.length > 0 ? (
                <ul className="mt-6 grid gap-3" aria-label="Private properties">
                  {properties.map((item) => (
                    <li className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4" key={item.propertyId}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>{item.displayName}</strong>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">Private draft</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{item.addressLine1}{item.addressLine2 ? `, ${item.addressLine2}` : ''}</p>
                      <p className="text-sm text-slate-600">{item.city}, {item.region} {item.postalCode}</p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {showPropertyForm ? (
                <form className="mt-7 border-t border-slate-200 pt-7" onSubmit={(event) => void submitProperty(event)}>
                  <h3 className="text-xl font-black">Add a property</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Use the service address. Grover will not publish it or share it with a provider at this step.</p>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field className="sm:col-span-2" id={inputId('property-name')} label="Property nickname" onChange={(value) => setProperty((current) => ({ ...current, displayName: value }))} required value={property.displayName} />
                    <Field autoComplete="address-line1" className="sm:col-span-2" id={inputId('address-1')} label="Street address" onChange={(value) => changeAddressField('addressLine1', value)} required value={property.addressLine1} />
                    <Field autoComplete="address-line2" className="sm:col-span-2" id={inputId('address-2')} label="Apartment, suite, or unit" onChange={(value) => changeAddressField('addressLine2', value)} value={property.addressLine2 ?? ''} />
                    <Field autoComplete="address-level2" id={inputId('city')} label="City" onChange={(value) => changeAddressField('city', value)} required value={property.city} />
                    <Field autoComplete="address-level1" id={inputId('region')} label="State or region" onChange={(value) => changeAddressField('region', value)} required value={property.region} />
                    <Field autoComplete="postal-code" id={inputId('postal')} label="ZIP or postal code" onChange={(value) => changeAddressField('postalCode', value)} required value={property.postalCode} />
                    <Field id={inputId('area')} label="General area" hint="Optional, for example Central Phoenix" onChange={(value) => setProperty((current) => ({ ...current, coarseArea: value }))} value={property.coarseArea ?? ''} />
                  </div>
                  <fieldset className="mt-6 grid gap-3">
                    <legend className="text-sm font-black text-slate-800">Confirm before saving</legend>
                    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                      <input checked={addressConfirmed} className="mt-1 h-5 w-5 accent-emerald-700" onChange={(event) => setAddressConfirmed(event.target.checked)} type="checkbox" />
                      <span className="text-sm leading-6"><strong>I reviewed this address and it is correct.</strong> Editing an address field will require confirmation again.</span>
                    </label>
                    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                      <input checked={authorityAttested} className="mt-1 h-5 w-5 accent-emerald-700" onChange={(event) => setAuthorityAttested(event.target.checked)} type="checkbox" />
                      <span className="text-sm leading-6"><strong>I am authorized to request yard care for this property.</strong></span>
                    </label>
                  </fieldset>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button className="min-h-12 rounded-xl bg-emerald-800 px-6 font-black text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60" disabled={saving} type="submit">
                      {saving ? 'Saving property…' : 'Save private property'}
                    </button>
                    {properties.length > 0 ? (
                      <button className="min-h-12 rounded-xl px-5 font-bold text-slate-700 hover:bg-slate-100" onClick={() => setShowPropertyForm(false)} type="button">Cancel</button>
                    ) : null}
                  </div>
                </form>
              ) : properties.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Next phase</p>
                  <h3 className="mt-2 font-black text-slate-900">Build the yard care brief</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-700">Goals, care cadence, considerations, and optional photos are coming next. Your saved property remains private.</p>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Privacy and process information">
          <section className="rounded-3xl bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-950/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Private by default</p>
            <h2 className="mt-3 text-xl font-black">You control each connection.</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-emerald-100">
              <li><strong className="block text-white">Not a public listing</strong>Your exact address stays in your private workspace.</li>
              <li><strong className="block text-white">No crew assignment</strong>You choose a provider company; that company manages its crews.</li>
              <li><strong className="block text-white">Review before sharing</strong>Photos and property details require a separate provider approval.</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-black">What happens next?</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li><strong className="text-slate-900">1. Describe the care</strong><br />Create a practical brief for the yard.</li>
              <li><strong className="text-slate-900">2. Connect a company</strong><br />Invite one you know before broader discovery.</li>
              <li><strong className="text-slate-900">3. Agree on service</strong><br />Review an assessment and provider-authored proposal.</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
