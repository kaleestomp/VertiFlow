import React, { useEffect, useState } from 'react';;
import LobbyChart from './LobbyChart';
import './LobbyCard.css'

function LobbyCard({ queue, maxQueue }) {
    //className="three-viewport"
    //style={{ width: '100%', height: 760}
    return (  
        <div className='lobby-viewport'>
            <LobbyChart queue={queue} maxQueue={maxQueue} />
        </div>
    );
}

export default React.memo(LobbyCard);
// memo isolates TimelineCart from processing when states/props in parent change
