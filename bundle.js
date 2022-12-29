(function (React$1, ReactDOM, d3$1) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM = ReactDOM && Object.prototype.hasOwnProperty.call(ReactDOM, 'default') ? ReactDOM['default'] : ReactDOM;

  //import { group } from 'd3-array';

  //const csvUrl =
  //  'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/d1ed7ef35690594a918ed5fe1ffb6a75266d2c1f/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

  const csvUrl =
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

  const parseDay = d3$1.timeParse('%m/%d/%y');

  const transform = rawData => {
    // Filter out rows that represent provinces or states.
    const countriesData = rawData.filter(d => !d['Province/State']);

    // Get timeseries data for each country.
    const days = rawData.columns.slice(4);
    return countriesData.map(d => {
      const countryName = d['Country/Region'];

      const countryTimeseries = days.map(day => ({
        date: parseDay(day),
        deathTotal: +d[day],
        countryName
      }));

      countryTimeseries.countryName = countryName;
      return countryTimeseries;
    });
  };

  const useData = () => {
    const [data, setData] = React$1.useState();

    React$1.useEffect(() => {
      d3$1.csv(csvUrl).then(rawData => {
        setData(transform(rawData));
      });
    }, []);

    return data;
  };

  const XAxis = ({ xScale, innerHeight }) => {
    const ref = React$1.useRef();
    React$1.useEffect(() => {
      const xAxisG = d3$1.select(ref.current);
      const xAxis = d3$1.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(18);
      xAxisG.call(xAxis);
    }, []);
    return React.createElement( 'g', { transform: `translate(0,${innerHeight})`, ref: ref });
  };

  const YAxis = ({ yScale, innerWidth }) => {
    const ref = React$1.useRef();
    React$1.useEffect(() => {
      const yAxisG = d3$1.select(ref.current);
      const yAxis = d3$1.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(3)
        .ticks(10, "~s");
        //.tickFormat((tickValue) => tickValue);
      yAxisG.call(yAxis);
    }, []);
    return React.createElement( 'g', { ref: ref });
  };

  const VoronoiOverlay = ({
    innerWidth,
    innerHeight,
    allData,
    lineGenerator,
    onHover
  }) => {

    return React$1.useMemo(() => {
      console.log('memoizing');
      const points = allData.map(d => [
        lineGenerator.x()(d),
        lineGenerator.y()(d)
      ]);
      const delaunay = d3.Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, innerWidth, innerHeight]);
      return (
        React.createElement( 'g', { className: "voronoi" },
          points.map((point, i) => (
            React.createElement( 'path', {
              onMouseEnter: () => onHover(allData[i]), fill: "none", stroke: "pink", d: voronoi.renderCell(i) })
          ))
        )
      );
    }, [allData, lineGenerator, innerWidth, innerHeight, onHover]);
  };

  const xValue = (d) => d.date;
  const yValue = (d) => d.deathTotal;

  const margin = { top: 50, right: 40, bottom: 80, left: 100 };

  const formatDate = d3$1.timeFormat('%b %d');

  const LineChart = ({ data, width, height }) => {
    const [activeCountryName, setActiveCountryName] = React$1.useState();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const allData = React$1.useMemo(
      () =>
        data.reduce(
          (accumulator, countryTimeseries) =>
            accumulator.concat(countryTimeseries),
          []
        ),
      [data]
    );

    const epsilon = 1;

    const xScale = React$1.useMemo(
      () => d3$1.scaleTime().domain(d3$1.extent(allData, xValue)).range([0, innerWidth]),
      [allData, xValue]
    );

    const yScale = React$1.useMemo(
      () =>
        d3$1.scaleLog()
          .domain([epsilon, d3$1.max(allData, yValue)])
          .range([innerHeight, 0]),
      [epsilon, allData, yValue]
    );

    const lineGenerator = React$1.useMemo(
      () =>
        d3$1.line()
          .x((d) => xScale(xValue(d)))
          .y((d) => yScale(epsilon + yValue(d))),
      [xScale, xValue, yScale, yValue, epsilon]
    );

    const mostRecentDate = xScale.domain()[1];

    console.log(activeCountryName);

    const handleVoronoiHover = React$1.useCallback((d) => {
      setActiveCountryName(d.countryName);
    }, []);

    return (
      React$1__default.createElement( 'svg', { width: width, height: height },
        React$1__default.createElement( 'g', { transform: `translate(${margin.left},${margin.top})` },
          React$1__default.createElement( XAxis, { xScale: xScale, innerHeight: innerHeight }),
          React$1__default.createElement( YAxis, { yScale: yScale, innerWidth: innerWidth }),
          data.map((countryTimeseries) => {
            return (
              React$1__default.createElement( 'path', {
                className: "marker-line", d: lineGenerator(countryTimeseries) })
            );
          }),

          React$1__default.createElement( 'text', { transform: `translate(${innerWidth / 2},0)`, 'text-anchor': "middle" }, "Global Coronavirus Deaths Over Time by Country"),
          React$1__default.createElement( 'text', {
            className: "axis-label", transform: `translate(-40,${innerHeight / 2}) rotate(-90)`, 'text-anchor': "middle" }, "Cumulative Deaths"),
          React$1__default.createElement( 'text', {
            className: "axis-label", 'text-anchor': "middle", 'alignment-baseline': "hanging", transform: `translate(${innerWidth / 2},${innerHeight + 40})` }, "Time"),
          React$1__default.createElement( VoronoiOverlay, {
            onHover: handleVoronoiHover, innerHeight: innerHeight, innerWidth: innerWidth, allData: allData, lineGenerator: lineGenerator }),
          activeCountryName ? (
            React$1__default.createElement( 'path', {
              className: "marker-line active", d: lineGenerator(
                data.find(
                  (countryTimeseries) =>
                    countryTimeseries.countryName === activeCountryName
                )
              ) })
          ) : null
        )
      )
    );
  };

  const width = window.innerWidth;
  const height = window.innerHeight;

  const App = () => {
    const data = useData();
    return data
      ? React$1__default.createElement( LineChart, { data: data, width: width, height: height })
      : React$1__default.createElement( 'div', null, "Loading..." );
  };

  const rootElement = document.getElementById('root');
  ReactDOM.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, d3));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInVzZURhdGEuanMiLCJYQXhpcy5qcyIsIllBeGlzLmpzIiwiVm9yb25vaU92ZXJsYXkuanMiLCJMaW5lQ2hhcnQuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3N2LCB0aW1lUGFyc2UgfSBmcm9tICdkMyc7XG4vL2ltcG9ydCB7IGdyb3VwIH0gZnJvbSAnZDMtYXJyYXknO1xuXG4vL2NvbnN0IGNzdlVybCA9XG4vLyAgJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9DU1NFR0lTYW5kRGF0YS9DT1ZJRC0xOS9kMWVkN2VmMzU2OTA1OTRhOTE4ZWQ1ZmUxZmZiNmE3NTI2NmQyYzFmL2Nzc2VfY292aWRfMTlfZGF0YS9jc3NlX2NvdmlkXzE5X3RpbWVfc2VyaWVzL3RpbWVfc2VyaWVzX2NvdmlkMTlfZGVhdGhzX2dsb2JhbC5jc3YnO1xuXG5jb25zdCBjc3ZVcmwgPVxuICAnaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0NTU0VHSVNhbmREYXRhL0NPVklELTE5L21hc3Rlci9jc3NlX2NvdmlkXzE5X2RhdGEvY3NzZV9jb3ZpZF8xOV90aW1lX3Nlcmllcy90aW1lX3Nlcmllc19jb3ZpZDE5X2RlYXRoc19nbG9iYWwuY3N2JztcblxuY29uc3Qgc3VtID0gKGFjY3VtdWxhdG9yLCBjdXJyZW50VmFsdWUpID0+IGFjY3VtdWxhdG9yICsgY3VycmVudFZhbHVlO1xuXG5jb25zdCBwYXJzZURheSA9IHRpbWVQYXJzZSgnJW0vJWQvJXknKTtcblxuY29uc3QgdHJhbnNmb3JtID0gcmF3RGF0YSA9PiB7XG4gIC8vIEZpbHRlciBvdXQgcm93cyB0aGF0IHJlcHJlc2VudCBwcm92aW5jZXMgb3Igc3RhdGVzLlxuICBjb25zdCBjb3VudHJpZXNEYXRhID0gcmF3RGF0YS5maWx0ZXIoZCA9PiAhZFsnUHJvdmluY2UvU3RhdGUnXSk7XG5cbiAgLy8gR2V0IHRpbWVzZXJpZXMgZGF0YSBmb3IgZWFjaCBjb3VudHJ5LlxuICBjb25zdCBkYXlzID0gcmF3RGF0YS5jb2x1bW5zLnNsaWNlKDQpO1xuICByZXR1cm4gY291bnRyaWVzRGF0YS5tYXAoZCA9PiB7XG4gICAgY29uc3QgY291bnRyeU5hbWUgPSBkWydDb3VudHJ5L1JlZ2lvbiddO1xuXG4gICAgY29uc3QgY291bnRyeVRpbWVzZXJpZXMgPSBkYXlzLm1hcChkYXkgPT4gKHtcbiAgICAgIGRhdGU6IHBhcnNlRGF5KGRheSksXG4gICAgICBkZWF0aFRvdGFsOiArZFtkYXldLFxuICAgICAgY291bnRyeU5hbWVcbiAgICB9KSk7XG5cbiAgICBjb3VudHJ5VGltZXNlcmllcy5jb3VudHJ5TmFtZSA9IGNvdW50cnlOYW1lO1xuICAgIHJldHVybiBjb3VudHJ5VGltZXNlcmllcztcbiAgfSk7XG59O1xuXG5leHBvcnQgY29uc3QgdXNlRGF0YSA9ICgpID0+IHtcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUoKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNzdihjc3ZVcmwpLnRoZW4ocmF3RGF0YSA9PiB7XG4gICAgICBzZXREYXRhKHRyYW5zZm9ybShyYXdEYXRhKSk7XG4gICAgfSk7XG4gIH0sIFtdKTtcblxuICByZXR1cm4gZGF0YTtcbn07XG4iLCJpbXBvcnQgeyB1c2VSZWYsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHNlbGVjdCwgYXhpc0JvdHRvbSB9IGZyb20gJ2QzJztcblxuZXhwb3J0IGNvbnN0IFhBeGlzID0gKHsgeFNjYWxlLCBpbm5lckhlaWdodCB9KSA9PiB7XG4gIGNvbnN0IHJlZiA9IHVzZVJlZigpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHhBeGlzRyA9IHNlbGVjdChyZWYuY3VycmVudCk7XG4gICAgY29uc3QgeEF4aXMgPSBheGlzQm90dG9tKHhTY2FsZSlcbiAgICAgIC50aWNrU2l6ZSgtaW5uZXJIZWlnaHQpXG4gICAgICAudGlja1BhZGRpbmcoMTgpO1xuICAgIHhBeGlzRy5jYWxsKHhBeGlzKTtcbiAgfSwgW10pO1xuICByZXR1cm4gPGcgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKDAsJHtpbm5lckhlaWdodH0pYH0gcmVmPXtyZWZ9IC8+O1xufTtcbiIsImltcG9ydCB7IHVzZVJlZiwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgc2VsZWN0LCBheGlzTGVmdCB9IGZyb20gJ2QzJztcblxuZXhwb3J0IGNvbnN0IFlBeGlzID0gKHsgeVNjYWxlLCBpbm5lcldpZHRoIH0pID0+IHtcbiAgY29uc3QgcmVmID0gdXNlUmVmKCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgeUF4aXNHID0gc2VsZWN0KHJlZi5jdXJyZW50KTtcbiAgICBjb25zdCB5QXhpcyA9IGF4aXNMZWZ0KHlTY2FsZSlcbiAgICAgIC50aWNrU2l6ZSgtaW5uZXJXaWR0aClcbiAgICAgIC50aWNrUGFkZGluZygzKVxuICAgICAgLnRpY2tzKDEwLCBcIn5zXCIpXG4gICAgICAvLy50aWNrRm9ybWF0KCh0aWNrVmFsdWUpID0+IHRpY2tWYWx1ZSk7XG4gICAgeUF4aXNHLmNhbGwoeUF4aXMpO1xuICB9LCBbXSk7XG4gIHJldHVybiA8ZyByZWY9e3JlZn0gLz47XG59O1xuIiwiaW1wb3J0IHsgdXNlTWVtbyB9IGZyb20gJ3JlYWN0JztcbmV4cG9ydCBjb25zdCBWb3Jvbm9pT3ZlcmxheSA9ICh7XG4gIGlubmVyV2lkdGgsXG4gIGlubmVySGVpZ2h0LFxuICBhbGxEYXRhLFxuICBsaW5lR2VuZXJhdG9yLFxuICBvbkhvdmVyXG59KSA9PiB7XG5cbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdtZW1vaXppbmcnKTtcbiAgICBjb25zdCBwb2ludHMgPSBhbGxEYXRhLm1hcChkID0+IFtcbiAgICAgIGxpbmVHZW5lcmF0b3IueCgpKGQpLFxuICAgICAgbGluZUdlbmVyYXRvci55KCkoZClcbiAgICBdKTtcbiAgICBjb25zdCBkZWxhdW5heSA9IGQzLkRlbGF1bmF5LmZyb20ocG9pbnRzKTtcbiAgICBjb25zdCB2b3Jvbm9pID0gZGVsYXVuYXkudm9yb25vaShbMCwgMCwgaW5uZXJXaWR0aCwgaW5uZXJIZWlnaHRdKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGcgY2xhc3NOYW1lPVwidm9yb25vaVwiPlxuICAgICAgICB7cG9pbnRzLm1hcCgocG9pbnQsIGkpID0+IChcbiAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBvbkhvdmVyKGFsbERhdGFbaV0pfVxuICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgc3Ryb2tlPVwicGlua1wiXG4gICAgICAgICAgICBkPXt2b3Jvbm9pLnJlbmRlckNlbGwoaSl9XG4gICAgICAgICAgLz5cbiAgICAgICAgKSl9XG4gICAgICA8L2c+XG4gICAgKTtcbiAgfSwgW2FsbERhdGEsIGxpbmVHZW5lcmF0b3IsIGlubmVyV2lkdGgsIGlubmVySGVpZ2h0LCBvbkhvdmVyXSk7XG59O1xuIiwiaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VTdGF0ZSwgdXNlTWVtbyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHNjYWxlVGltZSwgZXh0ZW50LCBzY2FsZUxvZywgbWF4LCBsaW5lLCB0aW1lRm9ybWF0IH0gZnJvbSAnZDMnO1xuaW1wb3J0IHsgWEF4aXMgfSBmcm9tICcuL1hBeGlzJztcbmltcG9ydCB7IFlBeGlzIH0gZnJvbSAnLi9ZQXhpcyc7XG5pbXBvcnQgeyBWb3Jvbm9pT3ZlcmxheSB9IGZyb20gJy4vVm9yb25vaU92ZXJsYXknO1xuXG5jb25zdCB4VmFsdWUgPSAoZCkgPT4gZC5kYXRlO1xuY29uc3QgeVZhbHVlID0gKGQpID0+IGQuZGVhdGhUb3RhbDtcblxuY29uc3QgbWFyZ2luID0geyB0b3A6IDUwLCByaWdodDogNDAsIGJvdHRvbTogODAsIGxlZnQ6IDEwMCB9O1xuXG5jb25zdCBmb3JtYXREYXRlID0gdGltZUZvcm1hdCgnJWIgJWQnKTtcblxuZXhwb3J0IGNvbnN0IExpbmVDaGFydCA9ICh7IGRhdGEsIHdpZHRoLCBoZWlnaHQgfSkgPT4ge1xuICBjb25zdCBbYWN0aXZlQ291bnRyeU5hbWUsIHNldEFjdGl2ZUNvdW50cnlOYW1lXSA9IHVzZVN0YXRlKCk7XG5cbiAgY29uc3QgaW5uZXJXaWR0aCA9IHdpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQ7XG4gIGNvbnN0IGlubmVySGVpZ2h0ID0gaGVpZ2h0IC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgY29uc3QgYWxsRGF0YSA9IHVzZU1lbW8oXG4gICAgKCkgPT5cbiAgICAgIGRhdGEucmVkdWNlKFxuICAgICAgICAoYWNjdW11bGF0b3IsIGNvdW50cnlUaW1lc2VyaWVzKSA9PlxuICAgICAgICAgIGFjY3VtdWxhdG9yLmNvbmNhdChjb3VudHJ5VGltZXNlcmllcyksXG4gICAgICAgIFtdXG4gICAgICApLFxuICAgIFtkYXRhXVxuICApO1xuXG4gIGNvbnN0IGVwc2lsb24gPSAxO1xuXG4gIGNvbnN0IHhTY2FsZSA9IHVzZU1lbW8oXG4gICAgKCkgPT4gc2NhbGVUaW1lKCkuZG9tYWluKGV4dGVudChhbGxEYXRhLCB4VmFsdWUpKS5yYW5nZShbMCwgaW5uZXJXaWR0aF0pLFxuICAgIFthbGxEYXRhLCB4VmFsdWVdXG4gICk7XG5cbiAgY29uc3QgeVNjYWxlID0gdXNlTWVtbyhcbiAgICAoKSA9PlxuICAgICAgc2NhbGVMb2coKVxuICAgICAgICAuZG9tYWluKFtlcHNpbG9uLCBtYXgoYWxsRGF0YSwgeVZhbHVlKV0pXG4gICAgICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKSxcbiAgICBbZXBzaWxvbiwgYWxsRGF0YSwgeVZhbHVlXVxuICApO1xuXG4gIGNvbnN0IGxpbmVHZW5lcmF0b3IgPSB1c2VNZW1vKFxuICAgICgpID0+XG4gICAgICBsaW5lKClcbiAgICAgICAgLngoKGQpID0+IHhTY2FsZSh4VmFsdWUoZCkpKVxuICAgICAgICAueSgoZCkgPT4geVNjYWxlKGVwc2lsb24gKyB5VmFsdWUoZCkpKSxcbiAgICBbeFNjYWxlLCB4VmFsdWUsIHlTY2FsZSwgeVZhbHVlLCBlcHNpbG9uXVxuICApO1xuXG4gIGNvbnN0IG1vc3RSZWNlbnREYXRlID0geFNjYWxlLmRvbWFpbigpWzFdO1xuXG4gIGNvbnNvbGUubG9nKGFjdGl2ZUNvdW50cnlOYW1lKTtcblxuICBjb25zdCBoYW5kbGVWb3Jvbm9pSG92ZXIgPSB1c2VDYWxsYmFjaygoZCkgPT4ge1xuICAgIHNldEFjdGl2ZUNvdW50cnlOYW1lKGQuY291bnRyeU5hbWUpO1xuICB9LCBbXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8c3ZnIHdpZHRoPXt3aWR0aH0gaGVpZ2h0PXtoZWlnaHR9PlxuICAgICAgPGcgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKCR7bWFyZ2luLmxlZnR9LCR7bWFyZ2luLnRvcH0pYH0+XG4gICAgICAgIDxYQXhpcyB4U2NhbGU9e3hTY2FsZX0gaW5uZXJIZWlnaHQ9e2lubmVySGVpZ2h0fSAvPlxuICAgICAgICA8WUF4aXMgeVNjYWxlPXt5U2NhbGV9IGlubmVyV2lkdGg9e2lubmVyV2lkdGh9IC8+XG4gICAgICAgIHtkYXRhLm1hcCgoY291bnRyeVRpbWVzZXJpZXMpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibWFya2VyLWxpbmVcIlxuICAgICAgICAgICAgICBkPXtsaW5lR2VuZXJhdG9yKGNvdW50cnlUaW1lc2VyaWVzKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSl9XG5cbiAgICAgICAgPHRleHQgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKCR7aW5uZXJXaWR0aCAvIDJ9LDApYH0gdGV4dC1hbmNob3I9XCJtaWRkbGVcIj5cbiAgICAgICAgICBHbG9iYWwgQ29yb25hdmlydXMgRGVhdGhzIE92ZXIgVGltZSBieSBDb3VudHJ5XG4gICAgICAgIDwvdGV4dD5cbiAgICAgICAgPHRleHRcbiAgICAgICAgICBjbGFzc05hbWU9XCJheGlzLWxhYmVsXCJcbiAgICAgICAgICB0cmFuc2Zvcm09e2B0cmFuc2xhdGUoLTQwLCR7aW5uZXJIZWlnaHQgLyAyfSkgcm90YXRlKC05MClgfVxuICAgICAgICAgIHRleHQtYW5jaG9yPVwibWlkZGxlXCJcbiAgICAgICAgPlxuICAgICAgICAgIEN1bXVsYXRpdmUgRGVhdGhzXG4gICAgICAgIDwvdGV4dD5cbiAgICAgICAgPHRleHRcbiAgICAgICAgICBjbGFzc05hbWU9XCJheGlzLWxhYmVsXCJcbiAgICAgICAgICB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiXG4gICAgICAgICAgYWxpZ25tZW50LWJhc2VsaW5lPVwiaGFuZ2luZ1wiXG4gICAgICAgICAgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKCR7aW5uZXJXaWR0aCAvIDJ9LCR7aW5uZXJIZWlnaHQgKyA0MH0pYH1cbiAgICAgICAgPlxuICAgICAgICAgIFRpbWVcbiAgICAgICAgPC90ZXh0PlxuICAgICAgICA8Vm9yb25vaU92ZXJsYXlcbiAgICAgICAgICBvbkhvdmVyPXtoYW5kbGVWb3Jvbm9pSG92ZXJ9XG4gICAgICAgICAgaW5uZXJIZWlnaHQ9e2lubmVySGVpZ2h0fVxuICAgICAgICAgIGlubmVyV2lkdGg9e2lubmVyV2lkdGh9XG4gICAgICAgICAgYWxsRGF0YT17YWxsRGF0YX1cbiAgICAgICAgICBsaW5lR2VuZXJhdG9yPXtsaW5lR2VuZXJhdG9yfVxuICAgICAgICAvPlxuICAgICAgICB7YWN0aXZlQ291bnRyeU5hbWUgPyAoXG4gICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIm1hcmtlci1saW5lIGFjdGl2ZVwiXG4gICAgICAgICAgICBkPXtsaW5lR2VuZXJhdG9yKFxuICAgICAgICAgICAgICBkYXRhLmZpbmQoXG4gICAgICAgICAgICAgICAgKGNvdW50cnlUaW1lc2VyaWVzKSA9PlxuICAgICAgICAgICAgICAgICAgY291bnRyeVRpbWVzZXJpZXMuY291bnRyeU5hbWUgPT09IGFjdGl2ZUNvdW50cnlOYW1lXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2c+XG4gICAgPC9zdmc+XG4gICk7XG59O1xuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHsgcmFuZ2UgfSBmcm9tICdkMyc7XG5pbXBvcnQgeyB1c2VEYXRhIH0gZnJvbSAnLi91c2VEYXRhJztcbmltcG9ydCB7IExpbmVDaGFydCB9IGZyb20gJy4vTGluZUNoYXJ0JztcblxuY29uc3Qgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbmNvbnN0IGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuY29uc3QgQXBwID0gKCkgPT4ge1xuICBjb25zdCBkYXRhID0gdXNlRGF0YSgpO1xuICByZXR1cm4gZGF0YVxuICAgID8gPExpbmVDaGFydCBkYXRhPXtkYXRhfSB3aWR0aD17d2lkdGh9IGhlaWdodD17aGVpZ2h0fSAvPlxuICAgIDogPGRpdj5Mb2FkaW5nLi4uPC9kaXY+O1xufTtcblxuY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpO1xuUmVhY3RET00ucmVuZGVyKDxBcHAgLz4sIHJvb3RFbGVtZW50KTtcbiJdLCJuYW1lcyI6WyJ0aW1lUGFyc2UiLCJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsImNzdiIsInVzZVJlZiIsInNlbGVjdCIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInVzZU1lbW8iLCJ0aW1lRm9ybWF0Iiwic2NhbGVUaW1lIiwiZXh0ZW50Iiwic2NhbGVMb2ciLCJtYXgiLCJsaW5lIiwidXNlQ2FsbGJhY2siLCJSZWFjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBRUE7QUFDQTtFQUNBO0VBQ0E7QUFDQTtFQUNBLE1BQU0sTUFBTTtFQUNaLEVBQUUscUpBQXFKLENBQUM7QUFHeEo7RUFDQSxNQUFNLFFBQVEsR0FBR0EsY0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3ZDO0VBQ0EsTUFBTSxTQUFTLEdBQUcsT0FBTyxJQUFJO0VBQzdCO0VBQ0EsRUFBRSxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7QUFDbEU7RUFDQTtFQUNBLEVBQUUsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDeEMsRUFBRSxPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJO0VBQ2hDLElBQUksTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDNUM7RUFDQSxJQUFJLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUs7RUFDL0MsTUFBTSxJQUFJLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQztFQUN6QixNQUFNLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDekIsTUFBTSxXQUFXO0VBQ2pCLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDUjtFQUNBLElBQUksaUJBQWlCLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztFQUNoRCxJQUFJLE9BQU8saUJBQWlCLENBQUM7RUFDN0IsR0FBRyxDQUFDLENBQUM7RUFDTCxDQUFDLENBQUM7QUFDRjtFQUNPLE1BQU0sT0FBTyxHQUFHLE1BQU07RUFDN0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHQyxnQkFBUSxFQUFFLENBQUM7QUFDckM7RUFDQSxFQUFFQyxpQkFBUyxDQUFDLE1BQU07RUFDbEIsSUFBSUMsUUFBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUk7RUFDaEMsTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7RUFDbEMsS0FBSyxDQUFDLENBQUM7RUFDUCxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVDtFQUNBLEVBQUUsT0FBTyxJQUFJLENBQUM7RUFDZCxDQUFDOztFQ3pDTSxNQUFNLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLO0VBQ2xELEVBQUUsTUFBTSxHQUFHLEdBQUdDLGNBQU0sRUFBRSxDQUFDO0VBQ3ZCLEVBQUVGLGlCQUFTLENBQUMsTUFBTTtFQUNsQixJQUFJLE1BQU0sTUFBTSxHQUFHRyxXQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ3ZDLElBQUksTUFBTSxLQUFLLEdBQUdDLGVBQVUsQ0FBQyxNQUFNLENBQUM7RUFDcEMsT0FBTyxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUM7RUFDN0IsT0FBTyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDdkIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3ZCLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUNULEVBQUUsT0FBTyw0QkFBRyxXQUFXLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUUsRUFBQyxLQUFLLEtBQUksQ0FBRyxDQUFDO0VBQ25FLENBQUMsQ0FBQzs7RUNWSyxNQUFNLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxLQUFLO0VBQ2pELEVBQUUsTUFBTSxHQUFHLEdBQUdGLGNBQU0sRUFBRSxDQUFDO0VBQ3ZCLEVBQUVGLGlCQUFTLENBQUMsTUFBTTtFQUNsQixJQUFJLE1BQU0sTUFBTSxHQUFHRyxXQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ3ZDLElBQUksTUFBTSxLQUFLLEdBQUdFLGFBQVEsQ0FBQyxNQUFNLENBQUM7RUFDbEMsT0FBTyxRQUFRLENBQUMsQ0FBQyxVQUFVLENBQUM7RUFDNUIsT0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDO0VBQ3JCLE9BQU8sS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUM7RUFDdEI7RUFDQSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDdkIsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ1QsRUFBRSxPQUFPLDRCQUFHLEtBQUssS0FBSSxDQUFHLENBQUM7RUFDekIsQ0FBQyxDQUFDOztFQ2RLLE1BQU0sY0FBYyxHQUFHLENBQUM7RUFDL0IsRUFBRSxVQUFVO0VBQ1osRUFBRSxXQUFXO0VBQ2IsRUFBRSxPQUFPO0VBQ1QsRUFBRSxhQUFhO0VBQ2YsRUFBRSxPQUFPO0VBQ1QsQ0FBQyxLQUFLO0FBQ047RUFDQSxFQUFFLE9BQU9DLGVBQU8sQ0FBQyxNQUFNO0VBQ3ZCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztFQUM3QixJQUFJLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJO0VBQ3BDLE1BQU0sYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUMxQixNQUFNLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDMUIsS0FBSyxDQUFDLENBQUM7RUFDUCxJQUFJLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQzlDLElBQUksTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7RUFDdEUsSUFBSTtFQUNKLE1BQU0sNEJBQUcsV0FBVTtFQUNuQixRQUFTLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUM3QixVQUFVO0VBQ1YsWUFBWSxjQUFjLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBRSxFQUN4QyxNQUFLLE1BQU0sRUFDWCxRQUFPLE1BQU0sRUFDYixHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFFLENBQ3pCO0VBQ1osU0FBUyxDQUFFO0VBQ1gsT0FBVTtFQUNWLE1BQU07RUFDTixHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztFQUNqRSxDQUFDLENBQUM7O0VDeEJGLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDN0IsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQztBQUNuQztFQUNBLE1BQU0sTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQzdEO0VBQ0EsTUFBTSxVQUFVLEdBQUdDLGVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QztBQUNBLEVBQU8sTUFBTSxTQUFTLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUs7RUFDdEQsRUFBRSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsb0JBQW9CLENBQUMsR0FBR1IsZ0JBQVEsRUFBRSxDQUFDO0FBQy9EO0VBQ0EsRUFBRSxNQUFNLFVBQVUsR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0VBQ3hELEVBQUUsTUFBTSxXQUFXLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMxRDtFQUNBLEVBQUUsTUFBTSxPQUFPLEdBQUdPLGVBQU87RUFDekIsSUFBSTtFQUNKLE1BQU0sSUFBSSxDQUFDLE1BQU07RUFDakIsUUFBUSxDQUFDLFdBQVcsRUFBRSxpQkFBaUI7RUFDdkMsVUFBVSxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDO0VBQy9DLFFBQVEsRUFBRTtFQUNWLE9BQU87RUFDUCxJQUFJLENBQUMsSUFBSSxDQUFDO0VBQ1YsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNwQjtFQUNBLEVBQUUsTUFBTSxNQUFNLEdBQUdBLGVBQU87RUFDeEIsSUFBSSxNQUFNRSxjQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUNDLFdBQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7RUFDNUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7RUFDckIsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLE1BQU0sTUFBTSxHQUFHSCxlQUFPO0VBQ3hCLElBQUk7RUFDSixNQUFNSSxhQUFRLEVBQUU7RUFDaEIsU0FBUyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUVDLFFBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUNoRCxTQUFTLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNoQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7RUFDOUIsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLE1BQU0sYUFBYSxHQUFHTCxlQUFPO0VBQy9CLElBQUk7RUFDSixNQUFNTSxTQUFJLEVBQUU7RUFDWixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQztFQUM3QyxHQUFHLENBQUM7QUFDSjtFQUNBLEVBQUUsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDO0VBQ0EsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDakM7RUFDQSxFQUFFLE1BQU0sa0JBQWtCLEdBQUdDLG1CQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUs7RUFDaEQsSUFBSSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7RUFDeEMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1Q7RUFDQSxFQUFFO0VBQ0YsSUFBSUMseUNBQUssT0FBTyxLQUFNLEVBQUMsUUFBUTtFQUMvQixNQUFNQSx1Q0FBRyxXQUFXLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM1RCxRQUFRQSxnQ0FBQyxTQUFNLFFBQVEsTUFBTyxFQUFDLGFBQWEsYUFBWTtFQUN4RCxRQUFRQSxnQ0FBQyxTQUFNLFFBQVEsTUFBTyxFQUFDLFlBQVksWUFBVztFQUN0RCxRQUFTLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxpQkFBaUIsS0FBSztFQUN6QyxVQUFVO0VBQ1YsWUFBWUE7RUFDWixjQUFjLFdBQVUsYUFBYSxFQUN2QixHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsR0FBRSxDQUNwQztFQUNkLFlBQVk7RUFDWixTQUFTO0FBQ1Q7RUFDQSxRQUFRQSwwQ0FBTSxXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFFLEVBQUMsZUFBWSxZQUFTLGdEQUV4RTtFQUNSLFFBQVFBO0VBQ1IsVUFBVSxXQUFVLFlBQVksRUFDdEIsV0FBVyxDQUFDLGNBQWMsRUFBRSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxFQUMzRCxlQUFZLFlBQ2IsbUJBRUQ7RUFDUixRQUFRQTtFQUNSLFVBQVUsV0FBVSxZQUFZLEVBQ3RCLGVBQVksUUFBUSxFQUNwQixzQkFBbUIsU0FBUyxFQUM1QixXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUM3RCxNQUVEO0VBQ1IsUUFBUUEsZ0NBQUM7RUFDVCxVQUFVLFNBQVMsa0JBQW1CLEVBQzVCLGFBQWEsV0FBWSxFQUN6QixZQUFZLFVBQVcsRUFDdkIsU0FBUyxPQUFRLEVBQ2pCLGVBQWUsZUFBYztFQUV2QyxRQUFTLGlCQUFpQjtFQUMxQixVQUFVQTtFQUNWLFlBQVksV0FBVSxvQkFBb0IsRUFDOUIsR0FBRyxhQUFhO0VBQzVCLGNBQWMsSUFBSSxDQUFDLElBQUk7RUFDdkIsZ0JBQWdCLENBQUMsaUJBQWlCO0VBQ2xDLGtCQUFrQixpQkFBaUIsQ0FBQyxXQUFXLEtBQUssaUJBQWlCO0VBQ3JFLGVBQWU7RUFDZixlQUFjLENBQ0Y7RUFDWixZQUFZLElBQUs7RUFDakIsT0FBVTtFQUNWLEtBQVU7RUFDVixJQUFJO0VBQ0osQ0FBQyxDQUFDOztFQzNHRixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO0VBQ2hDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDbEM7RUFDQSxNQUFNLEdBQUcsR0FBRyxNQUFNO0VBQ2xCLEVBQUUsTUFBTSxJQUFJLEdBQUcsT0FBTyxFQUFFLENBQUM7RUFDekIsRUFBRSxPQUFPLElBQUk7RUFDYixNQUFNQSxnQ0FBQyxhQUFVLE1BQU0sSUFBSyxFQUFDLE9BQU8sS0FBTSxFQUFDLFFBQVEsUUFBTyxDQUFHO0VBQzdELE1BQU1BLDZDQUFLLFlBQVUsRUFBTSxDQUFDO0VBQzVCLENBQUMsQ0FBQztBQUNGO0VBQ0EsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNwRCxRQUFRLENBQUMsTUFBTSxDQUFDQSxnQ0FBQyxTQUFHLEVBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQzs7OzsifQ==
