const container = document.getElementById('container');
const canvas = document.getElementById('canvas1');
const file = document.getElementById('fileupload');
const image = document.getElementById('imgupload');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
let audioSource;
let analyser;
ctx.lineWidth = 3;
const sprite = new Image();
sprite.src = 'Deezer.png'
let useImage = false;

// boutons actifs
const buttons = document.querySelectorAll('.btn-list li');
buttons.forEach((button) => {
    button.addEventListener('click', function() {
        buttons.forEach((btn) => {
            btn.classList.remove('button-active');
        });
        this.classList.add('button-active');
    });
});

// Ajouter des écouteurs d'événements aux boutons
document.querySelector('.button-draw0').addEventListener('click', function() {
    drawVisualiser = drawVisualiser0;
});
document.querySelector('.button-draw1').addEventListener('click', function() {
    drawVisualiser = drawVisualiser1;
});
document.querySelector('.button-draw2').addEventListener('click', function() {
    drawVisualiser = drawVisualiser2;
});
document.querySelector('.button-draw3').addEventListener('click', function() {
    drawVisualiser = drawVisualiser3;
});
/*document.querySelector('.button-draw4').addEventListener('click', function() {
    drawVisualiser = drawVisualiser4;
}); */

// Définir la fonction drawVisualiser par défaut
let drawVisualiser = drawVisualiser0;

document.getElementById('imgupload').addEventListener('change', function() {
    const files = this.files;
    if (files.length > 0) {
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Veuillez insérer une image.');
            return;
        }
        sprite.src = URL.createObjectURL(file);
        useImage = true;
    }
});


container.addEventListener('click', function(){
    // let audio1 = new Audio();
    const audio1 = document.getElementById('audio1');
    audio1.src = ''
    const audioContext = new AudioContext();
    audio1.play();
    audioSource = audioContext.createMediaElementSource(audio1);
    analyser = audioContext.createAnalyser();
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = 5;
    let barHeight;
    let x;
    function animate(){
        x = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        analyser.getByteFrequencyData(dataArray);
        if (useImage) {
            drawVisualiserImage(bufferLength, x, barWidth, barHeight, dataArray);
        } else {
            drawVisualiser(bufferLength, x, barWidth, barHeight, dataArray);
        }
        requestAnimationFrame(animate);
    }
    animate();
});
file.addEventListener('change', function(){
    const files = this.files;
    if (files.length > 0) {
        const file = files[0];
        if (!file.type.startsWith('audio/')) {
            alert('Veuillez insérer un fichier audio.');
            return;
        }
    const audio1 = document.getElementById('audio1');
    audio1.src = URL.createObjectURL(files[0]);
    audio1.load();
    audio1.play();
    audioSource = audioContext.createMediaElementSource(audio1);
    analyser = audioContext.createAnalyser();
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = 15;
    let barHeight;
    let x;
    function animate(){
        x = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        analyser.getByteFrequencyData(dataArray);
        if (useImage) {
            drawVisualiserImage(bufferLength, x, barWidth, barHeight, dataArray);
        } else {
            drawVisualiser(bufferLength, x, barWidth, barHeight, dataArray);
        }
        requestAnimationFrame(animate);
    }
    animate();
}
});

function drawVisualiser3(bufferLength, x, barWidth, barHeight, dataArray){
    for (let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 1.4;
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(i * bufferLength * -4.001);
        const hue = 250 + i * 2;
        ctx.fillStyle = 'hsl(' + hue + ',100%, 50%)';
        ctx.beginPath();
        ctx.arc(0, barHeight, barHeight/10, 0, Math.PI * 2); 
        ctx.arc(0, barHeight/1.5, barHeight/20, 0, Math.PI * 2); 
        ctx.arc(0, barHeight/2, barHeight/30, 0, Math.PI * 2); 
        ctx.arc(0, barHeight/3, barHeight/40, 0, Math.PI * 2); 
        ctx.fill(); 
        x += barWidth;
        ctx.restore();
    }
}

