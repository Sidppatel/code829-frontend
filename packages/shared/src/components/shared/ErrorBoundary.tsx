import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Result, Button } from 'antd';
import { createLogger } from '../../lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const log = createLogger('ErrorBoundary');

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface ErrorBoundary extends Component<Props, State> {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('React ErrorBoundary caught error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.error?.message}
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
