import LdrColor from "./files/LdrColor";
import MaterialFactory from "./MaterialFactory";
import PartDrawList from "./PartDrawList";
import DisposeTracker from "./DisposeTracker";
import VertexManager from "./VertexManager";
import Octree from "./Octree";
import {
  AmbientLight,
  Box3,
  Box3Helper,
  BufferAttribute,
  BufferGeometry,
  Color,
  Frustum,
  Group,
  LineSegments,
  Matrix4,
  Mesh,
  Ray,
  Scene,
  Vector3
} from "three";

export default class RenderModel {
  // Matrix used to invert the y-axis so that the OpenGL coordinate system matches the LDraw system.
  // eslint-disable-next-line prettier/prettier
  private readonly yAxisInvert = new Matrix4().set(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);

  // Used to avoid garbage when running vector calculations.
  private readonly tempVector1 = new Vector3();
  private readonly tempVector2 = new Vector3();
  private readonly tempVector3 = new Vector3();
  private readonly tempVector4 = new Vector3();

  // Keeps track of all the objects that need to be disposed
  private readonly disposables = new DisposeTracker();

  // List of all the draw lists for the parts
  public partDrawLists: PartDrawList[];

  // All the vertex bufers, indexed by color.
  private vertexBuffersByColor = new Map<LdrColor, BufferAttribute>();

  // Maps of lines, trangles and optional lines grouped by color.
  private readonly lineIndexesByColor = new Map<
    LdrColor,
    Uint32Array | Uint16Array
  >();
  private readonly triangleIndexesByColor = new Map<
    LdrColor,
    Uint32Array | Uint16Array
  >();
  private readonly optionalLineBuffersByColor = new Map<
    LdrColor,
    Float32Array[]
  >();

  // The entire 3D scene
  public readonly scene: Scene = new Scene();

  // The root group of the model.  This is shared with all the scene views that render the model
  private readonly group: Group = new Group();

  // The list of selected parts
  public selectedParts: PartDrawList[] = [];

  // Map of all the unique colors used in the model
  private readonly usedColors: Set<LdrColor> = new Set<LdrColor>();

  // Manages all the vertices
  private readonly vertexManager: VertexManager = new VertexManager();

  // Handles hit testing
  private readonly octree: Octree = new Octree();

  constructor(partDrawLists: PartDrawList[]) {
    this.partDrawLists = partDrawLists;

    // Build the scene for the render model
    this.scene.background = new Color(0xcdd2e0); // color-20

    this.scene.add(this.group);

    // Add ambient light
    const light = new AmbientLight(0x808080); // soft white light
    this.scene.add(light);

    // Initialise the root group
    this.group.matrixAutoUpdate = false; // This apparently makes things faster

    // Invert the y axis (-y is up)
    this.group.applyMatrix4(this.yAxisInvert);

    // Build a map of all the unique colors used in the model
    this.generateUsedColors();

    // Generate the initial mesh
    this.generateVertexBuffer();

    // Generate the vertex buffers
    this.vertexBuffersByColor = this.vertexManager.makeVertexBuffers();

    // Generate the transformed bounding boxes and Octree
    this.generateTransformedBoundingBoxes();
    this.octree.generate(partDrawLists);

    this.mergeDrawLists();
    this.generateMeshes();
  }

  public boundingBox(): Box3 {
    const box = new Box3();

    for (let i = this.partDrawLists.length - 1; i >= 0; i--) {
      box.union(this.partDrawLists[i].transformedBoundingBox);
    }

    // Apply the yAxis invert
    box.applyMatrix4(this.yAxisInvert);

    return box;
  }

  private generateUsedColors(): void {
    this.usedColors.clear();

    for (let i = this.partDrawLists.length - 1; i >= 0; i--) {
      const partDrawList = this.partDrawLists[i];

      for (const [color] of partDrawList.lineVertexesByColor) {
        this.usedColors.add(color);
      }
      for (const [color] of partDrawList.triangleVertexesByColor) {
        this.usedColors.add(color);
      }
      for (const [color] of partDrawList.optionalLineVertexesByColor) {
        this.usedColors.add(color);
      }
    }
  }

