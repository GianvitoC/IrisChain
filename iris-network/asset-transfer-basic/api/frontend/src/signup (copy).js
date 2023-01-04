import React, {Component, useState, useEffect} from "react";
import { Link, withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from './AppNavBar';
import logo from './mylogo.PNG';

class SignUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            image: ''
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    /** 
    async componentDidMount(){
        const res = await fetch('/sign-up');
        const body = await res.json();
        this.setState({
            message: body.message
        });
    }
    */
    onImageChange = event => {
        if(event.target.files && event.target.files[0]){
            let img = event.target.files[0];
            //this.setState({image: URL.createObjectURL(img)});
        }
    };
    async handleSubmit() {
        //var formData = new FormData();
        //formData.append('file', event.target.files[0], 'inputImage.bmp');
        //var xmlhttp = new XMLHttpRequest();
        //event.preventDefault();
        //this.setState({image: 'ciccio'});
        const {item} = this.state;
        await fetch('/sign-up', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });
        //this.props.history.push('/sign-up');
    }
    //                    <Form method="post" encType="multipart/form-data">
    //                            <Button color="primary" type="submit" onSubmit={this.handleSubmit}>Sign Up</Button>{' '}
    render(){
        const data = this.state.message;
        return (
            <div>
                <AppNavbar/>
                <img src={logo} alt="logo"/>
                <Container>
                    <Form onSubmit={this.handleSubmit}>
                        <FormGroup>
                            <Label for="username">Username</Label>
                            <Input type="text" name="username" id="username" autoComplete="username" placeholder="Enter username"/>
                        </FormGroup>
                        <div>
                        <img src={this.state.image}/>
                            <input type="file" name="myImage" onChange={this.onImageChange}/>
                        </div>
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