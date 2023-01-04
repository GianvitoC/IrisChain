import React, {Component} from "react";
import { Link, withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from '../AppNavBar';

class SignUp extends Component {
    render(){
        return (
            <div>
                <AppNavbar/>
                <Container>
                    <Form>
                        <FormGroup>
                            <Label for="name">Username</Label>
                            <Input type="text" name="name" id="name" autoComplete="username" placeholder="Enter username"/>
                        </FormGroup>
                        <FormGroup>
                            <Button color="primary" type="submit">Sign Up</Button>{' '}
                        </FormGroup>
                    </Form>
                </Container>
            </div>
        );
    }

}

export default withRouter(SignUp);
