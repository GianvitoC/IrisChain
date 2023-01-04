import React, {Component} from "react";
import { Navbar, NavbarBrand, useNavigate } from "reactstrap";
import { Link } from "react-router-dom";
import {Helmet} from "react-helmet";
export default class AppNavbar extends Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.toggle = this.toggle.bind(this);
    }
    toggle(){
        this.setState({
            isOpen: !this.state.isOpen
        });
    }
    render(){
        return (
        <div>
            <Navbar color="dark" dark expand="md">
                <NavbarBrand tag={Link} to="/">Home</NavbarBrand>
            </Navbar>
        </div>
    );

    }
}