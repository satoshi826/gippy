import {Core, Program, Renderer} from 'glaku'

export const shade = (core: Core, lightNum: number, preRenderer: Renderer) => new Program(core, {
  id            : 'shade',
  attributeTypes: {
    a_position    : 'vec3',
    a_textureCoord: 'vec2'
  },
  texture: {
    t_positionTexture: preRenderer.renderTexture[0],
    t_normalTexture  : preRenderer.renderTexture[1],
    t_colorTexture   : preRenderer.renderTexture[2]
  },
  uniformTypes: {
    u_lightPosition : `vec3[${lightNum}]`,
    u_cameraPosition: 'vec3'
  },
  vert: /* glsl */ `
        out vec2 v_uv;
        void main() {
          v_uv  = a_textureCoord;
          gl_Position = vec4(a_position, 1.0);
        }`,
  frag: /* glsl */`
        #define MAX_LIGHTS ${lightNum}

        float randInt(float seed){
          float seedFloor = floor(seed);
          return mod((seedFloor * seedFloor / 100.0), 100.0);
        }

        vec3 hsvToRgb(vec3 c){
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        in vec2 v_uv;
        out vec4 o_color;
        void main() {
          vec4 t_pos = texture(t_positionTexture, v_uv);
          vec3 position = t_pos.xyz;
          float id = t_pos.a;
          vec3 normal = texture(t_normalTexture, v_uv).xyz;
          vec4 localPos = texture(t_colorTexture, v_uv).xyzw;

          float windowSize = randInt(id) * 0.005;
          float tmp = step(windowSize, fract(5.0 * localPos.x)) + step(windowSize, fract(10.0 * localPos.y)) + step(windowSize, fract(5.0 * localPos.z));
          float window1 = 1.0 - tmp;
          float window2 = 3.0 * tmp - 6.0;

          bool isRoad = localPos.w < 1.0;
          bool isSky = localPos.w > 0.5 && localPos.w < 1.5;
          bool isBuilding = localPos.w > 1.5 && localPos.w < 2.5;

          float isWindow = isBuilding ? step(0.5, window1) + step(0.5, window2) : 0.0;
          vec3 isLight = localPos.w > 2.5 ? vec3(2.0, 1.0, 3.0) : vec3(0.0);

          float tmpx = floor(5.0 * localPos.x);
          float tmpy = floor(10.0 * localPos.y);
          float tmpz = floor(5.0 * localPos.z);
          float isLighted = isWindow * step(83.0, randInt(15.0 * tmpx + 2.0 * tmpy * tmpz * id));

          float window = 0.2 * isWindow + 0.001;
          vec3 viewVec = normalize(u_cameraPosition - position);

          vec3 lightVec;
          float lightDis;
          float lightDecay;
          vec3 reflectVec;

          float diffuse = 0.0;
          float specular = 0.0;

          float specIntensity = isWindow > 0.0 ? 60.0 : 20.0;

          for(int i = 0; i < ${lightNum}; i++){
            lightVec = normalize(u_lightPosition[i] - position);
            lightDis = distance(u_lightPosition[i], position);
            lightDecay = pow(lightDis, -1.2);

            reflectVec = reflect(-lightVec, normal);
            diffuse += 120.0 * lightDecay * max(0.0, dot(lightVec, normal));
            specular += 5000.0 * lightDecay * pow(max(0.0, dot(viewVec, reflectVec)), specIntensity);
          }
          float ambient = 0.02;
          float result = max((ambient + diffuse + specular) * 0.1, 0.01);

          vec3 resultColor = isBuilding ? vec3(0.9, 1.2, 1.8) : vec3(0.8, 0.2, 0.8);

          vec3 constColor = isRoad ? vec3(12.0, 1.0, 4.0) * (
            step(0.99, 1.0 - abs(0.96 - (2.0 * abs(fract(0.005 * position.x - 0.5) - 0.5)))) +
            step(0.99, 1.0 - abs(0.96 - (2.0 * abs(fract(0.005 * position.z - 0.5) - 0.5))))
            )
            : isLighted * vec3(6.0, 0.8, 0.2) + isLight;

          vec3 bottomLight =  isBuilding ? max((0.004 / (0.002 * position.y + 0.0001)), 0.0) * vec3(0.5, 0.1, 0.8) : vec3(0.0);

          o_color = vec4(result * resultColor + bottomLight, 1.0) + vec4(constColor, 1.0);
          if (isSky) {
            o_color = vec4(0.05, 0.01, 0.05, 1.0);
          }
        }`
})
