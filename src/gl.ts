export function createBuffer(gl: WebGLRenderingContext, target: GLenum, size: GLsizeiptr, usage: GLenum): WebGLBuffer {
  const buf: WebGLBuffer | null = gl.createBuffer();
  if (!buf) {
    throw new Error("Could not create buffer");
  }
  gl.bindBuffer(target, buf);
  gl.bufferData(target, size, usage);
  return buf;
}

export function createProgram(gl: WebGLRenderingContext, vert: string, frag: string): WebGLProgram {
  const vs: WebGLShader  = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
  gl.shaderSource(vs, vert);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(vs) as string);
  }

  const fs: WebGLShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
  gl.shaderSource(fs, frag);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(fs) as string);
  }

  const program: WebGLProgram = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) as string);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return program;
}

export function createTexture(gl: WebGLRenderingContext, image: HTMLImageElement,
                              width: number, height: number): WebGLTexture {
  const tex: WebGLTexture | null = gl.createTexture();
  if (!tex) {
    throw new Error("Could not create texture");
  }
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

// float + (vec2 * 4) + (char * 4)
const VERTEX_SIZE: number = 4 + ((4 * 2) * 4) + 4;
// floor(pow(2, 16) / 6)
const MAX_BATCH: number = 10922;
const VERTEX_DATA_SIZE: number = VERTEX_SIZE * MAX_BATCH * 4;
const VERTICES_PER_QUAD: number = 6;
const INDEX_DATA_SIZE: number = MAX_BATCH * (2 * VERTICES_PER_QUAD);

const vertexShaderSrc: string = `
precision lowp float;

attribute float a;
attribute vec2 b,c,d,e;
attribute vec4 f;
varying vec2 g;
varying vec4 h;
uniform mat4 i;

void main() {
  float q = cos(a);
  float w = sin(a);
  gl_Position = i * vec4(((vec2(d.x * q - d.y * w, d.x * w + d.y * q) * c) + b), 1.0, 1.0);
  g = e;
  h = f;
}
`;

const fragmentShaderSrc: string = `
precision lowp float;

varying vec2 g;
varying vec4 h;
uniform sampler2D j;

void main() {
  gl_FragColor = texture2D(j, g) * h;
}
`;

class Renderer {
  public gl: WebGLRenderingContext;
  public vertexData: ArrayBuffer;
  public vPositionData: Float32Array;
  public vColorData: Uint32Array;
  public vIndexData: Uint16Array;
  public IBO: WebGLBuffer;
  public VBO: WebGLBuffer;
  public col: number = 0xFFFFFFFF;
  public count: number;
  public currentTexture: WebGLTexture;

  constructor(canvas: HTMLCanvasElement) {

    const gl: WebGLRenderingContext | null = canvas.getContext("webgl");
    if (!gl) {
      throw new Error("Couldn't initialize WebGL context");
    }
    this.gl = gl;

    const width: number = canvas.width;
    const height: number = canvas.height;
    const prog = createProgram(this.gl, vertexShaderSrc, fragmentShaderSrc);

    this.vertexData = new ArrayBuffer(VERTEX_DATA_SIZE);
    this.vPositionData = new Float32Array(this.vertexData);
    this.vColorData = new Uint32Array(this.vertexData);
    this.vIndexData = new Uint16Array(INDEX_DATA_SIZE);
    this.IBO = createBuffer(this.gl, this.gl.ELEMENT_ARRAY_BUFFER, this.vIndexData.byteLength, gl.STATIC_DRAW);
    this.VBO = createBuffer(this.gl, this.gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);
    this.count = 0;

    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.gl.useProgram(prog);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.IBO);

    for (let indexA: number = 0, indexB: number = 0;
      indexA < MAX_BATCH * VERTICES_PER_QUAD;
      indexA += VERTICES_PER_QUAD, indexB += 4) {

      this.vIndexData[indexA + 0] = indexB,
      this.vIndexData[indexA + 1] = indexB + 1,
      this.vIndexData[indexA + 2] = indexB + 2,
      this.vIndexData[indexA + 3] = indexB + 0,
      this.vIndexData[indexA + 4] = indexB + 3,
      this.vIndexData[indexA + 5] = indexB + 1;
    }
    this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, 0, this.vIndexData);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);

    const locRotation = this.gl.getAttribLocation(prog, "a");
    const locTranslation = this.gl.getAttribLocation(prog, "b");
    const locScale = this.gl.getAttribLocation(prog, "c");
    const locPosition = this.gl.getAttribLocation(prog, "d");
    const locUv = this.gl.getAttribLocation(prog, "e");
    const locColor = this.gl.getAttribLocation(prog, "f");

    this.gl.enableVertexAttribArray(locRotation);
    this.gl.vertexAttribPointer(locRotation, 1, this.gl.FLOAT, false, VERTEX_SIZE, 0);

    this.gl.enableVertexAttribArray(locTranslation);
    this.gl.vertexAttribPointer(locTranslation, 2, this.gl.FLOAT, false, VERTEX_SIZE, 4);

    this.gl.enableVertexAttribArray(locScale);
    this.gl.vertexAttribPointer(locScale, 2, this.gl.FLOAT, false, VERTEX_SIZE, 12);

    this.gl.enableVertexAttribArray(locPosition);
    this.gl.vertexAttribPointer(locPosition, 2, this.gl.FLOAT, false, VERTEX_SIZE, 20);

    this.gl.enableVertexAttribArray(locUv);
    this.gl.vertexAttribPointer(locUv, 2, this.gl.FLOAT, false, VERTEX_SIZE, 28);

    this.gl.enableVertexAttribArray(locColor);
    this.gl.vertexAttribPointer(locColor, 4, this.gl.UNSIGNED_BYTE, true, VERTEX_SIZE, 36);

    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(prog, "i"), false,
      new Float32Array([
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 1, 1,
        -1, 1, 0, 0,
      ]),
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
  }

  public bkg(r: number, g: number, b: number): void {
    this.gl.clearColor(r, g, b, 1.0);
  }

  public cls(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public img(texture: WebGLTexture, x: number, y: number,
             w: number, h: number, r: number,
             tx: number, ty: number, sx: number, sy: number,
             u0: number, v0: number, u1: number, v1: number): void {

    const x0: number = x;
    const y0: number = y;
    const x1: number = x + w;
    const y1: number = y + h;
    const x2: number = x;
    const y2: number = y + h;
    const x3: number = x + w;
    const y3: number = y;
    const argb = this.col;
    let offset: number = 0;

    if (texture !== this.currentTexture || this.count + 1 >= MAX_BATCH) {
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vertexData);
      this.gl.drawElements(4, this.count * VERTICES_PER_QUAD, this.gl.UNSIGNED_SHORT, 0);
      this.count = 0;
      if (texture !== this.currentTexture) {
        this.currentTexture = texture;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.currentTexture);
      }
    }

    offset = this.count * VERTEX_SIZE;

    // Vertex order:
    // rotation|translation|scale|position|uv|color
    // Vertex 1
    this.vPositionData[offset++] = r;
    this.vPositionData[offset++] = tx;
    this.vPositionData[offset++] = ty;
    this.vPositionData[offset++] = sx;
    this.vPositionData[offset++] = sy;
    this.vPositionData[offset++] = x0;
    this.vPositionData[offset++] = y0;
    this.vPositionData[offset++] = u0;
    this.vPositionData[offset++] = v0;
    this.vColorData[offset++] = argb;

    // Vertex 2
    this.vPositionData[offset++] = r;
    this.vPositionData[offset++] = tx;
    this.vPositionData[offset++] = ty;
    this.vPositionData[offset++] = sx;
    this.vPositionData[offset++] = sy;
    this.vPositionData[offset++] = x1;
    this.vPositionData[offset++] = y1;
    this.vPositionData[offset++] = u1;
    this.vPositionData[offset++] = v1;
    this.vColorData[offset++] = argb;

    // Vertex 3
    this.vPositionData[offset++] = r;
    this.vPositionData[offset++] = tx;
    this.vPositionData[offset++] = ty;
    this.vPositionData[offset++] = sx;
    this.vPositionData[offset++] = sy;
    this.vPositionData[offset++] = x2;
    this.vPositionData[offset++] = y2;
    this.vPositionData[offset++] = u0;
    this.vPositionData[offset++] = v1;
    this.vColorData[offset++] = argb;

    // Vertex 4
    this.vPositionData[offset++] = r;
    this.vPositionData[offset++] = tx;
    this.vPositionData[offset++] = ty;
    this.vPositionData[offset++] = sx;
    this.vPositionData[offset++] = sy;
    this.vPositionData[offset++] = x3;
    this.vPositionData[offset++] = y3;
    this.vPositionData[offset++] = u1;
    this.vPositionData[offset++] = v0;
    this.vColorData[offset++] = argb;

    if (++this.count >= MAX_BATCH) {
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vertexData);
      this.gl.drawElements(4, this.count * VERTICES_PER_QUAD, this.gl.UNSIGNED_SHORT, 0);
      this.count = 0;
    }
  }

  public flush(): void {
    if (this.count === 0) {
      return;
    }
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vPositionData.subarray(0, this.count * VERTEX_SIZE));
    this.gl.drawElements(4, this.count * VERTICES_PER_QUAD, this.gl.UNSIGNED_SHORT, 0);
    this.count = 0;
  }
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  return new Renderer(canvas);
}
