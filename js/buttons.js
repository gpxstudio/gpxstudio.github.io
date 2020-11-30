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
        this.routing = true;
        this.disable_trace = false;
        this.show_direction = false;
        this.show_distance = false;

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
            minZoom: 1
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
        this.edit = document.getElementById("edit");
        this.validate = document.getElementById("validate");
        this.unvalidate = document.getElementById("unvalidate");
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
        this.bike = document.getElementById("bike");
        this.run = document.getElementById("run");
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

        // DISPLAYS
        this.distance = document.getElementById("distance-val");
        this.elevation = document.getElementById("elevation-val");
        this.duration = document.getElementById("duration-val");
        this.speed = document.getElementById("speed-val");
        this.trace_info_grid = document.getElementById('info-grid');
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
        var xhr2 = new XMLHttpRequest();
        xhr2.onreadystatechange = function() {
            if (xhr2.readyState == 4 && xhr2.status == 200) {
                _this.airmap_token = xhr2.responseText;
            }
        }
        xhr2.open('GET', './airmap_token.txt');
        xhr2.send();

        // ELEVATION PROFILE
        this.elev = L.control.elevation({
            theme: "steelblue-theme",
            useHeightIndicator: true,
            width: Math.max(100, Math.min((window.innerWidth - 270) * 2 / 3, 400)),
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
            this.trace_info_grid.style.height = '106px';

            this.toolbar = L.control({position: 'topleft'});
            this.toolbar.onAdd = function (map) {
                var div = _this.embed_content;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.toolbar.addTo(this.map);

            this.embed_content.addEventListener('click', function () {
                window.open('https://gpxstudio.github.io/?state='+urlParams.get('state'));
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

        this.slider = new Slider(this);
        this.google = new Google(this);

        this.hideTraceButtons();

        this.addHandlers();

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                _this.mapbox_token = xhr.responseText;
                _this.mapbox_token = _this.mapbox_token.replace(/\s/g, '');

                // TILES

                _this.openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                    maxZoom: 20,
                    maxNativeZoom: 19
                });

                if (_this.embedding) {
                    _this.openStreetMap.addTo(_this.map);
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

                    if (_this.supportsWebGL()) {
                        _this.mapboxOutdoors = L.mapboxGL({
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
                            boxZoom: false,
                            keyboard: false
                        }).addTo(_this.map);
                    } else {
                        _this.openStreetMap.addTo(_this.map);

                        _this.mapboxOutdoors = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                            maxZoom: 20,
                            id: 'mapbox/outdoors-v11',
                            tileSize: 512,
                            zoomOffset: -1,
                            accessToken: _this.mapbox_token,
        	                crossOrigin: true
                        });
                    }

                    _this.mapboxSatellite = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                        attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                        maxZoom: 20,
                        id: 'mapbox/satellite-v9',
                        tileSize: 512,
                        zoomOffset: -1,
                        accessToken: _this.mapbox_token,
    	                crossOrigin: true
                    });

                    _this.openCycleMap = L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}', {
                        attribution: '&copy; <a href="http://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                        apikey: '67774cfadfeb42d2ac42bc38fda667c0',
                        maxZoom: 20,
    	                crossOrigin: true
                    });

                    _this.openHikingMap = L.tileLayer('https://maps.refuges.info/hiking/{z}/{x}/{y}.png', {
                        maxZoom: 20,
                        maxNativeZoom: 18,
                        attribution: '&copy; <a href="https://wiki.openstreetmap.org/wiki/Hiking/mri" target="_blank">sly</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                    });

                    _this.stravaHeatmap = L.tileLayer('https://heatmap-external-{s}.strava.com/tiles-auth/cycling/bluered/{z}/{x}/{y}.png', {
                        maxZoom: 20,
                        maxNativeZoom: 15,
                        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
                    });

                    _this.controlLayers = L.control.layers({
                        "OpenStreetMap" : _this.openStreetMap,
                        "OpenCycleMap" : _this.openCycleMap,
                        "OpenHikingMap" : _this.openHikingMap,
                        "Mapbox Outdoors" : _this.mapboxOutdoors,
                        "Mapbox Satellite" : _this.mapboxSatellite
                    },{
                        "Strava Heatmap" : _this.stravaHeatmap
                    }).addTo(_this.map);

                    _this.stravaHeatmap.on('tileerror', function (e) {
                        _this.stravaHeatmap.remove();
                        if (_this.window_open) _this.window_open.hide();
                        _this.window_open = _this.strava_window;
                        _this.strava_window.show();
                    });

                    const toggle = document.getElementsByClassName('leaflet-control-layers-toggle')[0];
                    toggle.removeAttribute("href");
                    toggle.classList.add('fas','fa-bars','custom-button');

                    const settings_container = document.getElementsByClassName('leaflet-control-layers-list')[0];
                    const base = settings_container.childNodes[0];
                    const separator = settings_container.childNodes[1];
                    const overlays = settings_container.childNodes[2];

                    settings_container.appendChild(separator); // move separator after maps

                    const settings_list = document.createElement('ul');
                    settings_list.style = 'padding-inline-start: 20px;';

                    settings_list.appendChild(_this.units);
                    settings_list.appendChild(_this.activity);
                    settings_list.appendChild(_this.method);
                    settings_list.appendChild(_this.chevrons);
                    settings_list.appendChild(_this.dist_markers);

                    settings_container.appendChild(settings_list);
                }
                _this.total = new Total(_this);
            }
        }
        xhr.open('GET', './mapbox_token.txt');
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
        this.total = total;
        this.elev.total = total;
        const buttons = this;
        const map = this.map;

        $( ".sortable" ).on( "sortupdate", function( event, ui ) {
            const order = total.buttons.tabs.childNodes;
            const offset = 3;

            for (var i=offset; i<order.length; i++)
                total.swapTraces(i-offset, order[i].trace.index);

            if (total.hasFocus) total.update();
        });
        this.draw.addEventListener("click", function () {
            const newTrace = total.addTrace(undefined, "new.gpx");
            newTrace.draw();
            gtag('event', 'button', {'event_category' : 'draw'});
        });
        this.add_wpt.addEventListener("click", function () {
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
            buttons.cycling = !buttons.cycling;
            if (buttons.cycling) {
                buttons.bike.classList.add("selected");
                buttons.run.classList.remove("selected");
                buttons.stravaHeatmap.setUrl('https://heatmap-external-{s}.strava.com/tiles-auth/cycling/bluered/{z}/{x}/{y}.png');
            } else {
                buttons.bike.classList.remove("selected");
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
        document.addEventListener("keydown", ({key}) => {
            if (key === "Escape") {
                if (buttons.window_open) {
                    buttons.window_open.hide();
                    return;
                }
                if (total.hasFocus) return;
                var trace = total.traces[total.focusOn];
                if (trace.isEdited) buttons.edit.click();
            }
        });
        this.reverse.addEventListener("click", function() {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
            trace.reverse();
            gtag('event', 'button', {'event_category' : 'reverse'});
        });
        this.extract.addEventListener("click", function() {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
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
                    if (marker._latlng != marker._latlng_origin) trace.askElevation([marker._latlng], true);
                    if (trace.isEdited) map._container.style.cursor = 'crosshair';
                    else map._container.style.cursor = '';
                }
                map._draggedMarker = null;
            }
        });
        this.time.addEventListener("click", function (e) {
            if (total.hasFocus) return;

            var content = `<div id="speed-change" style="padding-bottom:4px;">`;

            if (buttons.cycling) {
                content += `Speed <input type="number" id="speed-input" min="1.0" max="99.9" step="0.1" lang="en-150"> `;
                if (buttons.km) content += `km/h</div>`;
                else content += `mi/h</div>`;
            } else {
                content += `Pace <input type="number" id="minutes" min="1" max="59" step="1">
                            :
                            <input type="number" id="seconds" min="0" max="59" step="1"> `;
                if (buttons.km) content += `min/km</div>`;
                else content += `min/mi</div>`;
            }

            content += `<div id="start-change">Start
                        <input type="datetime-local" id="start-time"></div></div><br>
                        <div><b style="color:red">Experimental</b> Generate speed considering<br>the slope (erases all existing time data) <input type="checkbox" id="slope-speed"></div><br>
                        <div id="edit-speed" class="panels custom-button normal-button">Ok</div>
                        <div id="cancel-speed" class="panels custom-button normal-button"><b>Cancel</b></div>`;

            const trace = total.traces[total.focusOn];
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

            buttons.color_picker.value = trace.normal_style.color;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.color_window;
            buttons.color_window.show();
        });
        this.color_ok.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            const color = buttons.color_picker.value;
            total.changeColor(trace.normal_style.color, color);
            trace.normal_style.color = color;
            trace.focus_style.color = color;
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
            trace.clone();
            gtag('event', 'button', {'event_category' : 'duplicate'});
        });
        this.combine.addEventListener("click", function () {
            if (total.traces.length <= 1) return;
            if (buttons.window_open) buttons.window_open.hide();
            const trace = total.traces[total.focusOn];
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
    }

    focusTabElement(tab) {
        document.querySelectorAll('.tab').forEach(item => {item.classList.remove('tab-focus');});
        tab.classList.add('tab-focus');
    }

    updateBounds() {
        this.map.fitBounds(this.total.getBounds());
    }

    updateTabWidth() {
        const offset = 3;
        const remaining_width = Math.floor(this.trace_info_grid.offsetWidth) - Math.ceil(this.total_tab.offsetWidth) - 1;
        var tabs_width = 0;
        for (var i=offset; i<this.tabs.childNodes.length; i++) {
            this.tabs.childNodes[i].style.width = 'auto';
            tabs_width += this.tabs.childNodes[i].offsetWidth;
        }
        if (tabs_width > remaining_width) {
            const avg_tab_width = remaining_width / (this.tabs.childNodes.length - offset);
            var cnt = 0;
            var to_divide = remaining_width;
            for (var i=offset; i<this.tabs.childNodes.length; i++) {
                if (this.tabs.childNodes[i].offsetWidth >= avg_tab_width) cnt++;
                else to_divide -= this.tabs.childNodes[i].offsetWidth;
            }
            const padding = 2 * parseFloat(window.getComputedStyle(this.total_tab, null).getPropertyValue('padding-left'));
            const new_tab_width = Math.floor(to_divide / cnt - padding);
            var first = true;
            for (var i=offset; i<this.tabs.childNodes.length; i++) {
                if (this.tabs.childNodes[i].offsetWidth >= avg_tab_width) {
                    if (first) {
                        first = false;
                        this.tabs.childNodes[i].style.width = (to_divide - (cnt - 1) * (new_tab_width + padding) - padding - 1) + 'px';
                    } else this.tabs.childNodes[i].style.width = new_tab_width + 'px';
                }
            }
        }
    }

    loadFiles(files) {
        var total = this.total;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.name.split('.').pop() != 'gpx') continue;
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

    donation() {
        window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TCK9RME3XUV9N&source=url');
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
       var canvas = document.createElement('canvas');
       var supports = 'probablySupportsContext' in canvas
           ? 'probablySupportsContext'
           :  'supportsContext';

       if (supports in canvas) {
         return canvas[supports]('webgl') || canvas[supports]('experimental-webgl');
       }

       return 'WebGLRenderingContext' in window;
   };
}
