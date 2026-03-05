import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto',
            fontFamily: 'system-ui, sans-serif',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            backgroundColor: '#fef2f2',
          }}
        >
          <h2 style={{ color: '#b91c1c', marginTop: 0 }}>오류가 발생했습니다</h2>
          <pre
            style={{
              overflow: 'auto',
              fontSize: '0.85rem',
              color: '#991b1b',
              whiteSpace: 'pre-wrap',
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);

