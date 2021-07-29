https://github.com/vue-electron/vuex-electron

Part Dictionary
* Map of part name to part objects

Part:
* List of child parts and each parts command, color, and transformation matrix: List<Tuple<Part, Command, Color, Matrix>>
* List of lines for this part and their colors: List<Tuple<Line, Command, Color>>
* List of optional lines for this part and their colors: List<Tuple<Line, Command, Color>>
* List of triangles for this part and their colors and surface normals: List<Tuple<Triangle, Command, Color, Normal>>
* Bounding box for the part
* Id in the part dictionary

The geometry and bounding box at each level is un-transformed.  To obtain the final position of the geometry, multiply by the part transformation matrix at each level.

Parts cannot be re-used between parents due to the way the geometry is inverted or the winding reverted as sub-parts are reused.

Parts are organised into a tree structure

 Model
  -> Part
      -> Part
          -> Part
      -> Part
      -> Part
          -> Part
          -> Part

Octree:
All the parts are loading in to a 3D Octree structure that recusivly sub-divides the transformed geometry of the model.  Minimum size of the octree is the thickness of a plate.


Wrap List

Depth first traversal of the part tree.  Extract the transformed geometry from the part and load it into an octree.  Traverse every trangle and mark those that form part of the exteria of the mesh and discard interior triangles.  Cache the result for re-use if a part sub-tree is re-used.

To determine the exteria mesh:

1 - Load all the geometry into the octree
2 - Cast a ray from a point on the edge of the mesh (min point will suffice) to the centre point of any triangle in the new geometry.
2 - Process the list of intersections and pick the one closest to the start point.
3 - Mark this as an exterior triangle.
4 - Foreach triangle that intersects the bounding box of the previous triangle:
    a - Determine if the two triangles are on the same plane with opposite normal vectors (i.e .they    
    directly face each other with no distance between them.)
    b - Subtract any overlapping regions of the two triangles from the model.
    c - mark the remaining areas as having been visited.
5 - For each remaining triangle that intersects the bounding box repeat step 4    

6 - Delete

