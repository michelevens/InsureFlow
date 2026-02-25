import { Component, lazy } from 'react';
import type { ComponentType, LazyExoticComponent, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches chunk/module load errors (stale deploys) and forces a page reload.
 * Prevents blank pages when lazy-loaded chunks are no longer available.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State | null {
    if (isChunkLoadError(error)) {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (isChunkLoadError(error)) {
      // Prevent infinite reload loop — only reload once per session per path
      const key = 'chunk_reload_' + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-slate-600">This page failed to load. Please refresh.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-shield-600 text-white rounded-lg hover:bg-shield-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Importing a module script failed') ||
    error.message?.includes('error loading dynamically imported module')
  );
}

/**
 * Wrapper around React.lazy that retries once on chunk load failure.
 * On retry failure, falls through to ChunkErrorBoundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry(
  importFn: () => Promise<{ default: ComponentType<any> }>
): LazyExoticComponent<ComponentType<any>> {
  return lazy(() =>
    importFn().catch(
      () =>
        new Promise<{ default: ComponentType<any> }>((resolve, reject) => {
          // Retry once after 1s — browser may have cached a stale chunk URL
          setTimeout(() => importFn().then(resolve).catch(reject), 1000);
        })
    )
  );
}
