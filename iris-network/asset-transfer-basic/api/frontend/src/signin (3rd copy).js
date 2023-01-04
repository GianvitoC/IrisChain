import React, {Component} from "react";
import { Link, withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from './AppNavBar';
import logo from './mylogo.PNG';

class SignIn extends Component {
    emptyItem = {
        name: '',
        image: ''
    };
    constructor(props) {
        super(props);
        this.state = {
            item: this.emptyItem
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event){
        const target = event.target;
        const value = target.value;
        const name = target.name;
        let item = {...this.state.item};
        item[name] = value;
        this.setState({item});
    }

    async handleSubmit(event) {
        event.preventDefault();
        const {item} = this.state;
        await fetch('/sign-in', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });
        this.props.history.push('/signedin');
    }
    render(){
        const {item} = this.state;
        return(
            <div>
                <AppNavbar/>
                <img src={logo} alt="logo"/>
                <Container>
                    <Form onSubmit={this.handleSubmit}>
                        <FormGroup>
                            <Label for="name">Username</Label>
                            <Input type="text" name="name" id="name" value={item.name||''} onChange={this.handleChange}/>
                        </FormGroup>
                        <FormGroup>
                            <Label for="image">Iris image path</Label>
                            <Input type="text" name="image" id="image" value={item.image||''} onChange={this.handleChange}/>
                        </FormGroup>
                        <FormGroup>
                            <Button color="secondary" type="submit">Sign In</Button>
                        </FormGroup>
                    </Form>
                </Container>
            </div>
        )
    }
}

export default withRouter(SignIn);