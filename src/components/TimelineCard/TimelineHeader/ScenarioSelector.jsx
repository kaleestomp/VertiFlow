import React, { useEffect, useMemo, useRef, useState } from 'react';
import Fab from '@mui/material/Fab';
import { colorConfig } from '../../../utils/Config';
import AddScenario from './AddScenario';
import './ScenarioSelector.css';

const LONG_PRESS_MS = 100;

export default function ScenarioSelector({ }) {

    const scenarios = useMemo(() => {
        // Fetch Scenarios from redux store
        const scenarios = [
            {id: 5, name: 'Cars', selected: true, color: colorConfig.primaryBlue},
            {id: 6, name: 'Cars', selected: false, color: colorConfig.primaryRed},
            {id: 7, name: 'Cars', selected: false, color: colorConfig.secondaryGreen}
        ]
        return scenarios;
    }, []);
    const [active, setActive] = useState(scenarios.map(scenario => scenario.selected ? 1 : 0));
    const updateActive = (index) => {
        if (active.reduce((sum, val) => sum + val, 0) === 1){
            setActive(prev => prev.map((value, i) => i === index ? 1 : value ))
        } else { 
            setActive(prev => prev.map((value, i) => i === index ? !value : value )); 
        }
    };
    const switchScenario = (index) => {
        setActive(prev => prev.map((value, i) => (i === index ? 1 : 0)));
    }

    // Specify Press and Hold
    const longPressTimerRef = useRef(null);
    const longPressTriggeredRef = useRef(false);
    const clearPressTimer = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };
    const handlePressStart = (index) => {
        clearPressTimer();
        longPressTriggeredRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            switchScenario(index);
        }, LONG_PRESS_MS);
    };
    const handlePressEnd = () => {
        clearPressTimer();
    };
    const handleClick = (index) => {
        if (longPressTriggeredRef.current) {
            longPressTriggeredRef.current = false;
            return;
        }
        updateActive(index);
    };
    useEffect(() => {
        return () => clearPressTimer();
    }, []);
    
    return (
        <div className="timeline-scenario-container">
            {scenarios.map((scenario, index) => (
                <Fab
                    key={`${scenario.id}-${scenario.name}`}
                    onClick={() => handleClick(index)}
                    onMouseDown={() => handlePressStart(index)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    variant= "extended"
                    aria-label={`${scenario.id}-${scenario.name}-title`}
                    size="small"
                    color={active[index] ? 'primary' : 'inactive'}
                    sx={{
                        width: active[index] ? 87 : 32,
                        color: 'white',
                        ...(active[index]
                            ? {
                                bgcolor: scenario.color,
                                '&:hover': {bgcolor: scenario.color, filter: 'brightness(1.00)',},
                              }
                            : {}
                        ),
                    }}
                >
                    <span className="fab-text-icon">{scenario.id}</span>
                    <span className={active[index] ? "fab-text-extended" : "fab-text"}>{active[index] ? scenario.name : ''}</span>
                </Fab>
            ))}
            <AddScenario />
        </div>
    );
}