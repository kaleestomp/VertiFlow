import { useEffect, useState } from 'react';
import { fetchDirTree } from './fetch';
import { useDispatch, useSelector } from 'react-redux';
import { updateMeta } from '../../store/zoneSlice';

export function useFetchOptionMeta({ optionPath = 'Project1/Direct-3Zone-DD-Lunch' }) {
  // Store State
  const dispatch = useDispatch();
  const zoneMetaState = useSelector((state) => state.zoneMeta);
  // Local State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
  // ----
  useEffect(() => {
    let isActive = true; 
    //^GUARD to prevent state updates if component unmounts
    //ie. if user navigates away before fetch completes
    //ie. if optionPath changes before fetch completes (data fetched for outdated optionPath) 
    const controller = new AbortController();
    //^ABORT SIGNAL to cancel fetch if component unmounts

    const fetchData = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Clear previous errors
      try {
        const dirTree = await fetchDirTree( optionPath, { signal: controller.signal } );
        if (!isActive) { return; }
        dispatch(updateMeta({ root: optionPath, tree: dirTree }));
      } catch (err) {
        if (!isActive) { return; }
        if (err.name === 'AbortError') { return; }
        setError(err);
      } finally {
        if (isActive) { setIsLoading(false); }
        // if (!controller.signal.aborted) { setIsLoading(false); }
        // Above are related, but not the same. 
        // What you actually care about before calling React state setters 
        // is not “was the request aborted?”, 
        // it is “is this effect still allowed to update state?”
      }
    };

    fetchData();

    return () => {
      // if component unmounts or just before effect re-runs
      isActive = false; //cleanup prevents state updates
      controller.abort(); //cleanup aborts the in-flight request
    };

  }, [dispatch, optionPath]);
  // ----
  return {
    data: zoneMetaState,
    isLoading,
    error,
  };
}