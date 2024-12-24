uniform sampler2D uTex;
uniform vec3 uColor;

void main() {
  gl_FragColor = vec4(uColor, 1.0);
  gl_FragColor = gl_FragColor * (texture2D(uTex, gl_PointCoord ));
}