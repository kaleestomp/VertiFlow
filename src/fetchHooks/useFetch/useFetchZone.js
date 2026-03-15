import { useEffect, useState } from 'react';
import { fetchDirTree, fetchSimDataPack} from '../../utils/fileStatus';
// import { useDispatch, useSelector } from 'react-redux';
// import { updateDirectoryTree, addSim } from '../simSlice';

export function useFetchZone({ optionPath = 'Project1/Direct-3Zone-DD-Lunch' }) {
  const [simData, setSimData] = useState({});
//   const dispatch = useDispatch();
//   const simState = useSelector((state) => state.simState);

  useEffect(() => {
    const getDirectoryTree = async (optionPath) => {
      // Request / Update table of contents for a selected Option directory
      // Example optionPath: 'Project1/Direct-3Zone-DD-Lunch'
      try {
        const dirTree = await fetchDirTree(optionPath);
        // dispatch(updateDirectoryTree({root: optionPath, tree: dirTree}));
        // console.log('Received Option Directory Tree:', dirTree);
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
        // dispatch(addSim({ simDataPack }));
        setSimData(prevData => ({ ...prevData, [`${simID}-${zone}`]: simDataPack }));
        // console.log(`Received Sim Data Pack: ${simID}-${zone}`);
        // console.log(simDataPack)
      } catch (error) {
        console.error(`Error fetching sim ${simID}-${zone}:`, error);
      }
    };
    
    getDirectoryTree(optionPath).then((dirTree) => {
      const zone = Object.keys(dirTree.zones)[0];
      const simID = dirTree.zones[zone][0];
      const root = dirTree.url
      addSim_lvl1(simID, zone, root);
    });
  }, []);

  return simData;
}

export function useStreamLoad({ optionPath = 'Project1/Direct-3Zone-DD-Lunch' }) {
  const [timelineData, setTimelineData] = useState([]);
  const [passengerData, setPassengerData] = useState([]);
  const [fullyLoaded, setFullyLoaded] = useState(false);
  useEffect(() => {
    loadChunks(
      'Project1/Direct-3Zone-DD-Lunch/South Tower - Office - High Zone/605',
      (chunk) => {
        console.log('Received chunk:', chunk);
        if (chunk.chunk_type === 'timeline') {
          setTimelineData((prev) => [...prev, chunk]);
        } else if (chunk.chunk_type === 'passenger') {
          setPassengerData((prev) => [...prev, chunk]);
        }
      },
      () => setFullyLoaded(true)
    ).catch((error) => {
      console.error('Chunk loading failed:', error);
    });
  }, []);
}