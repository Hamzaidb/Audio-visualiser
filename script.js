const AudioContext = window.AudioContext || window.webkitAudioContext;

let nodes = [];
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 128;

let player;
let display;
let streamPath;
let filePath;
let sourceNode;
let reverbImpulse;
let canvas;

function generateRandomId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function useAudioStream() {
  audioCtx.resume();
  filePath.value = "";
  player.src = streamPath.value;
  player.play();
}

function useFileStream() {
  audioCtx.resume();
  streamPath.value = "";
  var file = filePath.files[0];
  var reader = new FileReader();
  
  if (filePath.files && file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        player.src = e.target.result;
        player.play();
      }
      reader.readAsDataURL(file);
  }
}

function addNode(id, type) {
  nodes.push({
    "id": id,
    "type": type
  });
  processAudio();
}

function removeNode(id) {
  const node = document.getElementById(`${id}-container`)
  let index = -1;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id == id) {
      index = i;
      break;
    }
  }
  if (index == -1 || !node) {
    console.error(`Couldn't remove node. Couldn't find id ${id}`);
    return;
  }
  node.remove();
  nodes.splice(index,1);
  processAudio();
}

let activeVisualizer = setUpVisualizer0;

// Ajoutez ces lignes après la définition de vos fonctions setUpVisualizer

let drawVisual; // déplacez cette variable à l'extérieur de vos fonctions setUpVisualizer

function changeVisualizer(newVisualizer) {
  // arrête l'animation en cours
  if (drawVisual) {
    cancelAnimationFrame(drawVisual);
  }

  // efface le canvas
  const canvas = document.getElementById("visualizer");
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // démarre la nouvelle visualisation
  newVisualizer(analyser);
}

document.getElementById('vis0').addEventListener('click', function() {
  activeVisualizer = setUpVisualizer0;
  changeVisualizer(activeVisualizer);
});

document.getElementById('vis1').addEventListener('click', function() {
  activeVisualizer = setUpVisualizer1;
  changeVisualizer(activeVisualizer);
});

document.getElementById('vis2').addEventListener('click', function() {
  activeVisualizer = setUpVisualizer2;
  changeVisualizer(activeVisualizer);
});

document.getElementById('vis3').addEventListener('click', function() {
  activeVisualizer = setUpVisualizer3;
  changeVisualizer(activeVisualizer);
});


async function setupWebAudio() {
  player = document.getElementById("player");
  display = document.getElementById("audioDemo");
  streamPath = document.getElementById("streamPath");
  filePath = document.getElementById("filePath");
  sourceNode = audioCtx.createMediaElementSource(player); 
  reverbImpulse = await getImpulseBuffer(audioCtx, "assets/impulse.wav");
  activeVisualizer(analyser);
  processAudio();
}

function processAudio() {
  sourceNode.disconnect();
  let prevNode = {
    "outputNode": sourceNode
  }
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].filter) {
      nodes[i].filter.outputNode.disconnect();
      if (nodes[i].filter.inputNodes) {
        nodes[i].filter.inputNodes.forEach(node => prevNode.outputNode.connect(node));
      } else {
        prevNode.outputNode.connect(nodes[i].filter.outputNode);
      }
      prevNode = nodes[i].filter;
    } else {
      switch (nodes[i].type) {
        case "reverb":
          prevNode = createReverbNode(nodes[i].id, prevNode)
          break;
        case "gain":
          prevNode = createGainNode(nodes[i].id, prevNode);
          break;
        case "lpf":
          prevNode = createFilterNode(nodes[i].id, prevNode, "lowpass");
          break;
        case "hpf":
          prevNode = createFilterNode(nodes[i].id, prevNode, "highpass");
          break;
        case "pan":
          prevNode = createPanNode(nodes[i].id, prevNode);
          break;
        default:
          console.error(`Unknown filter type ${nodes[i].type}`)
          continue;
      }
      nodes[i].filter = prevNode;
    }
  }
  analyser.disconnect();
  prevNode.outputNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function createReverbNode(id, prevNode) {
  const reverb = audioCtx.createConvolver();
  reverb.buffer = reverbImpulse;
  const dryGainNode = audioCtx.createGain();
  const wetGainNode = audioCtx.createGain();
  dryGainNode.gain.value = 0.5;
  wetGainNode.gain.value = 0.5;
  const reverbSlider = createSlider(id, "Reverb", 0, 1, 0.5, 0.01);
  reverbSlider.oninput = () => {
    dryGainNode.gain.value = 1 - reverbSlider.value;
    wetGainNode.gain.value = reverbSlider.value;
  }
  const exitGainNode = audioCtx.createGain();
  exitGainNode.gain.value = 1;
  prevNode.outputNode.connect(dryGainNode).connect(exitGainNode);
  prevNode.outputNode.connect(reverb).connect(wetGainNode).connect(exitGainNode);
  return {
    "inputNodes": [
      dryGainNode,
      reverb
    ],
    "outputNode": exitGainNode
  }
}

