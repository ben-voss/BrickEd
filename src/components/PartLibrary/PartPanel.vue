<template>
  <div class="scene" ref="scene" v-resize="onResize" />
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import RenderModel from "@/app/RenderModel";
import { Prop, Watch } from "vue-property-decorator";
import { markRaw } from "@vue/reactivity";
import { DirectionalLight, OrthographicCamera, WebGLRenderer } from "three";

@Options({})
export default class PartPanel extends Vue {
  // Avoid queueing more than one render at a time.  This prevents stuttering when
  // responding to mouse interactions etc.
  private renderQueued!: boolean;

  private sceneDiv: HTMLDivElement | null = null;
  private controls!: OrbitControls | null;
  private camera!: OrthographicCamera;
  private renderer!: WebGLRenderer;

  private readonly driectionalLight = markRaw(
    new DirectionalLight(0xffffff, 0.9)
  );

  created(): void {
    this.renderQueued = false;
    this.controls = null;
    this.camera = markRaw(new OrthographicCamera(-1, 1, 1, -1, 0.1, 6000));
    this.renderer = markRaw(new WebGLRenderer());

    // This ensures that lines are rendered and high DPI
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  @Prop({
    type: Object as () => RenderModel | null,
    default: null
  })
  readonly renderModel!: RenderModel | null;

  mounted(): void {
    this.sceneDiv = this.$refs.scene as HTMLDivElement;

    // Attach the renderer into the DIV element
    this.sceneDiv.appendChild(this.renderer.domElement);

    // Attach Orbit Controls to the camera
    this.controls = markRaw(
      new OrbitControls(this.camera, this.renderer.domElement)
    );
    this.controls.addEventListener("change", this.queueRender);

    this.reset();

    this.onResize();
  }

  @Watch("renderModel")
  handleRenderModelChange(): void {
    this.reset();
  }

  private reset(): void {
    if (!this.sceneDiv || !this.renderModel || !this.controls) {
      return;
    }

    // Add a directional light at the camera origin
    const bbox = this.renderModel.boundingBox();
    const m = Math.max(bbox.max.x, bbox.max.y, bbox.max.z) * 2;
    const middle = bbox.getCenter(new THREE.Vector3());

    // Use the bounding box to initialise the zoom on the camera
    this.camera.zoom = Math.min(
      this.sceneDiv.clientWidth / bbox.min.distanceTo(bbox.max),
      this.sceneDiv.clientHeight / bbox.min.distanceTo(bbox.max)
    );

    this.camera.position.set(m, m, m);
    this.camera.lookAt(middle);
    this.camera.updateProjectionMatrix();

    this.controls.target = middle;
    this.controls.update();

    this.doRender();
  }

  public onResize(): void {
    if (!this.sceneDiv) {
      return;
    }

    const w = this.sceneDiv.clientWidth;
    const h = this.sceneDiv.clientHeight;

    this.camera.left = -w;
    this.camera.right = w;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);

    this.doRender();
  }

  private queueRender(): void {
    // Ignore if there is already a render call in the queue.
    if (this.renderQueued) {
      return;
    }
    this.renderQueued = true;

    requestAnimationFrame(() => {
      this.doRender();
      this.renderQueued = false;
    });
  }

