window.onload = () => {

  const educationEndpoint = ' https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
  const countyEndpoint = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';
  const tooltip = d3.select('.tooltip');
  const colors = [
    '#C5E1A5',
    '#9CCC65',
    '#7CB342',
    '#558B2F',
    '#1B5E20',
    '#0c3e10'
  ];
  const statesNames = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AS': 'American Samoa',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District Of Columbia',
    'FM': 'Federated States Of Micronesia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'GU': 'Guam',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MH': 'Marshall Islands',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'MP': 'Northern Mariana Islands',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PW': 'Palau',
    'PA': 'Pennsylvania',
    'PR': 'Puerto Rico',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VI': 'Virgin Islands',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
  };

  function colorMe(value, ranges) {
    for (let i = 0; i <= ranges.length; i++) {
      if (value <= ranges[i]) {
        return colors[i - 1];
      }
    }
  }

  function handleData(response) {
    const [educationData, geoData] = response;
    const width = 1500;
    const height = 900;
    const states = geoData.objects.states;
    const counties = geoData.objects.counties;
    const nation = geoData.objects.nation;
    const path = d3.geoPath();

    counties.geometries.sort((a, b) => a.id - b.id);
    counties.geometries.forEach((obj, idx) => obj.properties = educationData[idx]);

    // Adding main SVG element
    const svg = d3.select('.container')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const [min, max] = d3.extent(educationData, d => d.bachelorsOrHigher);
    const step = (max - min) / colors.length;

    let educationRanges = [];
    for (let i = 0; i <= max; i += step) {
      educationRanges.push(Math.round(i));
    }

    // Rendering counties
    svg.append('g')
      .attr('class', 'layout')
      .selectAll('path')
      .data(topojson.feature(geoData, counties).features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('data-fips', d => d.properties.fips)
      .attr('data-education', d => d.properties.bachelorsOrHigher)
      .attr('fill', d => colorMe(d.properties.bachelorsOrHigher, educationRanges))
      .attr('d', path)
      .on('mouseover', d => {
        tooltip.attr('data-education', d.properties.bachelorsOrHigher);
        tooltip.style('left', d3.event.pageX + 20 + 'px');
        tooltip.style('top', d3.event.pageY - 60 + 'px');
        tooltip.html(
          `
          <p class="info">State: ${statesNames[d.properties.state]}</p>
          <p class="info">County: ${d.properties.area_name}</p>
          <p class="info">Education: ${d.properties.bachelorsOrHigher}%</p>
          `
        );
        tooltip.classed('visible', true);
      })
      .on('mouseout', () => {
        tooltip.classed('visible', false);
      });

    // Rendering states
    svg.append('g')
      .attr('class', 'layout')
      .selectAll('path')
      .data(topojson.feature(geoData, states).features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('fill', 'none')
      .attr('d', path);

    // Rendering states
    svg.append('g')
      .attr('class', 'layout')
      .selectAll('path')
      .data(topojson.feature(geoData, nation).features)
      .enter()
      .append('path')
      .attr('class', 'nation')
      .attr('fill', 'none')
      .attr('d', path);

    // Adding legend
    const offsetX = 980;
    const offsetY = 60;
    const legendBarWidth = 50;
    const legendBarHeight = 20;

    let legendTickPositions = [];
    for (let i = 0; i < educationRanges.length * legendBarWidth; i += legendBarWidth) {
      legendTickPositions.push(i);
    }

    const legend = svg.append('g')
      .attr('id', 'legend')
      .attr('x', offsetX)
      .attr('y', offsetY);

    // Setting legend scale
    const legendScale = d3.scaleOrdinal()
      .domain(educationRanges)
      .range(legendTickPositions);

    // Adding legend axis
    svg.select('#legend')
      .append('g')
      .attr('transform', `translate(${offsetX}, ${offsetY + legendBarHeight})`)
      .call(d3.axisBottom(legendScale).tickFormat(d => d + '%').tickSizeOuter(0));

    legend.selectAll('rect')
      .data(colors)
      .enter()
      .append('rect')
      .attr('x', (d, i) => offsetX + i * legendBarWidth)
      .attr('y', offsetY)
      .attr('width', legendBarWidth)
      .attr('height', legendBarHeight)
      .attr('fill', d => d);
  }

  Promise.all([
    fetch(educationEndpoint)
    .then(response => response.json())
    .catch(error => console.log(error)),
    fetch(countyEndpoint)
    .then(response => response.json())
    .catch(error => console.log(error))
  ]).then(jsonResponse => handleData(jsonResponse))
};