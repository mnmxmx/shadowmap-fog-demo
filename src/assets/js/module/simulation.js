class Simulation{
  constructor(webgl, size){
    this.webgl = webgl;
    this.renderer = this.webgl.renderer;
    this.size = size;
    this.init();
  }

  init(){
    this.gpuCompute = new GPUComputationRenderer( this.size, this.size, this.renderer );

    this.dataPos = this.gpuCompute.createTexture();
    this.dataVel = this.gpuCompute.createTexture();
    this.dataDef = this.gpuCompute.createTexture();


    var posArray = this.dataPos.image.data;
    var velArray = this.dataVel.image.data;
    var defArray = this.dataDef.image.data;


    for ( var i = 0, il = posArray.length; i < il; i += 4 ) {

      var phi = Math.random() * 2 * Math.PI;
      var theta = Math.random() * Math.PI;
      var r = (1.2 + Math.random() * 2) * 1.2;

      defArray[ i + 0 ] = posArray[ i + 0 ] = r * Math.sin( theta) * Math.cos( phi );
      defArray[ i + 1 ] = posArray[ i + 1 ] = r * Math.sin( theta) * Math.sin( phi ) * 1.4;
      defArray[ i + 2 ] = posArray[ i + 2 ] = r * Math.cos( theta );
      defArray[ i + 3 ] = posArray[ i + 3 ] = Math.random() * 0.5;


      velArray[ i + 3 ] = Math.random() * 100; // frames life
    }

    this.def = this.gpuCompute.addVariable( "defTex", this.webgl.fragShader[2], this.dataDef );
    this.vel = this.gpuCompute.addVariable( "velTex", this.webgl.fragShader[3], this.dataVel );
    this.pos = this.gpuCompute.addVariable( "posTex", this.webgl.fragShader[4], this.dataPos );

    this.gpuCompute.setVariableDependencies( this.def, [ this.pos, this.vel, this.def ] );
    this.gpuCompute.setVariableDependencies( this.vel, [ this.pos, this.vel, this.def ] );
    this.gpuCompute.setVariableDependencies( this.pos, [ this.pos, this.vel, this.def ] );


    this.velUniforms = this.vel.material.uniforms;

    this.velUniforms.timer = { value: 0.0 };
    this.velUniforms.delta = { value: 0.0 };
    this.velUniforms.speed = { value: 0.4 };
    this.velUniforms.factor = { value: 0.5 };
    this.velUniforms.evolution = { value: 0.5 };
    this.velUniforms.radius = { value: 2.0 };

    var error = this.gpuCompute.init();
    if ( error !== null ) {
        console.error( error );
    }
  }

  render(time, delta){
    this.velUniforms.timer.value = time;
    this.velUniforms.delta.value = delta;

    this.gpuCompute.compute();
  }
  
}