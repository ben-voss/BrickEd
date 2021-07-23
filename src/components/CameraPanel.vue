<template>
  <div
    :class="['scene', 'pointer-' + mode]"
    ref="scene"
    v-on:pointerdown="handlePointerDown"
    v-on:pointerup="handlePointerUp"
    v-on:pointermove="handlePointerMove"
    v-on:keydown="keyDownHandler($event)"
    v-on:keyup="keyUpHandler($event)"
    v-on:focus="focusHandler($event)"
    v-resize="onResize"
    tabindex="0"
  >
    <div
      class="selectionRect"
      :style="{
        top: selectionRect.min.y + 'px',
        left: selectionRect.min.x + 'px',
        width: selectionRect.max.x + 'px',
        height: selectionRect.max.y + 'px',
        display: pointerCapture === -1 ? 'none' : 'block'
      }"
    ></div>
  </div>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Action, State } from "s-vuex-class";
import PartDrawList from "@/app/PartDrawList";
import {
  Box2,
  Box3,
  DirectionalLight,
  Frustum,
  MathUtils,
  Matrix4,
  MOUSE,
  OrthographicCamera,
  Quaternion,
  Raycaster,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer
} from "three";
import { Options, Vue } from "vue-class-component";
import { LazyInject, Symbols } from "../di";
import AppState from "@/store/AppState";
import { Store } from "vuex";
import { markRaw } from "@vue/reactivity";
import RenderModel from "@/app/RenderModel";

export type InteractionMode = "select" | "rotate" | "pan" | "centre";
export type GridSize = "large" | "medium" | "small";

@Options({})
export default class CameraPanel extends Vue {
  // x=-30.976, y=40.609, z=21.342
  // eslint-disable-next-line prettier/prettier
  public static readonly Angle3D = markRaw(CameraPanel.makeMatrix([0.7071088277269904, 0.000002512696022194394, -0.7071047346357171, 0, -0.2762875125104259, 0.9205060263844413, -0.2762858407894393, 0, 0.6508934752948157, 0.3907283652150334, 0.6508986314588661, 0, 0, 0, 0, 1]));