/*function drawVisualiser4(bufferLength, x, barWidth, barHeight, dataArray){
    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 2; 
        ctx.save(); 
        ctx.translate(canvas.width/2, canvas.height/2); 
        ctx.rotate(i* 3.2); 
        const hue = 150 + i * 0.1; 
        ctx.strokeStyle = 'hsl(' + hue + ',100 % ,' + barHeight/3 + '%)';
         ctx.beginPath(); 
         ctx.moveTo(0, 0); 
         ctx.lineTo(0, barHeight); 
         ctx.stroke(); 
        // x += barWidth; 

         if (i > bufferLength * 0.6) { 
            ctx.beginPath(); 
            ctx.arc(0, 0, barHeight/1.5, 0, Math.PI * 2); 
            ctx.stroke(); 
         }

        ctx.restore();
      }
}*/

function drawVisualiser2(bufferLength, x, barWidth, barHeight, dataArray){
    for (let i = 0; i < bufferLength; i++) {
          
          barHeight = dataArray[i] * 1.5;
          ctx.save();
          let x = Math.sin(i * Math.PI / 180) + 100;
          let y = Math.cos(i * Math.PI / 180) + 100;
          ctx.translate(canvas.width/2 + x, canvas.height/2)
          ctx.rotate( i +  Math.PI * 2/bufferLength);

          const hue = i * 0.6 + 200;
          ctx.fillStyle = 'hsl(' + hue + ',100%, 50%)';
          ctx.strokeStyle = 'hsl(' + hue + ',100%, 50%)';

          ctx.shadowOffsetX = 10;
          ctx.shadowOffsetY = 10;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(0,0,0,1)';

          ctx.globalCompositeOperation='source-over';

          // line
          ctx.lineWidth = barHeight/5;
          ctx.beginPath();
          ctx.moveTo(x,y);
          ctx.lineTo(x, y - barHeight);
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.closePath();
        
          // circle
          ctx.beginPath();
          ctx.arc(0, y + barHeight, barHeight/10, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'hsl(1, 100%, ' + i/4 + '%)';
          ctx.stroke();

          ctx.restore();
          x += barWidth;
        }
}

function drawVisualiser0(bufferLength, x, barWidth, barHeight, dataArray){
    for (let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 1.2;
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(i + Math.PI * 4/ bufferLength);
        const hue = 240 + i * 1.5;
        ctx.lineWidth = barHeight/10;
        ctx.strokeStyle = 'hsl(' + hue + ',100%, 50%)';
        ctx.fillStyle = 'hsl(' + hue + ',100%, 50%)';;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(0, barHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, barHeight + barHeight/5 , barHeight/20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, barHeight + barHeight/2, barHeight/10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
function drawVisualiser1(bufferLength, x, barWidth, barHeight, dataArray){
    for (let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 1.2;
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(i * Math.PI * 4/ bufferLength);
        const hue = 240 + i * 1.5;
        ctx.lineWidth = barHeight/10;
        ctx.strokeStyle = 'hsl(' + hue + ',100%, 50%)';
        ctx.fillStyle = 'hsl(' + hue + ',100%, 50%)';;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(0, barHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, barHeight + barHeight/5 , barHeight/20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, barHeight + barHeight/2, barHeight/10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
function drawVisualiserImage(bufferLength, x, barWidth, barHeight, dataArray){
        
    for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * 1.5;
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(i * 2)
            ctx.fillRect(0, 0, barWidth, 15);
          ctx.drawImage(sprite, 0, barHeight, barHeight/2.5, barHeight/2.5);
          x += barWidth;
           ctx.restore();
    }
    let size = dataArray[15] * 1.5 > 100 ? dataArray[15] : 100;
    ctx.drawImage(sprite, canvas.width/2 - size/2, canvas.height/2 - size/2, size, size);   
} 