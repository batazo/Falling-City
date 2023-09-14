console.clear();
window.addEventListener("DOMContentLoaded", app);

function app() {
   let scene,
      camera,
      renderer,
      controls,
      GUI,
      textureLoader = new THREE.TextureLoader(),
      asphaltTexture,
      bldgTexture,
      bldgs = [],
      debris = [],
      debrisIdealSet = [],
      ambientLight,
      hemiLight,
      // user adjustable
      brightness = 2,
      fogDistance = 720,
      speed = 0.3,
      // should stay as is
      bldgColor = 0x242424,
      lightColor = 0x444444,
      skyColor = 0xaaaaaa,
      chunkSize = 128,
      chunksAtATime = 6,
      debrisPerChunk = 32,
      debrisMaxChunkAscend = 2,
      smBldgSize = 10,
      lgBldgSize = 12;

   class Building {
      constructor(x, y, z, width, height, depth, rotX = 0, rotY = 0, rotZ = 0) {
         this.geo = new THREE.BoxGeometry(width, height, depth);
         this.mat = new THREE.MeshLambertMaterial({
            color: bldgColor,
            map: bldgTexture,
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
            color: bldgColor,
         });
         this.mesh = new THREE.Mesh(this.geo, this.mat);
         this.mesh.position.set(x, y, z);
         this.mesh.rotation.set((rotX * Math.PI) / 180, (rotY * Math.PI) / 180, (rotZ * Math.PI) / 180);
         scene.add(this.mesh);
      }
   }

   const randomInt = (min, max) => {
         return Math.floor(Math.random() * (max - min)) + min;
      },
      randomAngle = () => {
         return Math.floor(Math.random() * 360);
      };

   var init = () => {
         // load textures
         asphaltTexture = textureLoader.load("https://bzozoo.github.io/Falling-City/assets/img/asphalt.jpg");
         bldgTexture = textureLoader.load("https://bzozoo.github.io/Falling-City/assets/img/building.jpg");

         // setup scene
         scene = new THREE.Scene();
         camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
         renderer = new THREE.WebGLRenderer();
         renderer.setClearColor(new THREE.Color(skyColor));
         renderer.setSize(window.innerWidth, window.innerHeight);
         renderer.shadowMap.enabled = true;

         // use randomized and fixed configuration of debris particles that can be repeated
         for (let d = 0; d < debrisPerChunk; ++d) {
            let halfChunk = chunkSize / 2,
               debrisParams = {
                  x: randomInt(-halfChunk, halfChunk),
                  y: randomInt(0, chunkSize * debrisMaxChunkAscend),
                  z: randomInt(-halfChunk, halfChunk),
               };
            debrisParams.size = Math.abs(debrisParams.x / halfChunk) * 6;
            debrisParams.height = debrisParams.size * randomInt(2, 3);

            debrisIdealSet.push({
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
         for (var cz = 1; cz > -chunksAtATime; --cz) {
            var zMove = chunkSize * cz;

            // surface
            var groundGeo = new THREE.PlaneGeometry(chunkSize, chunkSize),
               groundMat = new THREE.MeshLambertMaterial({
                  color: 0x969696,
                  map: asphaltTexture,
               });
            var ground = new THREE.Mesh(groundGeo, groundMat);
            ground.rotation.x = -0.5 * Math.PI;
            ground.position.set(0, 0, zMove);
            ground.receiveShadow = true;
            scene.add(ground);

            // buildings
            bldgs.push(
               // northwest
               new Building(-44, 4, -44 + zMove, lgBldgSize, 40, lgBldgSize, 0, 35, -85),
               new Building(-56, -2, -32 + zMove, smBldgSize, 52, smBldgSize, 15, 0, -12),
               new Building(-36, 0, -16 + zMove, lgBldgSize, 52, lgBldgSize, 0, 0, -10),
               new Building(-24, 0, -36 + zMove, smBldgSize, 52, smBldgSize, 0, 0, -10),
               new Building(-16, 0, -20 + zMove, smBldgSize, 52, smBldgSize, 30, 0, 0),

               // northeast
               new Building(24, -2, -44 + zMove, lgBldgSize, 44, lgBldgSize, -15, 0, 15),
               new Building(40, 0, -36 + zMove, smBldgSize, 48, smBldgSize, 0, 0, 15),
               new Building(48, 0, -36 + zMove, smBldgSize, 38, smBldgSize, 0, 0, 12),
               new Building(20, 0, -24 + zMove, smBldgSize, 40, smBldgSize, 0, 0, 15),
               new Building(32, 0, -24 + zMove, smBldgSize, 48, smBldgSize, 0, 0, 15),
               new Building(42, 0, -24 + zMove, smBldgSize, 38, smBldgSize, 0, 0, 15),
               new Building(48, 2, 1 + zMove, lgBldgSize, 32, lgBldgSize, 0, -25, 80),

               // southwest
               new Building(-48, 0, 16 + zMove, smBldgSize, 44, smBldgSize, 0, 0, -10),
               new Building(-32, 0, 16 + zMove, smBldgSize, 48, smBldgSize, 0, 0, -15),
               new Building(-16, -2, 16 + zMove, smBldgSize, 40, smBldgSize, -10, 0, -12),
               new Building(-32, 0, 32 + zMove, lgBldgSize, 48, lgBldgSize, 0, 0, 15),
               new Building(-48, 0, 48 + zMove, smBldgSize, 20, smBldgSize),
               new Building(-16, 0, 48 + zMove, smBldgSize, 36, smBldgSize, 0, 0, 15),
               new Building(-48, 19, 48 + zMove, smBldgSize, 20, smBldgSize, 0, 0, -15),

               // southeast
               new Building(30, 0, 52 + zMove, lgBldgSize, 48, lgBldgSize, 0, 0, 20),
               new Building(24, 0, 20 + zMove, smBldgSize, 40, smBldgSize, 0, 0, 5),
               new Building(40, 0, 24 + zMove, smBldgSize, 40, smBldgSize),
               new Building(24, 0, 32 + zMove, smBldgSize, 36, smBldgSize),
               new Building(52, 0, 12 + zMove, smBldgSize, 20, smBldgSize),
               new Building(36, 0, 32 + zMove, lgBldgSize, 48, lgBldgSize, 0, 0, -25)
            );

            // debris particles
            for (var fs of debrisIdealSet) debris.push(new Debris(fs.x, fs.y, fs.z + zMove, fs.width, fs.height, fs.depth, fs.rotX, fs.rotY, fs.rotZ));
         }

         // lighting
         ambientLight = new THREE.AmbientLight(lightColor);
         scene.add(ambientLight);

         hemiLight = new THREE.HemisphereLight(lightColor, 0xffffff, brightness);
         hemiLight.position.set(0, 8, 0);
         scene.add(hemiLight);

         // camera
         camera.position.set(0, 8, 0);

         // fog
         scene.fog = new THREE.Fog(skyColor, 0.01, fogDistance);

         // controls
         controls = {
            brightness: brightness,
            fogDistance: fogDistance,
            speed: speed,
            debrisPerChunk: debrisPerChunk,
            skyColor: skyColor,
         };
         GUI = new dat.GUI();
         GUI.add(controls, "brightness", 0, 5, 0.01)
            .name("Brightness")
            .onChange((e) => {
               brightness = controls.brightness;
               hemiLight.intensity = brightness;
            });
         GUI.add(controls, "fogDistance", 1, 720, 1)
            .name("Fog Distance")
            .onChange((e) => {
               fogDistance = controls.fogDistance;
               scene.fog.far = fogDistance;
            });
         GUI.add(controls, "speed", 0, 2, 0.01)
            .name("Speed")
            .onChange((e) => {
               speed = controls.speed;
            });
         GUI.add(controls, "debrisPerChunk", 0, 300, 0.01)
            .name("Debris Per Chunk")
            .onChange((e) => {
               debrisPerChunk = controls.debrisPerChunk;
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

         console.log(renderer);
         console.log(scene);
      },
      renderScene = () => {
         // shift camera
         camera.position.z -= camera.position.z < -chunkSize ? -chunkSize : speed;

         // rotate debris
         for (let d of debris) {
            if (d.mesh.position.y >= chunkSize * debrisMaxChunkAscend) d.mesh.position.y += -chunkSize * debrisMaxChunkAscend;
            else d.mesh.position.y += speed;

            let angleToAdd = (speed / chunkSize) * (Math.PI * 2);
            d.mesh.rotation.x += d.mesh.rotation.x >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
            d.mesh.rotation.y += d.mesh.rotation.y >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
            d.mesh.rotation.z += d.mesh.rotation.z >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
         }

         renderer.render(scene, camera);
         requestAnimationFrame(renderScene);
      },
      onResize = () => {
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
