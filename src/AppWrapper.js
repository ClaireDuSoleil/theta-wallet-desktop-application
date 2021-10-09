import React, {Component} from 'react';
import {Dimmer} from 'semantic-ui-react';
import {Router, Redirect, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './state';
import {App, WalletApp} from './App';
import {Provider as AlertProvider} from 'react-alert';
import Alerts from './services/Alerts';
import Alert from './components/Alert';
import {isElectron} from './utils/isElectron';
import {createBrowserHistory, createHashHistory} from 'history';

export const myHistory = isElectron() ? createHashHistory() : createBrowserHistory();

// optional cofiguration
const options = {
  // you can also just use 'bottom center'
  position: 'top center',
  timeout: 5000,
  offset: '30px',
  transition: 'scale',
};

class AppWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {dimmed: false};
    window.api.receive('fromMain', (data) => {
      console.log(`Received ${data} from main process`);
      if (data === 'dim-window') this.setState({dimmed: true});
      if (data === 'undim-window') this.setState({dimmed: false});
    });
  }
  render() {
    let alertRef = Alerts.getRef();
    const dim = this.state.dimmed;
    return (
      <Dimmer.Dimmable dimmed={dim}>
        <Dimmer className="dimmedContent" active={dim} page />
        <Router history={myHistory}>
          <Provider store={store}>
            <AlertProvider ref={alertRef} template={Alert} {...options}>
              <Switch>
                <Redirect from="/" to="/unlock" exact={true} />
                <Route path="/wallet" component={WalletApp} />
                <Route path="/" component={App} />
              </Switch>
            </AlertProvider>
          </Provider>
        </Router>
      </Dimmer.Dimmable>
    );
  }
}

export default AppWrapper;
