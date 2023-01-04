//import logo from './logo.svg';
import logo from './mylogo.PNG';
import styles from './styles.css';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SignIn from './signin';
import SignUp from './signup';
import Home from './homepage';
import OnSignIn from './onsignin';
import OnSignUp from './onsignup';

class App extends Component {
  render(){
    return (
      <Router>
        <Switch>
          <Route path='/' exact={true} component={Home}/>
          <Route path='/sign-in' exact={true} component={SignIn}/>
          <Route path='/sign-up' exact={true} component={SignUp}/>
          <Route path='/signedin' exact={true} component={OnSignIn}/>
          <Route path='/signedup' exact={true} component={OnSignUp}/>
        </Switch>
      </Router>
    )
  }
}

export default App;
