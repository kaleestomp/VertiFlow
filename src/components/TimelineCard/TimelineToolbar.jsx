import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import FilterNone from '@mui/icons-material/FilterNone';
import Comment from '@mui/icons-material/Comment';
import AddToPhotos from '@mui/icons-material/AddToPhotos';
import UnfoldMore from '@mui/icons-material/UnfoldMore';
import UnfoldLess from '@mui/icons-material/UnfoldLess';
import InfoIcon from '@mui/icons-material/Info';

function TLHeaderToolbar() {
    const [compiled, setCompiled] = useState(true);
    const [showComment, setShowComment] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="timeline-toolbar-container">
            <IconButton 
                onClick={()=>{setCompiled(!compiled)}}
                color={compiled ? "primary" : "tertiary"}
                size="medium"
                aria-label="show-compiled"
            >
                <AddToPhotos fontSize="inherit" />
            </IconButton>
            <IconButton 
                onClick={()=>{setShowComment(!showComment)}}
                color={showComment ? "primary" : "tertiary"}
                size="medium"
                aria-label="show-comment"
            >
                <Comment fontSize="inherit" />
            </IconButton>
            <IconButton 
                onClick={()=>{setShowInfo(!showInfo)}}
                color={showInfo ? "primary" : "tertiary"} 
                size="medium"
                aria-label="show-info"
            >
                <InfoIcon fontSize="inherit" />
            </IconButton>
            <IconButton 
                onClick={()=>{setExpanded(!expanded)}}
                color={expanded ? "primary" : "tertiary"} 
                size="medium"
                aria-label="show-expanded"
            >
                {expanded ? <UnfoldLess fontSize="inherit" /> : <UnfoldMore fontSize="inherit" />}
            </IconButton>
        </div>
    );
}

export default TLHeaderToolbar;