function createGainNode(id, prevNode) {
  const gainNode = audioCtx.createGain();
  const gainSlider = createSlider(id, "Gain", 0, 2, 1, 0.01);
  gainSlider.oninput = () => {
    gainNode.gain.value = gainSlider.value;
  }
  prevNode.outputNode.connect(gainNode)
  return {
    "outputNode": gainNode
  };
}

function createFilterNode(id, prevNode, type) {
  const filterNode = audioCtx.createBiquadFilter();
  const filterInfo = getFilterInfo(type);
  filterNode.frequency.value = filterInfo.defaultFrequency;
  filterNode.type = type;
  const filterSlider = createSlider(id, filterInfo.labelText, 0, 20000, filterInfo.defaultFrequency, 1);
  filterSlider.oninput = () => {
    filterNode.frequency.value = filterSlider.value;
  }
  prevNode.outputNode.connect(filterNode);
  return {
    "outputNode": filterNode
  };
}


let panner;

let autopanInterval;

function createPanNode(id, prevNode) {
  panner = audioCtx.createStereoPanner();
  panner.pan.value = 0;
  const panSlider = createSlider(id, "Pan", -1, 1, 0, 0.01);
  panSlider.oninput = () => {
    panner.pan.value = panSlider.value;
  }
  prevNode.outputNode.connect(panner);
  return {
    "outputNode": panner
  };
};

/*
document.getElementById('autopan').addEventListener('click', function() {
  if (autopanInterval) {
    // Si le bouton autopan est déjà activé, on l'arrête
    clearInterval(autopanInterval);
    autopanInterval = null;
  } else {
    // Sinon, on active l'autopan
    let direction = 1;
    autopanInterval = setInterval(() => {
      panner.pan.value += 0.01 * direction;
      if (panner.pan.value >= 1) {
        direction = -1;
      } else if (panner.pan.value <= -1) {
        direction = 1;
      }
    }, 100); 
  }
}); */



function getFilterInfo(type) {
  switch (type) {
    case "lowpass":
      return {
        "labelText": "Low Pass Filter",
        "defaultFrequency": 20000
      }
    case "highpass":
      return {
        "labelText": "High Pass Filter",
        "defaultFrequency": 0
      };
  }
}



async function getImpulseBuffer(audioCtx, impulseUrl) {
  if (reverbImpulse) {
    return reverbImpulse;
  }
  const response = await fetch(impulseUrl);
  const responseBuffer = await response.arrayBuffer();
  reverbImpulse = audioCtx.decodeAudioData(responseBuffer)
  return reverbImpulse;
}

function createSlider(id, labelText, min, max, currentValue, step) {
  const containerDiv = document.createElement("div");
  containerDiv.id = `${id}-container`;
  containerDiv.classList = ["node-control"];
  const slider = document.createElement("input");
  slider.id = id;
  slider.type = "range"
  slider.labelText = labelText;
  slider.min = min;
  slider.max = max;
  slider.step = step;
  const label = document.createElement("label");
  label.for = labelText;
  label.innerText = labelText;
  slider.value = currentValue;
  const closeButton = document.createElement("img");
  closeButton.src = "assets/close-button.svg";
  closeButton.onclick = () => {
    removeNode(id);
  };
  closeButton.classList = ["close-button"];
  containerDiv.appendChild(label);
  containerDiv.appendChild(slider);
  containerDiv.appendChild(closeButton);
  display.appendChild(containerDiv);
  return slider;
}

document.addEventListener("DOMContentLoaded", setupWebAudio);
window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerHeight/4);
};

function setUpVisualizer0(analyser) {
  canvas = document.getElementById("visualizer");
  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerHeight);
  const canvasCtx = canvas.getContext("2d");

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const drawFrequency = () => {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawVisual = requestAnimationFrame(drawFrequency);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i] * 1.2;
      canvasCtx.save();
      canvasCtx.translate(canvas.width/2, canvas.height/2);
      canvasCtx.rotate(i + Math.PI * 4/ bufferLength);
      const hue = 240 + i * 1.5;
      canvasCtx.lineWidth = barHeight/10;
      canvasCtx.strokeStyle = 'hsl(' + hue + ',100%, 50%)';
      canvasCtx.fillStyle = 'hsl(' + hue + ',100%, 50%)';
      canvasCtx.beginPath();
      canvasCtx.moveTo(0,0);
      canvasCtx.lineTo(0, barHeight);
      canvasCtx.stroke();
      canvasCtx.beginPath();
      canvasCtx.arc(0, barHeight + barHeight/5 , barHeight/20, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.beginPath();
      canvasCtx.arc(0, barHeight + barHeight/2, barHeight/10, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.restore();
    }
  };

  drawFrequency();
}

