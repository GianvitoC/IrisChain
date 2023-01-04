import React, {Component} from "react";
import { Button, Container } from "reactstrap";
import logo from './mylogo.PNG';
import { Link  } from "react-router-dom";
import AppNavbar from './AppNavBar';

class Home extends Component {
    constructor(props){
        super(props);
        this.state = {message: 'Test'};
    }
    async componentDidMount(){
        const res = await fetch('/home');
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
                    <h2>{data}</h2>
                    <Button color="primary" tag={Link} to='/sign-up'>Sign Up</Button>
                    <Button color="secondary" tag={Link} to='/sign-in'>Sign In</Button>
                </Container>
            </div>
        );
    }
}

export default Home;