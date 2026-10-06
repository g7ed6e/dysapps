import { WebGLRenderer, Scene, Mesh, InstancedMesh, BufferGeometry, BufferAttribute, MeshLambertMaterial, MeshBasicMaterial, Texture, HemisphereLight, DirectionalLight, PerspectiveCamera, Fog, Color } from 'three';
const r = new WebGLRenderer(); const s = new Scene(); s.fog = new Fog(0, 1, 2); s.background = new Color();
const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(9), 3));
s.add(new Mesh(g, new MeshLambertMaterial({ map: new Texture() })), new InstancedMesh(g, new MeshBasicMaterial(), 2), new HemisphereLight(), new DirectionalLight());
r.render(s, new PerspectiveCamera());
