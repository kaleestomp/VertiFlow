import { createSlice } from '@reduxjs/toolkit';
import { fetchDirTree, fetchSimDataPack} from '../utils/fileStatus';

export const ZoneSlice = createSlice({
    name: 'zoneMeta',
    initialState: {
        rootPath: null,
        optionName: null,
        tree: null,
    },
    reducers: {
        updateMeta: (state, action) => {
            const {payload: {root, tree}} = action;
            state.rootPath = root;
            state.optionName = root.split('/')[1];
            state.tree = tree;
            console.log(`[STORE] Updated Zone Meta: ${state.optionName}`);
        },
    }
});

export const { updateMeta } = ZoneSlice.actions;

export default ZoneSlice.reducer;
