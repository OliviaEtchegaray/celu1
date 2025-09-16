let video, faceapi, detections = [];
let stars = [];
let state = "face"; 
let timer = 0, msgIndex = 0;
let displayedText = "";
let glitchTimer = 0;

// cámara en transición
let camScale = 1.0, targetScale = 1.0; 
let camX = 0, camY = 0, targetX = 0, targetY = 0;

let sensorActive = true;

let message = `Decís que tus secretos son tuyos,
pero cada palabra que no compartís también deja huella.
El algoritmo interpreta lo que callás,
deduce lo que ocultás,
predice lo que nunca dijiste.

Las fotos que borraste,
los mensajes eliminados,
las confesiones que nunca escribiste,
son espejos invisibles que alguien, en algún servidor,
ya convirtió en estadística.

Creemos que elegimos qué mostrar y qué esconder,
pero lo íntimo se filtra en cada clic,
en cada pausa antes de enviar un mensaje,
en la respiración frente a la cámara encendida.

¿Dónde termina lo privado
cuando lo humano se convierte en dato?
¿A quién le pertenece tu intimidad
cuando se traduce en patrones,
en predicciones,
en capital para una máquina que no olvida?`;

function setup(){
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  const faceOptions = { withLandmarks: true, withExpressions: false, withDescriptors: false };
  faceapi = ml5.faceApi(video, faceOptions, () => {
    if(sensorActive) faceapi.detect(gotFaces);
  });

  textFont("monospace");
  textSize(28);
  fill(255,0,0);
  textAlign(LEFT,TOP);
  timer = millis();
}

function gotFaces(err, result){
  if(result) detections = result;
  if(sensorActive) faceapi.detect(gotFaces);
}

function draw(){
  background(state === "face" ? 0 : 10);

  // estrellas flotando en modo texto
  if(state === "text"){
    if(frameCount % 6 === 0) 
      stars.push({
        x:random(width), 
        y:random(height), 
        spikes:5, 
        outer:random(15,30), 
        inner:random(5,12),
        rot: random(TWO_PI),
        alpha: random(80,180)
      });
    if(stars.length > 200) stars.splice(0, stars.length-200);
    for(let s of stars){
      push();
      translate(s.x,s.y);
      rotate(s.rot+frameCount*0.01);
      drawStar(0,0,s.spikes,s.outer,s.inner,s.alpha);
      pop();
    }
  }

  camScale = lerp(camScale, targetScale, 0.05);
  camX = lerp(camX, targetX, 0.05);
  camY = lerp(camY, targetY, 0.05);

  // cámara espejo
  push();
  translate(width,0);
  scale(-1,1);
  translate(camX, camY);
  scale(camScale);
  tint(255,200); // leve transparencia para estilo glitch
  image(video,0,0,width,height);
  noTint();
  if(sensorActive && state === "face") drawFacePoints();
  pop();

  if(state === "face"){
    if(millis()-timer > 5000){ 
      state="text"; 
      msgIndex=0; 
      displayedText=""; 
      timer=millis(); 
      targetScale=0.25;
      targetX = width*0.65; 
      targetY = height*0.65; 
      sensorActive = false;
    }
  } else if(state === "text"){
    drawConfessionalText();
  }
}

// --- puntos rojos conectados ---
function drawFacePoints(){
  for(let d of detections){
    if(d.landmarks){
      let pts = d.landmarks.positions;
      fill(255,0,0);
      stroke(255,0,0);
      strokeWeight(2);
      for(let p of pts){
        ellipse(p._x, p._y, 6, 6);
      }
    }
  }
}

// --- texto confesionario ---
function drawConfessionalText(){
  textSize(22);
  fill(220);
  textAlign(LEFT,TOP);

  // efecto máquina de escribir
  if(msgIndex < message.length && millis()-timer > 25){
    displayedText += message[msgIndex];
    msgIndex++;
    timer = millis();
  }

  text(displayedText, 60, height*0.1, width*0.75, height*0.8);

  // firma abajo derecha
  textAlign(RIGHT, BOTTOM);
  textSize(20);
  fill(255,0,50);
  text("@estreiia_", width-20, height-20);

  // glitch final
  if(msgIndex >= message.length){
    if(millis()-timer > 2000){
      if(millis()-glitchTimer > 120){
        for(let i=0;i<15;i++) drawStar(random(width),random(height),5,25,10,random(80,200));
        glitchTimer=millis();
      }
      textAlign(CENTER,CENTER);
      textSize(36);
      fill(255,0,0);
      text("CONFESIONARIO ALGORÍTMICO",width/2,height/2);

      if(millis()-timer > 5000){
        state="face";
        timer=millis();
        targetScale=1.0;
        targetX=0;
        targetY=0;
        sensorActive = true;
      }
    }
  }
}

// --- estrellas ---
function drawStar(cx,cy,spikes,outer,inner,alpha=200){
  let angle=TWO_PI/spikes, halfAngle=angle/2;
  beginShape();
  noFill();
  stroke(255,0,0,alpha);
  strokeWeight(1.5);
  for(let a=0;a<TWO_PI;a+=angle){
    let sx=cx+cos(a)*outer, sy=cy+sin(a)*outer; vertex(sx,sy);
    sx=cx+cos(a+halfAngle)*inner; sy=cy+sin(a+halfAngle)*inner; vertex(sx,sy);
  }
  endShape(CLOSE);
}

// --- interacción ---
function mousePressed(){
  if(state==="face"){
    state="text"; msgIndex=0; displayedText=""; timer=millis();
    targetScale=0.25;
    targetX=width*0.65;
    targetY=height*0.65;
    sensorActive = false;
  }
  else if(state==="text"){
    state="face"; timer=millis();
    targetScale=1.0;
    targetX=0;
    targetY=0;
    sensorActive = true;
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}
