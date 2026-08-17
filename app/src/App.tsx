import React from 'react';
import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom';
import AppShell from './components/app-shell/app-shell';
import Home from './pages/home/home';
import Lesson from './pages/lesson/lesson';

const App = () => (
    <Router>
        <AppShell>
            <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/lesson/:lessonId" component={Lesson} />
                <Redirect to="/" />
            </Switch>
        </AppShell>
    </Router>
);

export default App;
