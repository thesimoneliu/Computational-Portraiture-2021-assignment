/*

TF.js MODEL: handpose, faceapi, *facemesh
CONCEPT: a magic charm that generates natural particle power on the palm varied by emotion.

10/14/2021 by Simone Liu

*/


let handpose, facemesh;
let video;
let div;
let predictions_hand = [];
let predictions_face = [];
let keypoints_hand = [];
let keypoints_face = [];
let handModelReady = 0;
let facemeshModelReady = 0;
let faceApiModelReady = 0;
let keypoints_faceXmin, keypoints_faceXmax, keypoints_faceYmin, keypoints_faceYmax;
let age, gender, expression;
// let face_color = [194, 120, 63];

let fires = [];
let ices = [];
// let faceContour = [151, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338];
const MODEL_URL = 'https://rawcdn.githack.com/justadudewhohacks/face-api.js/a86f011d72124e5fb93e59d5c4ab98f699dd5c9c/weights/';

let exp, button, mode, bV; //buttonvalue
let expA = [];
let probA = [];
let r, g, b;
let img, imgX, imgY, imgZ;

let radios = document.forms["form"].elements["hand-input"];
for (let i = 0; i < radios.length; i++) {
    radios[i].onclick = function() {
        //alert(this.value);
        mode = this.value;
    }
}

button = document.getElementById('button').addEventListener("click", () => {
    bV = mode;
});

function preload() {
    img = loadImage("./assets/witchhat.png")
}

function setup() {

    createCanvas(640, 480);
    exp = createGraphics(width, height);

    textAlign(RIGHT);
    div = createDiv('<br>face-api models are loading...');

    video = createCapture(VIDEO, async() => {
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL)
        await faceapi.loadFaceLandmarkModel(MODEL_URL)
        await faceapi.loadFaceRecognitionModel(MODEL_URL)
        await faceapi.loadFaceExpressionModel(MODEL_URL)
        div.elt.innerHTML = '<br>model loaded!'
        getExpression();
        faceapimodelReady();
    })

    video.size(width, height);

    handpose = ml5.handpose(video, handmodelReady);
    handpose.on("predict", results => {
        predictions_hand = results;
    });

    facemesh = ml5.facemesh(video, facemeshmodelReady);
    facemesh.on("predict", results => {
        predictions_face = results;
    });

    // keypoints_faceXmax = 0;
    // keypoints_faceXmin = width;
    // keypoints_faceYmax = 0;
    // keypoints_faceYmin = height;

    imageMode(CENTER);
    video.hide();


}

// async function getExpressionAgeGender() {

//     detectionExpressionWithAge = await faceapi
//         .detectSingleFace(video.elt)
//         .withFaceLandmarks()
//         .withFaceExpressions()
//         .withAgeAndGender()
//         .withFaceDescriptor();

//     console.log(detectionExpressionWithAge);

//     if (!detectionExpressionWithAge) {
//         throw new Error(`no faces detected for ${label}`)
//     }
//     getExpressionAgeGender();
// }

async function getExpression() {
    expression = await faceapi.detectSingleFace(video.elt).withFaceExpressions();
    getExpression();
}

function handmodelReady() {
    console.log("Hand Model ready!");
    handModelReady = 1;
}

function facemeshmodelReady() {
    console.log("Face Model ready!");
    facemeshModelReady = 1;
}

function faceapimodelReady() {
    console.log("FaceAPI Model ready!");
    faceApiModelReady = 1;
}