  private generateVertexBufferForPart(partDrawList: PartDrawList): void {
    for (const color of this.usedColors) {
      const vertexColorManager = this.vertexManager.getColorManager(
        color,
        partDrawList
      );

      const lineVertexes = partDrawList.lineVertexesByColor.get(color);
      if (lineVertexes) {
        for (let i = 0; i < lineVertexes.length; i++) {
          vertexColorManager.addLine(lineVertexes[i], partDrawList.matrix);
        }
      }

      const triangleVertexes = partDrawList.triangleVertexesByColor.get(color);
      if (triangleVertexes) {
        for (let i = 0; i < triangleVertexes.length; i++) {
          vertexColorManager.addTriangle(
            triangleVertexes[i],
            partDrawList.matrix
          );
        }
      }

      const optionalLineVertexes =
        partDrawList.optionalLineVertexesByColor.get(color);
      if (optionalLineVertexes) {
        // Obtain/create the buffers
        let optionalLineBuffers =
          partDrawList.optionalLineBuffersByColor.get(color);
        if (!optionalLineBuffers) {
          optionalLineBuffers = [[], [], [], []];
          partDrawList.optionalLineBuffersByColor.set(
            color,
            optionalLineBuffers
          );
        }
        const optionalLineVertexBuffer1 = optionalLineBuffers[0];
        const optionalLineVertexBuffer2 = optionalLineBuffers[1];
        const optionalLineControlBuffer1 = optionalLineBuffers[2];
        const optionalLineControlBuffer2 = optionalLineBuffers[3];

        const a = optionalLineVertexes[0];
        const b = optionalLineVertexes[1];
        const c = optionalLineVertexes[2];
        const d = optionalLineVertexes[3];

        for (let i = 0; i < a.length; i++) {
          const firstPoint = this.tempVector1
            .copy(a[i])
            .applyMatrix4(partDrawList.matrix);
          const secondPoint = this.tempVector2
            .copy(b[i])
            .applyMatrix4(partDrawList.matrix);
          const firstControlPoint = this.tempVector3
            .copy(c[i])
            .applyMatrix4(partDrawList.matrix);
          const secondControlPoint = this.tempVector4
            .copy(d[i])
            .applyMatrix4(partDrawList.matrix);

          optionalLineVertexBuffer1.push(
            firstPoint.x,
            firstPoint.y,
            firstPoint.z,
            secondPoint.x,
            secondPoint.y,
            secondPoint.z
          );
          optionalLineVertexBuffer2.push(
            secondPoint.x,
            secondPoint.y,
            secondPoint.z,
            firstPoint.x,
            firstPoint.y,
            firstPoint.z
          );
          optionalLineControlBuffer1.push(
            firstControlPoint.x,
            firstControlPoint.y,
            firstControlPoint.z,
            firstControlPoint.x,
            firstControlPoint.y,
            firstControlPoint.z
          );
          optionalLineControlBuffer2.push(
            secondControlPoint.x,
            secondControlPoint.y,
            secondControlPoint.z,
            secondControlPoint.x,
            secondControlPoint.y,
            secondControlPoint.z
          );
        }
      }
    }
  }

  private generateVertexBuffer(): void {
    for (const color of this.usedColors) {
      for (let i = 0; i < this.partDrawLists.length; i++) {
        const partDrawList = this.partDrawLists[i];

        const vertexColorManager = this.vertexManager.getColorManager(
          color,
          partDrawList
        );

        const lineVertexes = partDrawList.lineVertexesByColor.get(color);
        if (lineVertexes) {
          for (let i = 0; i < lineVertexes.length; i++) {
            vertexColorManager.addLine(lineVertexes[i], partDrawList.matrix);
          }
        }

        const triangleVertexes =
          partDrawList.triangleVertexesByColor.get(color);
        if (triangleVertexes) {
          for (let i = 0; i < triangleVertexes.length; i++) {
            vertexColorManager.addTriangle(
              triangleVertexes[i],
              partDrawList.matrix
            );
          }
        }

        const optionalLineVertexes =
          partDrawList.optionalLineVertexesByColor.get(color);
        if (optionalLineVertexes) {
          // Obtain/create the buffers
          let optionalLineBuffers =
            partDrawList.optionalLineBuffersByColor.get(color);
          if (!optionalLineBuffers) {
            optionalLineBuffers = [[], [], [], []];
            partDrawList.optionalLineBuffersByColor.set(
              color,
              optionalLineBuffers
            );
          }
          const optionalLineVertexBuffer1 = optionalLineBuffers[0];
          const optionalLineVertexBuffer2 = optionalLineBuffers[1];
          const optionalLineControlBuffer1 = optionalLineBuffers[2];
          const optionalLineControlBuffer2 = optionalLineBuffers[3];

          const a = optionalLineVertexes[0];
          const b = optionalLineVertexes[1];
          const c = optionalLineVertexes[2];
          const d = optionalLineVertexes[3];

          for (let i = 0; i < a.length; i++) {
            const firstPoint = this.tempVector1
              .copy(a[i])
              .applyMatrix4(partDrawList.matrix);
            const secondPoint = this.tempVector2
              .copy(b[i])
              .applyMatrix4(partDrawList.matrix);
            const firstControlPoint = this.tempVector3
              .copy(c[i])
              .applyMatrix4(partDrawList.matrix);
            const secondControlPoint = this.tempVector4
              .copy(d[i])
              .applyMatrix4(partDrawList.matrix);

            optionalLineVertexBuffer1.push(
              firstPoint.x,
              firstPoint.y,
              firstPoint.z,
              secondPoint.x,
              secondPoint.y,
              secondPoint.z
            );
            optionalLineVertexBuffer2.push(
              secondPoint.x,
              secondPoint.y,
              secondPoint.z,
              firstPoint.x,
              firstPoint.y,
              firstPoint.z
            );
            optionalLineControlBuffer1.push(
              firstControlPoint.x,
              firstControlPoint.y,
              firstControlPoint.z,
              firstControlPoint.x,
              firstControlPoint.y,
              firstControlPoint.z
            );
            optionalLineControlBuffer2.push(
              secondControlPoint.x,
              secondControlPoint.y,
              secondControlPoint.z,
              secondControlPoint.x,
              secondControlPoint.y,
              secondControlPoint.z
            );
          }
        }
      }
    }
  }