  // x=0, y=0, z=0
  // eslint-disable-next-line prettier/prettier
  public static readonly AngleFront = markRaw(CameraPanel.makeMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));

  // x=0, y=180, z=0
  // eslint-disable-next-line prettier/prettier
  public static readonly AngleBack = markRaw(CameraPanel.makeMatrix([-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1]));

  // x=0, y=-90, z=0
  // eslint-disable-next-line prettier/prettier
  public static readonly AngleLeft = markRaw(CameraPanel.makeMatrix([0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1]));

  // x=0, y=90, z=0
  // eslint-disable-next-line prettier/prettier
  public static readonly AngleRight = markRaw(CameraPanel.makeMatrix([0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]));

  // x=-90, y=0, z=0
  // eslint-disable-next-line prettier/prettier
  public static readonly AngleTop = markRaw(CameraPanel.makeMatrix([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]));

  // x=90, y=0, z=0
  // eslint-disable-next-line prettier/prettier
  public static readonly AngleBottom = markRaw(CameraPanel.makeMatrix([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]));

  private static makeMatrix(elements: number[]): Matrix4 {
    const m = new Matrix4();
    m.elements = elements;
    return m;
  }

  // Avoid queueing more than one render at a time.  This prevents stuttering when
  // responding to mouse interactions etc.
  private renderQueued!: boolean;

  private sceneDiv: HTMLDivElement | null = null;
  private controls!: OrbitControls | null;
  private camera!: OrthographicCamera;
  private renderer!: WebGLRenderer;
  private raycaster!: Raycaster;
  private mousePosition!: Vector2;

  private readonly driectionalLight = markRaw(
    new DirectionalLight(0xffffff, 0.9)
  );

  private pointerCapture = -1;
  private captureStartPosition = markRaw(new Vector2());
  private selectionRect = markRaw(new Box2());

  @Prop({
    type: String,
    default: "select"
  })
  public mode!: InteractionMode;

  @Prop({
    type: String,
    default: "medium"
  })
  public grid!: GridSize;

  @Prop({
    type: Object as () => Matrix4,
    default: markRaw(new Matrix4())
  })
  public angle!: Matrix4;

  @Prop({
    type: Number,
    default: 1
  })
  public zoom!: number;

  @Prop({
    type: Number,
    default: 0
  })
  public index!: number;

  @Prop({
    type: Boolean,
    default: false
  })
  public isActive!: boolean;

  @State("renderModel", { namespace: "document" })
  private renderModel!: RenderModel;

  @State("selection", { namespace: "document" })
  private selection!: PartDrawList[];

  @Action("setSelection", { namespace: "document" })
  private setSelection!: (args: { parts: PartDrawList[] }) => void;

  @Action("moveParts", { namespace: "document" })
  private moveParts!: (args: {
    parts: PartDrawList[];
    matrix: Matrix4;
  }) => void;

  //@Action("removeParts", { namespace: "model" })
  private removeParts!: (args: { parts: PartDrawList[] }) => void;

  private unsubscribe!: () => void;

  created(): void {
    this.renderQueued = false;
    this.controls = null;
    this.camera = markRaw(new OrthographicCamera(-1, 1, 1, -1, -6000, 6000));
    this.renderer = markRaw(new WebGLRenderer({ antialias: true }));
    this.raycaster = markRaw(new Raycaster());
    this.mousePosition = markRaw(new Vector2());

    // This ensures that lines are rendered in high DPI
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  @LazyInject(Symbols.Store)
  private store!: Store<AppState>;

  mounted(): void {
    this.sceneDiv = this.$refs.scene as HTMLDivElement;

    // Attach the renderer into the DIV element
    this.sceneDiv.appendChild(this.renderer.domElement);

    // Attach Orbit Controls to the camera
    this.controls = markRaw(
      new OrbitControls(this.camera, this.renderer.domElement)
    );
    this.controls.addEventListener("change", this.queueRender);
    this.setMode(this.mode, false);

    this.unsubscribe = this.store.subscribe((mutation) => {
      if (mutation.type.startsWith("document/")) {
        if (mutation.type === "document/setRenderModel") {
          this.reset();
        }

        this.queueRender();
      }
    });

    // Setup the camera
    this.reset();

    this.onResize();
  }

  beforeDestroy(): void {
    this.unsubscribe();
  }

  @Watch("angle")
  private handleAngleChanged(): void {
    if (!this.controls) {
      return;
    }

    const middle = this.controls.target;
    const distance = this.camera.position.distanceTo(middle);

    this.updateCameraAngle(middle, distance);
  }

  public reset(): void {
    if (!this.controls || !this.sceneDiv || !this.renderModel) {
      return;
    }

    if (!this.renderModel) {
      return;
    }

    const bbox = this.renderModel.boundingBox();
    const distance = Math.max(bbox.max.x, bbox.max.y, bbox.max.z) * 2;
    const middle = bbox.getCenter(new Vector3());

    // Use the bounding box to initialise the zoom on the camera
    const zoom =
      Math.min(
        this.sceneDiv.clientWidth / bbox.min.distanceTo(bbox.max),
        this.sceneDiv.clientHeight / bbox.min.distanceTo(bbox.max)
      ) * 1.7;

    this.$emit("update:zoom", zoom);

    // Set the rotation and distance from the middle of the bounding box
    this.updateCameraAngle(middle, distance);
  }

  private updateCameraAngle(middle: Vector3, m: number): void {
    if (!this.controls) {
      return;
    }

    // Generate the rotation and translation matrices
    const ts = new Matrix4().makeTranslation(0, 0, m);

    // Compose the rotation axes and then the translation
    const rot = this.angle.clone();
    rot.multiply(ts);

    // Set the position to zero, apply the camera position and then move to centre
    // the camera on the middle of the model.
    this.camera.position.set(0, 0, 0).applyMatrix4(rot).add(middle);
    this.camera.lookAt(middle);
    this.camera.updateProjectionMatrix();

    this.controls.target = middle;
    this.controls.update();

    this.doRender();
  }

  private handlePointerDown(e: PointerEvent): void {
    if (
      !this.renderModel ||
      !this.sceneDiv ||
      e.pointerType !== "mouse" ||
      e.button !== 0
    ) {
      return;
    }

    // Make this panel the active panel if it was not active.
    // This allows the user to change the active panel without
    // clearing an existing selection.
    if (!this.isActive) {
      this.sceneDiv.focus();

      if (this.mode === "select") {
        if (this.renderModel.selectedParts.length > 0) {
          return;
        }
      }
    }

    switch (this.mode) {
      case "select": {
        this.select(e);
        break;
      }
      case "centre": {
        this.centre(e);
        break;
      }
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.sceneDiv || e.pointerId !== this.pointerCapture) {
      return;
    }

    this.sceneDiv.releasePointerCapture(this.pointerCapture);

    this.pointerCapture = -1;

    e.stopImmediatePropagation();
    e.preventDefault();
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.sceneDiv || e.pointerId !== this.pointerCapture) {
      return;
    }

    // Update the selection rect coordinates
    this.selectionRect.set(
      new Vector2(
        Math.min(this.captureStartPosition.x, e.offsetX) +
          this.sceneDiv.offsetLeft,
        Math.min(this.captureStartPosition.y, e.offsetY) +
          this.sceneDiv.offsetTop
      ),
      new Vector2(
        Math.max(this.captureStartPosition.x, e.offsetX) -
          Math.min(this.captureStartPosition.x, e.offsetX),
        Math.max(this.captureStartPosition.y, e.offsetY) -
          Math.min(this.captureStartPosition.y, e.offsetY)
      )
    );

    // Do nothing when we have a de-generate size
    if (this.selectionRect.max.x < 1 || this.selectionRect.max.y < 1) {
      return;
    }

    const frustum = new Frustum();

    // eslint-disable-next-line prettier/prettier
    const left = (Math.min(this.captureStartPosition.x, e.offsetX) / this.sceneDiv.clientWidth) * 2 - 1;
    // eslint-disable-next-line prettier/prettier
    const top = -((Math.min(this.captureStartPosition.y, e.offsetY) / this.sceneDiv.clientHeight) * 2 - 1);
    // eslint-disable-next-line prettier/prettier
    const right = (Math.max(this.captureStartPosition.x, e.offsetX) / this.sceneDiv.clientWidth) * 2 - 1;
    // eslint-disable-next-line prettier/prettier
    const bottom = -((Math.max(this.captureStartPosition.y, e.offsetY) / this.sceneDiv.clientHeight) * 2 - 1);

    const nearTopLeft = new Vector3().set(left, top, -1);
    const nearTopRight = new Vector3().set(right, top, -1);
    const nearDownRight = new Vector3().set(right, bottom, -1);
    const nearDownLeft = new Vector3().set(left, bottom, -1);

    const farTopLeft = new Vector3().set(left, top, 1);
    const farTopRight = new Vector3().set(right, top, 1);
    const farDownRight = new Vector3().set(right, bottom, 1);
    const farDownLeft = new Vector3().set(left, bottom, 1);

    // Need to ensure the camera has updated matricies
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    nearTopLeft.unproject(this.camera);
    nearTopRight.unproject(this.camera);
    nearDownRight.unproject(this.camera);
    nearDownLeft.unproject(this.camera);

    farTopLeft.unproject(this.camera);
    farTopRight.unproject(this.camera);
    farDownRight.unproject(this.camera);
    farDownLeft.unproject(this.camera);

    const planes = frustum.planes;
    planes[0].setFromCoplanarPoints(nearTopLeft, farTopLeft, farTopRight);
    planes[1].setFromCoplanarPoints(nearTopRight, farTopRight, farDownRight);
    planes[2].setFromCoplanarPoints(farDownRight, farDownLeft, nearDownLeft);
    planes[3].setFromCoplanarPoints(farDownLeft, farTopLeft, nearTopLeft);
    planes[4].setFromCoplanarPoints(nearTopRight, nearDownRight, nearDownLeft);
    planes[5].setFromCoplanarPoints(farDownRight, farTopRight, farTopLeft);
    planes[5].normal.multiplyScalar(-1);

    const t0 = performance.now();

    const parts = this.renderModel.frustumIntersect(frustum);

    const t1 = performance.now();
    console.log("Frustum intersection took " + (t1 - t0) + " ms.");
    console.log(parts.length + " parts");

    this.setSelection({ parts });

    e.stopImmediatePropagation();
    e.preventDefault();
  }

  private centre(e: PointerEvent): void {
    if (!this.controls || !this.sceneDiv) {
      return;
    }

    // Calculate the pan offset
    const dx = this.sceneDiv.clientWidth / 2 - e.offsetX;
    const dy = this.sceneDiv.clientHeight / 2 - e.offsetY;

    const distX =
      (dx * (this.camera.right - this.camera.left)) /
      this.camera.zoom /
      this.sceneDiv.clientWidth;
    const distY =
      (dy * (this.camera.top - this.camera.bottom)) /
      this.camera.zoom /
      this.sceneDiv.clientHeight;

    const panOffset = new Vector3();
    panOffset.add(
      new Vector3()
        .setFromMatrixColumn(this.camera.matrix, 0) // get X column of objectMatrix
        .multiplyScalar(-distX)
    );

    panOffset.add(
      new Vector3()
        .setFromMatrixColumn(this.camera.matrix, 1) // get Y column of objectMatrix
        .multiplyScalar(distY)
    );

    // Copied from OrbitControls.update()
    const spherical = new Spherical();
    const offset = new Vector3();

    // so camera.up is the orbit axis
    const quat = new Quaternion().setFromUnitVectors(
      this.camera.up,
      new Vector3(0, 1, 0)
    );
    const quatInverse = quat.clone().inverse();

    const position = this.camera.position;

    offset.copy(position).sub(this.controls.target);
    offset.applyQuaternion(quat);
    spherical.setFromVector3(offset);

    // Apply the pan offset
    this.controls.target.add(panOffset);

    offset.setFromSpherical(spherical);
    offset.applyQuaternion(quatInverse);
    position.copy(this.controls.target).add(offset);

    this.camera.lookAt(this.controls.target);

    this.queueRender();
  }

  private select(e: PointerEvent): void {
    if (!this.sceneDiv || !this.renderModel) {
      return;
    }

    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    this.mousePosition.x = (e.offsetX / this.sceneDiv.clientWidth) * 2 - 1;
    this.mousePosition.y = -(e.offsetY / this.sceneDiv.clientHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mousePosition, this.camera);

    // Calculate objects intersecting the picking ray
    const t0 = performance.now();

    const hitPart = this.renderModel.rayIntersect(this.raycaster.ray);

    const t1 = performance.now();
    console.log("Ray intersection took " + (t1 - t0) + " ms.");

    // When nothing was hit we could be starting a marque selection
    if (hitPart === null) {
      //this.renderModelStore.getRenderModel().resetSelection();

      this.pointerCapture = e.pointerId;
      this.captureStartPosition.set(e.offsetX, e.offsetY);

      this.selectionRect.set(
        new Vector2(
          Math.min(this.captureStartPosition.x, e.offsetX) +
            this.sceneDiv.offsetLeft,
          Math.min(this.captureStartPosition.y, e.offsetY) +
            this.sceneDiv.offsetTop
        ),
        new Vector2(
          Math.max(this.captureStartPosition.x, e.offsetX) -
            Math.min(this.captureStartPosition.x, e.offsetX),
          Math.max(this.captureStartPosition.y, e.offsetY) -
            Math.min(this.captureStartPosition.y, e.offsetY)
        )
      );

      this.sceneDiv.setPointerCapture(this.pointerCapture);

      e.stopImmediatePropagation();
      e.preventDefault();
    }

    // When the shift key is pressed we add to the current selection
    let parts: PartDrawList[];
    if (e.shiftKey) {
      // Stop if nothing was selected and don't clear the current selection
      if (hitPart === null) {
        return;
      }

      parts = [...this.selection, hitPart];
    } else {
      if (hitPart === null) {
        parts = [];
      } else {
        parts = [hitPart];
      }
    }

    this.setSelection({ parts });
  }

  public onResize(): void {
    if (!this.sceneDiv) {
      return;
    }

    const w = this.sceneDiv.clientWidth;
    const h = this.sceneDiv.clientHeight;

    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);

    this.doRender();
  }

  private queueRender(): void {
    // Ignore if there is already a render call in the queue.
    if (this.renderQueued || !this.camera) {
      return;
    }

    this.renderQueued = true;

    // If the camera zoom has changed we sync the prop
    if (this.zoom !== this.camera.zoom) {
      this.$emit("update:zoom", this.camera.zoom);
    }

    // TODO sync the rotation as well

    // Queue an animation update
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

  @Watch("mode")
  private handleModeChanged(mode: InteractionMode): void {
    this.setMode(mode, false);
  }

  private setMode(mode: InteractionMode, invert: boolean): void {
    if (!this.controls) {
      return;
    }

    this.controls.enableRotate = mode !== "select";
    this.controls.enablePan = mode !== "select";

    switch (mode) {
      case "select": {
        this.controls.mouseButtons.LEFT = MOUSE.LEFT;
        break;
      }

      case "rotate": {
        if (invert) {
          this.controls.mouseButtons.LEFT = MOUSE.PAN;
          this.controls.mouseButtons.RIGHT = MOUSE.ROTATE;
        } else {
          this.controls.mouseButtons.LEFT = MOUSE.ROTATE;
          this.controls.mouseButtons.RIGHT = MOUSE.PAN;
        }
        break;
      }

      case "pan": {
        if (invert) {
          this.controls.mouseButtons.LEFT = MOUSE.ROTATE;
          this.controls.mouseButtons.RIGHT = MOUSE.PAN;
        } else {
          this.controls.mouseButtons.LEFT = MOUSE.PAN;
          this.controls.mouseButtons.RIGHT = MOUSE.ROTATE;
        }
        break;
      }
    }
  }

  @Watch("zoom")
  private handleZoomChange(): void {
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.queueRender();
  }

  public snapToGrid(): void {
    if (!this.renderModel) {
      return;
    }
  }

  public rotate(x: 1 | 0 | -1, y: 1 | 0 | -1, z: 1 | 0 | -1): void {
    if (this.selection.length === 0) {
      return;
    }

    // The size of the angle depends on the grid size
    let angle = 0;
    switch (this.grid) {
      case "large": {
        angle = 90;
        break;
      }
      case "medium": {
        angle = 45;
        break;
      }
      case "small": {
        angle = 15;
        break;
      }
    }

    let centre: Vector3;
    if (this.selection.length === 1) {
      // Rotate around the selected parts position
      const elements = this.selection[0].matrix.elements;
      centre = new Vector3(elements[12], elements[13], elements[14]);
    } else {
      // Rotate around the bounding box
      const bBox = new Box3();
      for (const part of this.selection) {
        bBox.union(part.boundingBox);
      }

      centre = bBox.getCenter(new Vector3());
    }

    // Make the translation matrix
    let translationMatrix = new Matrix4().makeTranslation(
      -centre.x,
      -centre.y,
      -centre.z
    );
    translationMatrix = new Matrix4()
      .makeRotationAxis(new Vector3(x, y, z), MathUtils.degToRad(angle))
      .multiply(translationMatrix);
    translationMatrix = new Matrix4()
      .makeTranslation(centre.x, centre.y, centre.z)
      .multiply(translationMatrix);

    // Apply the translation to the selected parts
    this.moveParts({
      parts: this.selection,
      matrix: translationMatrix
    });
  }

  public delete(): void {
    if (this.selection.length === 0) {
      return;
    }

    // Remove all the parts in the selection
    this.removeParts({ parts: this.selection });
  }

  // Move the selected pieces in the specified direction
  public nudge(x: number, y: number): void {
    if (!this.renderModel) {
      return;
    }

    if (this.selection.length === 0) {
      return;
    }

    // Make a screen-space vector representing the movement direction
    const screen = new Vector4().set(x, y, 0, 0);

    // Use the inverse of the camera matrix to project the screen vector
    // into model space.
    //const inversed = new THREE.Matrix4().getInverse(this.camera.matrixWorld);
    const inversed = new Matrix4().copy(this.camera.matrixWorld).invert();
    const unprojected = screen.applyMatrix4(inversed);

    // The component with the largest value is the model-space version of
    // the screen space axis this is normalized so we move a whole unit
    // in that direction.
    const vector = this.isolateLargestComponent(
      new Vector3(unprojected.x, unprojected.y, unprojected.z)
    ).normalize();

    // We move a piece more left/right than up/down because a plate is thinner than it is wide.
    // Use the first piece in the selection to work out which way up actually is and
    // use this to determine how far to move depending on the grid size
    //
    //          W     H
    // Large    1     3
    // Medium   1/2   1
    // Small    1/20  1/8
    //
    // LDraw parts are measured in LDraw Units (LDU)
    // 1 brick width/depth = 20 LDU
    // 1 brick height = 24 LDU
    // 1 plate height = 8 LDU
    // 1 stud diameter = 12 LDU
    // 1 stud height = 4 LDU
    const worldNudge = new Vector4(vector.x, vector.y, vector.z, 1);

    const partInverse = new Matrix4().copy(this.selection[0].matrix).invert();

    // Clear the translation elements
    partInverse.setPosition(0, 0, 0);

    const brickNudge = worldNudge.applyMatrix4(partInverse);

    // Scale the nudge by the grid size
    if (
      Math.abs(brickNudge.y) > Math.abs(brickNudge.x) &&
      Math.abs(brickNudge.y) > Math.abs(brickNudge.z)
    ) {
      // Up/Down
      switch (this.grid) {
        case "large": {
          vector.multiplyScalar(24);
          break;
        }
        case "medium": {
          vector.multiplyScalar(8);
          break;
        }
        case "small": {
          vector.multiplyScalar(1);
          break;
        }
      }
    } else {
      // Left/Right
      switch (this.grid) {
        case "large": {
          vector.multiplyScalar(20);
          break;
        }
        case "medium": {
          vector.multiplyScalar(10);
          break;
        }
        case "small": {
          vector.multiplyScalar(1);
          break;
        }
      }
    }

    // Create a translation matrix and apply it to each of the selected parts
    const matrix = new Matrix4().makeTranslation(vector.x, vector.y, vector.z);

    this.moveParts({ parts: this.selection, matrix });
  }

  private isolateLargestComponent(vector: Vector3): Vector3 {
    if (Math.abs(vector.x) > Math.abs(vector.y)) {
      vector.y = 0;

      if (Math.abs(vector.x) > Math.abs(vector.z)) {
        vector.z = 0;
      } else {
        vector.x = 0;
      }
    } else {
      vector.x = 0;

      if (Math.abs(vector.y) > Math.abs(vector.z)) {
        vector.z = 0;
      } else {
        vector.y = 0;
      }
    }

    return vector;
  }

  // Handle key down
  private keyDownHandler(event: KeyboardEvent) {
    console.log(event.key);

    switch (event.key.toLowerCase()) {
      case "backspace": {
        this.delete();
        return;
      }

      case "arrowup": {
        this.nudge(0, -1);
        return;
      }

      case "arrowdown": {
        this.nudge(0, 1);
        return;
      }

      case "arrowleft": {
        this.nudge(-1, 0);
        return;
      }

      case "arrowright": {
        this.nudge(1, 0);
        return;
      }

      case "shift":
      case "control":
      case "meta": {
        if (this.mode === "pan") {
          this.setMode("rotate", true);
        } else if (this.mode === "rotate") {
          this.setMode("pan", true);
        }
        break;
      }
    }
  }

  private keyUpHandler(event: KeyboardEvent) {
    console.log(event.key);

    switch (event.key.toLowerCase()) {
      case "shift":
      case "control":
      case "meta": {
        if (this.mode === "pan") {
          this.setMode("rotate", false);
        } else if (this.mode === "rotate") {
          this.setMode("pan", false);
        }
        break;
      }
    }
  }

  private focusHandler() {
    console.log("focusHandler");
    this.$emit("gotFocus", this);
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.pointer-select {
  cursor: default;
}

// https://yoksel.github.io/url-encoder/
.pointer-rotate {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' width='24' height='24' viewBox='-12 -12 24 24'%3E%3Cpath style='fill:%23ffffff' d='m 0,-12 c -1.865664,0 -3.3037593,1.481131 -4.28125,3.4511719 -0.4536378,0.9142643 -0.8075504,1.9945772 -1.0917969,3.1523437 L -5.859375,-5.265625 c -1.7093485,0.4604127 -3.1710607,1.1121796 -4.267578,1.9667969 C -11.223471,-2.4442108 -12,-1.310264 -12,0 c 0,1.865664 1.481131,3.303759 3.4511719,4.28125 0.9142643,0.453638 1.9945772,0.80755 3.1523437,1.091797 l 0.1308594,0.486328 c 0.4604127,1.709348 1.1121796,3.171061 1.9667969,4.267578 C -2.4442108,11.223471 -1.310264,12 0,12 0.987101,12 1.895792,11.549112 2.626953,10.869141 3.358114,10.189169 3.95313,9.275618 4.445312,8.193359 4.812517,7.385915 5.056919,6.397799 5.300781,5.416016 L 5.859375,5.265625 C 7.568723,4.805212 9.030436,4.153445 10.126953,3.298828 11.223471,2.444211 12,1.310264 12,0 12,-1.44 11.068696,-2.6535383 9.775391,-3.5527344 8.622569,-4.3542564 7.085648,-4.9381775 5.353516,-5.3535156 4.938177,-7.0856478 4.354256,-8.6225686 3.552734,-9.7753906 2.653538,-11.068696 1.44,-12 0,-12 Z m 0,2 c 0.283195,0 0.595084,0.1034166 0.921875,0.328125 C 0.632075,-9.820115 0.355607,-10 0,-10 Z m 0,2 c 0.01113,0 0.260249,0.072998 0.601562,0.6464844 0.179471,0.3015515 0.317977,0.9255704 0.482422,1.4101562 C 0.719055,-5.9599208 0.378473,-6 0,-6 h -0.01563 l -1.121094,0.037109 c 0.03232,-0.096118 0.0309,-0.2848559 0.06445,-0.375 0.240559,-0.6463392 0.515573,-1.132714 0.740243,-1.396484 C -0.107361,-7.998145 -0.006212,-8 0,-8 Z m -3.203125,2.4179688 c -0.345781,1.3056404 -0.6781641,2.6571262 -0.7597656,4.3281252 0.095228,-1.6216512 0.3820323,-3.0472294 0.7597656,-4.3281252 z M 0.011719,-4 c 0.82739,4.637e-4 1.629566,0.048326 2.386719,0.125 l 0.0332,0.00391 C 1.649511,-3.9410798 0.855965,-3.9996669 0.011719,-4 Z m 3.859375,1.5683594 0.0039,0.033203 C 3.952049,-1.637577 4,-0.831686 4,0 4,-0.848626 3.941418,-1.645734 3.871094,-2.4316406 Z M 1.580078,-1.916016 c 0.105767,0.0065 0.216009,0.0079 0.320313,0.01563 C 1.946508,-1.281449 2,-0.670385 2,0 2,0.813876 1.788761,1.311083 1.71875,2.054688 L -0.335938,0 Z m 4.363281,0.832032 c 0.484586,0.164445 1.108605,0.302951 1.410157,0.482422 C 7.927002,-0.260249 8,-0.011132 8,0 8,0.01544 7.97513,0.174718 7.580078,0.457031 7.240805,0.699481 6.600109,0.955773 5.890625,1.1875 5.910381,0.77882 6,0.42008 6,0 6,-0.378473 5.95992,-0.719055 5.943359,-1.083984 Z m 3.728516,0.162109 C 9.896583,-0.595084 10,-0.283195 10,0 10,0.261028 9.92024,0.536972 9.742188,0.826172 9.860216,0.564018 10,0.309147 10,0 10,-0.355607 9.820115,-0.632075 9.671875,-0.921875 Z m -19.4140625,0.0957 C -9.8602159,-0.564018 -10,-0.309147 -10,0 c 0,-0.261028 0.079759,-0.536972 0.2578125,-0.826172 z M -4.0195312,-0.5625 -4.0410156,0 h 0.8769531 L -4,0.835938 -4.8359375,0 h 0.7929687 z m -3.8203126,0.386719 0.9609376,0.960937 C -7.1928541,0.629053 -7.5728189,0.469639 -7.734375,0.332031 -7.998145,0.107361 -8,0.006212 -8,0 c 0,-0.005916 0.1333888,-0.128921 0.1601562,-0.175781 z M -2,1.664062 v 0.15625 c -0.050832,-0.0046 -0.082377,-0.01853 -0.1328125,-0.02344 z m 2,1.5 L 0.835938,4 0,4.835938 V 4.042969 L -0.5625,4.019531 0,4.041016 Z m -5.5820312,0.03906 C -4.2763908,3.548903 -2.924905,3.881286 -1.253906,3.962888 -2.8755572,3.867658 -4.3011354,3.580855 -5.5820312,3.203122 Z M 0.753906,6.910153 C 0.626772,7.161365 0.499811,7.525413 0.382812,7.673825 0.13353,7.990042 0.010382,8 0,8 -0.0059,8 -0.128921,7.866611 -0.175781,7.839844 Z M -0.826172,9.742185 C -0.564018,9.860216 -0.309147,10 0,10 -0.261028,10 -0.536972,9.92024 -0.826172,9.742188 Z' /%3E%3Cpath d='M -4,2.25 -7.25,-1 H -5 c 0.25,-5.61 2.39,-10 5,-10 2,0 3.77,2.64 4.55,6.45 C 8.36,-3.77 11,-2 11,0 11,1.83 8.83,3.43 5.6,4.3 L 5.89,2.27 C 7.8,1.72 9,0.91 9,0 9,-1.06 7.35,-2 4.87,-2.5 4.95,-1.71 5,-0.87 5,0 5,6.08 2.76,11 0,11 -1.83,11 -3.43,8.83 -4.3,5.6 l 2.03,0.29 C -1.72,7.8 -0.91,9 0,9 1.66,9 3,4.97 3,0 3,-1 2.95,-1.95 2.85,-2.85 1.95,-2.95 1,-3 0,-3 L -1.86,-2.94 -1.57,-4.95 0,-5 c 0.87,0 1.71,0.05 2.5,0.13 C 2,-7.35 1.06,-9 0,-9 c -1.54,0 -2.82,3.5 -3,8 h 2.25 L -4,2.25 M 2.25,4 -1,7.25 V 5 C -6.61,4.75 -11,2.61 -11,0 c 0,-1.83 2.17,-3.43 5.4,-4.3 l -0.29,2.03 C -7.8,-1.72 -9,-0.91 -9,0 c 0,1.54 3.5,2.82 8,3 V 0.75 Z' /%3E%3C/svg%3E")
      12 12,
    auto;
}

.pointer-pan {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath style='fill:%23ffffff;' d='m 12,0.3359375 -5,5 L 5.3359375,7 l -5,5 5,5 L 7,18.664062 l 5,5 5,-5 L 18.664062,17 l 5,-5 -5,-5 L 17,5.3359375 Z M 12,3.1640625 13.835938,5 H 12 10.164062 Z M 7,7 h 3 v 3 H 7 Z m 7,0 h 3 v 3 H 14 Z M 5,10.164062 V 12 13.835938 L 3.1640625,12 Z m 14,0 L 20.835938,12 19,13.835938 V 12 Z M 7,14 h 3 v 3 H 7 Z m 7,0 h 3 v 3 h -3 z m -3.835938,5 H 12 13.835938 L 12,20.835938 Z'/%3E%3Cpath d='m 13,6 v 5 h 5 V 7.75 L 22.25,12 18,16.25 V 13 h -5 v 5 h 3.25 L 12,22.25 7.75,18 H 11 V 13 H 6 v 3.25 L 1.75,12 6,7.75 V 11 h 5 V 6 H 7.75 L 12,1.75 16.25,6 Z'/%3E%3C/svg%3E")
      12 12,
    auto;
}

.pointer-centre {
  cursor: url("data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='32px' height='32px' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E %3Cpath d='M443.6,387.1L312.4,255.4l131.5-130c5.4-5.4,5.4-14.2,0-19.6l-37.4-37.6c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4 L256,197.8L124.9,68.3c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4L68,105.9c-5.4,5.4-5.4,14.2,0,19.6l131.5,130L68.4,387.1 c-2.6,2.6-4.1,6.1-4.1,9.8c0,3.7,1.4,7.2,4.1,9.8l37.4,37.6c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1L256,313.1l130.7,131.1 c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1l37.4-37.6c2.6-2.6,4.1-6.1,4.1-9.8C447.7,393.2,446.2,389.7,443.6,387.1z'/%3E %3C/svg%3E")
      12 12,
    auto;
}

.scene {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
}

.selectionRect {
  background-color: rgba($color-19, 0.5);
  border: 1px solid $color-3;
  position: absolute;
}
</style>
<style>
canvas:focus {
  outline: none;
}
</style>
