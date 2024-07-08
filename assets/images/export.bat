SET inkscape=C:\Program Files\Inkscape\bin\inkscape
SET output_directory=..\..\app\public\images\ui

del "%output_directory%\*" /F /Q

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="keyframe__duplicate" --export-filename="%output_directory%\keyframe__duplicate.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="view__grid" --export-filename="%output_directory%\view__grid.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="view__grid_enabled" --export-filename="%output_directory%\view__grid_enabled.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="view__help" --export-filename="%output_directory%\view__help.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="view__help_enabled" --export-filename="%output_directory%\view__help_enabled.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="common__delete" --export-filename="%output_directory%\common__delete.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="properties__open_path" --export-filename="%output_directory%\properties__open_path.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="properties__close_path" --export-filename="%output_directory%\properties__close_path.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="edit__undo" --export-filename="%output_directory%\edit__undo.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="edit__redo" --export-filename="%output_directory%\edit__redo.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="object2d__export" --export-filename="%output_directory%\object2d__export.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="object2d__copy" --export-filename="%output_directory%\object2d__copy.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="object2d__hidden" --export-filename="%output_directory%\object2d__hidden.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="object2d__visible" --export-filename="%output_directory%\object2d__visible.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="object2d__scene" --export-filename="%output_directory%\object2d__scene.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="create__import_json" --export-filename="%output_directory%\create__import_json.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="create__transform" --export-filename="%output_directory%\create__transform.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="create__path" --export-filename="%output_directory%\create__path.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="create__rectangle" --export-filename="%output_directory%\create__rectangle.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="create__ellipse" --export-filename="%output_directory%\create__ellipse.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="create__text" --export-filename="%output_directory%\create__text.png"

"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="drop__below" --export-filename="%output_directory%\drop__below.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="drop__above" --export-filename="%output_directory%\drop__above.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="drop__inside" --export-filename="%output_directory%\drop__inside.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="drop__below_hovered" --export-filename="%output_directory%\drop__below_hovered.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="drop__above_hovered" --export-filename="%output_directory%\drop__above_hovered.png"
"%inkscape%" ui.svg --export-area-drawing --export-type="png" --export-id-only --export-id="drop__inside_hovered" --export-filename="%output_directory%\drop__inside_hovered.png"

pause
