import React from 'react';
// import logo from '../public/images/logo'
// import '../App.css';

import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button 
} from 'reactstrap';

export default class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    //  is1Checked:false,
    //  is2Checked:true,
    //  is3Checked:false,
    };

  }
  
  
  render() {
    return (
        <Navbar className="Nav-bar" color="light" >
          {/* <img
            src={logo}
            width="60vw"
            className="logo"
            alt="PwC logo"
          /> */}
            <div class="btn-group btn-group-toggle" data-toggle="buttons" >
              <label class={this.getRadioClass(1)}>
                <input type="radio" name="options" autocomplete="off" checked={this.state.is1Checked} onClick={()=>this.setState({is1Checked:true,is2Checked:false,is3Checked:false})}/> Transcribe
              </label>
              <label class={this.getRadioClass(2)}>
                <input type="radio" name="options" autocomplete="off" checked={this.state.is2Checked} onClick={()=>this.setState({is1Checked:false,is2Checked:true,is3Checked:false})}/> Action Items
              </label>
              <label class={this.getRadioClass(3)}>
                <input type="radio" name="options" autocomplete="off" checked={this.state.is3Checked} onClick={()=>this.setState({is1Checked:false,is2Checked:false,is3Checked:true})}/> Translate
              </label>
            </div>
          <text className="title">EmTech Smart Minutes</text>
        </Navbar>
        // {this.state.is1Checked?<Transciption/>:this.state.is2Checked?<ActionItems/>:<Translation/>}
    );
  }

  getRadioClass(selected){
    if(selected===1&&this.state.is1Checked===true){
      return "btn btn-secondary active"
    }
    if(selected===1&&this.state.is1Checked===false){
      return "btn btn-secondary"
    }
    if(selected===2&&this.state.is2Checked===true){
      return "btn btn-secondary active"
    }
    if(selected===2&&this.state.is2Checked===false){
      return "btn btn-secondary"
    }
    if(selected===3&&this.state.is3Checked===true){
      return "btn btn-secondary active"
    }
    if(selected===3&&this.state.is3Checked===false){
      return "btn btn-secondary"
    }
  }
}