export function createBuffer(
  gl: WebGLRenderingContext,
  target: GLenum,
  size: GLsizeiptr,
  usage: GLenum,
): WebGLBuffer {
  const buf: WebGLBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(target, buf);
  gl.bufferData(target, size, usage);
  return buf;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vert: string,
  frag: string,
): WebGLProgram {
  const vs: WebGLShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
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

export function createTexture(
  gl: WebGLRenderingContext,
  image: HTMLImageElement,
  width: number,
  height: number,
): WebGLTexture {
  const tex: WebGLTexture = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}
