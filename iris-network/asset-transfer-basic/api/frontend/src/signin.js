import React, {Component} from "react";
import { withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from './AppNavBar';
import logo from './mylogo.PNG';

class SignIn extends Component {
    emptyItem = {
        name: '',
        image: '',
        srcfile: ''
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
    onImageChange = event => {
        if(event.target.files && event.target.files[0]){
            const target = event.target;
            let img = event.target.files[0];
            const value = URL.createObjectURL(img);
            const name = target.name;
            let item = {...this.state.item};
            item[name] = value;
            item.srcfile = img;
            this.setState({item});
        }
    };
    async handleSubmit(event) {
        event.preventDefault();
        const {item} = this.state;
        let formData = new FormData();
        formData.append('name', item.name);
        formData.append('image', item.srcfile);
        await fetch('/sign-in', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
                //'Content-Type': 'application/json'
            },
            //body: JSON.stringify(item)
            body: formData
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
                        <div>
                            <img src={item.image}/>
                            <input type="file" name="image" id="image" onChange={this.onImageChange}/>
                        </div>
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