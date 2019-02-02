
interface AttribInfo {
  info: WebGLActiveInfo | null;
  location: GLint | null;
}

interface UniformInfo {
  info: WebGLActiveInfo | null;
  location: WebGLUniformLocation | null;
}

interface ProgramInfo {
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

    return  {
        attribs,
        program,
        uniforms
    };
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
        const info: WebGLActiveInfo | null = gl.getActiveAttrib(program, i);
        if (!info) continue;
        const location: GLint | null = gl.getAttribLocation(program, info.name);
        attribs[info.name] = {
            info,
            location
        };
    }

    active = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < active; i++) {
        const info: WebGLActiveInfo | null = gl.getActiveUniform(program, i);
        if (!info) continue;
        const location: WebGLUniformLocation | null  = gl.getUniformLocation(program, info.name);
        uniforms[info.name] = {
            info,
            location
        };
    }

    return [attribs, uniforms];
}

