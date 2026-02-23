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
        const simID = path.split('/').slice(-1)[0];
        console.log(`Fetched ${simID} Sim Data Pack:`);
        // console.log(simDataPack)
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

  return (
    <div className="page1-container">
      <h1>Page 1</h1>
      
      <div className="container-wrapper">
        <div className="empty-container container-1">
          <DataFrameChart data={dataPack[605]?.TimelineLogbooks?.all?.compiled ?? []} />
        </div>
        
        <div className="empty-container container-2">
          <DataFrameGrid data={dataPack[605]?.TimelineLogbooks?.all?.compiled ?? []} />
        </div>
      </div>
    </div>
  );
}

export default Page1;
