class Objs{
  constructor(webgl){
    this.webgl = webgl;
    this.controls = this.webgl.controls;

    this.objSize = 25;
    this.textureSize = 64;

    this.objNum = this.textureSize * this.textureSize;

    this.range = 180;

    this.setLight();


    this.colorPallete = [
      0x15b7b9,
      0xebfffa,
      0xc6fce5,
      0x00fff0,
    ];

    this.sim = new Simulation(this.webgl, this.textureSize);


    this.init();
  }

  init(){
    console.log('init --- objs');

    this.originalG = 
    new THREE.CylinderBufferGeometry( this.objSize * 1.5, this.objSize * 1.5, this.objSize * 0.2, 32 );
    // new THREE.CylinderBufferGeometry( this.objSize * 1.2, this.objSize * 1.2, this.objSize * 0.2, 3 );
    // new THREE.BoxBufferGeometry(this.objSize * 2.0, this.objSize * 2.0, this.objSize * 0.2);
    this.instanceG = new THREE.InstancedBufferGeometry();

    // 頂点
    var vertices = this.originalG.attributes.position.clone();
    this.instanceG.addAttribute('position', vertices);

    var normals = this.originalG.attributes.normal.clone();
    this.instanceG.addAttribute("normal", normals);

    // uv
    var uvs = this.originalG.attributes.uv.clone();
    this.instanceG.addAttribute('uv', uvs);

    // index
    if(this.originalG.index){
      var indices = this.originalG.index.clone();
      this.instanceG.setIndex(indices);
    }
    

    var nums = new THREE.InstancedBufferAttribute(new Float32Array(this.objNum * 1), 1, 1);
    var randoms = new THREE.InstancedBufferAttribute(new Float32Array(this.objNum * 1), 1, 1);
    var colors = new THREE.InstancedBufferAttribute(new Float32Array(this.objNum * 3), 3, 1);

    for(let i = 0; i < this.objNum; i++){
      nums.setX(i, i);

      randoms.setX(i, Math.random());

      const hex = this.colorPallete[Math.floor(this.colorPallete.length * Math.random())];

      const color = new THREE.Color(hex);
      colors.setXYZ(i, color.r, color.g, color.b);
    }

    this.instanceG.addAttribute('aNum', nums);
    this.instanceG.addAttribute('aRandom', randoms);
    this.instanceG.addAttribute('aColor', colors);

    this.uniforms = {
      isFog: {type: 'i', value: this.controls.props.fog},
      // isHemiLight: {type: 'i', value: this.controls.props.hemisphereLight},
      isShadowmap: {type: 'i', value: this.controls.props.shadowmap},


      uTick: {type: 'f', value: 0},
      uTileWidth: {type: 'f', value: this.objSize},
      uDirLightPos: {type: 'v3', value: this.light.position},

      posMap: { type: 't', value: this.sim.gpuCompute.getCurrentRenderTarget(this.sim.pos).texture },
      velMap: { type: 't', value: this.sim.gpuCompute.getCurrentRenderTarget(this.sim.vel).texture },
      uSize: { type:'f', value: this.textureSize},

      uRange: {type: 'f', value: this.range},

      uEyePosition: {type: 'v3', value: this.webgl.camera.position},
      uFogStart: {type: 'f', value: 0.5},
      uFogEnd: {type: 'f', value: 1.0},
      uFogColor: {type: 'v3', value: new THREE.Color(this.controls.props.bgColor)},

      shadowMap: { type: 't', value: this.light.shadow.map.texture },
      shadowMapSize: {type: 'v2', value: this.light.shadow.mapSize},
      shadowP: { type: 'm4', value: this.shadowCamera.projectionMatrix},
      shadowV: { type: 'm4', value: this.shadowCamera.matrixWorldInverse}
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader: this.webgl.vertShader[0],
      fragmentShader: this.webgl.fragShader[0],
      uniforms: this.uniforms,
      side: THREE.FrontSide,
    });

    console.log(this.webgl.camera.position);

    this.shadowMaterial = new THREE.ShaderMaterial({
      vertexShader: this.webgl.vertShader[0],
      fragmentShader: this.webgl.fragShader[1],
      uniforms: this.uniforms,
      side: THREE.FrontSide,
    });

    this.mesh = new THREE.Mesh(this.instanceG, this.material);
    this.webgl.scene.add(this.mesh);

  }


  setColor(){
    const saturation_min = 80;
    const saturation_ran = 5;
    const light_min = 60;
    const light_ran = 5;

    const hue = Math.round(360 * Math.random());
    const saturation = Math.round(saturation_min + saturation_ran * Math.random());
    const light = Math.round(light_min + light_ran * Math.random()); 

    return 'hsl(' + hue + ',' + saturation + '%,' + light + '%)';
  }


  setLight(){
    this.light = new THREE.DirectionalLight( 0xffffff );
    this.light.position.set( this.range * 6.0, this.range * 2.8, this.range * 2.4 );
    this.light.castShadow = true;

    const width = this.range * 14.0;
    this.light.shadow = new THREE.LightShadow( new THREE.OrthographicCamera( width / - 2, width / 2, width / 2, width / - 2, 1, width ) );
    
    this.shadowCamera = this.light.shadow.camera;
    this.shadowCamera.position.copy(this.light.position);
    this.shadowCamera.lookAt(this.webgl.scene.position);


    if(this.light.shadow.map === null){
      this.light.shadow.mapSize.x = 2048;
      this.light.shadow.mapSize.y = 2048;

      var pars = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };

      this.light.shadow.map = new THREE.WebGLRenderTarget( this.light.shadow.mapSize.x, this.light.shadow.mapSize.y, pars );
    }

    // this.webgl.scene.add( new THREE.CameraHelper( this.shadowCamera ) );
    // this.initShadowMapViewers();
  }

  initShadowMapViewers(){
    this.dirLightShadowMapViewer = new THREE.ShadowMapViewer( this.light );
    this.dirLightShadowMapViewer.position.x = 10;
    this.dirLightShadowMapViewer.position.y = 10;
    this.dirLightShadowMapViewer.size.width = 256;
    this.dirLightShadowMapViewer.size.height = 256;
    this.dirLightShadowMapViewer.update(); //Required when setting position or size directly
  }


  render(time, delta){

    this.sim.render(time, delta);

    this.uniforms.uEyePosition.value = this.webgl.camera.position;

    this.uniforms.uTick.value = time;

    this.uniforms.posMap.value = this.sim.gpuCompute.getCurrentRenderTarget(this.sim.pos).texture;
    this.uniforms.velMap.value = this.sim.gpuCompute.getCurrentRenderTarget(this.sim.vel).texture;

    this.mesh.material = this.shadowMaterial;
    this.webgl.renderer.render( this.webgl.scene, this.shadowCamera, this.light.shadow.map);

    this.mesh.material = this.material;
    this.webgl.renderer.render( this.webgl.scene, this.webgl.camera );

    if(this.dirLightShadowMapViewer){
      this.dirLightShadowMapViewer.render( this.webgl.renderer );

    }

  }
}