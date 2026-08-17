import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
// @ts-ignore
import { Button } from '@els/els-react--button';
// @ts-ignore
import { Card } from '@els/els-react--card';
import { useAuth } from '../../utils/auth-context';
import './login.scss';

const Login = () => {
    const baseClassName = 'login';
    const { session, loading, signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!loading && session) {
        return <Redirect to="/" />;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        const { error: signInError } = await signIn(email, password);
        setSubmitting(false);
        if (signInError) {
            setError(signInError);
        }
    };

    return (
        <div className={baseClassName}>
            <Card className={`${baseClassName}__card`}>
                <h1 id="my-content" tabIndex={-1}>
                    Sign in
                </h1>
                <p className={`${baseClassName}__subtitle`}>
                    Clinical Learning Hub demo — sign in with your seeded
                    account.
                </p>
                <form className={`${baseClassName}__form`} onSubmit={handleSubmit}>
                    <label className={`${baseClassName}__field`}>
                        <span>Email</span>
                        <input
                            type="email"
                            required
                            autoComplete="username"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </label>
                    <label className={`${baseClassName}__field`}>
                        <span>Password</span>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>
                    {error ? (
                        <p className={`${baseClassName}__error`} role="alert">
                            {error}
                        </p>
                    ) : null}
                    <Button type="primary" htmlType="submit" disabled={submitting}>
                        {submitting ? 'Signing in…' : 'Sign in'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Login;
