# gpx.studio - the online GPX file editor

This repository contains the source code of the website [gpx.studio](https://gpxstudio.github.io), an online tool for GPX editing.

![Preview of the online app.](preview.png)

## Features
* Import GPX files
* Draw new routes
* Edit traces
    * Move, insert and delete points
    * Cut from the start or the end
    * Change the starting time of the activity
    * Change the average speed of the activity
* Undo and redo
* Duplicate trace
* Reverse trace
* Combine and export multiple traces in the chosen order and respecting time precedence constraints (if any time data)
* Preserve and automatically extend speed, heart rate, cadence and temperature data
* Cycling and hiking maps, and Strava Heatmap layer
* Google Drive integration : select a file, save the new version and get a shareable link

## Future developments
* Merge traces from the UI
* Extend time data based on the slope and the existing uploaded data
* Allow more file formats
* Search bar for location

## Acknowledgements
This project would not have been possible without the following amazing projects :
* [Leaflet](https://leafletjs.com/) : awesome and easy map library
* [leaflet-gpx](https://github.com/mpetazzoni/leaflet-gpx) : parsing and displaying GPX files
* [Leaflet.Elevation](https://github.com/MrMufflon/Leaflet.Elevation) : elevation profiles
* [simplify2](https://github.com/geonome/simplify2-js) : line simplification algorithm
* [Font Awesome](https://fontawesome.com/) : nice icons
