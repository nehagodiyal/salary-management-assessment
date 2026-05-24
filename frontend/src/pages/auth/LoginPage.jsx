import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import FormikTextField from '@/components/common/FormikTextField';
import { useAuth } from '@/hooks/useAuth.jsx';
import { extractApiError } from '@/api/errors';
import env from '@/config/env';

const validationSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerError(null);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error?.code === 'NOT_ADMIN') {
        setServerError(error.message);
      } else {
        const { message, status } = extractApiError(error);
        setServerError(
          status === 401 ? 'Invalid email or password.' : message || 'Sign-in failed.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <PaidIcon fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {env.appName}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            HR admin console — sign in to manage employees & analytics.
          </Typography>
        </Stack>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form noValidate>
              <Stack spacing={2}>
                <FormikTextField
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                />
                <FormikTextField
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
          sx={{ mt: 3 }}
        >
          Access is restricted to administrators. Contact your system admin to
          provision a new account.
        </Typography>
      </CardContent>
    </Card>
  );
}
