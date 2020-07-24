// MIT License
//
// Copyright (c) 2020 Vianney Coppé https://github.com/vcoppe
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import Slider from './slider.js';
import Google from './google.js';

export default class Buttons {
    constructor() {
        // MAIN MAP
        this.map = L.map('mapid', {
            zoomControl: false
        }).setView([50.772, 3.890], 13);
        this.map.addEventListener("locationfound", function (e) {
            e.target.setView(e.latlng,12);
        });
        this.map.locate();

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
        this.reverse = document.getElementById("reverse");
        this.cancel_delete = document.getElementById("canceldelete");
        this.time = document.getElementById("edit-time");
        this.duplicate = document.getElementById("duplicate");
        this.color = document.getElementById("color");
        this.color_ok = document.getElementById("validate-color");
        this.color_picker = document.getElementById("color-picker");
        this.edit = document.getElementById("edit");
        this.validate = document.getElementById("validate");
        this.unvalidate = document.getElementById("unvalidate");
        this.export = document.getElementById("export");
        this.export2 = document.getElementById("export-2");
        this.save_drive = document.getElementById("save-drive");
        this.units = document.getElementById("units");
        this.activity = document.getElementById("activity");
        this.method = document.getElementById("method");
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
        this.share_ok = document.getElementById("share-ok");

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
        this.strava_content = document.getElementById('strava-content');
        this.color_content = document.getElementById('color-content');
        this.load_content = document.getElementById('load-content');
        this.share_content = document.getElementById('share-content');
        this.buttons_bar = document.getElementById('buttons-bar');

        // ZOOM CONTROL
        this.zoom = L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        var _this = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                _this.mapbox_token = xhr.responseText;

                const cacheAge = 30 * 24 * 60 * 60 * 1000;

                // TILES

                _this.openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 20,
                    maxNativeZoom: 19,
                    useCache: true,
	                crossOrigin: true,
                    cacheMaxAge: cacheAge
                }).addTo(_this.map);

                _this.mapboxStreets = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 20,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: _this.mapbox_token,
                    useCache: true,
	                crossOrigin: true,
                    cacheMaxAge: cacheAge
                });

                _this.mapboxOutdoors = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 20,
                    id: 'mapbox/outdoors-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: _this.mapbox_token,
                    useCache: true,
	                crossOrigin: true,
                    cacheMaxAge: cacheAge
                });

                _this.mapboxSatellite = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 20,
                    id: 'mapbox/satellite-v9',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: _this.mapbox_token,
                    useCache: true,
	                crossOrigin: true,
                    cacheMaxAge: cacheAge
                });

                _this.openCycleMap = L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}', {
                    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    apikey: '67774cfadfeb42d2ac42bc38fda667c0',
                    maxZoom: 20,
                    useCache: true,
	                crossOrigin: true,
                    cacheMaxAge: cacheAge
                });

                _this.openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    maxZoom: 20,
                    maxNativeZoom: 17,
                    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
                    useCache: true,
	                crossOrigin: true,
                    cacheMaxAge: cacheAge
                });

                _this.stravaHeatmap = L.tileLayer('https://heatmap-external-{s}.strava.com/tiles-auth/cycling/bluered/{z}/{x}/{y}.png', {
                    maxZoom: 20,
                    maxNativeZoom: 15,
                    attribution: 'Heatmap: &copy; <a href="https://www.strava.com">Strava</a>'
                });

                L.control.layers({
                    "OpenStreetMap" : _this.openStreetMap,
                    "OpenCycleMap" : _this.openCycleMap,
                    "OpenTopoMap" : _this.openTopoMap,
                    "Mapbox Streets" : _this.mapboxStreets,
                    "Mapbox Outdoors" : _this.mapboxOutdoors,
                    "Mapbox Satellite" : _this.mapboxSatellite
                },{
                    "Strava Heatmap" : _this.stravaHeatmap
                }).addTo(_this.map);

                _this.stravaHeatmap.on('tileerror', function (e) {
                    _this.stravaHeatmap.remove();
                    if (_this.stravaHeatmap.open) return;
                    _this.stravaHeatmap.open = true;
                    const popup = L.popup({
                        className: "centered-popup custom-popup",
                        autoPan: false,
                        closeButton: false
                    });
                    _this.stravaHeatmap.popup = popup;
                    popup.setLatLng(_this.map.getCenter());
                    popup.setContent(_this.strava_content);
                    _this.strava_content.style.display = 'block';
                    popup.openOn(_this.map);
                    _this.disableMap();
                    popup.addEventListener('remove', function (e) {
                        _this.stravaHeatmap.open = false;
                        _this.strava_content.style.display = 'none';
                        _this.enableMap();
                    });
                });
            }
        }
        xhr.open('GET', './mapbox_token.txt');
        xhr.send();

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
            width: 400,
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
        this.toolbar = L.control({position: 'topleft'});
        this.toolbar.onAdd = function (map) {
            var div = document.getElementById('toolbar');
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

        this.trace_info = L.control({position: 'bottomleft'});
        this.trace_info.onAdd = function (map) {
            var div = document.getElementById('info');
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        this.trace_info.addTo(this.map);
        this.trace_info_grid.appendChild(this.elevation_profile);


        this.social = L.control({position: 'bottomright'});
        this.social.onAdd = function (map) {
            var div = document.getElementById('social');
            return div;
        };
        this.social.addTo(this.map);

        this.slider = new Slider(this);
        this.google = new Google(this);

        this.addHandlers();

        // SETTINGS
        this.km = true;
        this.cycling = true;
        this.routing = true;
        this.openroute = true;
    }

    hideTraceButtons() {
        this.slider.hide();
        this.delete.classList.add('unselected','no-click');
        this.reverse.classList.add('unselected','no-click');
        this.edit.classList.add('unselected','no-click');
        this.time.classList.add('unselected','no-click');
        this.duplicate.classList.add('unselected','no-click');
        this.color.classList.add('unselected','no-click');
    }

    showTraceButtons() {
        this.slider.show();
        this.delete.classList.remove('unselected','no-click');
        this.reverse.classList.remove('unselected','no-click');
        this.edit.classList.remove('unselected','no-click');
        this.time.classList.remove('unselected','no-click');
        this.duplicate.classList.remove('unselected','no-click');
        this.color.classList.remove('unselected','no-click');
    }

    greyTraceButtons() {
        this.slider.hide();
        this.delete.classList.add('unselected','no-click');
        this.reverse.classList.add('unselected','no-click');
        this.time.classList.add('unselected','no-click');
        this.duplicate.classList.add('unselected','no-click');
        this.color.classList.add('unselected','no-click');
    }

    blackTraceButtons() {
        this.slider.show();
        this.delete.classList.remove('unselected','no-click');
        this.reverse.classList.remove('unselected','no-click');
        this.time.classList.remove('unselected','no-click');
        this.duplicate.classList.remove('unselected','no-click');
        this.color.classList.remove('unselected','no-click');
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
        this.map.keyboard.disable();
        this.zoom.disable();
        if (this.map.tap) this.map.tap.disable();
    }

    enableMap() {
        this.map.dragging.enable();
        this.map.touchZoom.enable();
        this.map.doubleClickZoom.enable();
        this.map.scrollWheelZoom.enable();
        this.map.boxZoom.enable();
        this.map.keyboard.enable();
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
            if (buttons.load.open) return;
            buttons.load.open = true;
            const popup = L.popup({
                className: "centered-popup custom-popup",
                closeButton: false,
                autoPan: false
            });
            buttons.load.popup = popup;
            popup.setLatLng(map.getCenter());
            popup.setContent(buttons.load_content);
            buttons.load_content.style.display = 'block';
            popup.openOn(map);
            buttons.disableMap();
            popup.addEventListener('remove', function (e) {
                buttons.load.open = false;
                buttons.load_content.style.display = 'none';
                buttons.enableMap();
            });
        });
        this.load2.addEventListener("click", function () {
            buttons.input.click();
            buttons.load.popup.remove();
        });
        this.load_drive.addEventListener("click", function () {
            buttons.google.loadPicker(false);
            buttons.load.popup.remove();
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
            buttons.stravaHeatmap.popup.remove();
        });
        this.share_ok.addEventListener("click", function () {
            buttons.share_content.popup.remove();
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
        this.clear.addEventListener("click", function () {
            if (total.traces.length == 0) return;
            if (buttons.clear.open) return;
            buttons.clear.open = true;
            const popup = L.popup({
                className: "centered-popup custom-popup",
                closeButton: false,
                autoPan: false
            });
            buttons.clear.popup = popup;
            popup.setLatLng(map.getCenter());
            popup.setContent(buttons.clear_content);
            buttons.clear_content.style.display = 'block';
            popup.openOn(map);
            buttons.disableMap();
            popup.addEventListener('remove', function (e) {
                buttons.clear.open = false;
                buttons.clear_content.style.display = 'none';
                buttons.enableMap();
            });
        });
        this.clear2.addEventListener("click", function () {
            total.clear();
            buttons.clear.popup.remove();
        });
        this.cancel_clear.addEventListener("click", function () {
            buttons.clear.popup.remove();
        });
        this.delete.addEventListener("click", function () {
            if (total.hasFocus) return;
            if (buttons.delete.open) return;
            buttons.delete.open = true;
            const popup = L.popup({
                className: "centered-popup custom-popup",
                closeButton: false,
                autoPan: false
            });
            buttons.delete.popup = popup;
            popup.setLatLng(map.getCenter());
            popup.setContent(buttons.delete_content);
            buttons.delete_content.style.display = 'block';
            popup.openOn(map);
            buttons.disableMap();
            popup.addEventListener('remove', function (e) {
                buttons.delete.open = false;
                buttons.delete_content.style.display = 'none';
                buttons.enableMap();
            });
        });
        this.delete2.addEventListener("click", function () {
            total.removeTrace(total.focusOn);
            buttons.delete.popup.remove();
        });
        this.cancel_delete.addEventListener("click", function () {
            buttons.delete.popup.remove();
        });
        this.export.addEventListener("click", function () {
            if (total.traces.length > 0) {
                if (buttons.export.open) return;
                buttons.export.open = true;
                const popup = L.popup({
                    className: "centered-popup custom-popup cross",
                    autoPan: false
                });
                buttons.merge.checked = true;
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
                buttons.export.popup = popup;
                popup.setLatLng(map.getCenter());
                popup.setContent(buttons.export_content);
                buttons.export_content.style.display = 'block';
                popup.openOn(map);
                buttons.disableMap();
                popup.addEventListener('remove', function (e) {
                    buttons.export.open = false;
                    buttons.export_content.style.display = 'none';
                    buttons.enableMap();
                });
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

            buttons.export.popup.remove();
            gtag('event', 'button', {'event_category' : 'export'});
        });
        this.save_drive.addEventListener("click", function () {
            buttons.google.loadPicker(true);
        });
        this.validate.addEventListener("click", function () {
            if (total.hasFocus) return;
            gtag('event', 'button', {'event_category' : 'crop'});
            total.traces[total.focusOn].crop(total.buttons.slider.getIndexStart(), total.buttons.slider.getIndexEnd());
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
            if (total.hasFocus) total.showData();
            else total.traces[total.focusOn].showData();
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
        this.reverse.addEventListener("click", function() {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
            trace.reverse();
        });
        map.on('mouseup', function (e) {
            map.dragging.enable();
            map.removeEventListener('mousemove');
            if (map._draggedMarker) {
                if (total.hasFocus) return;
                var trace = total.traces[total.focusOn];
                const marker = map._draggedMarker;
                marker.getElement().style.cursor = 'pointer';
                trace.updatePoint(marker, e.latlng.lat, e.latlng.lng);
                trace.refreshEditMarkers();
                map._draggedMarker = null;
            }
        });
        this.time.addEventListener("click", function (e) {
            const trace = total.traces[total.focusOn];
            if (trace.popup) return;

            var content = `<div id="popup-grid">
                           <div id="speed-change">`;

            if (buttons.cycling) {
                content += `Speed <input type="number" id="speed" min="1.0" max="99.9" step="0.1" lang="en-150"> `;
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
                        <input type="datetime-local" id="start-time"></div>
                        <div id="ok-dialog"><i class="fas fa-check custom-button"></i></div>
                        <div id="close-dialog"><i class="fas fa-times custom-button"></i></div>
                        </div>`;

            const popup = L.popup({
                closeButton: false,
                autoPan: false,
                className: "custom-popup"
            });

            popup.setContent(content);
            popup.setLatLng(map.getCenter());
            popup.openOn(map);
            popup.update();
            popup.addEventListener('remove', function (e) {
                trace.closePopup();
                buttons.enableMap();
            });
            trace.popup = popup;
            buttons.disableMap();

            var offset = -(new Date().getTimezoneOffset() / 60);

            var speed = document.getElementById("speed");
            var minutes = document.getElementById("minutes");
            var seconds = document.getElementById("seconds");

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

            var ok = document.getElementById("ok-dialog");
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

                trace.closePopup();
                trace.changeTimeData(startTime, v);

                trace.recomputeStats();
                trace.update();
                gtag('event', 'button', {'event_category' : 'edit-time'});
            });

            var close = document.getElementById("close-dialog");
            close.addEventListener("click", function () {
                trace.closePopup();
            });
        });
        this.color.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            if (trace.popup) return;

            const popup = L.popup({
                closeButton: false,
                autoPan: false,
                className: "custom-popup"
            });

            buttons.color_picker.value = trace.normal_style.color;
            popup.setContent(buttons.color_content);
            buttons.color_content.style.display = 'block';
            popup.setLatLng(map.getCenter());
            popup.openOn(map);
            popup.addEventListener('remove', function (e) {
                trace.closePopup();
                buttons.enableMap();
                buttons.color_content.style.display = 'none';
            });
            trace.popup = popup;
            buttons.disableMap();
        });
        this.color_ok.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            const color = buttons.color_picker.value;
            trace.normal_style.color = color;
            trace.focus_style.color = color;
            trace.gpx.setStyle(trace.focus_style);
            trace.popup.remove();
        });
        this.about.addEventListener("click", function () {
            window.open('./about.html');
        });
        this.help.addEventListener("click", function () {
            if (buttons.help.open) return;
            buttons.help.open = true;
            const popup = L.popup({
                className: "centered-popup custom-popup",
                autoPan: false
            });
            popup.setLatLng(map.getCenter());
            popup.setContent(buttons.help_text);
            buttons.help_text.style.display = 'block';
            popup.openOn(map);
            buttons.disableMap();
            popup.addEventListener('remove', function (e) {
                buttons.help_text.style.display = 'none';
                buttons.help.open = false;
                buttons.enableMap();
            });
            gtag('event', 'button', {'event_category' : 'help'});
        });
        this.duplicate.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            trace.clone();
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
        const remaining_width = Math.floor(this.trace_info_grid.offsetWidth) - Math.ceil(this.total_tab.offsetWidth);
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
        window.open('https://paypal.me/vcoppe');
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
}
