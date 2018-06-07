class Controls{
  constructor(webgl){
    this.webgl = webgl;

    this.props = {
      bgColor: 0xfaf10f, // 0x0d1b4c / 0xd5fffb / 0xfaf10f / 0xff2e63
      // hemisphereLight: true,
      shadowmap: true,
      fog: true
    };
  }

  init(){
    this.objs = this.webgl.objs;

    this.gui = new dat.GUI({width: 300});

    // this.gui.add(this.props, 'hemisphereLight').onChange(this.switchHemisphereLight.bind(this));
    this.gui.add(this.props, 'shadowmap').onChange(this.switchShadowmap.bind(this));
    this.gui.add(this.props, 'fog').onChange(this.switchFog.bind(this));

    this.gui.addColor(this.props, 'bgColor').name('bg color').onChange(this.changeBgColor.bind(this));
  }

  // switchHemisphereLight(value){
  //   this.objs.uniforms.isHemiLight.value = value;
  // }

  switchShadowmap(value){
    this.objs.uniforms.isShadowmap.value = value;
  }

  switchFog(value){
    this.objs.uniforms.isFog.value = value;

  }


  changeBgColor(value){
    var color = new THREE.Color(value);
    this.webgl.renderer.setClearColor( color, 1.0 );
    this.objs.uniforms.uFogColor.value = color;
  }
}