type GLintOrNull = GLint | null;
type WebGLActiveInfoOrNull = WebGLActiveInfo | null;
type WebGLUniformLocationOrNull = WebGLUniformLocation | null;

export interface AttribInfo {
    info: WebGLActiveInfoOrNull;
    location: GLintOrNull;
}

export interface UniformInfo {
    info: WebGLActiveInfoOrNull;
    location: WebGLUniformLocationOrNull;
}

export interface ProgramInfo {
    attribs: Record<string, AttribInfo>;
    program: WebGLProgram;
    uniforms: Record<string, UniformInfo>;
}

export function createProgram(gl: WebGLRenderingContext, vert: string, frag: string): ProgramInfo {
    const vs: WebGLShader  = <WebGLShader>gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vert);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        throw new Error(<string>gl.getShaderInfoLog(vs));
    }

    const fs: WebGLShader = <WebGLShader>gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, frag);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        throw new Error(<string>gl.getShaderInfoLog(fs));
    }

    const program: WebGLProgram = <WebGLProgram>gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(<string>gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const [attribs, uniforms] = getProgramData(gl, program);

    return  { attribs, program, uniforms };
}

export function getProgramData(gl: WebGLRenderingContext, program: WebGLProgram):
[
    Record<string, AttribInfo>,
    Record<string, UniformInfo>
] {
    const attribs: Record<string, AttribInfo> = {};
    const uniforms: Record<string, UniformInfo> = {};
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

export function createTexture(gl: WebGLRenderingContext,
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
