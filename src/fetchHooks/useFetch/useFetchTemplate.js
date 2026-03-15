import { useEffect, useState } from 'react';
import { fetchDirTree, fetchSimDataPack} from '../../utils/fileStatus';
import { useDispatch, useSelector } from 'react-redux';
import { updateDirectoryTree, addSim } from '../simSlice';

export function useFetchZone({ optionPath = 'Project1/Direct-3Zone-DD-Lunch' }) {
  const [zoneTree, setZoneTree] = useState({});
  const dispatch = useDispatch();
  const simState = useSelector((state) => state.simState);

  useEffect(() => {
    const getDirectoryTree = async (optionPath) => {
      // Request / Update table of contents for a selected Option directory
      // Example optionPath: 'Project1/Direct-3Zone-DD-Lunch'
      try {
        const dirTree = await fetchDirTree(optionPath);
        setZoneTree(dirTree);
        dispatch(updateDirectoryTree({root: optionPath, tree: dirTree}));
        // console.log('Received Option Directory Tree:', dirTree);
        // breakdown the  content of the zone tree:
        // How many sims;
        // How many runs;
        return dirTree;
      } catch (error) {
        console.error('Error Checking Option Directory:', error);
      }
    };
    getDirectoryTree(optionPath);
  }, []);

  return zoneTree;
}
