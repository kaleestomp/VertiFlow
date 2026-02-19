import React, { useEffect, useState } from 'react';
import DataFrameChart from '../components/DataFrameChart';
import DataFrameGrid from '../components/DataFrameGrid';
import { fetchDirTree, fetchSimDataPack} from '../utils/fileStatus';
import './Page1.css';

function Page1() {
  const [dataDirTree, setDataDirTree] = useState({});
  const [dataPack, setDataPack] = useState({});
  useEffect(() => {
    const readDir = async () => {
      try {
        // const text = await fetchLocalFile('Project1/Direct-3Zone-DD-Lunch/upload_stamp.json');
        // const data = JSON.parse(text);
        // console.log(data);
        const dirTree = await fetchDirTree('Project1/Direct-3Zone-DD-Lunch');
        console.log('Fetched Option Directory Structure:', dirTree);
        setDataDirTree(dirTree);
        return dirTree;
      } catch (error) {
        console.error('Error loading file:', error);
      }
    };
    const readSim = async (path) => {
      try {
        // const text = await fetchLocalFile('Project1/Direct-3Zone-DD-Lunch/upload_stamp.json');
        // const data = JSON.parse(text);
        // console.log(data);
        const simDataPack = await fetchSimDataPack(path);
        console.log('Fetched Sim Data Pack:', simDataPack);
        const simID = path.split('/').slice(-1)[0];
        setDataPack(prevData => ({ ...prevData, [simID]: simDataPack }));
        return simDataPack;
      } catch (error) {
        console.error('Error loading file:', error);
      }
    };

    readDir().then((dirTree) => {
      const relativePath = `${dirTree.url}/${Object.keys(dirTree.zones)[0]}/${dirTree.zones[Object.keys(dirTree.zones)[0]][0]}`;
      // console.log(relativePath);
      readSim(relativePath);
    });
  }, []);
  // useEffect(() => {
  //   const fetchDataStructure = async () => {
  //     try {
  //       const __proj = 'Project1';
  //       const __option = 'Direct-3Zone-DD-Lunch';
  //       const dataTree = await fetchDirTree(`${__proj}/${__option}`);
  //       console.log('Fetched Data Tree:', dataTree);
  //       setDataDirTree(dataTree);
  //       return dataTree;

  //     } catch (error) {
  //       console.error('Error fetching data structure:', error);
  //     }
  //   };
  //   const fetchScenarioData = async (dataTree, zone, configID) => {
  //     try {
  //       const simDirTree = {
  //         url: `${dataTree.url}/${zone}/${configID}`,
  //         simTree: dataTree.zones[zone].configs[configID],
  //       };
  //       const simData = await fetchSimDataPack(simDirTree);
  //       console.log('Fetched Sim Data:', simData);
  //       setDataPack(prevData => ({ ...prevData, [configID]: simData }));
  //     } catch (error) {
  //       console.error('Error fetching sim data:', error);
  //     }
  //   }

  //   fetchDataStructure().then((dataTree) => {
  //     fetchScenarioData(dataTree, 'South Tower - Office - High Zone', '605');
  //   });
  // }, []);

  return (
    <div className="page1-container">
      <h1>Page 1</h1>
      
      <div className="container-wrapper">
        <div className="empty-container container-1">
          <DataFrameChart />
        </div>
        
        <div className="empty-container container-2">
          <DataFrameGrid />
        </div>
      </div>
    </div>
  );
}

export default Page1;