  private generateTransformedBoundingBoxes(): void {
    for (let i = this.partDrawLists.length - 1; i >= 0; i--) {
      const part = this.partDrawLists[i];
      part.transformedBoundingBox
        .copy(part.boundingBox)
        .applyMatrix4(part.matrix);
    }
  }

  public deleteParts(partsToDelete: PartDrawList[]): void {
    for (let i = partsToDelete.length - 1; i >= 0; i--) {
      const part = partsToDelete[i];

      // Remove the part
      const index = this.partDrawLists.indexOf(part);
      console.assert(index > -1);
      this.partDrawLists.splice(i, 1);

      // Free the index buffer entries it was using
      this.vertexManager.remove(part);
    }

    this.generateUsedColors();

    this.vertexBuffersByColor = this.vertexManager.makeVertexBuffers();

    // Generate the transformed bounding boxes and Octree
    this.generateTransformedBoundingBoxes();
    this.octree.generate(this.partDrawLists);

    this.mergeDrawLists();
    this.generateMeshes();
  }

  public addParts(partsToAdd: PartDrawList[]): void {
    this.partDrawLists.push(...partsToAdd);

    // Build a map of all the unique colors used in the model
    this.generateUsedColors();

    for (let i = partsToAdd.length - 1; i >= 0; i--) {
      this.generateVertexBufferForPart(partsToAdd[i]);
    }

    this.vertexBuffersByColor = this.vertexManager.makeVertexBuffers();

    // Generate the transformed bounding boxes and Octree
    this.generateTransformedBoundingBoxes();
    this.octree.generate(this.partDrawLists);

    this.mergeDrawLists();
    this.generateMeshes();
  }

  public addPart(partToAdd: PartDrawList): void {
    this.partDrawLists.push(partToAdd);

    // Build a map of all the unique colors used in the model
    this.generateUsedColors();

    this.generateVertexBufferForPart(partToAdd);

    this.vertexBuffersByColor = this.vertexManager.makeVertexBuffers();

    // Generate the transformed bounding boxes and Octree
    this.generateTransformedBoundingBoxes();
    this.octree.generate(this.partDrawLists);

    this.mergeDrawLists();
    this.generateMeshes();
  }

  public moveParts(partsToMove: PartDrawList[], matrix: Matrix4): void {
    for (let i = partsToMove.length - 1; i >= 0; i--) {
      const partDrawList = partsToMove[i];

      // Free the index buffer entries it was using
      this.vertexManager.remove(partDrawList);

      // Note the order here is important
      partDrawList.matrix = matrix.clone().multiply(partDrawList.matrix);

      // Re-Generate draw list from part with new matrix
      this.generateVertexBufferForPart(partDrawList);
    }

    this.vertexBuffersByColor = this.vertexManager.makeVertexBuffers();

    // Generate the transformed bounding boxes and Octree
    this.generateTransformedBoundingBoxes();
    this.octree.generate(this.partDrawLists);

    this.mergeDrawLists();
    this.generateMeshes();
  }

