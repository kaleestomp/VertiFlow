import React, { useEffect, useState } from 'react';
import TimelineCard from '../components/TimelineCard/TimelineCard';
import LobbyChart from '../components/LobbyChart/LobbyChart';
import DataFrameChart from '../components/Samples/DataFrameChart';
import DataFrameGrid from '../components/Samples/DataFrameGrid';
import { fetchDirTree, fetchSimDataPack} from '../utils/fileStatus';
import { useDispatch, useSelector } from 'react-redux';
import { updateDirectoryTree, addSim } from '../utils/simSlice';
import ThreeViewport from '../components/ThreeViewport';

import './Page1.css';

function Page1() {
  const [simData, setSimData] = useState({});

  const dispatch = useDispatch();
  const simState = useSelector((state) => state.simState);

  useEffect(() => {

    const getDirectoryTree = async (optionPath) => {
      // Request / Update table of contents for a selected Option directory
      // Example optionPath: 'Project1/Direct-3Zone-DD-Lunch'
      try {
        const dirTree = await fetchDirTree(optionPath);
        dispatch(updateDirectoryTree({root: optionPath, tree: dirTree}));
        console.log('Received Option Directory Tree:', dirTree);
        return dirTree;
      } catch (error) {
        console.error('Error Checking Option Directory:', error);
      }
    };
    const addSim_lvl1 = async (simID, zone, root) => {
      // Request / Update sim data for a selected sim
      try {
        const simPath = `${root}/${zone}/${simID}`;
        const simDataPack = await fetchSimDataPack(simPath);
        dispatch(addSim({ simDataPack }));
        setSimData(prevData => ({ ...prevData, [`${simID}-${zone}`]: simDataPack }));
        console.log(`Received Sim Data Pack: ${simID}-${zone}`);
        // console.log(simDataPack)
      } catch (error) {
        console.error(`Error fetching sim ${simID}-${zone}:`, error);
      }
    };

    const optionPath = 'Project1/Direct-3Zone-DD-Lunch';
    getDirectoryTree(optionPath).then((dirTree) => {
      const zone = Object.keys(dirTree.zones)[0];
      const simID = dirTree.zones[zone][0];
      const root = dirTree.url
      addSim_lvl1(simID, zone, root);
    });

  }, []);

  return (
    <div className="page1-container">
      <h1>Page 1</h1>
      <LobbyChart worstQueue={80} />
      {/* <ThreeViewport /> */}
      <div className="floating-wrapper">
        <TimelineCard simData={simData} />
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
