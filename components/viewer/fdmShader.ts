import * as THREE from 'three';

// Custom GLSL Shader simulating FDM 3D printing horizontal layers
export const FdmLayerShaderMaterial = {
  uniforms: {
    uBaseColor: { value: new THREE.Color('#38bdf8') }, // Tech Cyan PLA
    uLayerColor: { value: new THREE.Color('#0284c7') }, // Layer groove color
    uLayerHeight: { value: 0.2 },                      // 0.2mm layer simulation (scaled)
    uRoughness: { value: 0.4 },
    uSpecularColor: { value: new THREE.Color('#ffffff') },
    uLightDirection: { value: new THREE.Vector3(1, 2, 1).normalize() },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uLayerColor;
    uniform float uLayerHeight;
    uniform float uRoughness;
    uniform vec3 uSpecularColor;
    uniform vec3 uLightDirection;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 lightDir = normalize(uLightDirection);

      // Diffuse Lighting (Lambertian)
      float diff = max(dot(normal, lightDir), 0.15);

      // Specular Highlight (Blinn-Phong)
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 32.0 * (1.0 - uRoughness));

      // FDM Layer Simulation via World Y coordinate modulation
      // Creates micro-ridges / striations along the vertical printing axis
      float layerPhase = fract(vWorldPosition.y / uLayerHeight);
      
      // Simulate layer extrusion curvature: rounded bead profile
      float layerGroove = smoothstep(0.0, 0.15, layerPhase) * smoothstep(1.0, 0.85, layerPhase);
      
      // Anisotropic-like reflection bump along layer lines
      float layerShading = mix(0.78, 1.08, layerGroove);

      // Color blending between base filament and layer lines
      vec3 surfaceColor = mix(uLayerColor, uBaseColor, layerGroove) * layerShading;

      // Final composite with ambient, diffuse, and specular sheen
      vec3 finalColor = surfaceColor * diff + (uSpecularColor * spec * 0.35);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function createFdmMaterial(color = '#38bdf8', layerHeight = 0.8): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(color) },
      uLayerColor: { value: new THREE.Color(color).multiplyScalar(0.7) },
      uLayerHeight: { value: layerHeight },
      uRoughness: { value: 0.35 },
      uSpecularColor: { value: new THREE.Color('#ffffff') },
      uLightDirection: { value: new THREE.Vector3(1.5, 3.0, 2.0).normalize() },
    },
    vertexShader: FdmLayerShaderMaterial.vertexShader,
    fragmentShader: FdmLayerShaderMaterial.fragmentShader,
  });
}
