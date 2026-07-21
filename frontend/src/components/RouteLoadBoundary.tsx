import React, { type ReactNode } from 'react';

type State = {
  failed: boolean;
  recovering: boolean;
};

export class RouteLoadBoundary extends React.Component<
  { children: ReactNode },
  State
> {
  state: State = { failed: false, recovering: false };

  static getDerivedStateFromError(): State {
    return { failed: true, recovering: false };
  }

  componentDidCatch(error: Error) {
    console.error('Frontend route failed to load.', error);
  }

  recover = async () => {
    this.setState({ recovering: true });
    try {
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith('grover-field-shell-'))
            .map((name) => window.caches.delete(name)),
        );
      }
    } finally {
      window.location.reload();
    }
  };

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
              disabled={this.state.recovering}
              onClick={() => void this.recover()}
              type="button"
            >
              {this.state.recovering ? 'Refreshing application files…' : 'Reload application'}
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
