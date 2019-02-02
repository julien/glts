const createContext = require("gl");

import {
    ProgramInfo,
    createProgram
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

        const info: ProgramInfo = createProgram(gl, vert, frag);

        expect(info).toBeDefined();

        expect(info.program).toBeDefined();
        expect(info.attribs.a_position).toBeDefined();

        const uniforms: number = Object.keys(info.uniforms).length;
        expect(uniforms).toBe(0);
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

        const info: ProgramInfo = createProgram(gl, vert, frag);

        expect(info).toBeDefined();

        expect(info.program).toBeDefined();
        expect(info.uniforms.u_color).toBeDefined();

        const attribs: number = Object.keys(info.attribs).length;
        expect(attribs).toBe(0);
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
