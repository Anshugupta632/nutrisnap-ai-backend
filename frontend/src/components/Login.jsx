import { useState } from 'react';
import { loginWithEmail, signupWithEmail, setAuthToken, setStoredUser } from '../services/api';

const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  showPassword, 
  onToggleShow, 
  touched, 
  error, 
  isSignup, 
  helperText,
  disabled,
  autoComplete 
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-cream/80 text-xs font-semibold tracking-wide uppercase">{label}</label>
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-steel/60 backdrop-blur-md rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border transition-all duration-200 pr-12 focus:ring-2 focus:ring-haldi/50 ${
          touched && error && value
            ? 'border-masala focus:border-masala'
            : 'border-white/10 focus:border-haldi'
        }`}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/50 hover:text-cream transition-colors p-1"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
    {isSignup && helperText && <p className="text-cream/40 text-xs">{helperText}</p>}
    {touched && error && value && <p className="text-masala text-xs font-medium">{error}</p>}
  </div>
);

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ 
    email: false, 
    password: false, 
    confirmPassword: false,
    firstName: false,
    lastName: false 
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password, isSignup) => {
    if (isSignup && password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const validateConfirmPassword = (password, confirmPassword, isSignup) => {
    if (!isSignup) return null;
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateName = (name, fieldName, isSignup) => {
    if (!isSignup) return null;
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    return null;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError(null);
  };

  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
    if (error) setError(null);
  };

  const handleLastNameChange = (e) => {
    setLastName(e.target.value);
    if (error) setError(null);
  };

  const handleEmailBlur = () => setTouched((prev) => ({ ...prev, email: true }));
  const handlePasswordBlur = () => setTouched((prev) => ({ ...prev, password: true }));
  const handleConfirmPasswordBlur = () => setTouched((prev) => ({ ...prev, confirmPassword: true }));
  const handleFirstNameBlur = () => setTouched((prev) => ({ ...prev, firstName: true }));
  const handleLastNameBlur = () => setTouched((prev) => ({ ...prev, lastName: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    setTouched({ 
      email: true, 
      password: true, 
      confirmPassword: true,
      firstName: true,
      lastName: true 
    });

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailError = !validateEmail(email) ? 'Please enter a valid email address' : null;
    const passwordError = validatePassword(password, !isLogin);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword, !isLogin);
    const firstNameError = validateName(firstName, 'First name', !isLogin);
    const lastNameError = validateName(lastName, 'Last name', !isLogin);

    const errors = [emailError, passwordError, confirmPasswordError, firstNameError, lastNameError].filter(Boolean);
    
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      const response = isLogin
        ? await loginWithEmail(email, password)
        : await signupWithEmail(email, password, firstName.trim(), lastName.trim());

      if (response.success && response.session) {
        setAuthToken(response.session.access_token);
        setStoredUser(response.user);
        onLogin(response.user);
      } else {
        setError(response.error || (isLogin ? 'Login failed. Please try again.' : 'Signup failed. Please try again.'));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || '';
      if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
        setError('Incorrect email or password');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please verify your email before logging in');
      } else if (errorMessage.includes('User already registered') || errorMessage.includes('already registered')) {
        setError('An account with this email already exists');
      } else if (errorMessage.includes('Password should be at least 6 characters')) {
        setError('Password must be at least 6 characters');
      } else {
        setError(isLogin ? 'Login failed. Please try again.' : 'Signup failed. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setTouched({ email: false, password: false, confirmPassword: false, firstName: false, lastName: false });
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
  };

  return (
    <div className="min-h-screen bg-steel flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Dynamic 3D Blur Glow Background Elements */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-haldi/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-masala/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-dabba/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-cream tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-cream/60 text-sm font-body mt-1.5">
            {isLogin
              ? 'Sign in to continue tracking your nutrition'
              : 'Start your nutrition journey today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-cream/80 text-xs font-semibold tracking-wide uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              className={`w-full bg-steel/60 backdrop-blur-md rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border transition-all duration-200 focus:ring-2 focus:ring-haldi/50 ${
                touched.email && !validateEmail(email) && email
                  ? 'border-masala focus:border-masala'
                  : 'border-white/10 focus:border-haldi'
              }`}
              autoComplete="email"
              disabled={isLoading}
            />
            {touched.email && !validateEmail(email) && email && (
              <p className="text-masala text-xs font-medium">Please enter a valid email address</p>
            )}
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-cream/80 text-xs font-semibold tracking-wide uppercase">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={handleFirstNameChange}
                  onBlur={handleFirstNameBlur}
                  placeholder="John"
                  className={`w-full bg-steel/60 backdrop-blur-md rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border transition-all duration-200 focus:ring-2 focus:ring-haldi/50 ${
                    touched.firstName && firstName && firstName.trim().length < 2
                      ? 'border-masala focus:border-masala'
                      : 'border-white/10 focus:border-haldi'
                  }`}
                  autoComplete="given-name"
                  disabled={isLoading}
                />
                {touched.firstName && firstName && firstName.trim().length < 2 && (
                  <p className="text-masala text-xs font-medium">At least 2 chars</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-cream/80 text-xs font-semibold tracking-wide uppercase">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={handleLastNameChange}
                  onBlur={handleLastNameBlur}
                  placeholder="Doe"
                  className={`w-full bg-steel/60 backdrop-blur-md rounded-xl px-4 py-3 text-cream font-mono text-sm outline-none border transition-all duration-200 focus:ring-2 focus:ring-haldi/50 ${
                    touched.lastName && lastName && lastName.trim().length < 2
                      ? 'border-masala focus:border-masala'
                      : 'border-white/10 focus:border-haldi'
                  }`}
                  autoComplete="family-name"
                  disabled={isLoading}
                />
                {touched.lastName && lastName && lastName.trim().length < 2 && (
                  <p className="text-masala text-xs font-medium">At least 2 chars</p>
                )}
              </div>
            </div>
          )}

          <PasswordInput
            label="Password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            placeholder="Enter password"
            showPassword={showPassword}
            onToggleShow={() => setShowPassword(!showPassword)}
            touched={touched.password}
            error={password && password.length < 6 && !isLogin}
            isSignup={!isLogin}
            helperText="Must be at least 6 characters"
            disabled={isLoading}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={handleConfirmPasswordBlur}
              placeholder="Confirm password"
              showPassword={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              touched={touched.confirmPassword}
              error={confirmPassword && password !== confirmPassword}
              isSignup={true}
              helperText="Re-enter your password"
              disabled={isLoading}
              autoComplete="new-password"
            />
          )}

          {error && (
            <div className="bg-masala/20 border border-masala/50 rounded-xl p-3 text-masala text-sm font-medium animate-shake shadow-inner">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl font-display font-semibold text-cream transition-all duration-200 shadow-lg ${
              isLoading
                ? 'bg-masala/50 cursor-wait'
                : 'bg-masala hover:bg-masala/90 active:scale-[0.98] cursor-pointer'
            }`}
          >
            {isLoading
              ? (isLogin ? 'Logging in...' : 'Creating account...')
              : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="text-cream/60 text-sm font-body text-center">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={toggleMode}
            className="ml-2 text-haldi hover:underline font-semibold cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;