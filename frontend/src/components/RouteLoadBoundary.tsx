import React, { type ReactNode } from 'react';

type State = {
  failed: boolean;
};

export class RouteLoadBoundary extends React.Component<
  { children: ReactNode },
  State
> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('Frontend route failed to load.', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-950">This screen did not finish loading</h1>
            <p className="mt-2 text-sm text-slate-600">
              Check your connection, then reload the latest application files.
            </p>
            <button
              className="mt-5 min-h-11 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload application
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
