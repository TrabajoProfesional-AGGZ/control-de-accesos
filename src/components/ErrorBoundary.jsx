import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error no capturado en la aplicación:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#F5F5F5',
            color: '#111111',
          }}
        >
          <h1 style={{ margin: 0 }}>Algo salió mal</h1>
          <p style={{ color: '#4A4A4A', margin: 0 }}>
            Ocurrió un error inesperado. Copiá el mensaje de abajo si le vas a avisar a soporte.
          </p>
          {import.meta.env.DEV && (
            <pre
              style={{
                maxWidth: '600px',
                overflow: 'auto',
                textAlign: 'left',
                backgroundColor: '#FFFFFF',
                border: '1px solid #111111',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.8rem',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
