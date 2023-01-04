import React, {Component} from "react";
import { Link, withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from './AppNavBar';
import logo from './mylogo.PNG';

class SignIn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            image: null
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    async componentDidMount(){
        const res = await fetch('/sign-in');
        const body = await res.json();
        this.setState({
            message: body.message
        });
    }
    onImageChange = event => {
        if(event.target.files && event.target.files[0]){
            let img = event.target.files[0]
            this.setState({image: URL.createObjectURL(img)});
        }
    };
    async handleSubmit(event) {
        const {item} = this.state;
        await fetch('/sign-in', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });
        this.props.history.push('/sign-in');
    }
    render(){
        const data = this.state.message;
        return (
            <div>
                <AppNavbar/>
                <img src={logo} alt="logo"/>
                <Container>
                    <h2>{data}</h2>
                    <Form>
                        <FormGroup>
                            <Label for="name">Username</Label>
                            <Input type="text" name="name" id="name" autoComplete="username" placeholder="Enter username"/>
                        </FormGroup>
                        <div>
                            <img src={this.state.image}/>
                            <input type="file" name="myImage" onChange={this.onImageChange}/>
                        </div>
                        <FormGroup>
                            <Button color="secondary" type="submit" onSubmit={this.handleSubmit}>Sign In</Button>{' '}
                        </FormGroup>
                    </Form>
                </Container>
            </div>
        );
    }

}

export default withRouter(SignIn);