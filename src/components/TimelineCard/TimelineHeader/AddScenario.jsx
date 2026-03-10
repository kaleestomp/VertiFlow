import React, { useState, useMemo } from 'react';
import Fab from '@mui/material/Fab';
import Add from '@mui/icons-material/Add';

export default function AddScenario() {
  return (
    <Fab
        variant= "extended"
        aria-label={`add-title`}
        size="small"
        color={'inactive'}
        sx={{width: 32, }} //'fit-content'
    >
        <Add className="fab-icon"/>
    </Fab>
  );
}