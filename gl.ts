
interface ProgramInfo {
    attribs: object;
    program: WebGLProgram;
    uniforms: object;
}

export function createProgram(gl: WebGLRenderingContext, vert: string, frag: string): ProgramInfo {

    const vs: WebGLShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vert);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vs));
    }

    const fs: WebGLShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, frag);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fs));
    }

    const program: WebGLProgram = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
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

export function getProgramData(gl: WebGLRenderingContext, program: WebGLProgram): [object, object] {
    const attribs: object = {};
    const uniforms: object = {};
    let i: number;
    let active: GLint;

    active = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < active; i++) {
        const attrib: WebGLActiveInfo = gl.getActiveAttrib(program, i);
        const loc: GLint = gl.getAttribLocation(program, attrib.name);
        attribs[attrib.name] = {
            info: attrib,
            location: loc
        };
    }

    active = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < active; i++) {
        const uniform: WebGLActiveInfo = gl.getActiveUniform(program, i);
        const loc: WebGLUniformLocation  = gl.getUniformLocation(program, uniform.name);
        uniforms[uniform.name] = {
            info: uniform,
            location: loc
        };
    }

    return [attribs, uniforms];
}


