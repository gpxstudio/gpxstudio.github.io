![logo of gpx.studio](res/logo.png)
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F1303GH)

This repository contains the source code of the website [**gpx.studio**](https://gpx.studio), an online tool for GPX editing.

## Run the code

To play with the code locally:
1. Get your own API token at [Mapbox](https://www.mapbox.com/) and put it in `res/config.json`
1. Launch a local server in the root directory, for example using `python3 -m http.server`
1. *(Optional)* To test the software with a routing server:
    - download [BRouter](https://github.com/abrensch/brouter) and follow the instructions [here](https://github.com/abrensch/brouter#brouter-on-windowslinuxmac-os) on how to launch a local instance
    - change the URL of the routing server in `res/config.json`

## Main features

* Load, edit and create new GPX files
* Support for multiple tracks (`<trk>`) and track segments (`<trkseg>`): extraction with smart waypoints matching and merge as track segments
* Support for waypoints (`<wpt>`): place and drag, edit information, duplicate
* Support for files with timestamps, temperature, heartrate, cadence and power data
* Change the starting time and speed of the activity
* Reverse the direction of a trace
* Reduce the number of track points
* Merge multiple traces together
* Delete points and/or waypoints inside or outside a rectangle selection
* View and rework the structure of the file
* Export multiple traces as one or separately in the chosen order and respecting time precedence constraints (if any time data)
* Drag and drop to load and export files
* Support as many traces as you want with scrollable tabs
* Support for custom map layers
* Google Drive integration and [add-on](https://gsuite.google.com/marketplace/app/gpxstudio_the_online_gpx_editor/666808960580): select a file, save the new version and get a shareable link as well as code to embed the map

Read the [User Guide](https://gpx.studio/about.html#guide) for more details.

## Contributing

If you think something is missing from the website, please create an issue to discuss it or make a pull request if you can implement it yourself.

## Translation

The website is translated by volunteers on a collaborative translation platform.
You can help complete and improve the translations by joining the [Crowdin project](https://crowdin.com/project/gpxstudio).
If you would like to start the translation in a new language, contact me or create an issue.
Apart from a good understanding of **gpx.studio**, some basic knowledge of HTML can be useful. Any help is greatly appreciated!

## Acknowledgements

This project would not have been possible without the following amazing projects:
* [Leaflet](https://leafletjs.com/): awesome map library
* [leaflet-gpx](https://github.com/mpetazzoni/leaflet-gpx): parsing GPX files
* [Leaflet.Heightgraph](https://github.com/GIScience/Leaflet.Heightgraph): elevation profile
* [Leaflet.Icon.Glyph](https://github.com/Leaflet/Leaflet.Icon.Glyph): markers with icons for the waypoints
* [Leaflet.TextPath](https://github.com/makinacorpus/Leaflet.TextPath): direction markers
* [Leaflet.VectorGrid](https://github.com/Leaflet/Leaflet.VectorGrid): to display some vector tiles
* [leaflet-distance-markers](https://github.com/adoroszlai/leaflet-distance-markers): distance markers
* [leaflet-control-window](https://github.com/mapshakers/leaflet-control-window): centered windows for all dialogs
* [leaflet-control-geocoder](https://github.com/perliedman/leaflet-control-geocoder): search for locations with chosen API
* [leaflet-locatecontrol](https://github.com/domoritz/leaflet-locatecontrol): center the map on user location
* [leaflet-overpass-layer](https://github.com/GuillaumeAmat/leaflet-overpass-layer): get POI from Overpass API
* [tilebelt](https://github.com/mapbox/tilebelt): find correct tiles to request and access elevation data
* [PNG.js](https://github.com/arian/pngjs): read raw PNG data to decode elevation from [Mapbox Terrain-RGB tiles](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/#mapbox-terrain-rgb)
* [simplify2](https://github.com/geonome/simplify2-js): line simplification algorithm
* [js-xss](https://github.com/leizongmin/js-xss): HTML sanitizer for waypoint text fields
* [SortableJS](https://github.com/SortableJS/Sortable): for swapping the tabs
* [Font Awesome](https://fontawesome.com/): nice icons

And of course [OpenStreetMap](https://www.openstreetmap.org/) for the worldwide map data on which are based most of the map layers and the routing server.
