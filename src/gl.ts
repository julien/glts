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

interface IRenderer {
  bkg(r: number, g: number, b: number): void;
  cls(): void;
}

export function createRenderer(canvas: HTMLCanvasElement): IRenderer {
  const gl: WebGLRenderingContext | null = canvas.getContext("webgl");
  if (!gl) {
    throw new Error("Couldn't initialize WebGL context");
  }

  const width: number = canvas.width;
  const height: number = canvas.height;
  const prog = createProgram(gl, vertexShaderSrc, fragmentShaderSrc);

  const vertexData: ArrayBuffer = new ArrayBuffer(VERTEX_DATA_SIZE);
  const vPositionData: Float32Array = new Float32Array(vertexData);
  const vColorData: Uint32Array = new Uint32Array(vertexData);
  const vIndexData: Uint16Array = new Uint16Array(INDEX_DATA_SIZE);
  const IBO = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, vIndexData.byteLength, gl.STATIC_DRAW);
  const VBO = createBuffer(gl, gl.ARRAY_BUFFER, vertexData.byteLength, gl.DYNAMIC_DRAW);
  let count: number = 0;
  let currentTexture: WebGLTexture;

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IBO);

  for (let indexA: number = 0, indexB: number = 0;
    indexA < MAX_BATCH * VERTICES_PER_QUAD;
    indexA += VERTICES_PER_QUAD, indexB += 4) {

    vIndexData[indexA + 0] = indexB,
    vIndexData[indexA + 1] = indexB + 1,
    vIndexData[indexA + 2] = indexB + 2,
    vIndexData[indexA + 3] = indexB + 0,
    vIndexData[indexA + 4] = indexB + 3,
    vIndexData[indexA + 5] = indexB + 1;
  }
  gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, vIndexData);

  gl.bindBuffer(gl.ARRAY_BUFFER, VBO);

  const locRotation = gl.getAttribLocation(prog, "a");
  const locTranslation = gl.getAttribLocation(prog, "b");
  const locScale = gl.getAttribLocation(prog, "c");
  const locPosition = gl.getAttribLocation(prog, "d");
  const locUv = gl.getAttribLocation(prog, "e");
  const locColor = gl.getAttribLocation(prog, "f");

  gl.enableVertexAttribArray(locRotation);
  gl.vertexAttribPointer(locRotation, 1, gl.FLOAT, false, VERTEX_SIZE, 0);

  gl.enableVertexAttribArray(locTranslation);
  gl.vertexAttribPointer(locTranslation, 2, gl.FLOAT, false, VERTEX_SIZE, 4);

  gl.enableVertexAttribArray(locScale);
  gl.vertexAttribPointer(locScale, 2, gl.FLOAT, false, VERTEX_SIZE, 12);

  gl.enableVertexAttribArray(locPosition);
  gl.vertexAttribPointer(locPosition, 2, gl.FLOAT, false, VERTEX_SIZE, 20);

  gl.enableVertexAttribArray(locUv);
  gl.vertexAttribPointer(locUv, 2, gl.FLOAT, false, VERTEX_SIZE, 28);

  gl.enableVertexAttribArray(locColor);
  gl.vertexAttribPointer(locColor, 4, gl.UNSIGNED_BYTE, false, VERTEX_SIZE, 36);

  gl.uniformMatrix4fv(gl.getUniformLocation(prog, "i"), false,
    new Float32Array([
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 1, 1,
      -1, 1, 0, 0,
    ]),
  );

  gl.activeTexture(gl.TEXTURE0);

  const renderer = {
    col: 0xFFFFFFFF,

    bkg(r: number, g: number, b: number): void {
      gl.clearColor(r, g, b, 1.0);
    },

    cls(): void {
      gl.clear(gl.COLOR_BUFFER_BIT);
    },

    gl,

    img(texture: WebGLTexture,
        x: number, y: number, w: number, h: number,
        r: number, tx: number, ty: number, sx: number, sy: number,
        u0: number, v0: number, u1: number, v1: number): void {

      const x0: number = x;
      const y0: number = y;
      const x1: number = x + w;
      const y1: number = y + h;
      const x2: number = x;
      const y2: number = y + h;
      const x3: number = x + w;
      const y3: number = y;
      const argb = renderer.col;
      let offset: number = 0;

      if (texture !== currentTexture || count + 1 >= MAX_BATCH) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
        gl.drawElements(4, count * VERTICES_PER_QUAD, gl.UNSIGNED_SHORT, 0);
        count = 0;
        if (texture !== currentTexture) {
          currentTexture = texture;
          gl.bindTexture(gl.TEXTURE_2D, currentTexture);
        }
      }

      offset = count * VERTEX_SIZE;

      // Vertex order:
      // rotation|translation|scale|position|uv|color
      // Vertex 1
      vPositionData[offset++] = r;
      vPositionData[offset++] = tx;
      vPositionData[offset++] = ty;
      vPositionData[offset++] = sx;
      vPositionData[offset++] = sy;
      vPositionData[offset++] = x0;
      vPositionData[offset++] = y0;
      vPositionData[offset++] = u0;
      vPositionData[offset++] = v0;
      vColorData[offset++] = argb;

      // Vertex 2
      vPositionData[offset++] = r;
      vPositionData[offset++] = tx;
      vPositionData[offset++] = ty;
      vPositionData[offset++] = sx;
      vPositionData[offset++] = sy;
      vPositionData[offset++] = x1;
      vPositionData[offset++] = y1;
      vPositionData[offset++] = u1;
      vPositionData[offset++] = v1;
      vColorData[offset++] = argb;

      // Vertex 3
      vPositionData[offset++] = r;
      vPositionData[offset++] = tx;
      vPositionData[offset++] = ty;
      vPositionData[offset++] = sx;
      vPositionData[offset++] = sy;
      vPositionData[offset++] = x2;
      vPositionData[offset++] = y2;
      vPositionData[offset++] = u0;
      vPositionData[offset++] = v1;
      vColorData[offset++] = argb;

      // Vertex 4
      vPositionData[offset++] = r;
      vPositionData[offset++] = tx;
      vPositionData[offset++] = ty;
      vPositionData[offset++] = sx;
      vPositionData[offset++] = sy;
      vPositionData[offset++] = x3;
      vPositionData[offset++] = y3;
      vPositionData[offset++] = u1;
      vPositionData[offset++] = v0;
      vColorData[offset++] = argb;

      if (++count >= MAX_BATCH) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
        gl.drawElements(4, count * VERTICES_PER_QUAD, gl.UNSIGNED_SHORT, 0);
        count = 0;
      }
    },

    flush(): void {
      if (count === 0) {
        return;
      }
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vPositionData.subarray(0, count * VERTEX_SIZE));
      gl.drawElements(4, count * VERTICES_PER_QUAD, gl.UNSIGNED_SHORT, 0);
      count = 0;
    },
  };

  return renderer;
}
