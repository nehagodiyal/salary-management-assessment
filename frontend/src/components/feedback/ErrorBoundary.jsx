import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('UI error:', error, info);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Something went wrong
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </Typography>
        <Button variant="contained" onClick={this.reset}>
          Try again
        </Button>
      </Box>
    );
  }
}