function draw() {

    console.log(mode, bV);
    background(0);

    //if (faceModelReady == 1 && handModelReady == 1) {
    if (handModelReady == 1 && facemeshModelReady == 1) {

        push();

        scale(-1, 1);
        translate(-width, 0);
        image(video, width / 2, height / 2, width, height);

        // console.log(typeof(expression));
        // console.log(expression);
        if (typeof(expression) == "object") {
            const { expressions } = expression;

            expressions.asSortedArray().forEach((item) => {
                const { expression, probability } = item;
                //console.log(expression, probability);
                //console.log(typeof(expression), typeof(probability));
                expA.push(expression);
                //console.log(expA[0]);
                //exp.background('red');
                exp.clear();
                exp.fill(255);
                exp.textSize(10);
                exp.text(expA[0], 50, 30);
                // exp.text(`${expression}:`, 70, idx * 20 + 20)
                // const val = map(probability, 0, 1, 0, width / 2)
                // exp.rect(80, idx * 20 + 10, val, 15)

                detectEmo(expA[0]);
            })
            expA = [];
            probA = [];

            image(exp, width / 2, height / 2, width, height);

            detectHandKeypoints();
            detectFaceKeypoints();
            let m = map(imgZ, -5, 30, 1, 0.5);
            image(img, imgX, imgY - 80, 450 * m, 400 * m);

            // img.resize(450 * m, 400 * m);

            // if (keypoints_face.length > 0) {
            //     /* ----------------- Draw Face ----------------- */
            //     noStroke();
            //     fill(face_color[0], face_color[1], face_color[2]);
            //     beginShape();
            //     for (let j = 0; j < keypoints_face.length; j++) {
            //         const [x, y] = [keypoints_face[j][0], keypoints_face[j][1]];
            //         curveVertex(x, y);
            //         //console.log([x, y]);
            //     };
            //     endShape(CLOSE);
            // }

            if (keypoints_hand.length > 0) {

                let objX = (keypoints_hand[2][0] + keypoints_hand[17][0]) / 2;
                let objY = (keypoints_hand[2][1] + keypoints_hand[17][1]) / 2;

                for (let i = 0; i < 4; i++) {
                    let fire = new Fire(objX, objY, r, g, b);
                    fires.push(fire);
                }
                for (let i = 0; i < 5; i++) {
                    let ice = new Ice(objX, objY, r, g, b);
                    ices.push(ice);
                }
                switch (detectHand()) {

                    case "palm-outdown":
                        console.log("palm out-down");

                        //fire
                        for (let i = 0; i < fires.length; i++) {
                            if (fires[i].vanish()) {
                                fires.splice(i, 1);
                            }
                            fires[i].update();
                            fires[i].show();
                        }

                        console.log(fires.length);
                        break;

                    case "palm-outup":
                        console.log("palm out-up");

                        //ice
                        for (let i = 0; i < ices.length; i++) {
                            ices[i].update();
                            ices[i].show();
                        }
                        console.log(ices.length);
                        break;

                    case "no-show":
                        console.log("no show");
                        fires = [];
                        ices = [];
                        break;
                }

                //console.log("Generating fires")


            };

        };
    };

};




function detectHandKeypoints() {
    for (let i = 0; i < predictions_hand.length; i++) {
        const prediction = predictions_hand[i];

        keypoints_hand = [];

        for (let j = 0; j < prediction.landmarks.length; j += 1) {

            keypoints_hand.push(prediction.landmarks[j]);
            const keypoint = prediction.landmarks[j];
            // fill(0, 255, 0);
            // noStroke();
            // ellipse(keypoint[0], keypoint[1], 5);
            // textSize(14);
            // text(j, keypoint[0], keypoint[1]);
        }
        //console.log(keypoints_hand);
        // console.log(prediction);
    }
}

function detectHand() {

    // for (let i = 0; i < keypoints_hand.length; i++) { //Detect if handpoints go into the face shape
    //     const [pr, pg, pb, palpha] = get(keypoints_hand[i][0], keypoints_hand[i][1]);
    //     //console.log(pr, pg, pb);
    //     if (pr == face_color[0] && pg == face_color[1] && pg == face_color[2]) {
    //         return "no_hand";
    //     } else {

    if (bV == "left-handed") {

        /*  palm out-down: x 4<20; y 0>12
            palm out-up: x 4>20; y 0<12
            palm in-down: x 4>20 y 0>12
            palm in-up: x 4<20; y 0<12 */
        if (keypoints_hand[4][0] >= keypoints_hand[20][0] && keypoints_hand[0][1] <= keypoints_hand[12][1]) { //
            return "palm-outdown";
        } else if (keypoints_hand[4][0] >= keypoints_hand[20][0] && keypoints_hand[0][1] >= keypoints_hand[12][1]) {
            return "palm-outup";
        } else {
            return "no-show"
        }

    } else if (bV == "right-handed") {
        if (keypoints_hand[4][0] <= keypoints_hand[20][0] && keypoints_hand[0][1] <= keypoints_hand[12][1]) { //
            return "palm-outdown";
        } else if (keypoints_hand[4][0] <= keypoints_hand[20][0] && keypoints_hand[0][1] >= keypoints_hand[12][1]) {
            return "palm-outup";
        } else {
            return "no-show"
        }
    }


    //     }

    // }

}

