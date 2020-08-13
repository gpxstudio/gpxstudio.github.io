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
* Merge traces
* Support for waypoints
* Export multiple traces as one or separately in the chosen order and respecting time precedence constraints (if any time data)
* Preserve and automatically extend speed, heart rate, cadence and temperature data
* Cycling and hiking maps, and Strava Heatmap layer
* Google Drive integration : select a file, save the new version and get a shareable link as well as code to embed the map

## Future developments
* Extend time data based on the slope and the existing uploaded data
* Allow more file formats
* Snap trace on road network

## Acknowledgements
This project would not have been possible without the following amazing projects :
* [Leaflet](https://leafletjs.com/) : awesome and easy map library
* [leaflet-gpx](https://github.com/mpetazzoni/leaflet-gpx) : parsing and displaying GPX files
* [Leaflet.Elevation](https://github.com/MrMufflon/Leaflet.Elevation) : elevation profiles
* [Leaflet.Icon.Glyph](https://github.com/Leaflet/Leaflet.Icon.Glyph) : markers with icons for the waypoints
* [simplify2](https://github.com/geonome/simplify2-js) : line simplification algorithm
* [Font Awesome](https://fontawesome.com/) : nice icons

And the data, maps and APIs from [OpenStreetMap](https://www.openstreetmap.org/), [Mapbox](https://www.mapbox.com/), [Thunderforest](https://www.thunderforest.com/), [Maps.Refuges.Info](https://wiki.openstreetmap.org/wiki/Hiking/mri), [Strava](https://strava.com) and [AirMap](https://www.airmap.com/).
