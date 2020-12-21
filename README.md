# gpx.studio - the online GPX file editor
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F1303GH)

This repository contains the source code of the website [gpx.studio](https://gpxstudio.github.io), an online tool for GPX editing.

![Preview of the online app.](preview.png)

## Features
* Import GPX files
* Draw new routes
* Edit traces : move, insert and delete points
* Cut from the start or the end
* Change the starting time and average speed of the activity
* Add timestamps with constant speed or adapted to the elevation profile
* Undo and redo
* Duplicate trace
* Reverse trace
* Simplify trace
* Merge traces
* Support for waypoints : place and drag, edit information, duplicate
* Support for track segments (trkseg) : extraction with smart waypoints matching and merge as track segments
* Delete points and/or waypoints inside or outside a rectangle selection
* Export multiple traces as one or separately in the chosen order and respecting time precedence constraints (if any time data)
* Preserve and automatically extend speed, heart rate, cadence and temperature data
* Cycling and hiking maps, and Strava Heatmap layer
* Google Drive integration : select a file, save the new version and get a shareable link as well as code to embed the map

## Future developments
* Snap trace on road network
* Color lines with elevation or speed data
* Show/hide trace
* Show/hide elevation profile
* Refactor interface for better files management (when a lot of them)

## Acknowledgements
This project would not have been possible without the following amazing projects :
* [Leaflet](https://leafletjs.com/) : awesome map library
* [leaflet-gpx](https://github.com/mpetazzoni/leaflet-gpx) : parsing GPX files
* [Leaflet.Elevation](https://github.com/MrMufflon/Leaflet.Elevation) : elevation profile
* [Leaflet.Icon.Glyph](https://github.com/Leaflet/Leaflet.Icon.Glyph) : markers with icons for the waypoints
* [Leaflet.TextPath](https://github.com/makinacorpus/Leaflet.TextPath) : direction markers
* [leaflet-distance-markers](https://github.com/adoroszlai/leaflet-distance-markers) : distance markers
* [leaflet-control-window](https://github.com/mapshakers/leaflet-control-window) : centered windows for all dialogs
* [leaflet-control-geocoder](https://github.com/perliedman/leaflet-control-geocoder) : search for locations with chosen API
* [simplify2](https://github.com/geonome/simplify2-js) : line simplification algorithm
* [js-xss](https://github.com/leizongmin/js-xss) : HTML sanitizer for waypoint text fields
* [Font Awesome](https://fontawesome.com/) : nice icons

And the data, maps and APIs from [OpenStreetMap](https://www.openstreetmap.org/), [Mapbox](https://www.mapbox.com/), [Thunderforest](https://www.thunderforest.com/), [Maps.Refuges.Info](https://wiki.openstreetmap.org/wiki/Hiking/mri), [Strava](https://strava.com) and [AirMap](https://www.airmap.com/).
