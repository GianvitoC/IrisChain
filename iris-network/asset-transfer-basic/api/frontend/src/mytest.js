import React, {Component} from "react";
import { Button, Container } from "reactstrap";
import { Link  } from "react-router-dom";
import AppNavbar from './AppNavBar';

class MyTest extends Component{
    state = {
        db: []
    };
    async componentDidMount(){
        const response = await fetch('../../backend/src/users');
        const body = await response.json();
        this.setState({db: body});
    };
    render() {
        const {db} = this.state;
        return(
            <div>
                <AppNavbar/>
                <Container>
                <Button color="primary" tag={Link} to='../../backend/src/users'>Test</Button>
                <h2>Test</h2>
                {db.map(user=>
                    <div key={user.name}>
                        {user.password}
                        </div>
                        )
                }
                </Container>
            </div>
        );
    }
};

export default MyTest;