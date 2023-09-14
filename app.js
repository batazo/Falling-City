console.clear();
window.addEventListener("DOMContentLoaded", app);

function app() {
   const config = {
      brightness: 1,
      fogDistance: 720,
      speed: 0.7,
      chunkSize: 128,
      chunksAtATime: 6,
      debrisPerChunk: 32,
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
      constructor(x, y, z, width, height, depth, rotX = 0, rotY = 0, rotZ = 0) {
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
      constructor(x, y, z, width, height, depth, rotX = 0, rotY = 0, rotZ = 0) {
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

   const init = () => {
      // setup scene
      renderer.setClearColor(new THREE.Color(config.colors.sky));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;

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

      // generate city
      for (let cz = 1; cz > -config.chunksAtATime; --cz) {
         const zMove = config.chunkSize * cz;

         // surface
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

         // buildings
         store.buildings.push(
            // northwest
            new Building(-44, 4, -44 + zMove, config.lgBldgSize, 40, config.lgBldgSize, 0, 35, -85),
            new Building(-56, -2, -32 + zMove, config.smBldgSize, 52, config.smBldgSize, 15, 0, -12),
            new Building(-36, 0, -16 + zMove, config.lgBldgSize, 52, config.lgBldgSize, 0, 0, -10),
            new Building(-24, 0, -36 + zMove, config.smBldgSize, 52, config.smBldgSize, 0, 0, -10),
            new Building(-16, 0, -20 + zMove, config.smBldgSize, 52, config.smBldgSize, 30, 0, 0),

            // northeast
            new Building(24, -2, -44 + zMove, config.lgBldgSize, 44, config.lgBldgSize, -15, 0, 15),
            new Building(40, 0, -36 + zMove, config.smBldgSize, 48, config.smBldgSize, 0, 0, 15),
            new Building(48, 0, -36 + zMove, config.smBldgSize, 38, config.smBldgSize, 0, 0, 12),
            new Building(20, 0, -24 + zMove, config.smBldgSize, 40, config.smBldgSize, 0, 0, 15),
            new Building(32, 0, -24 + zMove, config.smBldgSize, 48, config.smBldgSize, 0, 0, 15),
            new Building(42, 0, -24 + zMove, config.smBldgSize, 38, config.smBldgSize, 0, 0, 15),
            new Building(48, 2, 1 + zMove, config.lgBldgSize, 32, config.lgBldgSize, 0, -25, 80),

            // southwest
            new Building(-48, 0, 16 + zMove, config.smBldgSize, 44, config.smBldgSize, 0, 0, -10),
            new Building(-32, 0, 16 + zMove, config.smBldgSize, 48, config.smBldgSize, 0, 0, -15),
            new Building(-16, -2, 16 + zMove, config.smBldgSize, 40, config.smBldgSize, -10, 0, -12),
            new Building(-32, 0, 32 + zMove, config.lgBldgSize, 48, config.lgBldgSize, 0, 0, 15),
            new Building(-48, 0, 48 + zMove, config.smBldgSize, 20, config.smBldgSize),
            new Building(-16, 0, 48 + zMove, config.smBldgSize, 36, config.smBldgSize, 0, 0, 15),
            new Building(-48, 19, 48 + zMove, config.smBldgSize, 20, config.smBldgSize, 0, 0, -15),

            // southeast
            new Building(30, 0, 52 + zMove, config.lgBldgSize, 48, config.lgBldgSize, 0, 0, 20),
            new Building(24, 0, 20 + zMove, config.smBldgSize, 40, config.smBldgSize, 0, 0, 5),
            new Building(40, 0, 24 + zMove, config.smBldgSize, 40, config.smBldgSize),
            new Building(24, 0, 32 + zMove, config.smBldgSize, 36, config.smBldgSize),
            new Building(52, 0, 12 + zMove, config.smBldgSize, 20, config.smBldgSize),
            new Building(36, 0, 32 + zMove, config.lgBldgSize, 48, config.lgBldgSize, 0, 0, -25)
         );

         // debris particles
         for (let fs of store.debrisIdealSet) store.debris.push(new Debris(fs.x, fs.y, fs.z + zMove, fs.width, fs.height, fs.depth, fs.rotX, fs.rotY, fs.rotZ));
      }

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
            config.debrisPerChunk = controls.debrisPerChunk;
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
