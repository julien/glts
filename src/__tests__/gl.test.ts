const createContext = require("gl");

import {
  createProgram,
} from "../gl";

const gl: WebGLRenderingContext = createContext(200, 200);

describe("glts tests", () => {

  test("createProgram with 1 active attrib", () => {
    const vert: string = `
        precision mediump float;
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
        `;
    const frag: string = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
        }
        `;

    const program: WebGLProgram = createProgram(gl, vert, frag);

    expect(program).toBeDefined();

    const locPosition: GLint | null = gl.getAttribLocation(program, "a_position");

    expect(locPosition).toBeDefined();

    const locNonExisting: WebGLUniformLocation | null = gl.getUniformLocation(program, "non_existing");
    expect(locNonExisting).toBeNull();
  });

  test("createProgram with 1 active uniform", () => {
    const vert: string = `
        precision mediump float;
        uniform vec2 u_color;
        varying vec2 v_color;
        void main() {
            gl_Position = vec4(0.5, 0.5, 0.0, 1.0);
            v_color = u_color;
        }
        `;
    const frag: string = `
        precision mediump float;
        varying vec2 v_color;
        void main() {
            gl_FragColor = vec4(v_color, 0.0, 1.0);
        }
        `;

    const program: WebGLProgram = createProgram(gl, vert, frag);

    expect(program).toBeDefined();

    const locNonExisting: GLint | null = gl.getAttribLocation(program, "a_non_exisiting");
    expect(locNonExisting).toEqual(-1);

    const locColor: WebGLUniformLocation | null = gl.getUniformLocation(program, "u_color");
    expect(locColor).toBeDefined();
  });

  test("createProgram with vertex shader error", () => {
    const vert: string = `
        precision mediump float;
        attribute vec1 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
        `;
    const frag: string = "";

    function tryToCreateProgram() {
      return createProgram(gl, vert, frag);
    }

    expect(tryToCreateProgram).toThrow();
  });

  test("createProgram with fragment shader error", () => {
    const vert: string = `
        precision mediump float;
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
        `;
    const frag: string = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(1.0, );
        }
        `;

    function tryToCreateProgram() {
      return createProgram(gl, vert, frag);
    }

    expect(tryToCreateProgram).toThrow();
  });
});
