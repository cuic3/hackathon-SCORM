import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
// @ts-ignore
import { Button } from '@els/els-react--button';
// @ts-ignore
import { Card } from '@els/els-react--card';
import { useAuth } from '../../utils/auth-context';
import { supabase } from '../../utils/supabase';
import type { Tables } from '../../types/supabase';
import './signup.scss';

const Signup = () => {
    const baseClassName = 'signup';
    const { session, loading, signUpLearner } = useAuth();
    const [organizations, setOrganizations] = useState<
        Tables<'organizations'>[]
    >([]);
    const [displayName, setDisplayName] = useState('');
    const [organizationId, setOrganizationId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        supabase
            .from('organizations')
            .select('*')
            .order('name')
            .then(({ data }) => {
                if (isMounted && data) {
                    setOrganizations(data);
                    setOrganizationId((current) => current || data[0]?.id || '');
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    if (!loading && session) {
        return <Redirect to="/" />;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setMessage(null);
        const { error: signUpError } = await signUpLearner(
            email,
            password,
            displayName,
            organizationId
        );
        setSubmitting(false);
        if (signUpError) {
            setError(signUpError);
            return;
        }
        setMessage('Account created. You can now sign in.');
    };

    return (
        <div className={baseClassName}>
            <Card className={`${baseClassName}__card`}>
                <h1 id="my-content" tabIndex={-1}>
                    Create a learner account
                </h1>
                <p className={`${baseClassName}__subtitle`}>
                    Clinical Learning Hub demo — sign up to take lessons as a
                    learner.
                </p>
                <form className={`${baseClassName}__form`} onSubmit={handleSubmit}>
                    <label className={`${baseClassName}__field`}>
                        <span>Name</span>
                        <input
                            type="text"
                            required
                            autoComplete="name"
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                        />
                    </label>
                    <label className={`${baseClassName}__field`}>
                        <span>Institution</span>
                        <select
                            required
                            value={organizationId}
                            onChange={(event) => setOrganizationId(event.target.value)}
                        >
                            {organizations.map((organization) => (
                                <option key={organization.id} value={organization.id}>
                                    {organization.name}
                                </option>
                            ))}
                        </select>
                    </label>
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
                            minLength={6}
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>
                    {error ? (
                        <p className={`${baseClassName}__error`} role="alert">
                            {error}
                        </p>
                    ) : null}
                    {message ? (
                        <p className={`${baseClassName}__message`} role="status">
                            {message}
                        </p>
                    ) : null}
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={submitting || !organizationId}
                    >
                        {submitting ? 'Creating account…' : 'Sign up'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Signup;
