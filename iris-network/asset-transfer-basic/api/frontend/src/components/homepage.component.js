import React, {Component} from "react";
import { Button, Container } from "reactstrap";
import logo from '../mylogo.PNG';
import { Link  } from "react-router-dom";
import AppNavbar from '../AppNavBar';

export default class Home extends Component {
    render() {
        return(
            <div>
                <AppNavbar/>
                <img src={logo} alt="logo"/>
                <Container fluid>
                    <Button color="primary" tag={Link} to='/sign-up'>Sign Up</Button>
                    <Button color="secondary" tag={Link} to='/sign-in'>Sign In</Button>
                </Container>
            </div>
        );
    }
}