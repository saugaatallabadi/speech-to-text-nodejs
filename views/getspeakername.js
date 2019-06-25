import React from 'react';

export default function getSpeakerName(number,props) {
    if(number==0&&props.speaker0!=null){
        return props.speaker0+": ";
    }
    else if(number==1&&props.speaker1!=null){
        return props.speaker1+": ";
    }    
    else if(number==2&&props.speaker2!=null){
        return props.speaker2+": ";
    }
    else if(number==3&&props.speaker3!=null){
        return props.speaker3+": ";
    }
    else if(number==4&&props.speaker4!=null){
        return props.speaker4+": ";
    }
    else if(number==5&&props.speaker5!=null){
        return props.speaker5+": ";
    }
    else {
        return "Speaker "+number+": ";
    }
}
