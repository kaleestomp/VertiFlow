import React, { useEffect, useState } from 'react';;
import LobbyChart from './LobbyChart';

function LobbyCard({ queue, maxQueue }) {
    //className="three-viewport"
    
    return (  
        <div style={{ width: '100%', height: 760}} >
            <LobbyChart queue={queue} maxQueue={maxQueue} />
        </div>
    );
}

export default React.memo(LobbyCard);
// memo isolates TimelineCart from processing when states/props in parent change
