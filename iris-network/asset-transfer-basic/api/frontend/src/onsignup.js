import React, {Component} from "react";
import { Button, Container } from "reactstrap";
import logo from './mylogo.PNG';
import { Link  } from "react-router-dom";
import AppNavbar from './AppNavBar';

class OnSignUp extends Component {
    constructor(props){
        super(props);
        this.state = {message: ''};
    }
    async componentDidMount(){
        const res = await fetch('/signedup');
        const body = await res.json();
        this.setState({
            message: body.message
        });
    }

    render() {
        const data = this.state.message;
        return(
            <div>
                <AppNavbar/>
                <img src={logo} alt="logo"/>
                <Container fluid>
                    <h2>{!data ? "Enrollment ongoing..." : data}</h2>
                </Container>
            </div>
        );
    }
}

export default OnSignUp;