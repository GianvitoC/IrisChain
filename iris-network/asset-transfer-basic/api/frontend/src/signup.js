import React, {Component} from "react";
import { Link, withRouter } from "react-router-dom";
import { Container, Form, FormGroup, Button, Input, Label } from "reactstrap";
import AppNavbar from './AppNavBar';
import logo from './mylogo.PNG';

class SignUp extends Component {
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
        const name = target.name;
        let item = {...this.state.item};
        const value = (target.validity.valid) ? target.value : item.name;
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
    }
    async handleSubmit(event) {
        function readBuffer(file, start = 0, end = 2) {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve(reader.result);
              };
              reader.onerror = reject;
              reader.readAsArrayBuffer(file.slice(start, end));
            });
        }
        function check(headers) {
            return (buffers, options = { offset: 0 }) =>
                headers.every(
                (header, index) => header === buffers[options.offset + index]
                );
        }
        const isBMP = check([0x42, 0x4d]);
        event.preventDefault();
        const {item} = this.state;
        if(item.name.length>0){
            if(item.image.length>0){
                const buffers = await readBuffer(item.srcfile, 0, 2); 
                const uint8Array = new Uint8Array(buffers);
                if(isBMP(uint8Array)){
                    let formData = new FormData();
                    formData.append('name', item.name);
                    formData.append('image', item.srcfile);
                    await fetch('/sign-up', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json'
                        },
                        body: formData
                    });
                    this.props.history.push('/signedup');
                } else {
                    alert("Only .bmp file-types are accepted! Please check again your submitted Iris-image.");
                }
            } else {
                alert('You forgot to submit your Iris-image!');
            }
        } else {
            alert('Empty string is not a valid Username!');
        }
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
                            <Label for="name">Username 	&#40;alphanumeric upper/lower case and underscore allowed&#41;</Label>
                            <Input type="text" name="name" id="name" autoComplete="off" pattern="[a-zA-Z0-9_]+" value={item.name||''} onChange={this.handleChange}/>
                        </FormGroup>
                        <div>
                            <img src={item.image}/>
                            <input type="file" name="image" id="image" accept=".bmp" onChange={this.onImageChange}/>
                        </div>
                        <FormGroup>
                            <Button color="primary" type="submit">Sign Up</Button>
                        </FormGroup>
                    </Form>
                </Container>
            </div>
        )
    }
}

export default withRouter(SignUp);