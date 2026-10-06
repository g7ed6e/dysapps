import { Engine, Scene, Mesh, VertexData, StandardMaterial, MultiMaterial, SubMesh, Texture, HemisphericLight, DirectionalLight, UniversalCamera, Vector3, Color4 } from '@babylonjs/core';
const e = new Engine(document.querySelector('canvas')); const s = new Scene(e); s.clearColor = new Color4(); s.fogMode = Scene.FOGMODE_LINEAR;
const m = new Mesh('m', s); const v = new VertexData(); v.positions = new Float32Array(9); v.indices = [0, 1, 2]; v.applyToMesh(m);
const sm = new StandardMaterial('s', s); sm.diffuseTexture = new Texture('', s); m.material = new MultiMaterial('mm', s); SubMesh.CreateFromIndices(0, 0, 3, m);
m.thinInstanceSetBuffer('matrix', new Float32Array(16), 16);
new HemisphericLight('h', Vector3.Up(), s); new DirectionalLight('d', Vector3.Down(), s); new UniversalCamera('c', Vector3.Zero(), s);
e.runRenderLoop(() => s.render());
