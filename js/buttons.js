// gpx.studio is an online GPX file editor which can be found at https://gpx.studio
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
        this.km = localStorage.hasOwnProperty('km') ? localStorage.getItem('km') == 'true' : true;
        this.activity = localStorage.hasOwnProperty('activity') ? localStorage.getItem('activity') : 'bike';
        this.routing = localStorage.hasOwnProperty('routing') ? localStorage.getItem('routing') == 'true' : true;
        this.keep_timestamps = false;
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
            if (urlParams.has('running')) this.activity = 'hike';
            if (urlParams.has('direction')) this.show_direction = true;
            if (urlParams.has('distance')) this.show_distance = true;
        }

        // MAIN MAP
        this.map = L.map('mapid', {
            zoomControl: false,
            minZoom: 2,
            worldCopyJump: true
        }).setView([0, 0], 2);
        if (!this.embedding) this.map.attributionControl.addAttribution('Powered by <a href="https://www.graphhopper.com/">GraphHopper API</a>')
        this.map.addEventListener("locationfound", function (e) {
            e.target.setView(e.latlng,12);
        });
        if (!this.embedding && !urlParams.has('state')) this.map.locate({setView: true, maximumAge: 100000});

        // BUTTONS
        this.input = document.getElementById("input-file");
        this.load = document.getElementById("load");
        this.load2 = document.getElementById("load2");
        this.load_drive = document.getElementById("load-drive");
        this.load_error_ok = document.getElementById("load-error-ok");
        this.draw = document.getElementById("manual");
        this.undo = document.getElementById("undo");
        this.redo = document.getElementById("redo");
        this.clear = document.getElementById("clear");
        this.clear2 = document.getElementById("clear2");
        this.cancel_clear = document.getElementById("cancelclear");
        this.help = document.getElementById("help");
        this.about = document.getElementById("about");
        this.account = document.getElementById("account");
        this.donate = document.getElementById("donate");
        this.donate2 = document.getElementById("donate-2");
        this.delete = document.getElementById("delete");
        this.delete2 = document.getElementById("delete2");
        this.zone_delete = document.getElementById("zone-delete");
        this.zone_delete_ok = document.getElementById("zone-delete-ok");
        this.zone_delete_cancel = document.getElementById("zone-delete-cancel");
        this.zone_delete_pts = document.getElementById("zone-delete-points");
        this.zone_delete_wpts = document.getElementById("zone-delete-waypoints");
        this.zone_delete_inside = document.getElementById("zone-delete-inside");
        this.zone_delete_inside.value = 'inside';
        this.zone_delete_outside = document.getElementById("zone-delete-outside");
        this.zone_delete_outside.value = 'outside';
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
        this.width_slider = document.getElementById("width-slider");
        this.width_checkbox = document.getElementById("width-checkbox");
        this.edit = document.getElementById("edit");
        this.validate = document.getElementById("validate");
        this.crop_container = document.getElementById("crop-container");
        this.crop_ok = document.getElementById("crop-ok");
        this.crop_cancel = document.getElementById("crop-cancel");
        this.crop_keep = document.getElementById("crop-keep");
        this.export = document.getElementById("export");
        this.export2 = document.getElementById("export-2");
        this.save_drive = document.getElementById("save-drive");
        this.chevrons = document.getElementById("chevrons");
        this.show_chevrons = document.getElementById("show-chevrons");
        this.dist_markers = document.getElementById("dist-markers");
        this.show_dist_markers = document.getElementById("show-dist-markers");
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
        this.include_power = document.getElementById("include-power");
        this.copy_link = document.getElementById("copy-link");
        this.copy_embed = document.getElementById("copy-embed");
        this.merge_as_segments = document.getElementById("merge-as-segments");
        this.merge_keep_time = document.getElementById("merge-keep");
        this.merge_stick_time = document.getElementById("merge-stick");
        this.merge_cancel = document.getElementById("merge-cancel");
        this.edit_keep_time = document.getElementById("edit-keep");
        this.edit_ok = document.getElementById("edit-ok");
        this.remember_edit_time = document.getElementById("remember-edit-time");
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
        this.activity_input = document.getElementById("activity-input");
        this.activity_dropdown = document.getElementById("activity-dropdown");
        this.activity_choice = document.getElementById("selected-activity");
        this.activity_choices = {
            bike: document.getElementById("bike"),
            racingbike: document.getElementById("racingbike"),
            mtb: document.getElementById("mtb"),
            hike: document.getElementById("hike"),
            car: document.getElementById("car")
        };
        this.routing_input = document.getElementById("routing-input");
        this.routing_dropdown = document.getElementById("routing-dropdown");
        this.routing_choice = document.getElementById("selected-routing");
        this.routing_choices = {
            route: document.getElementById("route"),
            crow: document.getElementById("crow")
        };
        this.units_input = document.getElementById("units-input");
        this.units_dropdown = document.getElementById("units-dropdown");
        this.units_choice = document.getElementById("selected-units");
        this.units_choices = {
            km: document.getElementById("km"),
            mi: document.getElementById("mi")
        };
        this.routing_input = document.getElementById("routing-input");
        this.elevation_input = document.getElementById("elevation-input");
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
        this.color_content = document.getElementById('color-content');
        this.reduce_content = document.getElementById('reduce-content');
        this.reduce_npoints = document.getElementById('reduce-npoints');
        this.load_content = document.getElementById('load-content');
        this.share_content = document.getElementById('share-content');
        this.merge_content = document.getElementById('merge-content');
        this.merge_time_options = document.getElementById('merge-time-options');
        this.edit_content = document.getElementById('edit-content');
        this.crop_content = document.getElementById('crop-content');
        this.load_error_content = document.getElementById('load-error-content');
        this.embed_content = document.getElementById('embed-content');
        this.login_content = document.getElementById('login-content');
        this.trace_info_content = document.getElementById('info');
        this.toolbar_content = document.getElementById('toolbar');
        this.languages_content = document.getElementById('languages');
        this.street_view_content = document.getElementById('street-view');
        this.mapillary_container = document.getElementById('mly');
        this.mapillary_move = document.getElementById('mly-move');
        this.mapillary_close = document.getElementById('mly-close');

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
        this.start_loop_text = document.getElementById('start-loop-text').textContent;
        this.remove_pt_text = document.getElementById('remove-pt-text').textContent;
        this.speed_text = document.getElementById('speed-text').textContent;
        this.pace_text = document.getElementById('pace-text').textContent;
        this.start_text = document.getElementById('start-text').textContent;
        this.experimental_info_text = document.getElementById('experimental-info-text').innerHTML;
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
        this.color_window = L.control.window(this.map,{title:'',content:this.color_content,className:'panels-container',closeButton:false});
        this.reduce_window = L.control.window(this.map,{title:'',content:this.reduce_content,className:'panels-container',closeButton:false});
        this.load_window = L.control.window(this.map,{title:'',content:this.load_content,className:'panels-container'});
        this.load_error_window = L.control.window(this.map,{title:'',content:this.load_error_content,className:'panels-container',closeButton:false});
        this.share_window = L.control.window(this.map,{title:'',content:this.share_content,className:'panels-container'});
        this.merge_window = L.control.window(this.map,{title:'',content:this.merge_content,className:'panels-container',closeButton:false});
        this.edit_window = L.control.window(this.map,{title:'',content:this.edit_content,className:'panels-container',closeButton:false});
        this.crop_window = L.control.window(this.map,{title:'',content:this.crop_content,className:'panels-container',closeButton:false});
        this.login_window = L.control.window(this.map,{title:'',content:this.login_content,className:'panels-container'});

        this.zoom = L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        this.scale = L.control.scale({
            metric: this.km,
            imperial: !this.km
        }).addTo(this.map);

        var _this = this;

        // ELEVATION PROFILE
        const mapWidth = this.map._container.offsetWidth;
        var elevation_profile_width = Math.min((mapWidth - 237) * 2 / 3, 400);
        var mobileEmbeddingStyle = this.embedding && elevation_profile_width < 200;
        if (mobileEmbeddingStyle) elevation_profile_width = mapWidth * 4/5;
        this.elev = L.control.heightgraph({
            width: elevation_profile_width,
        	height: 110,
            margins:{
                top:15,
                right:10,
                bottom:30,
                left:60
            },
            expandControls: false,
            translation: {
                distance: this.distance_info.innerText,
                elevation: this.elevation_info.innerText,
                segment_length: document.getElementById('segment-text').innerText,
                type: document.getElementById('type-text').innerText
            }
        }).addTo(this.map);
        this.elev.buttons = this;
        this.elevation_profile = document.getElementsByClassName('heightgraph')[0];
        this.elevation_profile.style.gridColumn = '3 / span 1';
        this.elevation_profile.style.gridRow = '1 / span 4';
        if (mobileEmbeddingStyle) {
            this.activity_input.style.display = 'none';
            this.routing_input.style.display = 'none';
            this.units_input.style.display = 'none';
            this.elevation_input.style.display = 'none';

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
            this.toolbar_content.style.display = 'none';
            this.languages_content.style.display = 'none';
            this.units_input.style.display = 'none';
            this.activity_input.style.display = 'none';
            this.routing_input.style.display = 'none';
            this.elevation_input.style.display = 'none';
            this.chevrons.style.display = 'none';
            this.dist_markers.style.display = 'none';
            this.crop_container.style.display = 'none';
            this.slide_container.style.display = 'none';

            var nTraces = 0;
            const params = JSON.parse(urlParams.get('state'));
            if (params) {
                if (params.urls) nTraces += params.urls.length;
                if (params.ids) nTraces += params.ids.length;
                if (nTraces == 1) {
                    this.tabs.style.display = 'none';
                    this.trace_info_content.style.paddingBottom = '20px';
                } else this.multipleEmbedding = true;
            }

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

        var language = getLanguage();
        this.languages = L.control({position: 'bottomleft'});
        this.languages.onAdd = function (map) {
            var div = _this.languages_content;
            for (var i=0; i<div.children.length; i++) if (div.children[i].textContent == language) {
                div.children[i].style.display = 'none';
                break;
            }
            return div;
        };
        this.languages.addTo(this.map);

        this.addHandlers();

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                const keys = JSON.parse(xhr.responseText);
                _this.graphhopper_token = keys.graphhopper;
                if (urlParams.has('token')) _this.mapbox_token = urlParams.get('token');
                else if (window.location.hostname != "localhost") _this.mapbox_token = keys.mapbox;
                else _this.mapbox_token = keys.mapbox_dev;

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

                _this.ignMap = L.tileLayer('https://wxs.ign.fr/csxlabhak328gg7s096cu55r/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&FORMAT=image/jpeg&STYLE=normal', {
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
                        }).addTo(_this.map);

                        _this.mapboxSKUToken = _this.mapboxMap.getMapboxMap()._requestManager._skuToken;

                        _this.mapboxMap.remove();
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
                            "IGN SCAN25 (FR)" : _this.ignMap
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
                        div.appendChild(_this.street_view_content);
                        L.DomEvent.disableClickPropagation(div);
                        _this.mapillaryStreetView = div;
                        return div;
                    };
                    _this.streetView.addTo(_this.map);

                    _this.stravaHeatmap = L.tileLayer('', {
                        maxZoom: 20,
                        maxNativeZoom: 14,
                        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
                    });

                    _this.stravaHeatmap.on('tileerror', function () {
                        _this.updateStravaCookies();
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

                        _this.mapboxMap.getMapboxMap().on('load', () => {
                            _this.mapboxSKUToken = _this.mapboxMap.getMapboxMap()._requestManager._skuToken;
                        });

                        _this.mapillary_coverageZoomed = L.vectorGrid.protobuf('https://tiles.mapillary.com/maps/vtp/mly1_computed_public/2/{z}/{x}/{y}?access_token=MLY|4381405525255083|3204871ec181638c3c31320490f03011', {
                            minZoom: 14,
                            maxNativeZoom: 14,
                            pane: 'overlayPane',
                            attribution: '&copy; <a href="https://www.mapillary.com" target="_blank">Mapillary</a>',
                            vectorTileLayerStyles: {
                                sequence: {
                                    color: 'rgb(53, 175, 109)',
                                    weight: 1,
                                    opacity: 0.6
                                },
                                image: []
                            }
                        });

                        _this.mapillary_coverage = L.vectorGrid.protobuf('https://tiles.mapillary.com/maps/vtp/mly1_computed_public/2/{z}/{x}/{y}?access_token=MLY|4381405525255083|3204871ec181638c3c31320490f03011', {
                            minZoom: 6,
                            maxZoom: 14,
                            pane: 'overlayPane',
                            attribution: '&copy; <a href="https://www.mapillary.com" target="_blank">Mapillary</a>',
                            vectorTileLayerStyles: {
                                sequence: {
                                    color: 'rgb(53, 175, 109)',
                                    weight: 1,
                                    opacity: 0.6
                                },
                                image: []
                            },
                            rendererFactory: L.canvas.tile
                        });

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
                }

                const toggle = document.getElementsByClassName('leaflet-control-layers-toggle')[0];
                toggle.removeAttribute("href");
                toggle.classList.add('fas','fa-layer-group','custom-button');

                if (!_this.embedding) {
                    const settings_container = document.getElementsByClassName('leaflet-control-layers-list')[0];
                    const base = settings_container.childNodes[0];
                    const separator = settings_container.childNodes[1];
                    const overlays = settings_container.childNodes[2];

                    settings_container.appendChild(separator); // move separator after maps

                    const settings_list = document.createElement('div');

                    settings_list.appendChild(_this.chevrons);
                    settings_list.appendChild(_this.dist_markers);

                    settings_container.appendChild(settings_list);
                }

                _this.total = new Total(_this);
                _this.openURLs();
            }
        }
        xhr.open('GET', '/res/keys.json');
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
                _this.mapboxOutdoorsSelector.addEventListener('click', function (e) {
                    _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/outdoors-v11", {diff: false});
                });
            } else if (span.textContent.endsWith("Satellite")) {
                _this.mapboxSatelliteSelector = layerSelectors[i];
                _this.mapboxSatelliteSelector.checked = (_this.mapboxMap == Object.values(_this.map._layers)[0]) && (_this.mapboxMap.options.style == "mapbox://styles/mapbox/satellite-v9");
                _this.mapboxSatelliteSelector.addEventListener('click', function (e) {
                    _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/satellite-v9", {diff: false});
                });
            }
        }
    }

    updateStravaCookies() {
        if (this.updatingStravaCookies) {
            return;
        }
        this.updatingStravaCookies = true;
        const _this = this;

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                _this.stravaCookies = JSON.parse(xhr.response);
                if (_this.activity != 'hike') {
                    _this.stravaHeatmap.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/ride/bluered/{z}/{x}/{y}@2x.png?Signature=${_this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${_this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${_this.stravaCookies['CloudFront-Policy']}`);
                } else {
                    _this.stravaHeatmap.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}@2x.png?Signature=${_this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${_this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${_this.stravaCookies['CloudFront-Policy']}`);
                }
                _this.updatingStravaCookies = false;
            }
        }
        xhr.open('GET', 'https://s.gpx.studio');
        xhr.send();
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
        this.load_error_ok.addEventListener("click", function () {
            buttons.load_error_window.hide();
        });
        this.donate.addEventListener("click", function () {
            buttons.donation();
        });
        this.donate2.addEventListener("click", function () {
            buttons.donation();
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
        this.total = total;
        this.elev.total = total;
        const buttons = this;
        const map = this.map;

        this.sortable = Sortable.create(this.tabs, {
            draggable: ".tab-draggable",
            setData: function (dataTransfer, dragEl) {
                const avgData = dragEl.trace.getAverageAdditionalData();
                const data = total.outputGPX(false, true, avgData.hr, avgData.atemp, avgData.cad, avgData.power, dragEl.trace.index);

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
            buttons.add_wpt.active = true;
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
                    map.removeEventListener("mouseup", endRect);

                    buttons.zone_delete_window.show();
                    buttons.zone_delete_window.addEventListener('hide', function (e) {
                        if (buttons.zone_delete.rect) buttons.zone_delete.rect.remove();
                        buttons.zone_delete.rect = null;
                    });
                }
            };

            map.addEventListener("mousedown", createRect);
            map.addEventListener("mousemove", extendRect);
            map.addEventListener("mouseup", endRect);
        });
        this.zone_delete_ok.addEventListener("click", function () {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
            trace.deleteZone(buttons.zone_delete.rect.getBounds(),
                buttons.zone_delete_pts.checked,
                buttons.zone_delete_wpts.checked,
                buttons.zone_delete_inside.checked);
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
                if (!additionalData.power) {
                    buttons.include_power.checked = false;
                    buttons.include_power.disabled = true;
                } else {
                    buttons.include_power.checked = true;
                    buttons.include_power.disabled = false;
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
            const power = buttons.include_power.checked;

            const output = total.outputGPX(mergeAll, time, hr, atemp, cad, power);
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
            const start = Math.max(0, total.buttons.slider.getIndexStart());
            const end = Math.min(trace.getPoints().length-1, total.buttons.slider.getIndexEnd());
            total.traces[total.focusOn].crop(start, end, !buttons.crop_keep.checked);
            buttons.crop_window.hide();
            gtag('event', 'button', {'event_category' : 'crop'});
        });
        this.crop_cancel.addEventListener("click", function () {
            buttons.crop_window.hide();
        });
        this.units_input.addEventListener("mouseover", function (e) {
            buttons.units_dropdown.style.display = "block";
        });
        this.units_input.addEventListener("mouseleave", function (e) {
            buttons.units_dropdown.style.display = "";
        });
        this.units_input.addEventListener("click", function (e) {
            var path = e.path || (e.composedPath && e.composedPath());
            var units_div = path[0];
            if (!units_div.id) units_div = path[1];
            buttons.km = units_div.id == 'km';
            localStorage.setItem('km',buttons.km);
            buttons.units_choice.innerHTML = units_div.children[0].outerHTML;
            const focus = total.hasFocus ? total : total.traces[total.focusOn];
            focus.showData();
            focus.showElevation();
            if (!total.hasFocus) focus.showDistanceMarkers();
            buttons.units_dropdown.style.display = "";
            buttons.scale.remove();
            buttons.scale.options.metric = buttons.km;
            buttons.scale.options.imperial = !buttons.km;
            buttons.scale.addTo(buttons.map);
        });
        this.units_choices[buttons.km ? 'km' : 'mi'].click();
        this.activity_input.addEventListener("mouseover", function (e) {
            buttons.activity_dropdown.style.display = "block";
        });
        this.activity_input.addEventListener("mouseleave", function (e) {
            buttons.activity_dropdown.style.display = "";
        });
        this.activity_input.addEventListener("click", function (e) {
            var path = e.path || (e.composedPath && e.composedPath());
            var activity_div = path[0];
            if (!activity_div.id) activity_div = path[1];
            buttons.activity = activity_div.id;
            localStorage.setItem('activity',buttons.activity);
            buttons.activity_choice.innerHTML = activity_div.children[0].outerHTML;
            if (buttons.activity != 'hike') {
                if (buttons.stravaCookies) buttons.stravaHeatmap.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/ride/bluered/{z}/{x}/{y}@2x.png?Signature=${buttons.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${buttons.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${buttons.stravaCookies['CloudFront-Policy']}`);
            } else {
                if (buttons.stravaCookies) buttons.stravaHeatmap.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/run/bluered/{z}/{x}/{y}@2x.png?Signature=${buttons.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${buttons.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${buttons.stravaCookies['CloudFront-Policy']}`);
            }
            if (total.hasFocus) total.showData();
            else total.traces[total.focusOn].showData();
            buttons.activity_dropdown.style.display = "";
        });
        this.activity_choices[buttons.activity].click();
        this.routing_input.addEventListener("mouseover", function (e) {
            buttons.routing_dropdown.style.display = "block";
        });
        this.routing_input.addEventListener("mouseleave", function (e) {
            buttons.routing_dropdown.style.display = "";
        });
        this.routing_input.addEventListener("click", function (e) {
            var path = e.path || (e.composedPath && e.composedPath());
            var routing_div = path[0];
            if (!routing_div.id) routing_div = path[1];
            buttons.routing = routing_div.id == 'route';
            localStorage.setItem('routing',buttons.routing);
            buttons.routing_choice.innerHTML = routing_div.children[0].outerHTML;
            buttons.routing_dropdown.style.display = "";
        });
        this.routing_choices[buttons.routing ? 'route' : 'crow'].click();
        this.map.addEventListener("zoomend", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) trace.updateEditMarkers();
        });
        this.edit.addEventListener("click", function() {
            if (total.hasFocus) return;
            if (buttons.window_open) buttons.window_open.hide();
            var trace = total.traces[total.focusOn];
            if (trace.isEdited) {
                trace.stopEdit();
                if (trace.drawing) trace.stopDraw();
                gtag('event', 'button', {'event_category' : 'edit-trace'});
            } else {
                if (trace.hasTimeData() && !buttons.remember_edit_time.checked) {
                    buttons.window_open = buttons.edit_window;
                    buttons.edit_window.show();
                }
                trace.draw();
            }
        });
        this.edit_ok.addEventListener("click", function () {
            buttons.keep_timestamps = buttons.edit_keep_time.checked;
            buttons.edit_window.hide();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                if (buttons.window_open) buttons.window_open.hide();
                if (total.hasFocus) return;
                var trace = total.traces[total.focusOn];
                if (trace.isEdited) buttons.edit.click();
                e.preventDefault();
            } else if (e.key === "F1") {
                if (map.hasLayer(buttons.stravaHeatmap)) buttons.stravaHeatmap.remove();
                else buttons.stravaHeatmap.addTo(map);
                e.preventDefault();
            } else if (e.key === "F2") {
                const keys = Object.keys(buttons.routing_choices);
                buttons.routing_choices[keys[(keys.indexOf(buttons.routing ? 'route' : 'crow')+1)%keys.length]].click();
                e.preventDefault();
            } else if (e.key === "F3") {
                const keys = Object.keys(buttons.activity_choices);
                buttons.activity_choices[keys[(keys.indexOf(buttons.activity)+1)%keys.length]].click();
                e.preventDefault();
            } else if (e.key === "F4") {
                const keys = Object.keys(buttons.units_choices);
                buttons.units_choices[keys[(keys.indexOf(buttons.km ? 'km' : 'mi')+1)%keys.length]].click();
                e.preventDefault();
            } else if (e.key == "h" && (e.ctrlKey || e.metaKey)) {
                buttons.elevation_input.click();
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
            const newTraces = trace.extract_segments();
            for (var i=0; i<newTraces.length; i++) {
                total.setTraceIndex(newTraces[i].index, trace.index+1+i);
            }
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

            if (buttons.activity != 'hike') {
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
                        <div style="display: flex;align-items: center; padding: 10px; border: dashed;"><div style="max-width: 200px;display: inline-block;white-space: normal;">`+buttons.experimental_info_text+`</div><input type="checkbox" id="slope-speed" style="vertical-align:super"></div><br>
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

            if (buttons.activity != 'hike') {
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
                    if (buttons.activity != 'hike') {
                        v = Number(speed.value);
                        if (!buttons.km) v *= 1.609344;
                    } else {
                        v = Number(minutes.value) * 60 +  Number(seconds.value);
                        v = Math.max(v, 1);
                        if (!buttons.km) v /= 1.609344;
                        v = 1 / v; // km/s
                        v *= 3600;
                    }
                }

                const startTime = new Date(new Date(start.value).getTime());

                if (slope_speed.checked) trace.generateTimeData(startTime, v);

                trace.changeTimeData(startTime, v);
                trace.recomputeStats();
                trace.showData();

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
            buttons.width_slider.value = trace.normal_style.weight;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.color_window;
            buttons.color_window.show();
        });
        this.color_ok.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            const color = buttons.color_picker.value;
            const opacity = buttons.opacity_slider.value;
            const weight = parseInt(buttons.width_slider.value);
            total.changeColor(trace.normal_style.color, color);
            trace.normal_style.color = color;
            trace.focus_style.color = color;
            trace.normal_style.opacity = opacity;
            trace.focus_style.opacity = opacity;
            trace.normal_style.weight = weight;
            trace.focus_style.weight = weight+2;
            const hexOpacity = Math.round(opacity * 255).toString(16);
            if (buttons.color_checkbox.checked) total.same_color = true;
            if (buttons.color_checkbox.checked || buttons.opacity_checkbox.checked || buttons.width_checkbox.checked) {
                for (var i=0; i<total.traces.length; i++) {
                    if (buttons.color_checkbox.checked) {
                        total.traces[i].normal_style.color = color;
                        total.traces[i].focus_style.color = color;
                    }
                    if (buttons.opacity_checkbox.checked) {
                        total.traces[i].normal_style.opacity = opacity;
                        total.traces[i].focus_style.opacity = opacity;
                    }
                    if (buttons.width_checkbox.checked) {
                        total.traces[i].normal_style.weight = weight;
                        total.traces[i].focus_style.weight = weight+2;
                    }
                    total.traces[i].gpx.setStyle(total.traces[i].normal_style);
                    total.traces[i].tab.innerHTML = total.traces[i].name+'<div class="tab-color" style="background:'+total.traces[i].normal_style.color+hexOpacity+';">';
                    total.traces[i].set_color = true;
                }
                if (buttons.color_checkbox.checked) {
                    total.normal_style.color = color;
                    total.focus_style.color = color;
                }
                if (buttons.opacity_checkbox.checked) {
                    total.normal_style.opacity = opacity;
                    total.focus_style.opacity = opacity;
                }
                if (buttons.width_checkbox.checked) {
                    total.normal_style.weight = weight;
                    total.focus_style.weight = weight;
                }
            }
            trace.gpx.setStyle(trace.focus_style);
            trace.showChevrons();
            trace.showDistanceMarkers();
            trace.tab.innerHTML = trace.name+'<div class="tab-color" style="background:'+trace.normal_style.color+hexOpacity+';">';
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
            const clone = trace.clone();
            total.setTraceIndex(clone.index, trace.index+1);
            gtag('event', 'button', {'event_category' : 'duplicate'});
        });
        this.combine.addEventListener("click", function () {
            if (total.traces.length <= 1) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            if (buttons.window_open) buttons.window_open.hide();
            total.to_merge = trace;
            buttons.merge_time_options.style.display = trace.hasTimeData() ? '' : 'none';
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
                if (!buttons.mapillary) {
                    var {Viewer} = mapillary;
                    buttons.mapillary = new Viewer({
                      accessToken: 'MLY|4381405525255083|3204871ec181638c3c31320490f03011',
                      container: buttons.mapillary_container,
                      component: { cover: false }
                    });

                    buttons.mapillary.on('position', async (event) => {
                        if (buttons.mapillaryStreetView.open) {
                            const ll = await buttons.mapillary.getPosition();

                            if (!buttons.mapillary.marker) {
                                buttons.mapillary.marker = L.circleMarker(ll, {
                                    className: 'position-marker',
                                    radius: 8
                                });
                                buttons.mapillary.marker.addTo(buttons.map);
                            } else {
                                buttons.mapillary.marker.setLatLng(ll);
                            }

                            buttons.map.setView(ll);
                        }
                    });
                }

                var url = 'https://graph.mapillary.com/images?access_token=MLY|4381405525255083|3204871ec181638c3c31320490f03011&bbox=';
                url += e.latlng.toBounds(50).toBBoxString();

                var Http = new XMLHttpRequest();
                Http.open("GET", url);
                Http.send();
                Http.onreadystatechange = function() {
                    if (Http.readyState == 4 && Http.status == 200) {
                        var ans = JSON.parse(this.responseText);
                        if (ans.data) {
                            var dist = Infinity, imageId = null, ll = null;
                            for (var i=0; i<ans.data.length; i++) {
                                const imgLatlng = L.latLng([ans.data[i].geometry.coordinates[1],ans.data[i].geometry.coordinates[0]]);
                                if (imageId == null || e.latlng.distanceTo(imgLatlng) < dist) {
                                    imageId = ans.data[i].id;
                                    dist = e.latlng.distanceTo(imgLatlng);
                                    ll = imgLatlng;
                                }
                            }
                            if (imageId != null) {
                                buttons.mapillary.moveTo(imageId).then(function () {
                                    buttons.mapillary.resize();
                                });

                                if (!buttons.mapillary.marker) {
                                    buttons.mapillary.marker = L.circleMarker(ll, {
                                        className: 'position-marker',
                                        radius: 8
                                    });
                                    buttons.mapillary.marker.addTo(buttons.map);
                                } else {
                                    buttons.mapillary.marker.setLatLng(ll);
                                }

                                buttons.map.setView(ll);
                                buttons.mapillary_container.style.display = 'block';
                            }
                        }
                    }
                }
            };
            const closeStreetView = function (e) {
                buttons.mapillary_container.style.display = 'none';
                if (buttons.mapillary) {
                    if (buttons.mapillary.marker) {
                        buttons.mapillary.marker.remove();
                        buttons.mapillary.marker = null;
                    }
                    const sequenceComponent = buttons.mapillary.getComponent('sequence');
                    sequenceComponent.stop();
                }
            };
            this.mapillaryStreetView.addEventListener('click', function () {
                if (buttons.mapillaryStreetView.open) {
                    if (total.hasFocus || !total.traces[total.focusOn].isEdited) {
                        map._container.style.cursor = '';
                        if (buttons.mapillaryStreetView.mapboxgl_canvas) buttons.mapillaryStreetView.mapboxgl_canvas.style.cursor = '';
                    }
                    buttons.disable_trace = false;
                    buttons.street_view_content.style.color = '';
                    closeStreetView();
                    buttons.mapillary_coverage.remove();
                    buttons.mapillary_coverageZoomed.remove();
                    buttons.mapillaryStreetView.open = false;
                } else {
                    if (!buttons.mapboxMap.getMapboxMap().isStyleLoaded()) {
                        return;
                    }
                    buttons.disable_trace = true;
                    map._container.style.cursor = 'crosshair';
                    var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
                    if (mapboxgl_canvas.length > 0) {
                        buttons.mapillaryStreetView.mapboxgl_canvas = mapboxgl_canvas[0];
                        buttons.mapillaryStreetView.mapboxgl_canvas.style.cursor = 'crosshair';
                    } else buttons.mapillaryStreetView.mapboxgl_canvas = null;
                    buttons.mapillary_coverage.addTo(map);
                    buttons.mapillary_coverageZoomed.addTo(map);
                    buttons.street_view_content.style.color = '#247827';
                    buttons.mapillaryStreetView.open = true;
                }
            });
            this.mapillary_move.addEventListener('mousedown', function (e) {
                buttons.mapillary_move.startX = e.clientX;
                buttons.mapillary_move.startY = e.clientY;
                buttons.mapillary_move.startTop = buttons.mapillary_container.offsetTop;
                buttons.mapillary_move.startLeft = buttons.mapillary_container.offsetLeft;
                buttons.mapillary_move.dragging = true;
            });
            document.addEventListener('mousemove', function (e) {
                if (buttons.mapillary_move.dragging) {
                    e.preventDefault();
                    buttons.mapillary_container.style.top = (buttons.mapillary_move.startTop + e.clientY - buttons.mapillary_move.startY) + "px";
                    buttons.mapillary_container.style.left = (buttons.mapillary_move.startLeft + e.clientX - buttons.mapillary_move.startX) + "px";
                }
            });
            document.addEventListener('mouseup', function (e) {
                buttons.mapillary_move.dragging = false;
            });
            this.mapillary_close.addEventListener('click', closeStreetView);
            map.addEventListener('click', function (e) {
                if (buttons.mapillaryStreetView.open) {
                    openStreetView(e);
                    return;
                }
                if (!total.hasFocus) {
                    const trace = total.traces[total.focusOn];

                    if (buttons.add_wpt.active) {
                        trace.addWaypoint(e.latlng);
                        map._container.style.cursor = '';
                        var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
                        if (mapboxgl_canvas.length > 0) {
                            mapboxgl_canvas = mapboxgl_canvas[0];
                            mapboxgl_canvas.style.cursor = '';
                        }
                        buttons.disable_trace = false;
                        buttons.add_wpt.active = false;
                        gtag('event', 'button', {'event_category' : 'waypoint'});
                        return;
                    }

                    if (trace.drawing) {
                        if (buttons.disable_trace) return;
                        if (e.originalEvent.target.id != "mapid" && !e.originalEvent.target.classList.contains('mapboxgl-canvas')) return;
                        if (!trace._draggingWaypoint) trace.addEndPoint(e.latlng.lat, e.latlng.lng);
                        trace._draggingWaypoint = false;
                    }
                }
            })
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
        buttons.elevation_input.checked = true;
        this.elevation_input.addEventListener('click', function (e) {
            buttons.elevation_input.checked = !buttons.elevation_input.checked;
            if (buttons.elevation_input.checked) {
                buttons.trace_info_grid.style.gridAutoColumns = '';
                buttons.elevation_profile.style.display = '';
                buttons.activity_input.style.display = '';
                buttons.units_input.style.display = '';
                buttons.routing_input.style.display = '';
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
                buttons.elevation_input.style.gridColumn = '';
                buttons.elevation_input.style.gridRow = '';
            } else {
                buttons.trace_info_grid.style.gridAutoColumns = 'auto';
                buttons.elevation_profile.style.display = 'none';
                buttons.activity_input.style.display = 'none';
                buttons.units_input.style.display = 'none';
                buttons.routing_input.style.display = 'none';
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
                buttons.elevation_input.style.gridColumn = '7 / span 1';
                buttons.elevation_input.style.gridRow = '1 / span 2';
            }
        });
        this.google = new Google(this);
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

    showLoadErrorPopup() {
        if (this.window_open) this.window_open.hide();
        this.window_open = this.load_error_window;
        this.load_error_window.show();
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
