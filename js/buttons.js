// gpx.studio is an online GPX file editor which can be found at https://gpxstudio.github.io
// Copyright (C) 2020  Vianney Coppé
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

import Total from './total.js';
import Slider from './slider.js';
import Google from './google.js';

export default class Buttons {
    constructor() {
        // SETTINGS
        this.km = true;
        this.cycling = true;
        this.driving = false;
        this.routing = true;
        this.disable_trace = false;
        this.show_direction = false;
        this.show_distance = false;

        this.terrain_cache = new Map();
        this.tilebelt = require('/include/tilebelt/index.js');
        this.PNGReader = require('/include/png/PNGReader.js');

        // EMBEDDING
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        this.embedding = urlParams.has('embed');
        if (this.embedding) {
            if (urlParams.has('imperial')) this.km = false;
            if (urlParams.has('running')) this.cycling = false;
            if (urlParams.has('direction')) this.show_direction = true;
            if (urlParams.has('distance')) this.show_distance = true;
        }

        // MAIN MAP
        this.map = L.map('mapid', {
            zoomControl: false,
            minZoom: 2
        }).setView([0, 0], 2);
        this.map.addEventListener("locationfound", function (e) {
            e.target.setView(e.latlng,12);
        });
        if (!this.embedding && !urlParams.has('state')) this.map.locate({setView: true, maximumAge: 100000});

        // BUTTONS
        this.input = document.getElementById("input-file");
        this.load = document.getElementById("load");
        this.load2 = document.getElementById("load2");
        this.load_drive = document.getElementById("load-drive");
        this.draw = document.getElementById("manual");
        this.undo = document.getElementById("undo");
        this.redo = document.getElementById("redo");
        this.clear = document.getElementById("clear");
        this.clear2 = document.getElementById("clear2");
        this.cancel_clear = document.getElementById("cancelclear");
        this.help = document.getElementById("help");
        this.about = document.getElementById("about");
        this.donate = document.getElementById("donate");
        this.donate2 = document.getElementById("donate-2");
        this.delete = document.getElementById("delete");
        this.delete2 = document.getElementById("delete2");
        this.zone_delete = document.getElementById("zone-delete");
        this.zone_delete_ok = document.getElementById("zone-delete-ok");
        this.zone_delete_cancel = document.getElementById("zone-delete-cancel");
        this.zone_delete_pts = document.getElementById("zone-delete-points");
        this.zone_delete_wpts = document.getElementById("zone-delete-waypoints");
        this.hide = document.getElementById("hide");
        this.reverse = document.getElementById("reverse");
        this.extract = document.getElementById("extract");
        this.reduce = document.getElementById("reduce");
        this.reduce_ok = document.getElementById("reduce-ok");
        this.reduce_cancel = document.getElementById("reduce-cancel");
        this.reduce_slider = document.getElementById("reduce-slider");
        this.cancel_delete = document.getElementById("canceldelete");
        this.time = document.getElementById("edit-time");
        this.combine = document.getElementById("combine");
        this.duplicate = document.getElementById("duplicate");
        this.add_wpt = document.getElementById("add-wpt");
        this.color = document.getElementById("color");
        this.color_ok = document.getElementById("validate-color");
        this.color_cancel = document.getElementById("cancel-color");
        this.color_picker = document.getElementById("color-picker");
        this.color_checkbox = document.getElementById("color-checkbox");
        this.opacity_slider = document.getElementById("opacity-slider");
        this.opacity_checkbox = document.getElementById("opacity-checkbox");
        this.edit = document.getElementById("edit");
        this.validate = document.getElementById("validate");
        this.unvalidate = document.getElementById("unvalidate");
        this.crop_container = document.getElementById("crop-container");
        this.crop_ok = document.getElementById("crop-ok");
        this.crop_cancel = document.getElementById("crop-cancel");
        this.crop_keep = document.getElementById("crop-keep");
        this.export = document.getElementById("export");
        this.export2 = document.getElementById("export-2");
        this.save_drive = document.getElementById("save-drive");
        this.units = document.getElementById("units");
        this.activity = document.getElementById("activity");
        this.method = document.getElementById("method");
        this.chevrons = document.getElementById("chevrons");
        this.show_chevrons = document.getElementById("show-chevrons");
        this.dist_markers = document.getElementById("dist-markers");
        this.show_dist_markers = document.getElementById("show-dist-markers");
        this.profile = document.getElementById("profile");
        this.show_profile = document.getElementById("show-profile");
        this.bike = document.getElementById("bike");
        this.run = document.getElementById("run");
        this.drive = document.getElementById("drive");
        this.kms = document.getElementById("km");
        this.mi = document.getElementById("mi");
        this.route = document.getElementById("route");
        this.crow = document.getElementById("crow");
        this.merge = document.getElementById("merge");
        this.include_time = document.getElementById("include-time");
        this.include_hr = document.getElementById("include-hr");
        this.include_cad = document.getElementById("include-cad");
        this.include_atemp = document.getElementById("include-atemp");
        this.strava_ok = document.getElementById("strava-ok");
        this.copy_link = document.getElementById("copy-link");
        this.copy_embed = document.getElementById("copy-embed");
        this.merge_as_segments = document.getElementById("merge-as-segments");
        this.merge_cancel = document.getElementById("merge-cancel");
        this.buttons_bar = document.getElementById('buttons-bar');
        this.tabs = document.getElementById('sortable');

        // DISPLAYS
        this.distance_info = document.getElementById("distance");
        this.distance = document.getElementById("distance-val");
        this.elevation_info = document.getElementById("elevation");
        this.elevation = document.getElementById("elevation-val");
        this.duration_info = document.getElementById("duration");
        this.duration = document.getElementById("duration-val");
        this.speed_info = document.getElementById("speed");
        this.speed = document.getElementById("speed-val");
        this.points_info = document.getElementById("points");
        this.points = document.getElementById("points-val");
        this.segments_info = document.getElementById("segments");
        this.segments = document.getElementById("segments-val");
        this.live_distance = document.getElementById("live-distance");
        this.live_speed = document.getElementById("live-speed");
        this.live_elevation = document.getElementById("live-elevation");
        this.live_slope = document.getElementById("live-slope");
        this.trace_info_grid = document.getElementById('info-grid');
        this.slide_container = document.getElementById('slide-container');
        this.start_slider = document.getElementById('start-point');
        this.end_slider = document.getElementById('end-point');
        this.total_tab = document.getElementById('total-tab');
        this.tabs = document.getElementById('sortable');
        this.help_text = document.getElementById('help-text');
        this.export_content = document.getElementById('export-content');
        this.clear_content = document.getElementById('clear-content');
        this.delete_content = document.getElementById('delete-content');
        this.zone_delete_content = document.getElementById("zone-delete-content");
        this.strava_content = document.getElementById('strava-content');
        this.color_content = document.getElementById('color-content');
        this.reduce_content = document.getElementById('reduce-content');
        this.reduce_npoints = document.getElementById('reduce-npoints');
        this.load_content = document.getElementById('load-content');
        this.share_content = document.getElementById('share-content');
        this.merge_content = document.getElementById('merge-content');
        this.crop_content = document.getElementById('crop-content');
        this.embed_content = document.getElementById('embed-content');
        this.social_content = document.getElementById('social');
        this.trace_info_content = document.getElementById('info');
        this.toolbar_content = document.getElementById('toolbar');

        // TRANSLATED TEXT
        this.ok_button_text = document.getElementById('ok-button-text').textContent;
        this.cancel_button_text = document.getElementById('cancel-button-text').textContent;
        this.unit_kilometers_text = document.getElementById('unit-kilometers-text').textContent;
        this.unit_miles_text = document.getElementById('unit-miles-text').textContent;
        this.unit_meters_text = document.getElementById('unit-meters-text').textContent;
        this.unit_feet_text = document.getElementById('unit-feet-text').textContent;
        this.unit_hours_text = document.getElementById('unit-hours-text').textContent;
        this.unit_minutes_text = document.getElementById('unit-minutes-text').textContent;
        this.edit_info_text = document.getElementById('edit-info-text').textContent;
        this.duplicate_text = document.getElementById('duplicate-text').textContent;
        this.delete_text = document.getElementById('delete-text').textContent;
        this.split_text = document.getElementById('split-text').textContent;
        this.remove_pt_text = document.getElementById('remove-pt-text').textContent;
        this.speed_text = document.getElementById('speed-text').textContent;
        this.pace_text = document.getElementById('pace-text').textContent;
        this.start_text = document.getElementById('start-text').textContent;
        this.experimental_text = document.getElementById('experimental-text').textContent;
        this.experimental_info_text = document.getElementById('experimental-info-text').textContent;
        this.name_text = document.getElementById('name-text').textContent;
        this.comment_text = document.getElementById('comment-text').textContent;
        this.description_text = document.getElementById('description-text').textContent;
        this.symbol_text = document.getElementById('symbol-text').textContent;
        this.empty_title_text = document.getElementById('empty-title-text').textContent;

        // WINDOWS
        this.help_window = L.control.window(this.map,{title:'',content:this.help_text,className:'panels-container'});
        this.export_window = L.control.window(this.map,{title:'',content:this.export_content,className:'panels-container'});
        this.clear_window = L.control.window(this.map,{title:'',content:this.clear_content,className:'panels-container',closeButton:false});
        this.delete_window = L.control.window(this.map,{title:'',content:this.delete_content,className:'panels-container',closeButton:false});
        this.zone_delete_window = L.control.window(this.map,{title:'',content:this.zone_delete_content,className:'panels-container',closeButton:false});
        this.strava_window = L.control.window(this.map,{title:'',content:this.strava_content,className:'panels-container',closeButton:false});
        this.color_window = L.control.window(this.map,{title:'',content:this.color_content,className:'panels-container',closeButton:false});
        this.reduce_window = L.control.window(this.map,{title:'',content:this.reduce_content,className:'panels-container',closeButton:false});
        this.load_window = L.control.window(this.map,{title:'',content:this.load_content,className:'panels-container'});
        this.share_window = L.control.window(this.map,{title:'',content:this.share_content,className:'panels-container'});
        this.merge_window = L.control.window(this.map,{title:'',content:this.merge_content,className:'panels-container',closeButton:false});
        this.crop_window = L.control.window(this.map,{title:'',content:this.crop_content,className:'panels-container',closeButton:false});

        this.zoom = L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        var _this = this;

        // ELEVATION PROFILE
        const mapWidth = this.map._container.offsetWidth;
        var elevation_profile_width = Math.min((mapWidth - 270) * 2 / 3, 400);
        var mobileEmbeddingStyle = this.embedding && elevation_profile_width < 200;
        if (mobileEmbeddingStyle) elevation_profile_width = mapWidth * 4/5;
        this.elev = L.control.elevation({
            theme: "steelblue-theme",
            useHeightIndicator: true,
            width: elevation_profile_width,
        	height: 100,
            margins:{
                top:20,
                right:30,
                bottom:18,
                left:40
            }
        }).addTo(this.map);
        this.elev.buttons = this;
        this.elevation_profile = document.getElementsByClassName('elevation')[0];
        if (mobileEmbeddingStyle) {
            this.live_distance.style.display = 'none';
            this.live_speed.style.display = 'none';
            this.live_elevation.style.display = 'none';
            this.live_slope.style.display = 'none';

            this.elevation_profile.style.gridColumn = '1 / span 4';
            this.elevation_profile.style.gridRow = '1 / span 1';
            this.distance.style.gridColumn = '1 / span 1';
            this.distance.style.gridRow = '2 / span 1';
            this.distance_info.style.gridColumn = '1 / span 1';
            this.distance_info.style.gridRow = '3 / span 1';
            this.elevation.style.gridColumn = '2 / span 1';
            this.elevation.style.gridRow = '2 / span 1';
            this.elevation_info.style.gridColumn = '2 / span 1';
            this.elevation_info.style.gridRow = '3 / span 1';
            this.speed.style.gridColumn = '3 / span 1';
            this.speed.style.gridRow = '2 / span 1';
            this.speed_info.style.gridColumn = '3 / span 1';
            this.speed_info.style.gridRow = '3 / span 1';
            this.duration.style.gridColumn = '4 / span 1';
            this.duration.style.gridRow = '2 / span 1';
            this.duration_info.style.gridColumn = '4 / span 1';
            this.duration_info.style.gridRow = '3 / span 1';

            if (elevation_profile_width < 360) {
                this.distance.style.minWidth = 0;
                this.elevation.style.minWidth = 0;
                this.speed.style.minWidth = 0;
                this.duration.style.minWidth = 0;
            }

            if (elevation_profile_width < 300) {
                this.duration.style.display = 'none';
                this.duration_info.style.display = 'none';
                this.elevation_profile.style.gridColumn = '1 / span 3';
            }

            if (elevation_profile_width < 200) {
                this.speed.style.display = 'none';
                this.speed_info.style.display = 'none';
                this.elevation_profile.style.gridColumn = '1 / span 2';
            }
        }

        // OVERLAY COMPONENTS
        if (this.embedding) {
            this.buttons_bar.style.display = 'none';
            this.social_content.style.display = 'none';
            this.toolbar_content.style.display = 'none';
            this.units.style.display = 'none';
            this.activity.style.display = 'none';
            this.method.style.display = 'none';
            this.chevrons.style.display = 'none';
            this.dist_markers.style.display = 'none';
            this.profile.style.display = 'none';
            this.crop_container.style.display = 'none';
            this.slide_container.style.display = 'none';

            this.toolbar = L.control({position: 'topleft'});
            this.toolbar.onAdd = function (map) {
                var div = _this.embed_content;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.toolbar.addTo(this.map);

            this.embed_content.addEventListener('click', function () {
                window.open(queryString.replace('&embed','').replace('embed&','').replace('embed',''));
            });
        } else {
            this.toolbar = L.control({position: 'topleft'});
            this.toolbar.onAdd = function (map) {
                var div = _this.toolbar_content;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.toolbar.addTo(this.map);

            this.buttonbar = L.control({position: 'topleft'});
            this.buttonbar.onAdd = function (map) {
                var div = _this.buttons_bar;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.buttonbar.addTo(this.map);

            this.social = L.control({position: 'bottomright'});
            this.social.onAdd = function (map) {
                var div = _this.social_content;
                return div;
            };
            this.social.addTo(this.map);

            this.embed_content.style.display = 'none';

        }

        this.trace_info = L.control({position: 'bottomleft'});
        this.trace_info.onAdd = function (map) {
            var div = _this.trace_info_content;
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        this.trace_info.addTo(this.map);
        this.trace_info_grid.appendChild(this.elevation_profile);

        this.tabs.style.width = this.trace_info_grid.getBoundingClientRect().width+'px';

        this.slider = new Slider(this);

        this.hideTraceButtons();

        this.addHandlers();

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (urlParams.has('token')) _this.mapbox_token = urlParams.get('token');
                else {
                    _this.mapbox_token = xhr.responseText;
                    _this.mapbox_token = _this.mapbox_token.replace(/\s/g, '');
                }

                // TILES

                _this.openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                    maxZoom: 20,
                    maxNativeZoom: 19
                });

                _this.cyclOSM = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
                    maxZoom: 20,
                    attribution: '&copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                });

                _this.openHikingMap = L.tileLayer('https://maps.refuges.info/hiking/{z}/{x}/{y}.png', {
                    maxZoom: 20,
                    maxNativeZoom: 18,
                    attribution: '&copy; <a href="https://wiki.openstreetmap.org/wiki/Hiking/mri" target="_blank">sly</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                });

                _this.openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    maxZoom: 20,
                    maxNativeZoom: 17,
                    attribution: '&copy; <a href="https://www.opentopomap.org" target="_blank">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                });

                _this.ignMap = L.tileLayer('https://wxs.ign.fr/j5d7l46t2yri7bbc67krgo2b/geoportail/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&format=image/png&style=normal', {
                    minZoom : 0,
                    maxZoom : 18,
                    tileSize : 256,
                    attribution : "IGN-F/Géoportail"
                });

                if (_this.embedding) {
                    if (urlParams.has('token') && _this.supportsWebGL()) {
                        _this.mapboxMap = L.mapboxGL({
                            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                            maxZoom: 20,
                            accessToken: _this.mapbox_token,
                            style: 'mapbox://styles/mapbox/outdoors-v11',
                            interactive: true,
                            minZoom: 1,
                            dragRotate: false,
                            touchZoomRotate: false,
                            boxZoom: false,
                            dragPan: false,
                            touchPitch: false,
                            doubleClickZoom: false,
                            scrollZoom: false,
                            boxZoom: false
                        });
                    }

                    if (urlParams.has('source')) {
                        const mapSource = urlParams.get('source');
                        if (mapSource == 'osm') _this.openStreetMap.addTo(_this.map);
                        else if (mapSource == 'otm') _this.openTopoMap.addTo(_this.map);
                        else if (mapSource == 'ohm') _this.openHikingMap.addTo(_this.map);
                        else if (mapSource == 'cosm') _this.cyclOSM.addTo(_this.map);
                        else if (mapSource == 'ign') _this.ignMap.addTo(_this.map);
                        else if (mapSource == 'outdoors' && urlParams.has('token') && _this.supportsWebGL()) _this.mapboxMap.addTo(_this.map);
                        else if (mapSource == 'satellite' && urlParams.has('token') && _this.supportsWebGL()) {
                            _this.mapboxMap.addTo(_this.map);
                            _this.mapboxMap.options.style = "mapbox://styles/mapbox/satellite-v9";
                            _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/satellite-v9", {diff: false});
                        } else _this.openStreetMap.addTo(_this.map);
                    } else _this.openStreetMap.addTo(_this.map);

                    if (urlParams.has('token') && _this.supportsWebGL()) {
                        _this.controlLayers = L.control.layers({
                            "Mapbox Outdoors" : _this.mapboxMap,
                            "Mapbox Satellite" : _this.mapboxMap,
                            "OpenStreetMap" : _this.openStreetMap,
                            "OpenTopoMap" : _this.openTopoMap,
                            "OpenHikingMap" : _this.openHikingMap,
                            "CyclOSM" : _this.cyclOSM,
                            "IGN (FR)" : _this.ignMap
                        }).addTo(_this.map);

                        _this.addSwitchMapboxLayers();
                    } else {
                        _this.controlLayers = L.control.layers({
                            "OpenStreetMap" : _this.openStreetMap,
                            "OpenTopoMap" : _this.openTopoMap,
                            "OpenHikingMap" : _this.openHikingMap,
                            "CyclOSM" : _this.cyclOSM,
                            "IGN (FR)" : _this.ignMap
                        }).addTo(_this.map);
                    }
                } else {
                    L.Control.geocoder({
                        geocoder: new L.Control.Geocoder.Mapbox(_this.mapbox_token),
                        defaultMarkGeocode: false
                    }).on('markgeocode', function(e) {
                        var bbox = e.geocode.bbox;
                        _this.map.fitBounds(bbox);
                    }).addTo(_this.map);

                    _this.streetView = L.control({
                        position: 'topright'
                    });
                    _this.streetView.onAdd = function (map) {
                        var div = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
                        div.innerHTML = '<i class="fas fa-street-view custom-button" style="padding: 6px; font-size: 14px;"></i>';
                        L.DomEvent.disableClickPropagation(div);
                        _this.googleStreetView = div;
                        return div;
                    };
                    _this.streetView.addTo(_this.map);

                    _this.stravaHeatmap = L.tileLayer('https://heatmap-external-{s}.strava.com/tiles-auth/cycling/bluered/{z}/{x}/{y}.png', {
                        maxZoom: 20,
                        maxNativeZoom: 15,
                        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
                    });

                    if (_this.supportsWebGL()) {
                        _this.mapboxMap = L.mapboxGL({
                            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                            maxZoom: 20,
                            accessToken: _this.mapbox_token,
                            style: 'mapbox://styles/mapbox/outdoors-v11',
                            interactive: true,
                            minZoom: 1,
                            dragRotate: false,
                            touchZoomRotate: false,
                            boxZoom: false,
                            dragPan: false,
                            touchPitch: false,
                            doubleClickZoom: false,
                            scrollZoom: false,
                            boxZoom: false
                        }).addTo(_this.map);

                        _this.controlLayers = L.control.layers({
                            "Mapbox Outdoors" : _this.mapboxMap,
                            "Mapbox Satellite" : _this.mapboxMap,
                            "OpenStreetMap" : _this.openStreetMap,
                            "OpenTopoMap" : _this.openTopoMap,
                            "OpenHikingMap" : _this.openHikingMap,
                            "CyclOSM" : _this.cyclOSM,
                            "IGN (FR)" : _this.ignMap
                        },{
                            "Strava Heatmap" : _this.stravaHeatmap
                        }).addTo(_this.map);

                        _this.addSwitchMapboxLayers();
                    } else {
                        _this.openStreetMap.addTo(_this.map);

                        _this.controlLayers = L.control.layers({
                            "OpenStreetMap" : _this.openStreetMap,
                            "OpenTopoMap" : _this.openTopoMap,
                            "OpenHikingMap" : _this.openHikingMap,
                            "CyclOSM" : _this.cyclOSM,
                            "IGN (FR)" : _this.ignMap
                        },{
                            "Strava Heatmap" : _this.stravaHeatmap
                        }).addTo(_this.map);
                    }

                    _this.stravaHeatmap.on('tileload', function (e) {
                        _this.stravaHeatmap.is_loading = true;
                    });

                    _this.stravaHeatmap.on('tileerror', function (e) {
                        if (!_this.stravaHeatmap.is_loading) {
                            _this.stravaHeatmap.remove();
                            if (_this.window_open) _this.window_open.hide();
                            _this.window_open = _this.strava_window;
                            _this.strava_window.show();
                        }
                    });
                }

                const toggle = document.getElementsByClassName('leaflet-control-layers-toggle')[0];
                toggle.removeAttribute("href");
                toggle.classList.add('fas','fa-bars','custom-button');

                if (!_this.embedding) {
                    const settings_container = document.getElementsByClassName('leaflet-control-layers-list')[0];
                    const base = settings_container.childNodes[0];
                    const separator = settings_container.childNodes[1];
                    const overlays = settings_container.childNodes[2];

                    settings_container.appendChild(separator); // move separator after maps

                    const settings_list = document.createElement('ul');
                    settings_list.style = 'padding-inline-start: 20px;';

                    settings_list.appendChild(_this.method);
                    settings_list.appendChild(_this.activity);
                    settings_list.appendChild(_this.units);
                    settings_list.appendChild(_this.profile);
                    settings_list.appendChild(_this.chevrons);
                    settings_list.appendChild(_this.dist_markers);

                    settings_container.appendChild(settings_list);
                }

                _this.total = new Total(_this);
                _this.openURLs();
            }
        }
        xhr.open('GET', '/res/mapbox_token.txt');
        xhr.send();
    }

    addSwitchMapboxLayers() {
        const _this = this;
        const layerSelectors = _this.controlLayers._layerControlInputs;
        for (var i=0; i<layerSelectors.length; i++) {
            const span = layerSelectors[i].nextSibling;
            if (span.textContent.endsWith("Outdoors")) {
                _this.mapboxOutdoorsSelector = layerSelectors[i];
                _this.mapboxOutdoorsSelector.checked = (_this.mapboxMap == Object.values(_this.map._layers)[0]) && (_this.mapboxMap.options.style == "mapbox://styles/mapbox/outdoors-v11");
                _this.mapboxOutdoorsSelector.addEventListener('click', function () {
                    _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/outdoors-v11", {diff: false});
                });
            } else if (span.textContent.endsWith("Satellite")) {
                _this.mapboxSatelliteSelector = layerSelectors[i];
                _this.mapboxSatelliteSelector.checked = (_this.mapboxMap == Object.values(_this.map._layers)[0]) && (_this.mapboxMap.options.style == "mapbox://styles/mapbox/satellite-v9");
                _this.mapboxSatelliteSelector.addEventListener('click', function () {
                    _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/satellite-v9", {diff: false});
                });
            }
        }
    }

    hideTraceButtons() {
        this.slider.hide();
        this.delete.classList.add('unselected','no-click');
        this.zone_delete.classList.add('unselected','no-click');
        this.reverse.classList.add('unselected','no-click');
        this.edit.classList.add('unselected','no-click');
        this.time.classList.add('unselected','no-click');
        this.duplicate.classList.add('unselected','no-click');
        this.combine.classList.add('unselected','no-click');
        this.extract.classList.add('unselected','no-click');
        this.color.classList.add('unselected','no-click');
        this.add_wpt.classList.add('unselected','no-click');
        this.reduce.classList.add('unselected','no-click');
        this.hide.classList.add('unselected','no-click');
    }

    showTraceButtons() {
        this.slider.show();
        this.delete.classList.remove('unselected','no-click');
        this.zone_delete.classList.remove('unselected','no-click');
        this.reverse.classList.remove('unselected','no-click');
        this.edit.classList.remove('unselected','no-click');
        this.time.classList.remove('unselected','no-click');
        this.duplicate.classList.remove('unselected','no-click');
        this.extract.classList.remove('unselected','no-click');
        this.color.classList.remove('unselected','no-click');
        this.add_wpt.classList.remove('unselected','no-click');
        this.reduce.classList.remove('unselected','no-click');
        this.hide.classList.remove('unselected','no-click');
        if (this.total.traces.length > 1) this.combine.classList.remove('unselected','no-click');
    }

    greyTraceButtons() {
        this.slider.hide();
        this.delete.classList.add('unselected','no-click');
        this.zone_delete.classList.add('unselected','no-click');
        this.reverse.classList.add('unselected','no-click');
        this.time.classList.add('unselected','no-click');
        this.duplicate.classList.add('unselected','no-click');
        this.combine.classList.add('unselected','no-click');
        this.extract.classList.add('unselected','no-click');
        this.color.classList.add('unselected','no-click');
        this.add_wpt.classList.add('unselected','no-click');
        this.reduce.classList.add('unselected','no-click');
    }

    blackTraceButtons() {
        this.slider.show();
        this.delete.classList.remove('unselected','no-click');
        this.zone_delete.classList.remove('unselected','no-click');
        this.reverse.classList.remove('unselected','no-click');
        this.time.classList.remove('unselected','no-click');
        this.duplicate.classList.remove('unselected','no-click');
        this.extract.classList.remove('unselected','no-click');
        this.color.classList.remove('unselected','no-click');
        this.add_wpt.classList.remove('unselected','no-click');
        this.reduce.classList.remove('unselected','no-click');
        if (this.total.traces.length > 1) this.combine.classList.remove('unselected','no-click');
    }

    hideToolbars() {
        this.toolbar.getContainer().style.visibility = 'hidden';
        this.trace_info.getContainer().style.visibility = 'hidden';
        this.elev.hide();
        this.hideTraceButtons();
    }

    showToolbars() {
        this.elev.show();
        this.toolbar.getContainer().style.visibility = 'visible';
        this.trace_info.getContainer().style.visibility = 'visible';
        if (!this.total.hasFocus) {
             if (!this.total.traces[this.total.focusOn].isEdited) this.showTraceButtons();
         }
    }

    disableMap() {
        this.map.dragging.disable();
        this.map.touchZoom.disable();
        this.map.doubleClickZoom.disable();
        this.map.scrollWheelZoom.disable();
        this.map.boxZoom.disable();
        this.zoom.disable();
        if (this.map.tap) this.map.tap.disable();
    }

    enableMap() {
        this.map.dragging.enable();
        this.map.touchZoom.enable();
        this.map.doubleClickZoom.enable();
        this.map.scrollWheelZoom.enable();
        this.map.boxZoom.enable();
        this.zoom.enable();
        if (this.map.tap) this.map.tap.enable();
    }

    editToValidate() {
        this.edit.childNodes[0].classList.remove('fa-pencil-alt');
        this.edit.childNodes[0].classList.add('fa-check');
    }

    validateToEdit() {
        this.edit.childNodes[0].classList.remove('fa-check');
        this.edit.childNodes[0].classList.add('fa-pencil-alt');
    }

    hideToUnhide() {
        this.hide.childNodes[0].classList.remove('fa-eye-slash');
        this.hide.childNodes[0].classList.add('fa-eye');
    }

    unhideToHide() {
        this.hide.childNodes[0].classList.remove('fa-eye');
        this.hide.childNodes[0].classList.add('fa-eye-slash');
    }

    circlesToFront() {
        if (this.elev._startCircle) {
            this.elev._startCircle.bringToFront();
            this.elev._endCircle.bringToFront();
        }
    }

    addHandlers() {
        const buttons = this;
        const map = this.map;
        this.input.oninput = function() {
            buttons.loadFiles(this.files)
        };
        this.load.addEventListener("click", function () {
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.load_window;
            buttons.load_window.show();
        });
        this.load2.addEventListener("click", function () {
            buttons.input.click();
            buttons.load_window.hide();
        });
        this.load_drive.addEventListener("click", function () {
            buttons.google.loadPicker(false);
            buttons.load_window.hide();
        });
        this.donate.addEventListener("click", function () {
            buttons.donation();
        });
        this.donate2.addEventListener("click", function () {
            buttons.donation();
        });
        this.unvalidate.addEventListener("click", function () {
            buttons.slider.reset();
        });
        this.strava_ok.addEventListener("click", function () {
            buttons.strava_window.hide();
        });

        window.addEventListener('dragover', function (e) {
            e.preventDefault();
        });
        window.addEventListener('drop', function (e) {
            e.preventDefault();
            buttons.loadFiles(e.dataTransfer.files);
        });
    }

    addHandlersWithTotal(total) {
        this.google = new Google(this);
        this.total = total;
        this.elev.total = total;
        const buttons = this;
        const map = this.map;

        this.sortable = Sortable.create(this.tabs, {
            draggable: ".tab-draggable",
            setData: function (dataTransfer, dragEl) {
                const avgData = dragEl.trace.getAverageAdditionalData();
                const data = total.outputGPX(false, true, avgData.hr, avgData.atemp, avgData.cad, dragEl.trace.index);

                dataTransfer.setData('DownloadURL', 'application/gpx+xml:'+data[0].name+':data:text/plain;charset=utf-8,'+encodeURIComponent(data[0].text));
                dataTransfer.dropEffect = 'copy';
                dataTransfer.effectAllowed = 'copy';
            },
            onEnd: function (e) {
                const order = total.buttons.tabs.childNodes;
                const offset = 3;

                for (var i=offset; i<order.length; i++)
                    total.swapTraces(i-offset, order[i].trace.index);

                if (total.hasFocus) total.update();
            }
        });
        this.tabs.addEventListener('wheel', function(e) {
            if(e.type != 'wheel') {
                return;
            }
            let delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;
            delta = delta * (-100);
            buttons.tabs.scrollLeft -= delta;
            e.preventDefault();
        });
        L.DomEvent.on(this.tabs,"mousewheel",L.DomEvent.stopPropagation);
        L.DomEvent.on(this.tabs,"MozMousePixelScroll",L.DomEvent.stopPropagation);
        this.draw.addEventListener("click", function () {
            const newTrace = total.addTrace(undefined, "new.gpx");
            newTrace.draw();
            gtag('event', 'button', {'event_category' : 'draw'});
        });
        this.add_wpt.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            buttons.disable_trace = true;
            map._container.style.cursor = 'crosshair';
            var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
            if (mapboxgl_canvas.length > 0) {
                mapboxgl_canvas = mapboxgl_canvas[0];
                mapboxgl_canvas.style.cursor = 'crosshair';
            } else mapboxgl_canvas = null;
            map.addEventListener("click", function (e) {
                const trace = total.traces[total.focusOn];
                trace.addWaypoint(e.latlng);
                map._container.style.cursor = '';
                if (mapboxgl_canvas) mapboxgl_canvas.style.cursor = '';
                map.removeEventListener("click");
                buttons.disable_trace = false;
                gtag('event', 'button', {'event_category' : 'waypoint'});
            });
        });
        this.clear.addEventListener("click", function () {
            if (total.traces.length == 0) return;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.clear_window;
            buttons.clear_window.show();
        });
        this.clear2.addEventListener("click", function () {
            total.clear();
            buttons.clear_window.hide();
        });
        this.cancel_clear.addEventListener("click", function () {
            buttons.clear_window.hide();
        });
        this.delete.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.delete_window;
            buttons.delete_window.show();
        });
        this.delete2.addEventListener("click", function () {
            total.removeTrace(total.focusOn);
            buttons.delete_window.hide();
        });
        this.cancel_delete.addEventListener("click", function () {
            buttons.delete_window.hide();
        });
        this.zone_delete.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.zone_delete_window;

            map._container.style.cursor = 'crosshair';
            var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
            if (mapboxgl_canvas.length > 0) {
                mapboxgl_canvas = mapboxgl_canvas[0];
                mapboxgl_canvas.style.cursor = 'crosshair';
            } else mapboxgl_canvas = null;
            map.dragging.disable();

            var start_pt = null;

            const createRect = function (e) {
                map._container.style.cursor = '';
                if (mapboxgl_canvas) mapboxgl_canvas.style.cursor = '';
                if (buttons.window_open != buttons.zone_delete_window) {
                    map.removeEventListener("mousedown", createRect);
                    map.removeEventListener("mousemove", extendRect);
                    map.removeEventListener("click", endRect);
                    return;
                }
                buttons.zone_delete.rect = L.rectangle([
                    [e.latlng.lat, e.latlng.lng],
                    [e.latlng.lat, e.latlng.lng]
                ]).addTo(map);
                start_pt = e.latlng;
            };
            const extendRect = function (e) {
                if (buttons.zone_delete.rect) {
                    buttons.zone_delete.rect.setBounds(L.latLngBounds(start_pt, e.latlng));
                }
            };
            const endRect = function (e) {
                if (buttons.zone_delete.rect) {
                    map.removeEventListener("mousedown", createRect);
                    map.removeEventListener("mousemove", extendRect);
                    map.removeEventListener("click", endRect);

                    buttons.zone_delete_window.show();
                    buttons.zone_delete_window.addEventListener('hide', function (e) {
                        if (buttons.zone_delete.rect) buttons.zone_delete.rect.remove();
                        buttons.zone_delete.rect = null;
                    });
                }
            };

            map.addEventListener("mousedown", createRect);
            map.addEventListener("mousemove", extendRect);
            map.addEventListener("click", endRect);
        });
        this.zone_delete_ok.addEventListener("click", function () {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
            trace.deleteZone(buttons.zone_delete.rect.getBounds(),
                buttons.zone_delete_pts.checked,
                buttons.zone_delete_wpts.checked,
                document.querySelector('input[name="where"]:checked').value == 'inside');
            buttons.zone_delete_window.hide();
            gtag('event', 'button', {'event_category' : 'zone-delete'});
        });
        this.zone_delete_cancel.addEventListener("click", function () {
            buttons.zone_delete_window.hide();
        });
        this.export.addEventListener("click", function () {
            if (total.traces.length > 0) {
                buttons.merge.checked = false;
                if (total.getMovingTime() == 0) {
                    buttons.include_time.checked = false;
                    buttons.include_time.disabled = true;
                } else {
                    buttons.include_time.checked = true;
                    buttons.include_time.disabled = false;
                }
                const additionalData = total.getAverageAdditionalData();
                if (!additionalData.hr) {
                    buttons.include_hr.checked = false;
                    buttons.include_hr.disabled = true;
                } else {
                    buttons.include_hr.checked = true;
                    buttons.include_hr.disabled = false;
                }
                if (!additionalData.cad) {
                    buttons.include_cad.checked = false;
                    buttons.include_cad.disabled = true;
                } else {
                    buttons.include_cad.checked = true;
                    buttons.include_cad.disabled = false;
                }
                if (!additionalData.atemp) {
                    buttons.include_atemp.checked = false;
                    buttons.include_atemp.disabled = true;
                } else {
                    buttons.include_atemp.checked = true;
                    buttons.include_atemp.disabled = false;
                }
                if (buttons.window_open) buttons.window_open.hide();
                buttons.window_open = buttons.export_window;
                buttons.export_window.show();
            }
        });
        this.export2.addEventListener("click", function () {
            const mergeAll = buttons.merge.checked;
            const time = buttons.include_time.checked;
            const hr = buttons.include_hr.checked;
            const atemp = buttons.include_atemp.checked;
            const cad = buttons.include_cad.checked;

            const output = total.outputGPX(mergeAll, time, hr, atemp, cad);
            for (var i=0; i<output.length; i++)
                buttons.download(output[i].name, output[i].text);

            buttons.export_window.hide();
            gtag('event', 'button', {'event_category' : 'export'});
        });
        this.save_drive.addEventListener("click", function () {
            buttons.export_window.hide();
            buttons.google.loadPicker(true);
        });
        this.validate.addEventListener("click", function () {
            if (total.hasFocus) return;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.crop_window;
            buttons.crop_window.show();
        });
        this.crop_ok.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            const start = Math.max(0, total.buttons.slider.getIndexStart()-1);
            const end = Math.min(trace.getPoints().length-1, total.buttons.slider.getIndexEnd()+1);
            total.traces[total.focusOn].crop(start, end, !buttons.crop_keep.checked);
            buttons.crop_window.hide();
            gtag('event', 'button', {'event_category' : 'crop'});
        });
        this.crop_cancel.addEventListener("click", function () {
            buttons.crop_window.hide();
        });
        buttons.kms.classList.add("selected");
        this.units.addEventListener("click", function () {
            buttons.km = !buttons.km;
            if (buttons.km) {
                buttons.kms.classList.add("selected");
                buttons.mi.classList.remove("selected");
            } else {
                buttons.kms.classList.remove("selected");
                buttons.mi.classList.add("selected");
            }
            const focus = total.hasFocus ? total : total.traces[total.focusOn];
            focus.showData();
            focus.showElevation();
            if (!total.hasFocus) focus.showDistanceMarkers();
        });
        buttons.bike.classList.add("selected");
        this.activity.addEventListener("click", function () {
            if (buttons.cycling) {
                if (buttons.driving) buttons.driving = false;
                else buttons.cycling = false;
            } else {
                buttons.cycling = true;
                buttons.driving = true;
            }
            buttons.bike.classList.remove("selected");
            buttons.run.classList.remove("selected");
            buttons.drive.classList.remove("selected");
            if (buttons.cycling) {
                if (buttons.driving) buttons.drive.classList.add("selected");
                else buttons.bike.classList.add("selected");
                buttons.stravaHeatmap.setUrl('https://heatmap-external-{s}.strava.com/tiles-auth/cycling/bluered/{z}/{x}/{y}.png');
            } else {
                buttons.run.classList.add("selected");
                buttons.stravaHeatmap.setUrl('https://heatmap-external-{s}.strava.com/tiles-auth/running/bluered/{z}/{x}/{y}.png');
            }
            if (total.hasFocus) total.showData();
            else total.traces[total.focusOn].showData();
        });
        buttons.route.classList.add("selected");
        this.method.addEventListener("click", function () {
            buttons.routing = !buttons.routing;
            if (buttons.routing) {
                buttons.route.classList.add("selected");
                buttons.crow.classList.remove("selected");
            } else {
                buttons.route.classList.remove("selected");
                buttons.crow.classList.add("selected");
            }
            if (total.hasFocus) total.showData();
            else total.traces[total.focusOn].showData();
        });
        this.map.addEventListener("zoomend", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) trace.updateEditMarkers();
        });
        this.edit.addEventListener("click", function() {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
            if (trace.isEdited) {
                trace.stopEdit();
                if (trace.drawing) trace.stopDraw();
                gtag('event', 'button', {'event_category' : 'edit-trace'});
            } else trace.draw();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                if (buttons.window_open) buttons.window_open.hide();
                if (total.hasFocus) return;
                var trace = total.traces[total.focusOn];
                if (trace.isEdited) buttons.edit.click();
            } else if (e.key === "F1") {
                if (map.hasLayer(buttons.stravaHeatmap)) buttons.stravaHeatmap.remove();
                else buttons.stravaHeatmap.addTo(map);
            } else if (e.key === "F2") {
                buttons.method.click();
            } else if (e.key === "F3") {
                buttons.activity.click();
            } else if (e.key === "F4") {
                buttons.units.click();
            } else if (e.key == "h" && (e.ctrlKey || e.metaKey)) {
                buttons.show_profile.click();
                e.preventDefault();
            } else if (e.key == "z" && (e.ctrlKey || e.metaKey)) {
                buttons.undo.click();
                e.preventDefault();
            } else if (e.key == "y" && (e.ctrlKey || e.metaKey)) {
                buttons.redo.click();
                e.preventDefault();
            } else if (e.key == "s" && (e.ctrlKey || e.metaKey)) {
                buttons.export.click();
                e.preventDefault();
            } else if (e.key == "k" && (e.ctrlKey || e.metaKey)) {
                buttons.clear.click();
                e.preventDefault();
            } else if (e.key == "o" && (e.ctrlKey || e.metaKey)) {
                buttons.load.click();
                e.preventDefault();
            } else if (e.key == "d" && (e.ctrlKey || e.metaKey)) {
                buttons.draw.click();
                e.preventDefault();
            }
        });
        this.reverse.addEventListener("click", function() {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            trace.reverse();
            gtag('event', 'button', {'event_category' : 'reverse'});
        });
        this.extract.addEventListener("click", function() {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.can_extract) return;
            trace.extract_segments();
            gtag('event', 'button', {'event_category' : 'extract'});
        });
        const sliderCallback = function() {
            const npoints = buttons.reduce.trace.previewSimplify(buttons.reduce_slider.value);
            buttons.reduce_npoints.innerHTML = npoints + '/' + buttons.reduce.trace.getPoints().length;
        };
        this.reduce.addEventListener("click", function() {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            buttons.reduce.trace = total.traces[total.focusOn];
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.reduce_window;
            buttons.reduce_window.show();
            buttons.reduce_window.addEventListener('hide', function (e) {
                buttons.reduce.trace.cancelSimplify();
            });
            buttons.reduce_slider.value = 500;
            sliderCallback();
        });
        this.reduce_ok.addEventListener("click", function() {
            buttons.reduce.trace.simplify();
            buttons.reduce_window.hide();
            gtag('event', 'button', {'event_category' : 'simplify'});
        });
        this.reduce_cancel.addEventListener("click", function() {
            buttons.reduce_window.hide();
        });
        this.reduce_slider.addEventListener("input", sliderCallback);
        map.on('mouseup', function (e) {
            map.dragging.enable();
            map.removeEventListener('mousemove');
            if (map._draggedMarker) {
                if (total.hasFocus) return;
                var trace = total.traces[total.focusOn];
                const marker = map._draggedMarker;
                marker.getElement().style.cursor = 'pointer';
                if (marker._pt) {
                    trace.updatePoint(marker, e.latlng.lat, e.latlng.lng);
                    trace.refreshEditMarkers();
                    map._container.style.cursor = 'crosshair';
                } else {
                    if (marker._latlng != marker._latlng_origin) {
                        marker._latlng.meta = {'ele': 0};
                        trace.askElevation([marker._latlng], true);
                    }
                    if (trace.isEdited) map._container.style.cursor = 'crosshair';
                    else map._container.style.cursor = '';
                }
                map._draggedMarker = null;
            }
        });
        this.time.addEventListener("click", function (e) {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();

            var content = `<div id="speed-change" style="padding-bottom:4px;">`;

            if (buttons.cycling) {
                content += buttons.speed_text + ` <input type="number" id="speed-input" min="1.0" max="99.9" step="0.1" lang="en-150"> `;
                if (buttons.km) content += buttons.unit_kilometers_text + '/' + buttons.unit_hours_text + `</div>`;
                else content += buttons.unit_miles_text + '/' + buttons.unit_hours_text + `</div>`;
            } else {
                content += buttons.pace_text + ` <input type="number" id="minutes" min="1" max="59" step="1">
                            :
                            <input type="number" id="seconds" min="0" max="59" step="1"> `;
                if (buttons.km) content += buttons.unit_minutes_text + '/' + buttons.unit_kilometers_text + `</div>`;
                else content += buttons.unit_minutes_text + '/' + buttons.unit_miles_text + `</div>`;
            }

            content += `<div id="start-change">`+buttons.start_text+`
                        <input type="datetime-local" id="start-time"></div></div><br>
                        <div><b style="color:red; vertical-align:top">`+buttons.experimental_text+`</b>  <div style="max-width: 200px;display: inline-block;white-space: normal;">`+buttons.experimental_info_text+`</div><input type="checkbox" id="slope-speed" style="vertical-align:top"></div><br>
                        <div id="edit-speed" class="panels custom-button normal-button">`+buttons.ok_button_text+`</div>
                        <div id="cancel-speed" class="panels custom-button normal-button"><b>`+buttons.cancel_button_text+`</b></div>`;

            if (buttons.window_open) buttons.window_open.hide();
            buttons.time.window = L.control.window(map,{title:'','content':content,className:'panels-container',visible:true,closeButton:false});
            buttons.window_open = buttons.time.window;
            buttons.time.window.addEventListener('hide', function () {
                buttons.time.window.remove();
            });

            var offset = -(new Date().getTimezoneOffset() / 60);

            var speed = document.getElementById("speed-input");
            var minutes = document.getElementById("minutes");
            var seconds = document.getElementById("seconds");
            var slope_speed = document.getElementById("slope-speed");

            var speedChange = false;

            if (buttons.cycling) {
                speed.value = Math.max(1, trace.getMovingSpeed().toFixed(1));
                speed.addEventListener("change", function () {
                    speedChange = true;
                });
            } else {
                var pace = Math.floor(trace.getMovingPace() / 1000);
                minutes.value = Math.floor(pace / 60);
                seconds.value = pace % 60;
                minutes.addEventListener("change", function () {
                    speedChange = true;
                });
                seconds.addEventListener("change", function () {
                    speedChange = true;
                });
            }

            var start = document.getElementById("start-time");
            if (trace.hasPoints()) {
                const points = trace.getPoints();
                if (points[0].meta.time) start.value = (new Date(points[0].meta.time.getTime() + offset * 60 * 60 * 1000)).toISOString().substring(0, 16);
                else start.value = new Date().toISOString().substring(0, 16);
            }

            const ok = document.getElementById("edit-speed");
            ok.addEventListener("click", function () {
                var v = trace.getMovingSpeed();
                if (speedChange) {
                    if (buttons.cycling) {
                        v = Number(speed.value);
                        if (!buttons.km) v *= 1.60934;
                    } else {
                        v = Number(minutes.value) * 60 +  Number(seconds.value);
                        v = Math.max(v, 1);
                        if (!buttons.km) v /= 1.60934;
                        v = 1 / v; // km/s
                        v *= 3600;
                    }
                }

                const startTime = new Date(new Date(start.value).getTime());

                if (slope_speed.checked) trace.generateTimeData(startTime, v);

                trace.changeTimeData(startTime, v);
                trace.recomputeStats();
                trace.update();

                buttons.time.window.close();
                gtag('event', 'button', {'event_category' : 'edit-time'});
            });
            const cancel = document.getElementById("cancel-speed");
            cancel.addEventListener("click", function () {
                buttons.time.window.close();
            });
        });
        this.color.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();

            buttons.color_picker.value = trace.normal_style.color;
            buttons.opacity_slider.value = trace.normal_style.opacity;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.color_window;
            buttons.color_window.show();
        });
        this.color_ok.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            const color = buttons.color_picker.value;
            const opacity = buttons.opacity_slider.value;
            total.changeColor(trace.normal_style.color, color);
            trace.normal_style.color = color;
            trace.focus_style.color = color;
            trace.normal_style.opacity = opacity;
            trace.focus_style.opacity = opacity;
            if (buttons.color_checkbox.checked) total.same_color = true;
            if (buttons.color_checkbox.checked || buttons.opacity_checkbox.checked) {
                for (var i=0; i<total.traces.length; i++) {
                    if (buttons.color_checkbox.checked) {
                        total.traces[i].normal_style.color = color;
                        total.traces[i].focus_style.color = color;
                    }
                    if (buttons.opacity_checkbox.checked) {
                        total.traces[i].normal_style.opacity = opacity;
                        total.traces[i].focus_style.opacity = opacity;
                    }
                    total.traces[i].gpx.setStyle(total.traces[i].normal_style);
                }
                if (buttons.color_checkbox.checked) {
                    total.normal_style.color = color;
                    total.focus_style.color = color;
                }
                if (buttons.opacity_checkbox.checked) {
                    total.normal_style.opacity = opacity;
                    total.focus_style.opacity = opacity;
                }
            }
            trace.gpx.setStyle(trace.focus_style);
            trace.showChevrons();
            trace.showDistanceMarkers();
            trace.tab.innerHTML = trace.name+'<div class="tab-color" style="background:'+trace.normal_style.color+';">';
            trace.set_color = true;
            buttons.color_window.hide();
            gtag('event', 'button', {'event_category' : 'color'});
        });
        this.color_cancel.addEventListener("click", function () {
            buttons.color_window.hide();
        });
        this.about.addEventListener("click", function () {
            window.open('./about.html');
        });
        this.help.addEventListener("click", function () {
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.help_window;
            buttons.help_window.show();
            gtag('event', 'button', {'event_category' : 'help'});
        });
        this.duplicate.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            trace.clone();
            gtag('event', 'button', {'event_category' : 'duplicate'});
        });
        this.combine.addEventListener("click", function () {
            if (total.traces.length <= 1) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            if (buttons.window_open) buttons.window_open.hide();
            total.to_merge = trace;
            buttons.window_open = buttons.merge_window;
            buttons.merge_window.show();
            buttons.merge_window.addEventListener('hide', function (e) {
                total.to_merge = null;
            });
        });
        this.merge_cancel.addEventListener("click", function () {
            buttons.merge_window.hide();
        });
        this.hide.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            trace.hideUnhide();
            gtag('event', 'button', {'event_category' : 'hide'});
        });
        if (!this.embedding) {
            const openStreetView = function (e) {
                if (total.hasFocus || !total.traces[total.focusOn].isEdited) {
                    map._container.style.cursor = '';
                    if (buttons.googleStreetView.mapboxgl_canvas) buttons.googleStreetView.mapboxgl_canvas.style.cursor = '';
                }
                map.removeEventListener("click", openStreetView);
                buttons.disable_trace = false;
                window.open('https://maps.google.com/maps?q=&layer=c&cbll='+e.latlng.lat+','+e.latlng.lng+'&cbp=11,0,0,0,0');
            };
            this.googleStreetView.addEventListener('click', function () {
                buttons.disable_trace = true;
                map._container.style.cursor = 'crosshair';
                var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
                if (mapboxgl_canvas.length > 0) {
                    buttons.googleStreetView.mapboxgl_canvas = mapboxgl_canvas[0];
                    buttons.googleStreetView.mapboxgl_canvas.style.cursor = 'crosshair';
                } else buttons.googleStreetView.mapboxgl_canvas = null;
                map.addEventListener("click", openStreetView);
            });
        }
        this.show_chevrons.addEventListener('input', function (e) {
            buttons.show_direction = buttons.show_chevrons.checked;
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (buttons.show_direction) trace.showChevrons();
            else trace.hideChevrons();
        });
        this.show_dist_markers.addEventListener('input', function (e) {
            buttons.show_distance = buttons.show_dist_markers.checked;
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (buttons.show_distance) trace.showDistanceMarkers();
            else trace.hideDistanceMarkers();
        });
        this.show_profile.addEventListener('input', function (e) {
            if (buttons.show_profile.checked) {
                buttons.trace_info_grid.style.gridAutoColumns = '';
                buttons.elevation_profile.style.display = '';
                buttons.live_distance.style.display = '';
                buttons.live_elevation.style.display = '';
                buttons.live_speed.style.display = '';
                buttons.live_slope.style.display = '';
                buttons.slide_container.style.display = '';
                buttons.crop_container.style.display = 'block';

                buttons.points.style.display = 'none';
                buttons.points_info.style.display = 'none';
                buttons.segments.style.display = 'none';
                buttons.segments_info.style.display = 'none';

                buttons.speed.style.gridColumn = '';
                buttons.speed.style.gridRow = '';
                buttons.speed_info.style.gridColumn = '';
                buttons.speed_info.style.gridRow = '';
                buttons.duration.style.gridColumn = '';
                buttons.duration.style.gridRow = '';
                buttons.duration_info.style.gridColumn = '';
                buttons.duration_info.style.gridRow = '';

            } else {
                buttons.trace_info_grid.style.gridAutoColumns = 'auto';
                buttons.elevation_profile.style.display = 'none';
                buttons.live_distance.style.display = 'none';
                buttons.live_elevation.style.display = 'none';
                buttons.live_speed.style.display = 'none';
                buttons.live_slope.style.display = 'none';
                buttons.slide_container.style.display = 'none';
                buttons.crop_container.style.display = 'none';

                buttons.points.style.display = '';
                buttons.points_info.style.display = '';
                buttons.segments.style.display = '';
                buttons.segments_info.style.display = '';

                buttons.speed.style.gridColumn = '3 / span 1';
                buttons.speed.style.gridRow = '1 / span 1';
                buttons.speed_info.style.gridColumn = '3 / span 1';
                buttons.speed_info.style.gridRow = '2 / span 1';
                buttons.duration.style.gridColumn = '4 / span 1';
                buttons.duration.style.gridRow = '1 / span 1';
                buttons.duration_info.style.gridColumn = '4 / span 1';
                buttons.duration_info.style.gridRow = '2 / span 1';
            }
        });
    }

    focusTabElement(tab) {
        document.querySelectorAll('.tab').forEach(item => {item.classList.remove('tab-focus');});
        tab.classList.add('tab-focus');
    }

    updateBounds() {
        this.map.fitBounds(this.total.getBounds());
    }

    loadFiles(files) {
        var total = this.total;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.name.split('.').pop().toLowerCase() != 'gpx') continue;
            var reader = new FileReader();
            reader.onload = (function(f, name) {
                return function(e) {
                    total.addTrace(e.target.result, name)
                };
            })(file, file.name);
            reader.readAsDataURL(file);
        }
        this.input.value = "";
        gtag('event', 'button', {'event_category' : 'load'});
    }

    openURLs() {
        const _this = this;
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        if (!urlParams.has('state')) return;
        const params = JSON.parse(urlParams.get('state'));
        if (!params.urls) return;

        params.urls = [...new Set(params.urls)];

        const sortable = this.sortable;
        const total = this.total;
        var countDone = 0, countOk = 0;
        const onFinish = function () {
            for (var j=1; j<sortable.el.children.length; j++) {
                const tab = sortable.el.children[j];
                const trace = tab.trace;
                trace.index = j-1;
                trace.key = null;
                total.traces[trace.index] = trace;
                if (trace.hasFocus) {
                    total.focusOn = trace.index;
                }
            }
        };

        const index = {};
        for (var i=0; i<params.urls.length; i++) {
            index[params.urls[i]] = i;
        }

        for (var i=0; i<params.urls.length; i++) {
            const file_url = params.urls[i];
            const href = decodeURIComponent(file_url);
            if (href) {
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        const path = href.split('/');
                        const name = path.length ? path[path.length-1] : href;
                        _this.total.addTrace(xhr.responseText, name, function (trace) {
                            trace.key = file_url;
                            countOk++;
                            countDone++;
                            for (var j=total.traces.length-countOk; j<total.traces.length-1; j++) {
                                if (index[total.traces[j].key] > index[file_url]) {
                                    sortable.el.appendChild(total.traces[j].tab);
                                }
                            }
                            if (countDone == params.urls.length) onFinish();
                        });
                    } else if (xhr.readyState == 4 && xhr.status != 200) {
                        countDone++;
                        if (countDone == params.urls.length) onFinish();
                    }
                }
                xhr.open('GET', href);
                xhr.send();
            }
        }
    }

    donation() {
        window.open('https://ko-fi.com/gpxstudio');
        gtag('event', 'button', {'event_category' : 'donate'});
    }

    download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    supportsWebGL() {
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return (gl && gl instanceof WebGLRenderingContext);
   };
}