  private doRender(): void {
    if (!this.renderModel) {
      return;
    }

    const scene = this.renderModel.scene;

    // Add a directional light at the camera origin
    this.driectionalLight.position.copy(this.camera.position);
    scene.add(this.driectionalLight);

    try {
      // Render the scene
      this.renderer.render(scene, this.camera);
    } finally {
      // Remove the light
      scene.remove(this.driectionalLight);
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.scene {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' width='24' height='24' viewBox='-12 -12 24 24'%3E%3Cpath style='fill:%23ffffff' d='m 0,-12 c -1.865664,0 -3.3037593,1.481131 -4.28125,3.4511719 -0.4536378,0.9142643 -0.8075504,1.9945772 -1.0917969,3.1523437 L -5.859375,-5.265625 c -1.7093485,0.4604127 -3.1710607,1.1121796 -4.267578,1.9667969 C -11.223471,-2.4442108 -12,-1.310264 -12,0 c 0,1.865664 1.481131,3.303759 3.4511719,4.28125 0.9142643,0.453638 1.9945772,0.80755 3.1523437,1.091797 l 0.1308594,0.486328 c 0.4604127,1.709348 1.1121796,3.171061 1.9667969,4.267578 C -2.4442108,11.223471 -1.310264,12 0,12 0.987101,12 1.895792,11.549112 2.626953,10.869141 3.358114,10.189169 3.95313,9.275618 4.445312,8.193359 4.812517,7.385915 5.056919,6.397799 5.300781,5.416016 L 5.859375,5.265625 C 7.568723,4.805212 9.030436,4.153445 10.126953,3.298828 11.223471,2.444211 12,1.310264 12,0 12,-1.44 11.068696,-2.6535383 9.775391,-3.5527344 8.622569,-4.3542564 7.085648,-4.9381775 5.353516,-5.3535156 4.938177,-7.0856478 4.354256,-8.6225686 3.552734,-9.7753906 2.653538,-11.068696 1.44,-12 0,-12 Z m 0,2 c 0.283195,0 0.595084,0.1034166 0.921875,0.328125 C 0.632075,-9.820115 0.355607,-10 0,-10 Z m 0,2 c 0.01113,0 0.260249,0.072998 0.601562,0.6464844 0.179471,0.3015515 0.317977,0.9255704 0.482422,1.4101562 C 0.719055,-5.9599208 0.378473,-6 0,-6 h -0.01563 l -1.121094,0.037109 c 0.03232,-0.096118 0.0309,-0.2848559 0.06445,-0.375 0.240559,-0.6463392 0.515573,-1.132714 0.740243,-1.396484 C -0.107361,-7.998145 -0.006212,-8 0,-8 Z m -3.203125,2.4179688 c -0.345781,1.3056404 -0.6781641,2.6571262 -0.7597656,4.3281252 0.095228,-1.6216512 0.3820323,-3.0472294 0.7597656,-4.3281252 z M 0.011719,-4 c 0.82739,4.637e-4 1.629566,0.048326 2.386719,0.125 l 0.0332,0.00391 C 1.649511,-3.9410798 0.855965,-3.9996669 0.011719,-4 Z m 3.859375,1.5683594 0.0039,0.033203 C 3.952049,-1.637577 4,-0.831686 4,0 4,-0.848626 3.941418,-1.645734 3.871094,-2.4316406 Z M 1.580078,-1.916016 c 0.105767,0.0065 0.216009,0.0079 0.320313,0.01563 C 1.946508,-1.281449 2,-0.670385 2,0 2,0.813876 1.788761,1.311083 1.71875,2.054688 L -0.335938,0 Z m 4.363281,0.832032 c 0.484586,0.164445 1.108605,0.302951 1.410157,0.482422 C 7.927002,-0.260249 8,-0.011132 8,0 8,0.01544 7.97513,0.174718 7.580078,0.457031 7.240805,0.699481 6.600109,0.955773 5.890625,1.1875 5.910381,0.77882 6,0.42008 6,0 6,-0.378473 5.95992,-0.719055 5.943359,-1.083984 Z m 3.728516,0.162109 C 9.896583,-0.595084 10,-0.283195 10,0 10,0.261028 9.92024,0.536972 9.742188,0.826172 9.860216,0.564018 10,0.309147 10,0 10,-0.355607 9.820115,-0.632075 9.671875,-0.921875 Z m -19.4140625,0.0957 C -9.8602159,-0.564018 -10,-0.309147 -10,0 c 0,-0.261028 0.079759,-0.536972 0.2578125,-0.826172 z M -4.0195312,-0.5625 -4.0410156,0 h 0.8769531 L -4,0.835938 -4.8359375,0 h 0.7929687 z m -3.8203126,0.386719 0.9609376,0.960937 C -7.1928541,0.629053 -7.5728189,0.469639 -7.734375,0.332031 -7.998145,0.107361 -8,0.006212 -8,0 c 0,-0.005916 0.1333888,-0.128921 0.1601562,-0.175781 z M -2,1.664062 v 0.15625 c -0.050832,-0.0046 -0.082377,-0.01853 -0.1328125,-0.02344 z m 2,1.5 L 0.835938,4 0,4.835938 V 4.042969 L -0.5625,4.019531 0,4.041016 Z m -5.5820312,0.03906 C -4.2763908,3.548903 -2.924905,3.881286 -1.253906,3.962888 -2.8755572,3.867658 -4.3011354,3.580855 -5.5820312,3.203122 Z M 0.753906,6.910153 C 0.626772,7.161365 0.499811,7.525413 0.382812,7.673825 0.13353,7.990042 0.010382,8 0,8 -0.0059,8 -0.128921,7.866611 -0.175781,7.839844 Z M -0.826172,9.742185 C -0.564018,9.860216 -0.309147,10 0,10 -0.261028,10 -0.536972,9.92024 -0.826172,9.742188 Z' /%3E%3Cpath d='M -4,2.25 -7.25,-1 H -5 c 0.25,-5.61 2.39,-10 5,-10 2,0 3.77,2.64 4.55,6.45 C 8.36,-3.77 11,-2 11,0 11,1.83 8.83,3.43 5.6,4.3 L 5.89,2.27 C 7.8,1.72 9,0.91 9,0 9,-1.06 7.35,-2 4.87,-2.5 4.95,-1.71 5,-0.87 5,0 5,6.08 2.76,11 0,11 -1.83,11 -3.43,8.83 -4.3,5.6 l 2.03,0.29 C -1.72,7.8 -0.91,9 0,9 1.66,9 3,4.97 3,0 3,-1 2.95,-1.95 2.85,-2.85 1.95,-2.95 1,-3 0,-3 L -1.86,-2.94 -1.57,-4.95 0,-5 c 0.87,0 1.71,0.05 2.5,0.13 C 2,-7.35 1.06,-9 0,-9 c -1.54,0 -2.82,3.5 -3,8 h 2.25 L -4,2.25 M 2.25,4 -1,7.25 V 5 C -6.61,4.75 -11,2.61 -11,0 c 0,-1.83 2.17,-3.43 5.4,-4.3 l -0.29,2.03 C -7.8,-1.72 -9,-0.91 -9,0 c 0,1.54 3.5,2.82 8,3 V 0.75 Z' /%3E%3C/svg%3E")
      12 12,
    auto;
}
</style>
<style>
canvas:focus {
  outline: none;
}
</style>
