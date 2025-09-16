let video;
let poseNet;
let poses = [];
let smoothPoses = [];
let useFrontCamera = true;

const privacyText = [
  "¿Dónde termina lo privado",
  "cuando lo humano se convierte en dato?",
  "¿A quién le pertenece tu intimidad",
  "cuando se traduce en patrones,",
  "en predicciones,",
  "en capital para una máquina que no olvida?"
];

let headOverlays = []; // para almacenar la estrella + palabra por cabeza

function setup() {
  createCanvas(windowWidth, windowHeight);
  initVideo();

  poseNet = ml5.poseNet(video, () => console.log("PoseNet listo"));
  poseNet.on('pose', (results) => {
    poses = results;
    if (smoothPoses.length === 0 && poses.length > 0) {
      for (let i = 0; i < poses.length; i++) {
        let smPose = poses[i].pose.keypoints.map(kp => ({x: kp.position.x, y: kp.position.y}));
        smoothPoses.push(smPose);
      }
    }
  });

  textFont('Arial');
  textSize(16);
  fill(255, 0, 0);

  // Botón para rotar cámara
  const button = createButton('Rotar cámara');
  button.position(width - 140, 10);
  button.style('font-size','14px');
  button.mousePressed(toggleCamera);
}

function initVideo() {
  if(video) video.remove();
  video = createCapture({
    video: { facingMode: useFrontCamera ? "user" : "environment" }
  }, () => console.log("Video listo"));
  video.size(windowWidth, windowHeight);
  video.hide();
}

function toggleCamera() {
  useFrontCamera = !useFrontCamera;
  initVideo();
}

function draw() {
  background(0, 50);

  // espejo solo en frontal
  push();
  translate(width, 0);
  scale(useFrontCamera ? -1 : 1, 1);
  tint(255, 50);
  image(video, 0, 0, width, height);

  const partesImportantes = ['nose','leftShoulder','rightShoulder',
                            'leftWrist','rightWrist','leftHip','rightHip','leftAnkle','rightAnkle'];

  headOverlays = []; // resetear overlays cada frame

  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;

    if (!smoothPoses[i]) {
      smoothPoses[i] = pose.keypoints.map(kp => ({x: kp.position.x, y: kp.position.y}));
    }

    for (let j = 0; j < pose.keypoints.length; j++) {
      let kp = pose.keypoints[j];
      if (!partesImportantes.includes(kp.part)) continue;

      smoothPoses[i][j].x = lerp(smoothPoses[i][j].x, kp.position.x, 0.4);
      smoothPoses[i][j].y = lerp(smoothPoses[i][j].y, kp.position.y, 0.4);

      if (kp.score > 0.2) {
        fill(255,0,0);
        noStroke();
        ellipse(smoothPoses[i][j].x, smoothPoses[i][j].y, 12,12);

        // Si es cámara trasera y la parte es cabeza (nose)
        if(!useFrontCamera && kp.part === 'nose'){
          let leftShoulder = pose.keypoints.find(k => k.part==='leftShoulder');
          let rightShoulder = pose.keypoints.find(k => k.part==='rightShoulder');
          let shoulderDist = dist(
            leftShoulder.position.x, leftShoulder.position.y,
            rightShoulder.position.x, rightShoulder.position.y
          );
          let offsetY = shoulderDist * 0.9;

          // Guardar overlay para dibujar estrella + palabra
          headOverlays.push({
            x: smoothPoses[i][j].x,
            y: smoothPoses[i][j].y - offsetY,
            word: random(privacyText.join(" ").split(" "))
          });
        }

        // Texto tracking siempre legible
        push();
        scale(useFrontCamera ? -1 : 1, 1);
        text(`${traducirParte(kp.part)} (${Math.floor(smoothPoses[i][j].x)}, ${Math.floor(smoothPoses[i][j].y)})`,
             -smoothPoses[i][j].x - 5, smoothPoses[i][j].y - 5);
        pop();
      }
    }

    // dibujar líneas del cuerpo
    stroke(255,0,0);
    strokeWeight(2);
    const linePairs = [
      ['nose','leftShoulder'], ['nose','rightShoulder'],
      ['leftShoulder','leftWrist'], ['rightShoulder','rightWrist'],
      ['leftHip','leftAnkle'], ['rightHip','rightAnkle']
    ];

    for(let [aName,bName] of linePairs){
      let a = pose.keypoints.findIndex(kp => kp.part===aName);
      let b = pose.keypoints.findIndex(kp => kp.part===bName);
      if(pose.keypoints[a].score>0.2 && pose.keypoints[b].score>0.2){
        line(smoothPoses[i][a].x, smoothPoses[i][a].y, smoothPoses[i][b].x, smoothPoses[i][b].y);
      }
    }
  }

  // dibujar overlay de cabeza solo una estrella grande + palabra
  for(let o of headOverlays){
    drawStar(o.x, o.y, 20, 60, 5);
    fill(255,0,0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(o.word, o.x, o.y);
  }

  pop();

  // etiqueta inferior derecha
  fill(255,0,0);
  textSize(16);
  textAlign(RIGHT, BOTTOM);
  text("@estreiia_", width-10, height-10);

  // texto conceptual arriba en trasera
  if(!useFrontCamera){
    fill(255,0,0);
    textSize(18);
    textAlign(CENTER, CENTER);
    text(privacyText.join("\n"), width/2, 50, width-40);
  }
}

function drawStar(x, y, radius1, radius2, npoints){
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for(let a=0;a<TWO_PI;a+=angle){
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function traducirParte(parte){
  switch(parte){
    case 'nose': return 'Cabeza';
    case 'leftShoulder': return 'Brazo Izquierdo';
    case 'rightShoulder': return 'Brazo Derecho';
    case 'leftWrist': return 'Mano Izquierda';
    case 'rightWrist': return 'Mano Derecha';
    case 'leftHip': return 'Pierna Izquierda';
    case 'rightHip': return 'Pierna Derecha';
    case 'leftAnkle': return 'Pie Izquierdo';
    case 'rightAnkle': return 'Pie Derecho';
    default: return parte;
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}