function detectFaceKeypoints() {

    for (let i = 0; i < predictions_face.length; i++) {
        const prediction = predictions_face[i];

        console.log(prediction.scaledMesh[10][2]);
        imgX = prediction.scaledMesh[10][0];
        imgY = prediction.scaledMesh[10][1];
        imgZ = prediction.scaledMesh[10][2];
        return imgX, imgY, imgZ;

        // for (let j = 0; j < prediction.annotations.silhouette.length; j += 1) {
        //     keypoints_face.push(prediction.annotations.silhouette[j]);
        //     if (keypoints_faceXmin > keypoints_face[j][0]) { keypoints_faceXmin = keypoints_face[j][0] };
        //     if (keypoints_faceXmax < keypoints_face[j][0]) { keypoints_faceXmax = keypoints_face[j][0] };
        //     if (keypoints_faceYmin > keypoints_face[j][1]) { keypoints_faceYmin = keypoints_face[j][1] };
        //     if (keypoints_faceYmax < keypoints_face[j][1]) { keypoints_faceYmax = keypoints_face[j][1] };
        // }

        console.log(prediction);
        //console.log(prediction.annotations.silhouette);
    }
}

function detectEmo(emotion) {
    switch (emotion) {
        case "happy":
            return [r, g, b] = [245, 50, 198]; //pink
            break;
        case "sad":
            return [r, g, b] = [64, 100, 245]; //blue
            break;
        case "surprised":
            return [r, g, b] = [235, 231, 77]; //yellow
            break;
        case "neutral":
            return [r, g, b] = [245, 22, 0]; //red
            break;
        case "angry":
            return [r, g, b] = [77, 235, 26]; //green
            break;
    }
}

class Fire {

    constructor(x, y, r, g, b) {
        this.x = x;
        this.y = y;
        this.r = 30;
        this.vx = random(-1.2, 1.2);
        this.vy = random(-5, -1);
        this.alpha = 255;
        this.red = r;
        this.green = g;
        this.blue = b;
        this.col = sin(radians(frameCount) * 0.5) * 10;
        console.log(r, g, b);
    }

    show() {
        noStroke();
        // fill('rgba(255,255,255,this.alpha)');
        fill(this.red, this.green, this.blue, this.alpha);
        ellipse(this.x, this.y, this.r);
        // console.log(this.alpha);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.alpha > 200) {
            this.alpha -= 5;
        } else if (this.alpha <= 200 && this.alpha > 100) {
            this.alpha -= 7;
        } else if (this.alpha <= 100) {
            this.alpha -= 10;
        }
        //console.log(this.alpha);
        if (this.alpha < 160) {
            this.r -= 1;
        }
        this.red += this.col;
        this.green += this.col;
        this.blue += this.col;
    }
    vanish() {
        return this.alpha < 0;
    }
}


class Ice {

    constructor(x, y, r, g, b) {
        this.x = x;
        this.y = y;
        this.vx = sin(radians(frameCount)) * 30;
        this.vy = cos(radians(frameCount)) * 30;
        this.alpha = 255;
        this.red = r;
        this.green = g;
        this.blue = b;
        this.col = sin(radians(frameCount) * 0.5) * 10;
    }

    show() {
        noStroke();
        fill(this.red, this.green, this.blue, this.alpha);
        rect(this.x, this.y, 10, 20);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.alpha > 200) {
            this.alpha -= 5;
        } else if (this.alpha <= 200 && this.alpha > 100) {
            this.alpha -= 7;
        } else if (this.alpha <= 100) {
            this.alpha -= 10;
        }
        //console.log(this.alpha);
        if (this.alpha < 160) {
            this.r -= 1;
        }
        this.red += this.col;
        this.green += this.col;
        this.blue += this.col;
    }
    vanish() {
        return this.alpha < 0;
    }
}