  private mergeDrawLists() {
    const t0 = performance.now();

    this.lineIndexesByColor.clear();
    this.triangleIndexesByColor.clear();
    this.optionalLineBuffersByColor.clear();

    // Iterate the list of colors.  This is done so we can
    // merge the mesh for a color all at once which avoids
    // storing and retrieving the meshes repeatidly for for
    // each part
    for (const color of this.usedColors) {
      // Count the number of elements needed in the buffer arrays
      let lineCount = 0;
      let optionalLineCount = 0;
      let triangleCount = 0;

      for (let i = this.partDrawLists.length - 1; i >= 0; i--) {
        const partDrawList = this.partDrawLists[i];

        const partLineIndexes = partDrawList.lineIndexesByColor.get(color);
        if (partLineIndexes) {
          lineCount += partLineIndexes.length;
        }

        const partOptionalLineBuffer =
          partDrawList.optionalLineBuffersByColor.get(color);
        if (partOptionalLineBuffer) {
          optionalLineCount += partOptionalLineBuffer[0].length;
        }

        const partTriangleIndexes =
          partDrawList.triangleIndexesByColor.get(color);
        if (partTriangleIndexes) {
          triangleCount += partTriangleIndexes.length;
        }
      }

      // Choose the appropriately sized index buffer based on the largest possible
      // index value we need to store
      const vertexBuffer = this.vertexBuffersByColor.get(color)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

      let lineIndexes: Uint32Array | Uint16Array;
      let triangleIndexes: Uint32Array | Uint16Array;

      if (vertexBuffer.count > 65535) {
        lineIndexes = new Uint32Array(lineCount);
        triangleIndexes = new Uint32Array(triangleCount);
      } else {
        lineIndexes = new Uint16Array(lineCount);
        triangleIndexes = new Uint16Array(triangleCount);
      }

      console.assert(optionalLineCount % 3 === 0);

      const optionalLineBuffer = [
        new Float32Array(optionalLineCount),
        new Float32Array(optionalLineCount),
        new Float32Array(optionalLineCount),
        new Float32Array(optionalLineCount)
      ];

      // Merge the draw lists for the current color from each part
      let lineOffset = 0;
      let optionalLineOffset = 0;
      let triangleOffset = 0;

      for (let i = this.partDrawLists.length - 1; i >= 0; i--) {
        const partDrawList = this.partDrawLists[i];

        const partLineIndexes = partDrawList.lineIndexesByColor.get(color);
        if (partLineIndexes) {
          lineIndexes.set(partLineIndexes, lineOffset);
          lineOffset += partLineIndexes.length;
        }

        const partOptionalLineBuffer =
          partDrawList.optionalLineBuffersByColor.get(color);
        if (partOptionalLineBuffer) {
          optionalLineBuffer[0].set(
            partOptionalLineBuffer[0],
            optionalLineOffset
          );
          optionalLineBuffer[1].set(
            partOptionalLineBuffer[1],
            optionalLineOffset
          );
          optionalLineBuffer[2].set(
            partOptionalLineBuffer[2],
            optionalLineOffset
          );
          optionalLineBuffer[3].set(
            partOptionalLineBuffer[3],
            optionalLineOffset
          );
          optionalLineOffset += partOptionalLineBuffer[0].length;
        }

        // Selected parts are not filled
        if (this.selectedParts.indexOf(partDrawList) >= 0) {
          continue;
        }

        const partTriangleIndexes =
          partDrawList.triangleIndexesByColor.get(color);
        if (partTriangleIndexes) {
          triangleIndexes.set(partTriangleIndexes, triangleOffset);
          triangleOffset += partTriangleIndexes.length;
        }
      }

      if (lineIndexes.length > 0) {
        this.lineIndexesByColor.set(color, lineIndexes);
      }
      if (optionalLineBuffer.length > 0) {
        this.optionalLineBuffersByColor.set(color, optionalLineBuffer);
      }
      if (triangleIndexes.length > 0) {
        this.triangleIndexesByColor.set(color, triangleIndexes);
      }
    }

    const t1 = performance.now();
    console.log("Draw list processing took " + (t1 - t0) + " ms.");
  }