function setUpVisualizer1(analyser) {
  canvas = document.getElementById("visualizer");
  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerHeight);
  const canvasCtx = canvas.getContext("2d");

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const drawFrequency = () => {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawVisual = requestAnimationFrame(drawFrequency);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i] * 1.5;
      canvasCtx.save();
      let x = Math.sin(i * Math.PI / 180) + 100;
      let y = Math.cos(i * Math.PI / 180) + 100;
      canvasCtx.translate(canvas.width/2 + x, canvas.height/2);
      canvasCtx.rotate(i + Math.PI * 2/bufferLength);

      const hue = i * 0.6 + 200;
      canvasCtx.fillStyle = 'hsl(' + hue + ',100%, 50%)';
      canvasCtx.strokeStyle = 'hsl(' + hue + ',100%, 50%)';

      canvasCtx.shadowOffsetX = 10;
      canvasCtx.shadowOffsetY = 10;
      canvasCtx.shadowBlur = 8;
      canvasCtx.shadowColor = 'rgba(0,0,0,1)';

      canvasCtx.globalCompositeOperation='source-over';

      // line
      canvasCtx.lineWidth = barHeight/5;
      canvasCtx.beginPath();
      canvasCtx.moveTo(x,y);
      canvasCtx.lineTo(x, y - barHeight);
      canvasCtx.lineCap = "round";
      canvasCtx.stroke();
      canvasCtx.closePath();
      
      // circle
      canvasCtx.beginPath();
      canvasCtx.arc(0, y + barHeight, barHeight/10, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.lineWidth = 1.5;
      canvasCtx.strokeStyle = 'hsl(1, 100%, ' + i/4 + '%)';
      canvasCtx.stroke();

      canvasCtx.restore();
    }
  };

  drawFrequency();
}

function setUpVisualizer2(analyser) {
  canvas = document.getElementById("visualizer");
  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerHeight);
  const canvasCtx = canvas.getContext("2d");

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const drawFrequency = () => {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawVisual = requestAnimationFrame(drawFrequency);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i] * 1.2;
      canvasCtx.save();
      canvasCtx.translate(canvas.width/2, canvas.height/2);
      canvasCtx.rotate(i * Math.PI * 4/ bufferLength);
      const hue = 240 + i * 1.5;
      canvasCtx.lineWidth = barHeight/10;
      canvasCtx.strokeStyle = 'hsl(' + hue + ',100%, 50%)';
      canvasCtx.fillStyle = 'hsl(' + hue + ',100%, 50%)';
      canvasCtx.beginPath();
      canvasCtx.moveTo(0,0);
      canvasCtx.lineTo(0, barHeight);
      canvasCtx.stroke();
      canvasCtx.beginPath();
      canvasCtx.arc(0, barHeight + barHeight/5 , barHeight/20, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.beginPath();
      canvasCtx.arc(0, barHeight + barHeight/2, barHeight/10, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.restore();
    }
  };

  drawFrequency();
}

function setUpVisualizer3(analyser) {
  canvas = document.getElementById("visualizer");
  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerHeight);
  const canvasCtx = canvas.getContext("2d");

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const drawFrequency = () => {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawVisual = requestAnimationFrame(drawFrequency);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i] * 1.4;
      canvasCtx.save();
      canvasCtx.translate(canvas.width/2, canvas.height/2);
      canvasCtx.rotate(i * bufferLength * -4.001);
      const hue = 250 + i * 2;
      canvasCtx.fillStyle = 'hsl(' + hue + ',100%, 50%)';
      canvasCtx.beginPath();
      canvasCtx.arc(0, barHeight, barHeight/10, 0, Math.PI * 2); 
      canvasCtx.arc(0, barHeight/1.5, barHeight/20, 0, Math.PI * 2); 
      canvasCtx.arc(0, barHeight/2, barHeight/30, 0, Math.PI * 2); 
      canvasCtx.arc(0, barHeight/3, barHeight/40, 0, Math.PI * 2); 
      canvasCtx.fill(); 
      canvasCtx.restore();
    }
  };

  drawFrequency();
}
