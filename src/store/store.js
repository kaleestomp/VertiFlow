import { configureStore } from '@reduxjs/toolkit';
import simReducer from './simSlice';
import zoneReducer from './zoneSlice';

const store = configureStore({
    reducer: {
        simState: simReducer,
        zoneMeta: zoneReducer,
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
