import React from 'react';
import ReactDOM from 'react-dom';
import { range } from 'd3';
import { useData } from './useData';
import { LineChart } from './LineChart';

const width = window.innerWidth;
const height = window.innerHeight;

const App = () => {
  const data = useData();
  return data
    ? <LineChart data={data} width={width} height={height} />
    : <div>Loading...</div>;
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
