// ==UserScript==
// @name        bQ-ESP
// @namespace   http://tampermonkey.net/
// @version     0.2
// @description BEST ESP 4 1V1.LOL
// @author      BQUER
// @match       *://1v1.lol/*
// @icon        https://cdn.waifu.im/4651.jpeg
// @grant       none
// @license     MIT
// @run-at      document-start
// ==/UserScript==

const threshold = 4.5;
let espEnabled = false;
const WebGL = WebGL2RenderingContext.prototype;

HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
  apply(target, thisArgs, args) {
    if (args[1]) {
      args[1].preserveDrawingBuffer = true;
    }
    return Reflect.apply(...arguments);
  }
});

WebGL.shaderSource = new Proxy(WebGL.shaderSource, {
  apply(target, thisArgs, args) {
    if (args[1].indexOf('gl_Position') > -1) {
      args[1] = args[1].replace('void main', 'out float vDepth; uniform bool enabled; uniform float threshold; void main');
      args[1] = args[1].replace(/return;/, 'vDepth = gl_Position.z; if (enabled && vDepth > threshold) { gl_Position.z = 1.0; }');
    } else if (args[1].indexOf('SV_Target0') > -1) {
      args[1] = args[1].replace('void main', 'in float vDepth; uniform bool enabled; uniform float threshold; void main');
      args[1] = args[1].replace(/return;/, 'if (enabled && vDepth > threshold) { SV_Target0 = vec4(0.0, 1.0, 0.0, 1.0); }');
    }
    return Reflect.apply(...arguments);
  }
});

WebGL.getUniformLocation = new Proxy(WebGL.getUniformLocation, {
  apply(target, thisArgs, [program, name]) {
    const result = Reflect.apply(...arguments);
    if (result) {
      result.name = name;
      result.program = program;
    }
    return result;
  }
});

WebGL.uniform4fv = new Proxy(WebGL.uniform4fv, {
  apply(target, thisArgs, args) {
    if (args[0].name === 'hlslcc_mtx4x4unity_ObjectToWorld') {
      args[0].program.isUIProgram = true;
    }
    return Reflect.apply(...arguments);
  }
});

let movementX = 0, movementY = 0;
let count = 0;

WebGL.drawElements = new Proxy(WebGL.drawElements, {
  apply(target, thisArgs, args) {
    const program = thisArgs.getParameter(thisArgs.CURRENT_PROGRAM);
    if (!program.uniforms) {
      program.uniforms = {
        enabled: thisArgs.getUniformLocation(program, 'enabled'),
        threshold: thisArgs.getUniformLocation(program, 'threshold')
      };
    }
    const couldBePlayer = args[1] > 4000;
    thisArgs.uniform1i(program.uniforms.enabled, espEnabled && couldBePlayer);
    thisArgs.uniform1f(program.uniforms.threshold, threshold);
    args[0] = args[0];
    Reflect.apply(...arguments);
  }
});

window.addEventListener('keyup', function(event) {
  switch (String.fromCharCode(event.keyCode)) {
    case 'T':
      espEnabled = !espEnabled;
      showMsg('ESP', espEnabled);
      break;
  }
});

function showMsg(name, bool) {
  const msgEl = document.createElement('div');
  msgEl.innerText = name + ': ' + (bool ? 'ON' : 'OFF');
  msgEl.classList.add('msg');
  document.body.appendChild(msgEl);
  setTimeout(() => (msgEl.style.display = 'none'), 1500);
}
