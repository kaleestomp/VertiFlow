import React, { useEffect, useState } from 'react';
import { Pagination, IconButton } from '@mui/material';
import JoinFullRoundedIcon from '@mui/icons-material/JoinFullRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';

export default function TimelineFooter({ simData }) {

    const [compiled, setCompiled] = useState(true);
    const [goTo, setGoTo] = useState(true);

    return (
        <div className="timeline-footer-container">
            <div className="timeline-footer-center">
                <Pagination
                    count={10}
                    siblingCount={4}
                    // color="primary" 
                    disabled={false}
                    size='medium'
                />
                {/* <IconButton
                    onClick={() => { setGoTo(!goTo) }}
                    color={goTo ? "primaryGrey" : "inactive"}
                    size="medium"
                    aria-label="show-goTo"
                >
                    <ExitToAppRoundedIcon fontSize="inherit" />
                </IconButton> */}
            </div>
        </div>
    );
}