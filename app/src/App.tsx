import React from 'react';
import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom';
import AppShell from './components/app-shell/app-shell';
import RequireRole from './components/require-role/require-role';
import { AuthProvider } from './utils/auth-context';
import Home from './pages/home/home';
import Lesson from './pages/lesson/lesson';
import Login from './pages/login/login';
import AdminUpload from './pages/admin-upload/admin-upload';
import Report from './pages/report/report';

const App = () => (
    <Router>
        <AuthProvider>
            <AppShell>
                <Switch>
                    <Route exact path="/login" component={Login} />
                    <Route exact path="/">
                        <RequireRole allow={['learner']}>
                            <Home />
                        </RequireRole>
                    </Route>
                    <Route exact path="/lesson/:lessonId">
                        <RequireRole allow={['learner']}>
                            <Lesson />
                        </RequireRole>
                    </Route>
                    <Route exact path="/admin/upload">
                        <RequireRole allow={['admin']}>
                            <AdminUpload />
                        </RequireRole>
                    </Route>
                    <Route exact path="/report">
                        <RequireRole allow={['educator']}>
                            <Report />
                        </RequireRole>
                    </Route>
                    <Redirect to="/" />
                </Switch>
            </AppShell>
        </AuthProvider>
    </Router>
);

export default App;