  private generateMeshes() {
    const t0 = performance.now();
    let totalGroups = 0;
    let totalVertices = 0;
    let totalTriangleIndexes = 0;
    let totalLineIndexes = 0;
    let totalOptionalLineVertexes = 0;

    // Reset
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    this.disposables.mark();

    // Generate the meshes
    for (const [ldrColor, vertexBuffer] of this.vertexBuffersByColor) {
      totalVertices += vertexBuffer.count;

      // Generate all the optional lines
      const optionalLineBuffers = this.optionalLineBuffersByColor.get(ldrColor);
      if (optionalLineBuffers) {
        const geometry = this.disposables.track(new BufferGeometry());
        geometry.setAttribute(
          "position",
          new BufferAttribute(optionalLineBuffers[0], 3)
        );
        geometry.setAttribute(
          "position2",
          new BufferAttribute(optionalLineBuffers[1], 3)
        );
        geometry.setAttribute(
          "controlPoint1",
          new BufferAttribute(optionalLineBuffers[2], 3)
        );
        geometry.setAttribute(
          "controlPoint2",
          new BufferAttribute(optionalLineBuffers[3], 3)
        );

        const material = this.disposables.track(
          MaterialFactory.MakeOptionalLineMaterial(ldrColor)
        );

        const segments = new LineSegments(geometry, material);
        segments.matrixAutoUpdate = false; // This apparently makes things faster
        segments.frustumCulled = false; // This prevents the mesh from being tested against the frustum - which saves a lot of time.
        this.group.add(segments);

        totalGroups++;
        totalOptionalLineVertexes += optionalLineBuffers[0].length;
      }

      // Generate all the lines
      const lineIndexes = this.lineIndexesByColor.get(ldrColor);
      if (lineIndexes && lineIndexes.length > 0) {
        const geometry = this.disposables.track(new BufferGeometry());
        geometry.setAttribute("position", vertexBuffer);
        geometry.setIndex(new BufferAttribute(lineIndexes, 1));

        const material = this.disposables.track(
          MaterialFactory.MakeLineMaterial(ldrColor)
        );

        const segments = new LineSegments(geometry, material);
        segments.matrixAutoUpdate = false; // This apparently makes things faster
        segments.frustumCulled = false; // This prevents the mesh from being tested against the frustum - which saves a lot of time.
        this.group.add(segments);

        totalGroups++;
        totalLineIndexes += lineIndexes.length;
      }

      // Generate the vertex and index buffer - if needed for this part
      const triangleIndexes = this.triangleIndexesByColor.get(ldrColor);
      if (triangleIndexes && triangleIndexes.length > 0) {
        const geometry = this.disposables.track(new BufferGeometry());
        geometry.setAttribute("position", vertexBuffer);
        geometry.setIndex(new BufferAttribute(triangleIndexes, 1));

        const material = this.disposables.track(
          MaterialFactory.MakeMeshMaterial(ldrColor)
        );

        const mesh = new Mesh(geometry, material);
        mesh.matrixAutoUpdate = false; // This apparently makes things faster
        mesh.frustumCulled = false; // This prevents the mesh from being tested against the frustum - which saves a lot of time.

        this.group.add(mesh);

        totalGroups++;
        totalTriangleIndexes += triangleIndexes.length;
      }
    }

    const t1 = performance.now();
    console.log("Mesh generation took " + (t1 - t0) + " ms.");

    console.log(
      "Selected: " +
        this.selectedParts.length +
        " Groups: " +
        totalGroups +
        " Vertices: " +
        totalVertices +
        " Line Indices " +
        totalLineIndexes +
        " Optional Line Vertexes " +
        totalOptionalLineVertexes +
        " Trangle Indices" +
        totalTriangleIndexes
    );

    //this.group.add(this.octree.makeMesh());

    this.disposables.dispose();
  }

  public generateBoundingBoxMeshes(): Group {
    const group = new Group();

    for (let i = this.partDrawLists.length - 1; i >= 0; i--) {
      group.add(
        new Box3Helper(
          this.partDrawLists[i].transformedBoundingBox,
          new Color(1, 0, 0)
        )
      );
    }

    return group;
  }

  public updateSelection(): void {
    this.mergeDrawLists();
    this.generateMeshes();
  }

  public rayIntersect(ray: Ray): PartDrawList | null {
    // Invert the y-axis of the ray to mirror the y-axis inversion of
    // the root group
    const invertedRay = ray.clone().applyMatrix4(this.yAxisInvert);

    return this.octree.rayIntersect(invertedRay, this.vertexBuffersByColor);
  }

  public frustumIntersect(frustum: Frustum): PartDrawList[] {
    // Invert the y-axis of the ray to mirror the y-axis inversion of
    // the root group
    frustum = frustum.clone();

    const planes = frustum.planes;
    for (let i = planes.length - 1; i >= 0; i--) {
      planes[i].applyMatrix4(this.yAxisInvert);
    }

    return this.octree.frustumIntersect(frustum, this.vertexBuffersByColor);
  }

  public resetSelection(): void {
    this.octree.resetSelection();
  }
}
