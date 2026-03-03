import { configureStore } from '@reduxjs/toolkit';
import simReducer from './simSlice';
 const store = configureStore({
    reducer: {
        simState: simReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                warnAfter: 128,
                ignoredActions: ['simState/addSim'],
                ignoredPaths: ['simState.sims'],
            },
        }),
});
export default store
