import ResetPasswordClient from './resetPasswordClient';

/**
 * Reset Password Page
 * This page handles the reset password functionality.
 * It retrieves the token from the URL query parameters and
 * passes it to the ResetPasswordClient component.
 */
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const tokenFromUrl = searchParams.token || '';

  return <ResetPasswordClient initialToken={tokenFromUrl} />;
}
