type GLintOrNull = GLint | null;
type WebGLActiveInfoOrNull = WebGLActiveInfo | null;
type WebGLUniformLocationOrNull = WebGLUniformLocation | null;

export interface IAttribInfo {
    info: WebGLActiveInfoOrNull;
    location: GLintOrNull;
}

export interface IUniformInfo {
    info: WebGLActiveInfoOrNull;
    location: WebGLUniformLocationOrNull;
}

export interface IProgramInfo {
    attribs: Record<string, IAttribInfo>;
    program: WebGLProgram;
    uniforms: Record<string, IUniformInfo>;
}

export function createProgram(
    gl: WebGLRenderingContext,
    vert: string,
    frag: string): IProgramInfo {
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

    const [attribs, uniforms] = getProgramData(gl, program);

    return  { attribs, program, uniforms };
}

export function getProgramData(
    gl: WebGLRenderingContext,
    program: WebGLProgram): [
        Record<string, IAttribInfo>, Record<string, IUniformInfo>] {
    const attribs: Record<string, IAttribInfo> = {};
    const uniforms: Record<string, IUniformInfo> = {};
    let i: number;
    let active: GLint;

    active = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < active; i++) {
        const info: WebGLActiveInfoOrNull = gl.getActiveAttrib(program, i);
        if (!info) {
            continue;
        }
        const location: GLintOrNull = gl.getAttribLocation(program, info.name);
        attribs[info.name] = { info, location };
    }

    active = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < active; i++) {
        const info: WebGLActiveInfoOrNull | null = gl.getActiveUniform(program, i);
        if (!info) {
            continue;
        }
        const location: WebGLUniformLocationOrNull = gl.getUniformLocation(program, info.name);
        uniforms[info.name] = { info, location };
    }

    return [attribs, uniforms];
}

export function createTexture(
    gl: WebGLRenderingContext,
    wrap: GLint = WebGLRenderingContext.CLAMP_TO_EDGE,
    filter: GLint = WebGLRenderingContext.LINEAR): WebGLTexture {
    const tex: WebGLTexture | null = gl.createTexture();
    if (!tex) {
        throw new Error("Could not create texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

    return tex;
}

export function createBuffer(
    gl: WebGLRenderingContext,
    target: GLenum,
    size: GLsizeiptr,
    usage: GLenum): WebGLBuffer {

    const buf: WebGLBuffer | null = gl.createBuffer();
    if (!buf) {
        throw new Error("Could not create buffer");
    }
    gl.bindBuffer(target, buf);
    gl.bufferData(target, size, usage);
    return buf;
}
