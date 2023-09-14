console.clear();
window.addEventListener("DOMContentLoaded", app);

function app() {
   const config = {
      brightness: 1,
      fogDistance: 720,
      speed: 0.7,
      chunkSize: 128,
      chunksAtATime: 6,
      debrisPerChunk: 150,
      debrisMaxChunkAscend: 2,
      smBldgSize: 10,
      lgBldgSize: 12,
      colors: Object.freeze({
         bldg: 0x242424,
         light: 0x444444,
         sky: 0xaaaaaa,
      }),
   };

   const store = {
      buildings: [],
      debris: [],
      debrisIdealSet: [],
   };

   const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000),
      renderer = new THREE.WebGLRenderer(),
      textureLoader = new THREE.TextureLoader(),
      ambientLight = new THREE.AmbientLight(config.colors.light),
      hemiLight = new THREE.HemisphereLight(config.colors.lightColor, 0xffffff, config.brightness);

   class Building {
      constructor({ x, y, z, width, height, depth, rotX = 0, rotY = 0, rotZ = 0 }) {
         this.geo = new THREE.BoxGeometry(width, height, depth);
         this.mat = new THREE.MeshLambertMaterial({
            color: config.colors.bldg,
            map: textureLoader.load("https://bzozoo.github.io/Falling-City/assets/img/building.jpg"),
         });

         this.mat.map.wrapS = THREE.RepeatWrapping;
         this.mat.map.wrapT = THREE.RepeatWrapping;
         this.mat.map.repeat.set(1, height / width > 2 ? 3 : 2);

         const halfHeight = height / 2,
            isRotated = rotX != 0 || rotY != 0 || rotZ != 0;

         this.mesh = new THREE.Mesh(this.geo, this.mat);
         this.mesh.position.set(x, isRotated ? y : y + halfHeight, z);

         if (isRotated) {
            this.geo.translate(0, halfHeight, 0);
            this.mesh.rotation.x = (rotX * Math.PI) / 180;
            this.mesh.rotation.y = (rotY * Math.PI) / 180;
            this.mesh.rotation.z = (rotZ * Math.PI) / 180;
         }
         this.mesh.castShadow = true;

         scene.add(this.mesh);
      }
   }

   class Debris {
      constructor({ x, y, z, width, height, depth, rotX = 0, rotY = 0, rotZ = 0 }) {
         this.geo = new THREE.BoxGeometry(width, height, depth);
         this.mat = new THREE.MeshLambertMaterial({
            color: config.colors.bldg,
         });
         this.mesh = new THREE.Mesh(this.geo, this.mat);
         this.mesh.position.set(x, y, z);
         this.mesh.rotation.set((rotX * Math.PI) / 180, (rotY * Math.PI) / 180, (rotZ * Math.PI) / 180);
         scene.add(this.mesh);
      }
   }

   const randomInt = (min, max) => {
      return Math.floor(Math.random() * (max - min)) + min;
   };

   const randomAngle = () => {
      return Math.floor(Math.random() * 360);
   };

   const debrisRemove = () => {
      for (let d of store.debris) {
         scene.remove(d.mesh);
      }
      store.debris = [];
   };

   const groundCreate = () => {
      for (let cz = 1; cz > -config.chunksAtATime; --cz) {
         const zMove = config.chunkSize * cz;
         const groundGeo = new THREE.PlaneGeometry(config.chunkSize, config.chunkSize);
         const groundMat = new THREE.MeshLambertMaterial({
            color: 0x969696,
            map: textureLoader.load("https://bzozoo.github.io/Falling-City/assets/img/asphalt.jpg"),
         });

         const ground = new THREE.Mesh(groundGeo, groundMat);
         ground.rotation.x = -0.5 * Math.PI;
         ground.position.set(0, 0, zMove);
         ground.receiveShadow = true;
         scene.add(ground);
      }
   };

   const buildingCreate = () => {
      for (let cz = 1; cz > -config.chunksAtATime; --cz) {
         const zMove = config.chunkSize * cz;
         // buildings
         store.buildings.push(
            // northwest
            new Building({ x: -44, y: 4, z: -44 + zMove, width: config.lgBldgSize, height: 40, depth: config.lgBldgSize, rotX: 0, rotY: 35, rotZ: -85 }),
            new Building({ x: -56, y: -2, z: -32 + zMove, width: config.smBldgSize, height: 52, depth: config.smBldgSize, rotX: 15, rotY: 0, rotZ: -12 }),
            new Building({ x: -36, y: 0, z: -16 + zMove, width: config.lgBldgSize, height: 52, depth: config.lgBldgSize, rotX: 0, rotY: 0, rotZ: -10 }),
            new Building({ x: -24, y: 0, z: -36 + zMove, width: config.smBldgSize, height: 52, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: -10 }),
            new Building({ x: -16, y: 0, z: -20 + zMove, width: config.smBldgSize, height: 52, depth: config.smBldgSize, rotX: 30, rotY: 0, rotZ: 0 }),

            // northeast
            new Building({ x: 24, y: -2, z: -44 + zMove, width: config.lgBldgSize, height: 44, depth: config.lgBldgSize, rotX: -15, rotY: 0, rotZ: 15 }),
            new Building({ x: 40, y: 0, z: -36 + zMove, width: config.smBldgSize, height: 48, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 15 }),
            new Building({ x: 48, y: 0, z: -36 + zMove, width: config.smBldgSize, height: 38, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 12 }),
            new Building({ x: 20, y: 0, z: -24 + zMove, width: config.smBldgSize, height: 40, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 15 }),
            new Building({ x: 32, y: 0, z: -24 + zMove, width: config.smBldgSize, height: 48, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 15 }),
            new Building({ x: 42, y: 0, z: -24 + zMove, width: config.smBldgSize, height: 38, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 15 }),
            new Building({ x: 48, y: 2, z: 1 + zMove, width: config.lgBldgSize, height: 32, depth: config.lgBldgSize, rotX: 0, rotY: -25, rotZ: 80 }),

            // southwest
            new Building({ x: -48, y: 0, z: 16 + zMove, width: config.smBldgSize, height: 44, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: -10 }),
            new Building({ x: -32, y: 0, z: 16 + zMove, width: config.smBldgSize, height: 48, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: -15 }),
            new Building({ x: -16, y: -2, z: 16 + zMove, width: config.smBldgSize, height: 40, depth: config.smBldgSize, rotX: -10, rotY: 0, rotZ: -12 }),
            new Building({ x: -32, y: 0, z: 32 + zMove, width: config.lgBldgSize, height: 48, depth: config.lgBldgSize, rotX: 0, rotY: 0, rotZ: 15 }),
            new Building({ x: -48, y: 0, z: 48 + zMove, width: config.smBldgSize, height: 20, depth: config.smBldgSize }),
            new Building({ x: -16, y: 0, z: 48 + zMove, width: config.smBldgSize, height: 36, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 15 }),
            new Building({ x: -48, y: 19, z: 48 + zMove, width: config.smBldgSize, height: 20, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: -15 }),

            // southeast
            new Building({ x: 30, y: 0, z: 52 + zMove, width: config.lgBldgSize, height: 48, depth: config.lgBldgSize, rotX: 0, rotY: 0, rotZ: 20 }),
            new Building({ x: 24, y: 0, z: 20 + zMove, width: config.smBldgSize, height: 40, depth: config.smBldgSize, rotX: 0, rotY: 0, rotZ: 5 }),
            new Building({ x: 40, y: 0, z: 24 + zMove, width: config.smBldgSize, height: 40, depth: config.smBldgSize }),
            new Building({ x: 24, y: 0, z: 32 + zMove, width: config.smBldgSize, height: 36, depth: config.smBldgSize }),
            new Building({ x: 52, y: 0, z: 12 + zMove, width: config.smBldgSize, height: 20, depth: config.smBldgSize }),
            new Building({ x: 36, y: 0, z: 32 + zMove, width: config.lgBldgSize, height: 48, depth: config.lgBldgSize, rotX: 0, rotY: 0, rotZ: -25 })
         );
      }
   };

   const debrisIdealSetCreate = () => {
      store.debrisIdealSet = [];
      // use randomized and fixed configuration of debris particles that can be repeated
      for (let d = 0; d < config.debrisPerChunk; ++d) {
         let halfChunk = config.chunkSize / 2,
            debrisParams = {
               x: randomInt(-halfChunk, halfChunk),
               y: randomInt(0, config.chunkSize * config.debrisMaxChunkAscend),
               z: randomInt(-halfChunk, halfChunk),
            };
         debrisParams.size = Math.abs(debrisParams.x / halfChunk) * 6;
         debrisParams.height = debrisParams.size * randomInt(2, 3);

         store.debrisIdealSet.push({
            x: debrisParams.x,
            y: debrisParams.y,
            z: debrisParams.z,

            width: debrisParams.size,
            height: debrisParams.height,
            depth: debrisParams.size,

            rotX: randomAngle(),
            rotY: randomAngle(),
            rotZ: randomAngle(),
         });
      }
   };

   const debrisCreate = () => {
      debrisRemove();
      for (let cz = 1; cz > -config.chunksAtATime; --cz) {
         const zMove = config.chunkSize * cz;
         for (let fs of store.debrisIdealSet)
            store.debris.push(
               new Debris({
                  x: fs.x,
                  y: fs.y,
                  z: fs.z + zMove,
                  width: fs.width,
                  height: fs.height,
                  depth: fs.depth,
                  rotX: fs.rotX,
                  rotY: fs.rotY,
                  rotZ: fs.rotZ,
               })
            );
      }
   };

   const debrisUpdate = () => {
      debrisIdealSetCreate();
      debrisCreate();
   };

   const generateCity = () => {
      debrisUpdate();
      groundCreate();
      buildingCreate();
   };

   const init = () => {
      // generate city
      generateCity();
      // setup scene
      renderer.setClearColor(new THREE.Color(config.colors.sky));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;

      // lighting
      scene.add(ambientLight);
      hemiLight.position.set(0, 8, 0);
      scene.add(hemiLight);

      // camera
      camera.position.set(0, 8, 0);

      // fog
      scene.fog = new THREE.Fog(config.colors.sky, 0.01, config.fogDistance);

      // controls
      controls = {
         brightness: config.brightness,
         fogDistance: config.fogDistance,
         speed: config.speed,
         debrisPerChunk: config.debrisPerChunk,
         skyColor: config.colors.sky,
      };

      const GUI = new dat.GUI();
      GUI.add(controls, "brightness", 0, 5, 0.01)
         .name("Brightness")
         .onChange((e) => {
            config.brightness = controls.brightness;
            hemiLight.intensity = config.brightness;
         });
      GUI.add(controls, "fogDistance", 1, 720, 1)
         .name("Fog Distance")
         .onChange((e) => {
            config.fogDistance = controls.fogDistance;
            scene.fog.far = config.fogDistance;
         });
      GUI.add(controls, "speed", 0, 2, 0.01)
         .name("Speed")
         .onChange((e) => {
            config.speed = controls.speed;
         });
      GUI.add(controls, "debrisPerChunk", 0, 300, 0.01)
         .name("Debris Per Chunk")
         .onChange((e) => {
            console.log("Debris");
            config.debrisPerChunk = controls.debrisPerChunk;
            debrisUpdate();
         });
      GUI.addColor(controls, "skyColor")
         .name("Sky Color")
         .onChange((color) => {
            // Vagy az egész scene bg vagy a render setClearColor
            //scene.background = new THREE.Color(color);
            renderer.setClearColor(new THREE.Color(color));
            scene.fog.color = new THREE.Color(color);
         });

      // render
      document.body.appendChild(renderer.domElement);
   };

   const renderScene = () => {
      // shift camera
      camera.position.z -= camera.position.z < -config.chunkSize ? -config.chunkSize : config.speed;

      // rotate debris
      for (let d of store.debris) {
         if (d.mesh.position.y >= config.chunkSize * config.debrisMaxChunkAscend) d.mesh.position.y += -config.chunkSize * config.debrisMaxChunkAscend;
         else d.mesh.position.y += config.speed;

         let angleToAdd = (config.speed / config.chunkSize) * (Math.PI * 2);
         d.mesh.rotation.x += d.mesh.rotation.x >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
         d.mesh.rotation.y += d.mesh.rotation.y >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
         d.mesh.rotation.z += d.mesh.rotation.z >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(renderScene);
   };

   const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
   };

   function letsGo() {
      init();
      renderScene();
   }

   letsGo();

   window.addEventListener("resize", onResize);
}
