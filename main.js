//  VR CONTROLLER SETUP
import * as THREE from 'three';

import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { XRControllerModelFactory} from "three/examples/jsm/webxr/XRControllerModelFactory"



let controllers

const workingMatrix = new THREE.Matrix4() 
let workingVector = new THREE.Vector3()

let room 


    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x505050 );

    const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 1.6, 3 );


    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    renderer.xr.enabled = true

    document.body.appendChild( VRButton.createButton( renderer ) );

    renderer.setAnimationLoop(loop);

    controllers =  buildControllers()

    //aggiunge event listener per i controller
    controllers.forEach((controller)=>{

        controller.addEventListener("selectstart", ()=>{
            controller.children[0].scale.z = 10;
            controller.userData.selectPressed = true
        })

        controller.addEventListener("selectend", ()=>{
            controller.children[0].scale.z = 0;
            highlight.visible = false;
            controller.userData.selectPressed = false
        })
    })



    let radius = 0.08

    

    room = new THREE.LineSegments(
        new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
        new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
    );
    room.geometry.translate( 0, 3, 0)
    scene.add( room );

    let geometry = new THREE.IcosahedronGeometry(radius, 2)

    for(let i=0; i<200; i++){
        let obj = new THREE.Mesh(geometry,
            new THREE.MeshLambertMaterial({
                color: Math.random() * 0xFFFFFF
            }))
        obj.position.x = random(-2 , 2)
        obj.position.y = random(-2 , 2)
        obj.position.z = random(-2 , 2)

        room.add(obj)
    }

    const highlight = new THREE.Mesh(
        geometry, 
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })
    )

    highlight.scale.set(1.5, 1.5, 1.5)
    scene.add(highlight)

    scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

    const light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );

   
    

    
    window.addEventListener( 'resize', onWindowResize, false );




function buildControllers(){
    //get the device in use, and generete a model that match the aspect and functionality of your controller(the actions should be filled by you)
    const controllerModelFactory = new XRControllerModelFactory()

    //il ray target
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ])
    const laserRay = new THREE.Line(laserGeo)
    laserRay.name="laserRay"
    laserRay.scale.z = 0

    const controllers=[]
    for(let i=0; i<2; i++){

        //controller add the raytarget space 
        const controller = renderer.xr.getController(i)
        controller.add(laserRay.clone())
        controller.userData.selectPressed = false
        scene.add(controller)

        controllers.push(controller)


        //grip add the movement space
        const grip = renderer.xr.getControllerGrip(i)
        grip.add(controllerModelFactory.createControllerModel(grip))
        scene.add(grip)
    }

    return controllers
}

function handleController(controller){

  if(controller.userData.selectPressed){
    controller.children[0].scale.z = 10;
    
    const raycaster = new THREE.Raycaster()

    workingMatrix.identity().extractRotation(controller.matrixWorld)

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)

    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(workingMatrix)


    let intersects = raycaster.intersectObjects(room.children)

    if(intersects.length>0){
      if(intersects[0].object !== highlight){
        intersects[0].object.add(highlight)
        highlight.visible = true
        controller.children[0].scale.z = intersects[0].distance
      }  
      
    }
    else{
      highlight.visible = false
    }
  }
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function random( min, max ){
    return Math.random() * (max-min) + min;
}

//Render (Animation Loop)

function loop() {

    if(controllers){
        
        controllers.forEach((controller)=>{
            handleController(controller)
            
        })
    }

    renderer.render( scene, camera );

}


