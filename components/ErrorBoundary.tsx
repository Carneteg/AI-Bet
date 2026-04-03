"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Okänt fel";
    return { hasError: true, message };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-[40vh] flex items-center justify-center px-4">
            <div className="bg-surface-card border border-accent-red/30 rounded-2xl p-8 max-w-md text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-accent-red mb-2">
                Något gick fel
              </h2>
              <p className="text-slate-400 text-sm mb-6">{this.state.message}</p>
              <button
                onClick={() => this.setState({ hasError: false, message: "" })}
                className="bg-brand hover:bg-brand-dark transition px-6 py-2 rounded-xl font-semibold text-white text-sm"
              >
                Försök igen
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
