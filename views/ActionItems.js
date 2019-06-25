import React from 'react';
import PropTypes from 'prop-types';

export default class ActionItems extends React.Component{
    constructor(props) {
        super();
        this.state = {

        };
    }

    renderActionItems(){
        let items = this.props.actionItems;
        // console.log(this.props.actionItems);
        if (typeof items !== 'undefined'){
            return items.map((item, i) =>
                <div key={i}>
                    <span>{item.from.name}: {item.text}</span>
                </div>
            )
        }
    }

    render(){
        return(
            <div>
                {this.renderActionItems()}
            </div>
        )
    }
}