import { Color, Material, ShaderMaterial, Vector4 } from "three";
import LdrColor from "./files/LdrColor";

export default class MaterialFactory {
  public static MakeOptionalLineMaterial(ldrColor: LdrColor): Material {
    // http://www.ldraw.org/article/218.html
    const optionalLineVertexShader =
      "precision highp float;\n" +
      "precision mediump int;\n" +
      "\n" +
      "attribute vec3 position2;\n" +
      "attribute vec3 controlPoint1;\n" +
      "attribute vec3 controlPoint2;\n" +
      "\n" +
      "uniform vec4 color;\n" +
      "\n" +
      "varying vec4 vColor;\n" +
      "\n" +
      "void main() {\n" +
      "  mat4 m = projectionMatrix * modelViewMatrix;\n" +
      "  gl_Position = m * vec4(position, 1.0);\n" +
      "  vec2 xp1 = gl_Position.xy;\n" +
      "  vec2 d12 = vec4(m * vec4(position2, 1.0)).yx - xp1.yx;\n" +
      "  d12.y = -d12.y;\n" +
      "  vec2 d13 = vec4(m * vec4(controlPoint1, 1.0)).xy - xp1;\n" +
      "  vec2 d14 = vec4(m * vec4(controlPoint2, 1.0)).xy - xp1;\n" +
      "  vColor = color;\n" +
      "  vColor.a *= sign(dot(d12, d13) * dot(d12, d14));\n" +
      "  gl_Position.w -= 0.0001;\n" +
      "}";

    const optionalLineFragmentShader =
      "precision lowp float;\n" +
      "\n" +
      "varying vec4 vColor;\n" +
      "\n" +
      "void main() {\n" +
      "  if(vColor.a <= 0.001)\n" +
      "    discard;\n" +
      "\n" +
      "  gl_FragColor = vColor;\n" +
      "}";

    const c = new Color(ldrColor.edge);
    const a = ldrColor.alpha ? ldrColor.alpha / 255.0 : 1;

    const uniforms = {
      color: {
        type: "v4",
        value: new Vector4(c.r, c.g, c.b, a)
      }
    };

    return new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: optionalLineVertexShader,
      fragmentShader: optionalLineFragmentShader,
      transparent: a != 1,
      visible: true
    });
  }

  public static MakeLineMaterial(ldrColor: LdrColor): Material {
    const c = new Color(ldrColor.edge);
    const a = ldrColor.alpha ? ldrColor.alpha / 255.0 : 1;

    const uniforms = {
      color: {
        type: "v4",
        value: new Vector4(c.r, c.g, c.b, a)
      }
    };

    const vertexShader =
      "uniform vec4 color;\n" +
      "\n" +
      "varying vec4 vColor;\n" +
      "\n" +
      "void main() {\n" +
      "  vColor = color;\n" +
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n" +
      "  gl_Position.w -= 0.0001;\n" +
      "}";

    const fragmentShader =
      "varying vec4 vColor;\n" +
      "\n" +
      "void main() {\n" +
      "  gl_FragColor=vColor;\n" +
      "}";

    return new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: a != 1,
      visible: true
    });
  }

  public static MakeMeshMaterial(ldrColor: LdrColor): Material {
    const c = new Color(ldrColor.value);
    const a = ldrColor.alpha ? ldrColor.alpha / 255.0 : 1;

    const uniforms = {
      color: {
        type: "v4",
        value: new Vector4(c.r, c.g, c.b, a)
      }
    };

    const vertexShader =
      "uniform vec4 color;\n" +
      "\n" +
      "varying vec4 vColor;\n" +
      "\n" +
      "void main() {\n" +
      "  vColor = color;\n" +
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n" +
      "}";

    const fragmentShader =
      "varying vec4 vColor;\n" +
      "\n" +
      "void main() {\n" +
      "  gl_FragColor=vColor;\n" +
      "}";

    return new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: a != 1,
      depthWrite: a === 1
    });
  }
}
