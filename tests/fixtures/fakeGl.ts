/**
 * A WebGL2 stand-in that compiles and links everything. It records draws, colour uniforms, uPhase
 * values, every fragment source compiled and every link, and fires events on its canvas.
 */
export function fakeGl() {
  const calls = { draws: 0, colors: [] as number[][], phases: [] as number[], fragments: [] as string[], links: 0 };
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    TRIANGLES: 5,
    createShader: (type: number) => ({ type, source: "" }),
    shaderSource: (sh: { source: string }, src: string) => {
      sh.source = src;
    },
    compileShader: (sh: { type: number; source: string }) => {
      if (sh.type === 2) calls.fragments.push(sh.source);
    },
    getShaderParameter: () => true,
    deleteShader: () => {},
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {
      calls.links++;
    },
    getProgramParameter: () => true,
    deleteProgram: () => {},
    createVertexArray: () => ({}),
    deleteVertexArray: () => {},
    getUniformLocation: (_p: unknown, name: string) => ({ name }),
    viewport: () => {},
    useProgram: () => {},
    bindVertexArray: () => {},
    uniform1f: (l: { name: string }, v: number) => {
      if (l.name === "uPhase") calls.phases.push(v);
    },
    uniform1i: () => {},
    uniform2f: () => {},
    uniform3f: (_l: unknown, r: number, g: number, b: number) => calls.colors.push([r, g, b]),
    drawArrays: () => {
      calls.draws++;
    },
  };
  const events = new EventTarget();
  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 64,
    clientHeight: 32,
    getContext: () => gl,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  } as unknown as HTMLCanvasElement;
  return { canvas, calls };
}
