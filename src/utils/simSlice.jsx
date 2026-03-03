import { createSlice } from '@reduxjs/toolkit';
import { fetchDirTree, fetchSimDataPack} from '../utils/fileStatus';

export const SimSlice = createSlice({
    name: 'simState',
    initialState: {
        rootPath: null,
        optionName: null,
        tree: null,
        sims: {},
    },
    reducers: {
        updateDirectoryTree: (state, action) => {
            const {payload: {root, tree}} = action;
            state.rootPath = root;
            state.optionName = root.split('/')[1];
            state.tree = tree;
            console.log(`[STORE] Updated Option Directory Tree: ${state.optionName}`);
        },

        addSim: (state, action) => {
            const {payload: {simDataPack}} = action;
            const key = `${simDataPack.SimID}-${simDataPack.Zone}`;
            state.sims[key] = simDataPack;
            console.log(`[STORE] Received Sim Data Pack: ${key}`);
        },
    }
});

export const { updateDirectoryTree, addSim } = SimSlice.actions;

export default SimSlice.reducer;
