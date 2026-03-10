import React from 'react';
import TimelineCard from './TimelineCard';

const buildCompiledTimeline = (points = 720) => {
  const source = [['time', 'awt', 'min_awt', 'awt_range']];

  for (let i = 0; i < points; i += 1) {
    const h = Math.floor(i / 60);
    const m = i % 60;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

    const base = 35 + Math.sin(i / 30) * 8;
    const minAwt = Math.max(8, Math.round(base - 10));
    const awt = Math.max(minAwt + 1, Math.round(base + Math.cos(i / 17) * 3));
    const range = Math.max(2, Math.round(12 + Math.sin(i / 45) * 4));

    source.push([time, awt, minAwt, range]);
  }

  return source;
};

const defaultSimData = {
  '605-High-Zone': {
    TimelineLogbooks: {
      all: {
        compiled: buildCompiledTimeline(),
      },
    },
  },
};

const meta = {
  title: 'Cards/TimelineCard',
  component: TimelineCard,
  parameters: {
    layout: 'padded',
  },
  args: {
    simData: defaultSimData,
    onHover: (point) => {
      // eslint-disable-next-line no-console
      console.log('Hovered point:', point);
    },
  },
};

export default meta;

export const Default = {
  render: (args) => (
    <div style={{ maxWidth: 1100 }}>
      <TimelineCard {...args} />
    </div>
  ),
};

export const EmptyState = {
  args: {
    simData: {},
  },
  render: (args) => (
    <div style={{ maxWidth: 1100 }}>
      <TimelineCard {...args} />
    </div>
  ),
};
