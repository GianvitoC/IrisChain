import React, {Component} from "react";
import { Link, withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from './AppNavBar';
import logo from './mylogo.PNG';

class SignIn extends Component {
    render(){
        return (
            <div>
                <AppNavbar/>
                <img src={logo} alt="logo"/>
                <Container>
                    <Form>
                    <FormGroup>
                            <Label for="name">Username</Label>
                            <Input type="text" name="name" id="name" autoComplete="username" placeholder="Enter username"/>
                        </FormGroup>
                        <FormGroup>
                            <Button color="secondary" type="submit">Sign In</Button>{' '}
                        </FormGroup>
                    </Form>
                </Container>
            </div>
        );
    }

}

export default withRouter(SignIn);