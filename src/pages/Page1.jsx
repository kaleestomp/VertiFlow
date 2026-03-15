import React, { useEffect, useState } from 'react';
import TimelineCard from '../components/TimelineCard/TimelineCard';
// import LobbyCard from '../components/LobbyChart/LobbyCard';
import LobbyCard from '../components/MultiLobbyChart/LobbyCard';
import { fetchDirTree, fetchSimDataPack} from '../utils/fileStatus';
import { useFetchZone } from '../fetchHooks/useFetch/useFetchZone';
import { useFetchOptionMeta } from '../fetchHooks/fetchOptionMeta/useFetchOptionMeta';
import { loadChunks } from '../utils/streamLoad';
import SideCard from '../components/SideCard/SideCard';

import './Page1.css';

function Page1() {

  const res = useFetchOptionMeta({ optionPath: 'Project1/Direct-3Zone-DD-Lunch' });
  const simData = useFetchZone({ optionPath: 'Project1/Direct-3Zone-DD-Lunch' });
  
  const [isSideCardCollapsed, setIsSideCardCollapsed] = useState(false);
  const [maxQueue, setMaxQueue] = useState({5: 60, 6: 80, 7: 90});
  const [timeSlice, setTimeSlice] = useState({x: '00:00:00', y: {5: maxQueue[5], 6: maxQueue[6], 7: maxQueue[7]}});
  const onTimelineHover = (value) => {
    // console.log('Timeline Hover Value:', value);
    setTimeSlice(value);
  };

  return (
    <div className={`page1-container ${isSideCardCollapsed ? 'sidecard-collapsed' : 'sidecard-expanded'}`}>
      <SideCard isCollapsed={isSideCardCollapsed} onToggle={() => setIsSideCardCollapsed((prev) => !prev)} />
      <div className="page1-content">
        <LobbyCard queue={timeSlice.y} maxQueue={maxQueue} />
        {/* <ThreeViewport /> */}
        <div className="floating-wrapper">
          <TimelineCard simData={simData} onHover={onTimelineHover} />
        </div>
      </div>
      {/* <div className="container-wrapper">
        <TimelineCard simData={simData} />
        
        <div className="empty-container container-2">
          <DataFrameGrid data={simData[Object.keys(simData)[0]]?.TimelineLogbooks?.all?.compiled ?? []} />
        </div>
      </div> */}
    </div>
  );
}

export default Page1;
