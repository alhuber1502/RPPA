
const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in

  layout: {
    name: 'cose',
  },
  style: [
    {
      selector: 'node',
      style: {
        'label': 'data(id)',
        'text-valign': 'center',
        'color': '#000000',
        'background-color': '#3a7ecf',
        'font-family': 'Helvetica'
      },
    },
    {
      selector: '#n1',
      style: {
        'background-fill': 'linear-gradient',
        'background-gradient-stop-colors': 'cyan magenta yellow'
      }
    },
    {
      selector: '#n2',
      style: {
        'background-fill': 'linear-gradient',
        'background-gradient-direction': 'to-left',
        'background-gradient-stop-colors': 'gold red lawngreen'
      }
    },
    {
      selector: '#n3',
      style: {
        'background-fill': 'radial-gradient',
        'background-gradient-stop-colors': 'cyan magenta yellow'
      }
    },
    {
      selector: '#n4',
      style: {
        "border-color": "black",
        "border-style": "dashed",
        "border-width": 2
      }
    },
    {
      selector: '#n5',
      style: {
        "border-color": "red",
        "border-style": "dotted",
        "border-width": 4,
        'text-background-color': '#555',
        'text-background-opacity': 1,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#3a7ecf',
        'opacity': 0.5,
      },
    },
    {
      selector: '#n1-n2',
      style: {
        'line-style': 'solid'
      }
    },
    {
      selector: '#n1-n3',
      style: {
        'line-style': 'dotted'
      }
    },
    {
      selector: '#n1-n4',
      style: {
        'line-style': 'dashed'
      }
    },
    {
      selector: '#n1-n5',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [1, 1, 4, 1],
      }
    },
    {
      selector: '#n2-n3',
      style: {
        'line-fill': 'linear-gradient',
        'line-gradient-stop-colors': 'lawngreen red'
      }
    },
    {
      selector: '#n2-n4',
      style: {
        'label': 'normal label',
        'font-size': '6px',
        'edge-text-rotation': 'autorotate',
      }
    },
    {
      selector: '#n2-n5',
      style: {
        'label': 'bold label',
        'font-size': '6px',
        'edge-text-rotation': 'autorotate',
        'font-weight': 'bold'
      }
    }
  ],
  elements: {
    nodes: [
      { data: { id: 'n1', weight: 1 } },
      { data: { id: 'n2', weight: 2 } },
      { data: { id: 'n3', weight: 3 } },
      { data: { id: 'n4', weight: 4 } },
      { data: { id: 'n5', weight: 5 } },
    ],
    edges: [
      { data: { id:'n1-n2', source: 'n1', target: 'n2', directed: 'false' } },
      { data: { id:'n1-n3', source: 'n1', target: 'n3', directed: 'false' } },
      { data: { id:'n1-n4', source: 'n1', target: 'n4', directed: 'false' } },
      { data: { id:'n1-n5', source: 'n1', target: 'n5', directed: 'false' } },
      { data: { id:'n2-n3', source: 'n2', target: 'n3', directed: 'false' } },
      { data: { id:'n2-n4', source: 'n2', target: 'n4', directed: 'false' } },
      { data: { id:'n2-n5', source: 'n2', target: 'n5', directed: 'false' } },
      { data: { id:'n3-n4', source: 'n3', target: 'n4', directed: 'false' } },
      { data: { id:'n3-n5', source: 'n3', target: 'n5', directed: 'false' } },
      { data: { id:'n4-n5', source: 'n4', target: 'n5', directed: 'false' } },
    ],
  },
});

cy.ready(() => {
  const options = {
    save: true,
    bg: 'lightgray'
  };
  window.pdf = (override) => {
    cy.pdf({ ...options, ...override });
  };
});

