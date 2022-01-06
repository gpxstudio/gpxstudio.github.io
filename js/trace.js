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

const options = {
    async: true,
    polyline_options: { weight: 3, opacity: 1 },
    marker_options: {
        startIconUrl: '',
        endIconUrl: '',
        shadowUrl: '',
        wptIconUrls : { '': './res/favicon.png' }
    },
    max_point_interval: 10 * 60000,
    gpx_options: {
        joinTrackSegments: false
    }
};
const ELEVATION_ZOOM = 14;

export default class Trace {
    constructor(file, name, map, total, callback) {
        name = name.split('.')[0];
        this.name = name;
        this.map = map;
        this.total = total;
        this.buttons = total.buttons;
        this.hasFocus = false;
        this.isEdited = false;
        this.drawing = false;
        this.visible = true;
        this.popup = L.popup({closeButton: false});
        this.renaming = false;
        this.normal_style = {...total.normal_style};
        this.focus_style = {...total.focus_style};

        const color = total.getColor();
        this.normal_style.color = color;
        this.focus_style.color = color;

        this.memory = [];
        this.at = -1;
        this.lastSaveIsNew = true;
        this.backToZero = false;

        this.gpx = new L.GPX(file, options, this).addTo(map);
        this.gpx.trace = this;

        this.index = total.traces.length;
        total.traces.push(this);

        const trace = this;

        this.gpx.on('error', function (e) {
            console.log(e);
            total.removeTrace(trace.index);
            total.buttons.showLoadErrorPopup();
        }).on('loaded', function(e) {
            if (this.getLayers().length > 0) {
                var layers = this.getLayers()[0].getLayers();
                var wptMissingEle = [];
                for (var i=0; i<layers.length; i++) {
                    if (layers[i]._latlng) { // wpt
                        if (layers[i]._latlng.meta && layers[i]._latlng.meta.ele == -1) wptMissingEle.push(layers[i]._latlng);
                    }
                }
                if (wptMissingEle.length > 0 && !trace.buttons.embedding) trace.askElevation(wptMissingEle);
            }
            if (this.getLayers().length > 0) total.buttons.updateBounds();

            var ul = document.getElementById("sortable");
            var li = document.createElement("li");
            li.innerHTML = '<div class="handle">'+name+'</div><div class="tab-color" style="background:'+trace.normal_style.color+Math.round(trace.normal_style.opacity * 255).toString(16)+';">';
            li.title = name;
            li.classList.add('tab','tab-draggable');
            li.trace = trace;
            li.addEventListener('click', function (e) {
                if (total.to_merge && total.to_merge != trace && total.buttons.window_open == total.buttons.merge_window) {
                    total.to_merge.merge(trace, total.buttons.merge_as_segments.checked, total.buttons.merge_stick_time.checked);
                    total.removeTrace(trace.index);
                    total.to_merge.focus();
                    total.to_merge = null;
                    total.buttons.merge_window.hide();
                    gtag('event', 'button', {'event_category' : 'merge'});
                } else if (!trace.hasFocus) trace.focus();
            });
            li.addEventListener('dblclick', function (e) {
                if (trace.buttons.embedding) return;
                if (trace.renaming) return;
                trace.renaming = true;
                li.innerHTML = '<input type="text" id="tabname" class="input-minimal" minlength="1" size="'+(trace.name.length)+'"> ';
                trace.tabname = document.getElementById("tabname");
                trace.tabname.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') trace.rename();
                });
                trace.tabname.addEventListener('focusout', function (e) {
                    trace.rename();
                });
                trace.tabname.focus();
                trace.tabname.value = trace.name;
            });
            ul.appendChild(li);

            trace.tab = li;
            total.buttons.circlesToFront();

            trace.extendTimeData(true);
            trace.focus();

            if (total.buttons.multipleEmbedding) trace.updateFocus();

            if (trace.gpx.missing_elevation && (!trace.buttons.embedding || trace.buttons.mapboxSKUToken)) trace.askElevation(trace.getPoints());

            if (callback) callback(trace);
        }).on('click', function (e) {
            if (e.layer.sym) return;
            if (trace.buttons.disable_trace) return;
            if (!trace.total.hasFocus && trace.total.focusOn != trace.index && trace.total.traces[trace.total.focusOn].isEdited) return;
            if (!e.target.trace.isEdited) e.target.trace.updateFocus();
        }).on('mousedown', function (e) {
            if (trace.buttons.disable_trace) return;
            if (trace.isEdited) {
                if (e.originalEvent.which == 3) return;
                if (e.layer._latlng) return;
                trace.insertingMarker = true;
                const marker = trace.insertEditMarker(e.layer, e.layerPoint);
                marker.fire('mousedown');
            }
        }).on('contextmenu', function (e) {
            if (!trace.isEdited) return;

            var best_idx = -1, best_dist = null;
            const points = trace.getPoints();
            for (var i=0; i<points.length; i++) {
                const dist = points[i].distanceTo(e.latlng);
                if (best_idx == -1 || dist < best_dist) {
                    best_idx = i;
                    best_dist = dist;
                }
            }

            if (!best_idx) return;

            trace.popup.setContent(`<div id="split" class="custom-button popup-action"><i class="fas fa-cut"></i> `+trace.buttons.split_text+`</div>
                                    <div id="start-loop" class="custom-button popup-action"><i class="fas fa-undo"></i> `+trace.buttons.start_loop_text+`</div>
                                    <div id="close-popup" class="custom-button" style="position: absolute; top: 4px; right: 6px;"><i class="fas fa-times"></i></div>`);
            trace.popup.setLatLng(e.latlng);
            trace.popup.openOn(map);
            trace.popup.addEventListener('remove', function (e) {
                trace.closePopup();
            });

            var button = document.getElementById("split");
            button.addEventListener("click", function () {
                const copy = trace.clone();
                total.setTraceIndex(copy.index, trace.index+1);
                copy.crop(best_idx, copy.getPoints().length, true);
                trace.crop(0, best_idx, true);
                trace.closePopup();
                trace.draw();
            });

            var button2 = document.getElementById("start-loop");
            button2.addEventListener("click", function () {
                trace.setStart(best_idx);
                trace.closePopup();
            });

            var close = document.getElementById("close-popup");
            close.addEventListener("click", function () {
                trace.closePopup();
            });

            return false;
        });
        L.DomEvent.on(this.gpx, 'dblclick', L.DomEvent.stopPropagation);

        if (file === undefined) this.gpx.fire('loaded');
    }

    rename(name) {
        var newname = name ? name : this.tabname.value;
        if (newname.length == 0) this.tab.innerHTML = '<div class="handle">'+this.name+'</div><div class="tab-color" style="background:'+this.normal_style.color+';">';
        else {
            this.name = newname;
            this.tab.innerHTML = '<div class="handle">'+newname+'</div><div class="tab-color" style="background:'+this.normal_style.color+';">';
            this.tab.title = newname;
        }
        this.renaming = false;
    }

    clone() {
        const newTrace = this.total.addTrace(undefined, this.name);
        newTrace.gpx.addLayer(new L.FeatureGroup());

        const segments = this.getSegments();
        for (var l=0; l<segments.length; l++) {
            const points = segments[l]._latlngs;
            const cpy = [];
            for (var i=0; i<points.length; i++) {
                const pt = points[i].clone();
                pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                pt.index = points[i].index;
                pt.routing = points[i].routing;
                cpy.push(pt);
            }

            if (cpy.length > 0) {
                newTrace.gpx.getLayers()[0].addLayer(new L.Polyline(cpy, newTrace.gpx.options.polyline_options));
            }
        }

        newTrace.recomputeStats();
        newTrace.update();
        newTrace.gpx.setStyle(newTrace.focus_style);
        newTrace.showChevrons();
        newTrace.showDistanceMarkers();

        const waypoints = this.getWaypoints();
        for (var i=0; i<waypoints.length; i++) {
            const marker = waypoints[i];
            const newMarker = newTrace.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
            newTrace.gpx.getLayers()[0].addLayer(newMarker);
        }

        return newTrace;
    }

    /*** LOGIC ***/

    remove() {
        this.total.removeColor(this.normal_style.color);
        this.unfocus();
        this.gpx.clearLayers();
        if (document.body.contains(this.tab)) this.buttons.tabs.removeChild(this.tab);
    }

    /*** DISPLAY ***/

    focus(creation) {
        this.total.unfocusAll();
        this.hasFocus = true;
        this.total.focusOn = this.index;
        this.total.hasFocus = false;
        this.gpx.setStyle(this.focus_style);
        this.gpx.bringToFront();
        this.buttons.focusTabElement(this.tab);
        this.showData();
        this.showElevation();
        this.updateExtract();
        if (this.visible) {
            this.buttons.unhideToHide();
            this.showWaypoints();
            this.showChevrons();
            this.showDistanceMarkers();
        } else this.buttons.hideToUnhide();
        if (!this.buttons.embedding) this.tab.scrollIntoView();
    }

    unfocus() {
        this.hasFocus = false;
        this.gpx.setStyle(this.normal_style);
        this.closePopup();
        this.hideWaypoints();
        this.hideChevrons();
        this.hideDistanceMarkers();
        if (this.isEdited) this.stopEdit();
        if (this.drawing) this.stopDraw();
        if (this.renaming) this.rename();
        if (this.buttons.slider.isActive()) this.buttons.slider.reset();
    }

    updateFocus() {
        if (this.hasFocus) {
            this.unfocus();
            this.total.focus();
        } else this.focus();
    }

    update() {
        if (this.hasFocus) {
            this.showData();
            this.showElevation();
            this.updateExtract();
        }
    }

    hideUnhide() {
        this.visible = !this.visible;
        if (this.visible) {
            this.buttons.unhideToHide();
            this.showSegments();
            this.showWaypoints();
            this.showChevrons();
            this.showDistanceMarkers();
            if (this.isEdited) this.updateEditMarkers();
            else this.buttons.elev._addSliderCircles();
        } else {
            this.buttons.hideToUnhide();
            this.hideSegments();
            this.hideWaypoints();
            this.hideChevrons();
            this.hideDistanceMarkers();
            this.removeEditMarkers();
            if (this.buttons.slider.isActive()) this.buttons.slider.reset();
            this.buttons.elev._removeSliderCircles();
        }
    }

    updateUndoRedo() {
        if (this.at >= 0 && !this.backToZero) this.buttons.undo.classList.remove('unselected','no-click2');
        else this.buttons.undo.classList.add('unselected','no-click2');
        if (this.at < this.memory.length-1) this.buttons.redo.classList.remove('unselected','no-click2');
        else this.buttons.redo.classList.add('unselected','no-click2');
    }

    updateExtract() {
        const count = this.getSegments().length;
        if (count < 2) {
            this.buttons.extract.classList.add('unselected','no-click');
            this.can_extract = false;
        } else {
            this.buttons.extract.classList.remove('unselected','no-click');
            this.can_extract = true;
        }
    }

    showSegments() {
        const segments = this.getSegments();
        for (var i=0; i<segments.length; i++) {
            segments[i]._path.style.display = '';
        }
    }

    hideSegments() {
        const segments = this.getSegments();
        for (var i=0; i<segments.length; i++) {
            segments[i]._path.style.display = 'none';
        }
    }

    showWaypoints() {
        const waypoints = this.getWaypoints();
        for (var i=0; i<waypoints.length; i++) {
            waypoints[i]._icon.style.display = '';
        }
    }

    hideWaypoints() {
        const waypoints = this.getWaypoints();
        for (var i=0; i<waypoints.length; i++) {
            waypoints[i]._icon.style.display = 'none';
        }
    }

    edit() {
        this.isEdited = true;
        this.updatePointIndices();
        this.updateEditMarkers();
        this.buttons.greyTraceButtons();
        if (this.buttons.slider.isActive()) this.buttons.slider.reset();
        this.buttons.elev._removeSliderCircles();
        this.buttons.editToValidate();
        this.closePopup();

        this.buttons.undo.addEventListener('click', this.undoListener = this.undo.bind(this));
        this.buttons.redo.addEventListener('click', this.redoListener = this.redo.bind(this));
        this.updateUndoRedo();
    }

    stopEdit() {
        this.isEdited = false;
        this.removeEditMarkers();
        this.buttons.blackTraceButtons();
        if (this.visible) this.buttons.elev._addSliderCircles();
        this.buttons.validateToEdit();
        this.closePopup();
        this.updateExtract();

        this.buttons.undo.classList.add('unselected');
        this.buttons.redo.classList.add('unselected');
        this.buttons.undo.removeEventListener('click', this.undoListener);
        this.buttons.redo.removeEventListener('click', this.redoListener);

        this.memory = [];
        this.at = -1;
    }

    draw() {
        this.edit();
        this.drawing = true;
        this.buttons.map._container.style.cursor = 'crosshair';
        var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
        if (mapboxgl_canvas.length > 0) {
            mapboxgl_canvas = mapboxgl_canvas[0];
            mapboxgl_canvas.style.cursor = 'crosshair';
            this.mapboxgl_canvas = mapboxgl_canvas;
        } else this.mapboxgl_canvas = null;
    }

    stopDraw() {
        this.buttons.map._container.style.cursor = '';
        var mapboxgl_canvas = document.getElementsByClassName('mapboxgl-canvas');
        if (this.mapboxgl_canvas) this.mapboxgl_canvas.style.cursor = '';
        this.drawing = false;
        if (this.getPoints().length == 0) {
            this.total.removeTrace(this.index);
        }
    }

    closePopup() {
        if (this.popup) {
            this.popup.remove();
        }
    }

    redraw() {
        const segments = this.getSegments();
        for (var i=0; i<segments.length; i++) {
            segments[i].redraw();
        }
    }

    showData() {
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(1).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.elevation.innerHTML = '<i class="fas fa-angle-up"></i> ' + this.getElevationGain().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text) +
            ' <i class="fas fa-angle-down"></i> ' + this.getElevationLoss().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text);
        if (this.buttons.activity != 'hike') this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text) + '/' + this.buttons.unit_hours_text;
        else this.buttons.speed.innerHTML = this.total.msToTimeMin(this.getMovingPace()) + ' ' + this.buttons.unit_minutes_text + '/' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.duration.innerHTML = this.total.msToTime(this.getMovingTime());
        this.buttons.points.innerHTML = this.gpx._info.npoints;
        this.buttons.segments.innerHTML = this.gpx._info.nsegments;
    }

    showElevation() {
        this.buttons.elev.clear();
        this.buttons.elev.options.imperial = !this.buttons.km;
        this.addElevation();
        if (this.isEdited || !this.visible) this.buttons.elev._removeSliderCircles();
    }

    addElevation(total_points) {
        const segments = this.getSegments();
        var points = [];
        for (var i=0; i<segments.length; i++) points.push(segments[i]._latlngs);
        this.buttons.elev.addData(points);
    }

    showChevrons() {
        if (this.buttons.show_direction) {
            this.hideChevrons();
            this.gpx.setText('     ➜     ', {
                repeat: true,
                attributes: {
                    fill: this.normal_style.color,
                    opacity: this.normal_style.opacity,
                    dy: '5px',
                    'font-size': '14px',
                    style: `text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white, 0px 1px 0 white, 0px -1px 0 white, -1px 0px 0 white, 1px 0px 0 white, 2px 2px 0 white, -2px 2px 0 white, 2px -2px 0 white, -2px -2px 0 white, 0px 2px 0 white, 0px -2px 0 white, -2px 0px 0 white, 2px 0px 0 white, 1px 2px 0 white, -1px 2px 0 white, 1px -2px 0 white, -1px -2px 0 white, 2px 1px 0 white, -2px 1px 0 white, 2px -1px 0 white, -2px -1px 0 white;
                            -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;`
                }
            });
        }
    }

    hideChevrons() {
        this.gpx.setText(null);
    }

    showDistanceMarkers() {
        if (this.buttons.show_distance) {
            if (this.buttons.km) this.gpx.addDistanceMarkers();
            else this.gpx.addDistanceMarkers({ offset: 1609.344});
        }
    }

    hideDistanceMarkers() {
        this.gpx.removeDistanceMarkers();
    }

    getBounds() {
        return this.gpx.getBounds();
    }

    newEditMarker(point, layer) {
        const trace = this;
        const map = this.map;
        const marker = L.circleMarker([point.lat, point.lng], {
            className: 'edit-marker',
            radius: 4,
            pane: 'markerPane'
        }).addTo(map);
        marker._pt = point;
        marker._prec = point;
        marker._succ = point;
        marker._layer = layer;
        marker.on({
            mousedown: function (e) {
                if (e.originalEvent !== undefined && e.originalEvent.which == 3) return;
                map.dragging.disable();
                map.on('mousemove', function (e) {
                    marker.setLatLng(e.latlng);
                });
                map._draggedMarker = marker;
                marker.getElement().style.cursor = 'grabbing';
            },
            contextmenu: function (e) {
                if (trace._editMarkers.length == 1) return;
                var content = '<div id="close-popup" class="custom-button" style="float: right;"><i class="fas fa-times"></i></div>';
                if (marker != trace._editMarkers[0] && marker != trace._editMarkers[trace._editMarkers.length-1]) {
                    content += `<div id="split-waypoint" class="custom-button popup-action"><i class="fas fa-cut"></i> `+trace.buttons.split_text+`</div>
                                <div id="start-loop-waypoint" class="custom-button popup-action"><i class="fas fa-undo"></i> `+trace.buttons.start_loop_text+`</div>`;
                }
                content += `<div id="remove-waypoint" class="custom-button popup-action"><i class="fas fa-trash-alt"></i> `+trace.buttons.remove_pt_text+`</div>`;

                trace.popup.setContent(content);
                trace.popup.setLatLng(e.latlng);
                trace.popup.openOn(map);
                trace.popup.addEventListener('remove', function (e) {
                    trace.closePopup();
                });

                var button = document.getElementById("remove-waypoint");
                button.addEventListener("click", function () {
                    trace.deletePoint(marker);
                    marker.remove();
                    trace.closePopup();
                });

                if (marker != trace._editMarkers[0] && marker != trace._editMarkers[trace._editMarkers.length-1]) {
                    var button2 = document.getElementById("split-waypoint");
                    button2.addEventListener("click", function () {
                        const copy = trace.clone();
                        copy.total.setTraceIndex(copy.index, trace.index+1);
                        copy.crop(marker._pt.trace_index, copy.getPoints().length, true);
                        trace.crop(0, marker._pt.trace_index, true);
                        marker.remove();
                        trace.closePopup();
                        trace.draw();
                    });

                    var button3 = document.getElementById("start-loop-waypoint");
                    button3.addEventListener("click", function () {
                        trace.setStart(marker._pt.trace_index);
                        trace.closePopup();
                    });
                }

                var close = document.getElementById("close-popup");
                close.addEventListener("click", function () {
                    trace.closePopup();
                });

                return false;
            }
        });
        return marker;
    }

    insertEditMarker(layer, layer_point) {
        const pt = this.map.layerPointToLatLng(layer_point);
        const points = layer._latlngs;
        var best_dist = -1, best_idx = -1;
        for (var i=0; i<points.length-1; i++) {
            const dist = L.LineUtil.pointToSegmentDistance(layer_point,
                this.map.latLngToLayerPoint(points[i]),
                this.map.latLngToLayerPoint(points[i+1])
            );
            if (best_idx == -1 || dist < best_dist) {
                best_idx = i+1;
                best_dist = dist;
            }
        }

        var newPt = new L.LatLng(pt.lat, pt.lng);
        newPt.meta = {
            time: null,
            original_time: false,
            ele: (points[best_idx-1].meta.ele + points[best_idx].meta.ele) / 2,
            surface: "missing"
        };
        points.splice(best_idx, 0, newPt);
        this.updatePointIndices();

        const marker = this.newEditMarker(newPt, layer);
        var marker_idx = -1;
        // find index for new marker (could binary search)
        for (var i=0; i<this._editMarkers.length; i++) {
            if (this._editMarkers[i]._layer == layer && this._editMarkers[i]._pt.index >= best_idx) {
                marker_idx = i;
                break;
            }
        }

        // insert new marker
        this._editMarkers.splice(marker_idx, 0, marker);
        this._editMarkers[marker_idx]._prec = this._editMarkers[marker_idx-1]._pt;
        this._editMarkers[marker_idx]._succ = this._editMarkers[marker_idx+1]._pt;
        this._editMarkers[marker_idx-1]._succ = this._editMarkers[marker_idx]._pt;
        this._editMarkers[marker_idx+1]._prec = this._editMarkers[marker_idx]._pt;

        return marker;
    }

    removeEditMarkers() {
        if (this._editMarkers) {
            for (var i=0; i<this._editMarkers.length; i++)
                this._editMarkers[i].remove();
        }
        this._editMarkers = [];
    }

    updateEditMarkers() {
        if (this.isEdited && this.visible) {
            this.removeEditMarkers();
            const bounds = this.map.getBounds();
            const dist = Math.abs(bounds._southWest.lat - bounds._northEast.lat);
            const segments = this.getSegments();
            for (var l=0; l<segments.length; l++) {
                const points = segments[l]._latlngs;
                var start = -1, simplifiedPoints = [];
                for (var i=0; i<points.length; i++) {
                    if (!points[i].routing && start == -1) start = i;
                    else if (points[i].routing && start != -1) {
                        if (start == i-1) simplifiedPoints.push(points[start]);
                        else simplifiedPoints = simplifiedPoints.concat(simplify.douglasPeucker(points.slice(start, i), dist/20));
                        start = -1;
                    }
                }
                if (start != -1) {
                    if (start == points.length-1) simplifiedPoints.push(points[start]);
                    else simplifiedPoints = simplifiedPoints.concat(simplify.douglasPeucker(points.slice(start, points.length), dist/20));
                }
                for (var i=0; i<simplifiedPoints.length; i++) {
                    this._editMarkers.push(this.newEditMarker(simplifiedPoints[i], segments[l]));
                    if (i > 0) {
                        const len = this._editMarkers.length;
                        this._editMarkers[len-1]._prec = this._editMarkers[len-2]._pt;
                        this._editMarkers[len-2]._succ = this._editMarkers[len-1]._pt;
                    }
                }
            }
        }
    }

    updatePointIndices() {
        const segments = this.getSegments();
        var k = 0;
        for (var l=0; l<segments.length; l++) {
            const points = segments[l]._latlngs;
            for (var i=0; i<points.length; i++) {
                points[i].index = i;
                points[i].trace_index = k++;
            }
        }
    }

    refreshEditMarkers() {
        for (var i=0; i<this._editMarkers.length; i++)
            this._editMarkers[i].bringToFront();
    }

    previewSimplify(value) {
        value = value / 50;
        const bounds = this.getBounds();
        const dist = Math.abs(bounds._southWest.lat - bounds._northEast.lat);
        const tol = dist * Math.pow(2, -value);
        if (this.preview) this.preview.clearLayers();
        const color = this.normal_style.color;
        const preview_style = {
            color: `#${color.substring(3,7)}${color.substring(1,3)}`,
            weight: 4
        };
        this.preview = new L.GPX(undefined, options, null).addTo(this.map);
        const segments = this.getSegments();
        var totalPoints = 0;
        for (var l=0; l<segments.length; l++) {
            const simplifiedPoints = simplify.douglasPeucker(segments[l]._latlngs, tol);
            const preview_layer = new L.Polyline(simplifiedPoints, preview_style);
            this.preview.addLayer(preview_layer);
            preview_layer.segment = segments[l];
            totalPoints += simplifiedPoints.length;
        }
        return totalPoints;
    }

    cancelSimplify() {
        if (this.preview) {
            this.preview.clearLayers();
            this.preview = null;
        }
    }

    simplify() {
        const preview_layers = this.preview.getLayers();
        for (var l=0; l<preview_layers.length; l++) preview_layers[l].segment._latlngs = preview_layers[l]._latlngs;

        const points = this.getPoints();
        for (var i=0; i<points.length; i++) {
            points[i].routing = false;
        }

        this.buttons.slider.reset();
        this.update();
        this.redraw();

        this.preview.clearLayers();
        this.preview = null;
    }

    /*** GPX DATA ***/

    getLayers() {
        if (this.gpx.getLayers().length == 0) return [];
        else return this.gpx.getLayers()[0].getLayers();
    }

    getSegments() {
        const layers = this.getLayers();
        const segments = [];
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
            segments.push(layers[l]);
        }
        return segments;
    }

    getWaypoints() {
        const layers = this.getLayers();
        const waypoints = [];
        for (var l=0; l<layers.length; l++) if (layers[l]._latlng) {
            waypoints.push(layers[l]);
        }
        return waypoints;
    }

    hasPoints() {
        const layers = this.getLayers();
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs)
            return true;
        return false;
    }

    getPoints() {
        const segments = this.getSegments();
        var points = [];
        for (var i=0; i<segments.length; i++)
            points = points.concat(segments[i]._latlngs);
        return points;
    }

    getDistance(noConversion) {
        if (this.buttons.km || noConversion) return this.gpx._info.length;
        else return this.gpx._info.length / 1.609344;
    }

    getMovingDistance(noConversion) {
        if (this.buttons.km || noConversion) return this.gpx._info.moving_length;
        else return this.gpx._info.moving_length / 1.609344;
    }

    getElevationGain() {
        if (this.buttons.km) return this.gpx._info.elevation.gain;
        else return this.gpx._info.elevation.gain * 3.280839895;
    }

    getElevationLoss() {
        if (this.buttons.km) return this.gpx._info.elevation.loss;
        else return this.gpx._info.elevation.loss * 3.280839895;
    }

    getMovingTime() {
        return this.gpx._info.duration.moving;
    }

    getMovingSpeed(noConversion) {
        const time = this.getMovingTime();
        if (time == 0) return 0;
        return this.getMovingDistance(noConversion) / (time / 3600);
    }

    getMovingPace() {
        const dist = this.getDistance();
        if (dist == 0) return 0;
        return this.getMovingTime() / (this.getDistance() / 1000);
    }

    getAverageAdditionalData() {
        var cntHr = 0, totHr = 0;
        var cntTemp = 0, totTemp = 0;
        var cntCad = 0, totCad = 0;
        var cntPower = 0, totPower = 0;

        const points = this.getPoints();

        for (var i=0; i<points.length; i++) {
            if (points[i].meta.hasOwnProperty('hr')) {
                totHr += points[i].meta.hr;
                cntHr++;
            }
            if (points[i].meta.hasOwnProperty('atemp')) {
                totTemp += points[i].meta.atemp;
                cntTemp++;
            }
            if (points[i].meta.hasOwnProperty('cad')) {
                totCad += points[i].meta.cad;
                cntCad++;
            }
            if (points[i].meta.hasOwnProperty('power')) {
                totPower += points[i].meta.power;
                cntPower++;
            }
        }

        this.additionalAvgData = {
            hr: cntHr > 0 ? Math.round(totHr/cntHr) : null,
            atemp: cntTemp > 0 ? Math.round((totTemp/cntTemp) * 10) / 10 : null,
            cad: cntCad > 0 ? Math.round(totCad/cntCad) : null,
            power: cntPower > 0 ? Math.round(totPower/cntPower) : null
        };
        return this.additionalAvgData;
    }

    /*** MODIFIERS ***/

    crop(start, end, no_recursion) {
        var copy = null;
        if (!no_recursion) {
            copy = this.clone();
        }

        const segments = this.getSegments();
        var cumul = 0;
        for (var i=0; i<segments.length; i++) {
            const len = segments[i]._latlngs.length;
            if (start >= cumul+len) this.gpx.getLayers()[0].removeLayer(segments[i]);
            else if (end < cumul) this.gpx.getLayers()[0].removeLayer(segments[i]);
            else if (start > cumul || end < cumul+len-1) {
                if (end-cumul+1 < len) segments[i]._latlngs.splice(end-cumul+1);
                if (start > cumul) segments[i]._latlngs.splice(0, start-cumul);
                segments[i]._latlngs[0].routing = false;
                segments[i]._latlngs[segments[i]._latlngs.length-1].routing = false;
            }
            cumul += len;
        }

        if (!no_recursion) {
            if (start > 0 && end < cumul-1) {
                const copy2 = copy.clone();
                copy.crop(0, start-1, true);
                this.total.setTraceIndex(copy.index, this.index);
                copy2.crop(end+1, cumul, true);
                this.total.setTraceIndex(copy2.index, this.index+1);
            } else if (start > 0) {
                copy.crop(0, start-1, true);
                this.total.setTraceIndex(copy.index, this.index);
            } else if (end < cumul-1) {
                copy.crop(end+1, cumul, true);
                this.total.setTraceIndex(copy.index, this.index+1);
            }
        }

        this.recomputeStats();
        this.redraw();
        this.update();
        this.focus();
    }

    reverse() {
        const segments = this.getSegments();
        for (var l=0; l<segments.length; l++)
            segments[l]._latlngs.reverse();

        for (var l=0; l<segments.length; l++)
            this.gpx.getLayers()[0].removeLayer(segments[l]);

        for (var l=segments.length-1; l>=0; l--)
            this.gpx.getLayers()[0].addLayer(new L.Polyline(segments[l]._latlngs, this.gpx.options.polyline_options));

        if (this.hasTimeData()) {
            const points = this.getPoints();
            var last = points[0].meta.time;
            points[0].meta.time = points[points.length-1].meta.time;
            for (var i=1; i<points.length; i++) {
                const tmp = new Date(points[i-1].meta.time.getTime() + (last.getTime() - points[i].meta.time.getTime()));
                last = points[i].meta.time;
                points[i].meta.time = tmp;
            }
        }
        this.buttons.slider.reset();
        this.update();
        this.redraw();
        this.focus();
    }

    setStart(index) {
        this.save();

        const segments = this.getSegments();
        var cumul = 0, before = [], after = [];

        for (var i=0; i<segments.length; i++) {
            this.gpx.getLayers()[0].removeLayer(segments[i]);
            if (index >= cumul + segments[i]._latlngs.length) before.push(segments[i]);
            else if (index < cumul) after.push(segments[i]);
            else { // split in this segment
                if (segments.length == 1) {
                    this.gpx.getLayers()[0].addLayer(new L.Polyline(segments[i]._latlngs.slice(index-cumul).concat(segments[i]._latlngs.slice(0, index-cumul+1)), this.gpx.options.polyline_options));
                } else {
                    before.push(new L.Polyline(segments[i]._latlngs.slice(0, index-cumul+1), this.gpx.options.polyline_options));
                    after.push(new L.Polyline(segments[i]._latlngs.slice(index-cumul), this.gpx.options.polyline_options));
                }
            }
            cumul += segments[i]._latlngs.length;
        }
        for (var i=0; i<after.length; i++)
            this.gpx.getLayers()[0].addLayer(new L.Polyline(after[i]._latlngs, this.gpx.options.polyline_options));
        for (var i=0; i<before.length; i++)
            this.gpx.getLayers()[0].addLayer(new L.Polyline(before[i]._latlngs, this.gpx.options.polyline_options));

        this.gpx.setStyle(this.focus_style);

        this.redraw();
        this.recomputeStats();
        this.update();
    }

    merge(trace, as_segments, stick_time) {
        const points = this.getPoints();
        const otherPoints = trace.getPoints();

        const data = this.getAverageAdditionalData();
        const otherData = trace.getAverageAdditionalData();

        for (var i=0; i<points.length; i++) {
            if (data.hr == null && otherData.hr != null) points[i].meta.hr = otherData.hr;
            if (data.atemp == null && otherData.atemp != null) points[i].meta.atemp = otherData.atemp;
            if (data.cad == null && otherData.cad != null) points[i].meta.cad = otherData.cad;
            if (data.power == null && otherData.power != null) points[i].meta.power = otherData.power;
        }
        for (var i=0; i<otherPoints.length; i++) {
            if (data.hr != null && otherData.hr == null) otherPoints[i].meta.hr = data.hr;
            if (data.atemp != null && otherData.atemp == null) otherPoints[i].meta.atemp = data.atemp;
            if (data.cad != null && otherData.cad == null) otherPoints[i].meta.cad = data.cad;
            if (data.power != null && otherData.power == null) otherPoints[i].meta.power = data.power;
        }

        if (this.hasPoints() && trace.hasPoints()) {
            if (this.hasTimeData() && !trace.hasTimeData()) {
                const avg = this.getMovingSpeed();
                const a = points[points.length-1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b);
                const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                trace.changeTimeData(startTime, avg);
            } else if (!this.hasTimeData() && trace.hasTimeData()) {
                const avg = trace.getMovingSpeed();
                const a = points[points.length-1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b) + this.getDistance(true);
                const startTime = new Date(b.meta.time.getTime() - 1000 * 60 * 60 * dist/(1000 * avg));
                this.changeTimeData(startTime, avg);
            } else if (this.hasTimeData() && trace.hasTimeData()) {
                const avg1 = this.getMovingSpeed();
                const avg2 = trace.getMovingSpeed();
                const dist1 = this.getMovingDistance();
                const dist2 = trace.getMovingDistance();
                const avg = (dist1 * avg1 + dist2 * avg2) / (dist1 + dist2);
                const a = points[points.length-1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b);
                const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                if (startTime > b.meta.time.getTime() || stick_time) trace.changeTimeData(startTime, avg2);
            }
        }

        if (as_segments) {
            const segments = trace.getSegments();
            for (var l=0; l<segments.length; l++)
                this.gpx.getLayers()[0].addLayer(new L.Polyline(segments[l]._latlngs, this.gpx.options.polyline_options));
        } else {
            if (this.hasPoints()) {
                points.push(...otherPoints);
                const segments = this.getSegments();
                for (var l=0; l<segments.length; l++)
                    this.gpx.getLayers()[0].removeLayer(segments[l]);
                this.gpx.getLayers()[0].addLayer(new L.Polyline(points, this.gpx.options.polyline_options));
            } else {
                this.gpx.getLayers()[0].addLayer(new L.Polyline(otherPoints, this.gpx.options.polyline_options));
            }
        }

        this.gpx.setStyle(this.focus_style);

        const waypoints = trace.getWaypoints();
        for (var i=0; i<waypoints.length; i++) {
            const marker = waypoints[i];
            const newMarker = this.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
            this.gpx.getLayers()[0].addLayer(newMarker);
        }

        this.recomputeStats();
        this.update();
        this.redraw();
    }

    extract_segments() {
        const segments = this.getSegments();
        const waypoints = this.getWaypoints();
        var count = 1;
        var lastTrace = null;

        const traces = [];

        var closestSegments = [];
        for (var w=0; w<waypoints.length; w++) {
            closestSegments.push({distance: Infinity, segments: []});
        }

        for (var l=0; l<segments.length; l++) {
            const bounds = segments[l].getBounds().pad(0.2);
            for (var w=0; w<waypoints.length; w++) if (bounds.contains(waypoints[w]._latlng)) {
                var pt = segments[l].closestLayerPoint(this.map.latLngToLayerPoint(waypoints[w]._latlng));
                if (!pt) pt = L.GeometryUtil.closest(this.map, segments[l]._latlngs, waypoints[w]._latlng, true);
                if (pt && pt.distance < closestSegments[w].distance) {
                    closestSegments[w] = { distance: pt.distance, segments: [segments[l]] };
                } else if (pt && pt.distance == closestSegments[w].distance) {
                    closestSegments[w].segments.push(segments[l]);
                }
            }
        }

        for (var l=0; l<segments.length; l++) {
            const newTrace = this.total.addTrace(undefined, this.name);
            newTrace.gpx.addLayer(new L.FeatureGroup());

            const points = segments[l]._latlngs;
            const cpy = [];
            for (var i=0; i<points.length; i++) {
                const pt = points[i].clone();
                pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                pt.index = points[i].index;
                pt.routing = points[i].routing;
                cpy.push(pt);
            }

            if (cpy.length > 0) {
                newTrace.gpx.getLayers()[0].addLayer(new L.Polyline(cpy, newTrace.gpx.options.polyline_options));
            }

            for (var w=0; w<waypoints.length; w++) if (closestSegments[w].segments.includes(segments[l])) {
                const marker = waypoints[w];
                const newMarker = newTrace.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
                newTrace.gpx.getLayers()[0].addLayer(newMarker);
            }

            newTrace.recomputeStats();
            newTrace.rename(newTrace.name.split('.')[0] + "_" + count);
            count++;

            lastTrace = newTrace;
            traces.push(newTrace);
        }

        lastTrace.focus();

        return traces;
    }

    addEndPoint(lat, lng) {
        if (!this.visible) this.hideUnhide();

        this.save();

        const pt = new L.LatLng(lat, lng);
        pt.meta = {time:null, original_time: false, ele:0, surface:"missing"};
        var segment = null;

        if (!this.hasPoints()) {
            this.gpx.addLayer(new L.FeatureGroup());
            this.gpx.getLayers()[0].addLayer(new L.Polyline([pt], this.gpx.options.polyline_options));
            this.gpx.setStyle(this.focus_style);
            this.showChevrons();
            this.showDistanceMarkers();
            pt.index = 0;
            segment = this.gpx.getLayers()[0].getLayers()[0];
        } else {
            const segments = this.getSegments();
            for (var i=segments.length-1; i>=0; i--) {
                pt.index = segments[i]._latlngs.length;
                segment = segments[i];
                segments[i]._latlngs.push(pt);
                break;
            }
        }

        const len = this._editMarkers.length;
        if (len == 0) {
            this.askElevation([pt]);
            this.addRoute2([pt], pt, pt, segment);
        } else if (this.buttons.routing) {
            this.askRoute2(this._editMarkers[len-1]._pt, pt, segment);
        } else {
            const new_points = this.getIntermediatePoints(this._editMarkers[len-1]._pt, pt);
            new_points.push(pt);
            this.askElevation(new_points);
            this.addRoute2(new_points, this._editMarkers[len-1]._pt, pt, segment);
        }
    }

    updatePoint(marker, lat, lng) {
        this.save();

        if (this.buttons.routing) this.updatePointRouting(marker, lat, lng);
        else this.updatePointManual(marker, lat, lng);
    }

    deletePoint(marker) {
        this.save();

        const points = marker._layer._latlngs;

        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        this.deletePointManual(marker);

        if (this.buttons.routing) {
            if(!marker._prec.equals(marker._pt) && !marker._succ.equals(marker._pt)) this.askRoute2(a, c, marker._layer);
            else {
                this.recomputeStats();
                this.update();
                this.redraw();
            }
        }
    }

    addWaypoint(latlng) {
        latlng.meta = {ele: 0};
        const marker = this.gpx._get_marker(
            latlng,
            this.buttons.clone_wpt ? this.buttons.clone_wpt.sym : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.name : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.desc : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.cmt : '',
            this.gpx.options
        );
        this.gpx.getLayers()[0].addLayer(marker);
        marker.fire('click');
        const edit_marker = document.getElementById('edit' + marker._popup._leaflet_id);
        edit_marker.click();
        this.askElevation([marker._latlng]);
        this.buttons.clone_wpt = null;
    }

    deleteWaypoint(marker) {
        this.gpx.getLayers()[0].removeLayer(marker);
    }

    deletePointManual(marker) {
        const points = marker._layer._latlngs;

        const prec_idx = marker._prec.index;
        const this_idx = marker._pt.index;
        const succ_idx = marker._succ.index;

        var res = [];
        if (prec_idx == this_idx) {
            res = points.splice(this_idx, succ_idx-this_idx);
        } else if (succ_idx == this_idx) {
            res = points.splice(prec_idx+1, this_idx-prec_idx);
        } else {
            res = points.splice(prec_idx+1, succ_idx-prec_idx-1);
        }
        this.updatePointIndices();

        // update markers indices
        var idx = -1;
        for (var i=0; i<this._editMarkers.length; i++) {
            if (this._editMarkers[i] == marker) {
                idx = i;
                break;
            }
        }
        if (idx > 0) {
            if (idx < this._editMarkers.length-1) this._editMarkers[idx-1]._succ = this._editMarkers[idx+1]._pt;
            else this._editMarkers[idx-1]._succ = this._editMarkers[idx-1]._pt;
        }
        if (idx < this._editMarkers.length-1) {
            if (idx > 0) this._editMarkers[idx+1]._prec = this._editMarkers[idx-1]._pt;
            else this._editMarkers[idx+1]._prec = this._editMarkers[idx+1]._pt;
        }
        this._editMarkers.splice(idx, 1);

        if (!this.buttons.routing) {
            this.recomputeStats();
            this.update();
            this.redraw();
        }
    }

    deleteZone(bounds, deletePts, deleteWpts, inside) {
        const layers = this.getLayers();
        for (var l=0; l<layers.length; l++) {
            if (deletePts && layers[l]._latlngs) { // points
                layers[l]._bounds = L.latLngBounds(layers[l]._latlngs);
                if ((inside && bounds.intersects(layers[l].getBounds())) ||
                (!inside && !bounds.contains(layers[l].getBounds()))) {
                    var remove = true;
                    var start = 0;
                    while (remove) {
                        const points = layers[l]._latlngs;
                        var first = -1;
                        remove = false;
                        for (var i=start; i<points.length; i++) {
                            const contains = bounds.contains(points[i]);
                            if (inside == contains) {
                                if (first == -1) first = i;
                            } else if (first != -1) {
                                points.splice(first, i-first);
                                remove = true;
                                start = first;
                                break;
                            }
                        }
                        if (!remove && first != -1) {
                            if (first == 0) this.gpx.getLayers()[0].removeLayer(layers[l]);
                            else points.splice(first);
                        }
                    }
                    layers[l]._latlngs[0].routing = false;
                    layers[l]._latlngs[layers[l]._latlngs.length-1].routing = false;
                }
            } else if (deleteWpts && layers[l]._latlng) { // waypoints
                const contains = bounds.contains(layers[l]._latlng);
                if (inside == contains) this.deleteWaypoint(layers[l]);
            }
        }

        if (this.getLayers().length == 0) {
            this.total.removeTrace(this.index);
        } else {
            this.buttons.slider.reset();
            this.update();
            this.redraw();
        }
    }

    updatePointManual(marker, lat, lng) {
        marker._pt.lat = lat;
        marker._pt.lng = lng;

        const new_points = [];
        if (marker._prec == marker._pt || marker._pt == marker._succ) { // start or end of line
            new_points.splice(new_points.length, 0, ...this.getIntermediatePoints(marker._prec, marker._succ));
        } else {
            new_points.push(marker._pt);
            new_points.splice(0, 0, ...this.getIntermediatePoints(marker._prec, marker._pt));
            new_points.splice(new_points.length, 0, ...this.getIntermediatePoints(marker._pt, marker._succ));
        }

        this.addRoute(new_points, marker._prec, marker._succ, marker._layer);
        this.askElevation(new_points);
    }

    getIntermediatePoints(a, b) {
        const pt1 = L.Projection.SphericalMercator.project(a);
        const pt2 = L.Projection.SphericalMercator.project(b);

        const origin = L.point(0,0);
        const step = L.point(100, 100);
        var d_pt = pt2.subtract(pt1);
        d_pt = d_pt.divideBy(d_pt.distanceTo(origin)/step.distanceTo(origin));

        const pts = [];
        for (var i=1; pt1.distanceTo(pt1.add(d_pt.multiplyBy(i))) < pt1.distanceTo(pt2); i++) {
            const pt = L.Projection.SphericalMercator.unproject(pt1.add(d_pt.multiplyBy(i)));
            pt.meta = {time:null, original_time:false, ele:0, surface:"missing"};
            pt.routing = true;
            pts.push(pt);
        }

        if (pts.length == 0) {
            d_pt = pt2.subtract(pt1);
            d_pt = d_pt.divideBy(2);
            const pt = L.Projection.SphericalMercator.unproject(pt1.add(d_pt));
            pt.meta = {time:null, original_time: false, ele:0, surface:"missing"};
            pt.routing = true;
            pts.push(pt);
        }

        return pts;
    }

    updatePointRouting(marker, lat, lng) {
        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        b.lat = lat;
        b.lng = lng;

        if (a.equals(b) && b.equals(c)) return;

        this.askRoute(a,b,c,marker._layer);
    }

    hasTimeData() {
        const points = this.getPoints();
        if (points.length == 0) return false;
        else if (points[0].meta.time != null) return true;
        else return false;
    }

    changeTimeData(start, avg) {
        const points = this.getPoints();
        const curAvg = this.getMovingSpeed(true);
        if (this.hasTimeData() && curAvg > 0) {
            this.shiftAndCompressTime(start, avg);
        } else {
            points[0].meta.time = start;
            points[0].meta.original_time = true;
            for (var i=1; i<points.length; i++) {
                const dist = this.gpx._dist2d(points[i-1], points[i]);
                points[i].meta.time = new Date(points[i-1].meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                points[i].meta.original_time = true;
            }
        }
    }

    shiftAndCompressTime(start, avg) {
        if (avg <= 0) return;
        const points = this.getPoints();
        const curAvg = this.getMovingSpeed(true);
        var last = points[0].meta.time;
        points[0].meta.time = start;
        for (var i=1; i<points.length; i++) {
            const newTime = new Date(points[i-1].meta.time.getTime() + (points[i].meta.time.getTime() - last.getTime()) * curAvg / avg);
            last = points[i].meta.time;
            points[i].meta.time = newTime;
        }
    }

    extendTimeData(keep_timestamps) {
        var avg = this.getMovingSpeed(true);
        if (avg <= 0) return;

        const points = this.getPoints();

        if (keep_timestamps) {
            var start = null, total_dist = 0;
            for (var i=0; i<points.length; i++) {
                if (start == null && points[i].meta.time == null) start = i;
                else if (start != null) {
                    total_dist += this.gpx._dist2d(points[i-1], points[i]);
                    if (points[i].meta.original_time) {
                        if (start == 0) {
                            const dist = this.gpx._dist2d(points[0], points[i]);
                            points[0].meta.time = new Date(points[i].meta.time.getTime() - 1000 * 60 * 60 * dist/(1000 * avg));
                            for (var j=1; j<i; j++) {
                                const dist = this.gpx._dist2d(points[j-1], points[j]);
                                points[j].meta.time = new Date(points[j-1].meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                            }
                        } else {
                            const delta = points[i].meta.time.getTime() - points[start-1].meta.time.getTime();
                            for (var j=start; j<i; j++) {
                                const dist = this.gpx._dist2d(points[j-1], points[j]);
                                points[j].meta.time = new Date(points[j-1].meta.time.getTime() + delta * dist / total_dist);
                            }
                        }

                        start = null;
                        total_dist = 0;
                    }
                }
            }

            if (start != null && start > 0) {
                for (var i=start; i<points.length; i++) {
                    const dist = this.gpx._dist2d(points[i-1], points[i]);
                    points[i].meta.time = new Date(points[i-1].meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                }
            }
        } else {
            var moving_length = 0, moving_time = 0, missing_length = 0;
            for (var i=1; i<points.length; i++) {
                const dist = this.gpx._dist2d(points[i-1], points[i]);
                if (points[i-1].meta.time != null && points[i].meta.time != null) {
                    const t = points[i].meta.time - points[i-1].meta.time;
                    if (this.gpx._moving_criterion(dist, t)) {
                        moving_length += dist / 1000;
                        moving_time += t / (1000 * 60 * 60);
                    }
                } else {
                    missing_length += dist / 1000;
                }
            }

            const total_length = moving_length + missing_length;
            const missing_time = total_length / avg - moving_time;
            const missing_avg = missing_length / missing_time;

            if (points[0].meta.time == null) {
                var total_dist = 0;
                for (var i=1; i<points.length; i++) {
                    const dist = this.gpx._dist2d(points[i-1], points[i]);
                    total_dist += dist;
                    if (points[i].meta.time != null) {
                        points[0].meta.time = new Date(points[i].meta.time.getTime() - 1000 * 60 * 60 * total_dist/(1000 * missing_avg));
                        points[0].meta.original_time = true;
                        break;
                    }
                }
            }

            var last = points[0].meta.time;
            for (var i=1; i<points.length; i++) {
                if (points[i].meta.time == null || last == null) {
                    last = points[i].meta.time;
                    const dist = this.gpx._dist2d(points[i-1], points[i]);
                    points[i].meta.time = new Date(points[i-1].meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * missing_avg));
                    points[i].meta.original_time = true;
                } else {
                    const newTime = new Date(points[i-1].meta.time.getTime() + points[i].meta.time.getTime() - last.getTime());
                    last = points[i].meta.time;
                    points[i].meta.time = newTime;
                    points[i].meta.original_time = true;
                }
            }
        }
    }

    slopeFactor(slope) {
        const max_slope = 100;
        slope = Math.max(-max_slope, Math.min(max_slope, slope));

        if (this.buttons.activity != 'hike') {
            if (slope < -30) {
                return 1.5;
            } else if (slope < 0) {
                return 1 + 2 * 0.7 / 13 * slope + 0.7 / Math.pow(13, 2) * Math.pow(slope,2);
            } else if (slope <= 20) {
                return 1 + Math.pow(slope / 7, 2);
            } else {
                return 10;
            }
        } else {
            if (slope < -30) {
                return 4;
            } else if (slope < 0) {
                return 1 + 0.05 * slope + 0.005 * Math.pow(slope,2);
            } else if (slope <= 20) {
                return 1 + Math.pow(slope / 12, 2);
            } else {
                return 4;
            }
        }
    }

    generateTimeData(start, avg) {
        const alpha = 0.15;
        var last_speed = avg;
        const points = this.getPoints();
        points[0].meta.time = start;
        points[0].meta.original_time = true;

        for (var i=1; i<points.length; i++) {
            const a = points[i-1];
            const b = points[i];
            const dist = b._dist - a._dist;
            const slope = dist == 0 ? 0 : (b.meta.smoothed_ele - a.meta.smoothed_ele) / (1000 * dist) * 100;
            const slope_factor = this.slopeFactor(slope);
            const speed = alpha * (avg / slope_factor) + (1-alpha) * last_speed;
            points[i].meta.time = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/speed);
            points[i].meta.original_time = true;
            last_speed = speed;
        }

        this.recomputeStats();
    }

    timeConsistency() {
        if (!this.hasTimeData()) return;

        const points = this.getPoints();
        if (this.getMovingSpeed(true) <= 0) {
            for (var i=0; i<points.length; i++) {
                points[i].meta.time = null;
                points[i].meta.original_time = false;
            }
        } else {
            var lastTime = null;
            for (var i=0; i<points.length; i++) {
                if (points[i].meta.time) {
                    if (lastTime && lastTime > points[i].meta.time) {
                        points[i].meta.time = lastTime;
                        points[i].meta.original_time = true;
                    }
                    lastTime = points[i].meta.time;
                }
            }
        }
    }

    recomputeStats() {
        var start = 0, end = this.getPoints().length-1;
        if (this.buttons.slider.isActive()) {
            start = Math.max(start, this.buttons.slider.getIndexStart());
            end = Math.min(end, this.buttons.slider.getIndexEnd());
        }

        this.gpx._compute_stats(start, end);
    }

    /*** REQUESTS ***/

    askElevation(points) {
        const _this = this;

        const toID = function(tile) {
            var dim = 2 * (1 << tile[2]);
            return ((dim * tile[1] + tile[0]) * 32) + tile[2];
        }

        const decodeElevation = function (start) {
            for (var i=(start ? start : 0); i<points.length; i++) {
                const png = _this.buttons.terrain_cache.get(points[i].tile);
                if (png === true) { // request not ended
                    setTimeout(decodeElevation, 500);
                    return;
                } else if (png === false) { // tile not found (sea)
                    points[i].meta.ele = 0;
                } else { // decode
                    const x = points[i].tf[0]*png.width;
                    const _x = Math.floor(x);
                    const y = points[i].tf[1]*png.height;
                    const _y = Math.floor(y);

                    const dx = x - _x;
                    const dy = y - _y;

                    // bilinear interpolation
                    const p00 = png.getPixel(_x, _y);
                    const p01 = png.getPixel(_x, _y+(_y == 511 ? 0 : 1));
                    const p10 = png.getPixel(_x+(_x == 511 ? 0 : 1), _y);
                    const p11 = png.getPixel(_x+(_x == 511 ? 0 : 1), _y+(_y == 511 ? 0 : 1));

                    const ele00 = -10000 + ((p00[0] * 256 * 256 + p00[1] * 256 + p00[2]) * 0.1);
                    const ele01 = -10000 + ((p01[0] * 256 * 256 + p01[1] * 256 + p01[2]) * 0.1);
                    const ele10 = -10000 + ((p10[0] * 256 * 256 + p10[1] * 256 + p10[2]) * 0.1);
                    const ele11 = -10000 + ((p11[0] * 256 * 256 + p11[1] * 256 + p11[2]) * 0.1);

                    points[i].meta.ele = ele00 * (1 - dx) * (1 - dy) + ele01 * (1 - dx) * dy + ele10 * dx * (1 - dy) + ele11 * dx * dy;
                }
            }

            _this.recomputeStats();
            _this.update();
        };

        var found = 0;
        for (var i=0; i<points.length; i++) {
            const tf = this.buttons.tilebelt.pointToTileFraction(points[i].lng, points[i].lat, ELEVATION_ZOOM);
            const tile = tf.map(Math.floor);
            const tile_id = toID(tile);
            points[i].tile = tile_id;
            points[i].tf = [tf[0]-tile[0], tf[1]-tile[1]];
            if (this.buttons.terrain_cache.has(tile_id)) { // check in cache
                found++;
                if (found == points.length) decodeElevation();
            } else { // request
                this.buttons.terrain_cache.set(tile_id, true); // already set so only one query
                const Http = new XMLHttpRequest();
                Http.responseType = 'arraybuffer';
                var url = 'https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/'+tile[2]+'/'+tile[0]+'/'+tile[1]+'@2x.pngraw?access_token='+this.buttons.mapbox_token;
                if (this.buttons.mapboxSKUToken) {
                    url += '&sku=' + this.buttons.mapboxSKUToken;
                }
                Http.open("GET", url);
                Http.send();
                Http.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        var reader = new _this.buttons.PNGReader(this.response);
                        reader.parse(function(err, png){
                			if (err) console.log('Error parsing terrain PNG:', err);
                			else _this.buttons.terrain_cache.set(tile_id, png);
                            found++;
                            if (found == points.length) decodeElevation();
                		});
                    } else if (this.readyState == 4 && this.status == 404) {
                        found++;
                        _this.buttons.terrain_cache.set(tile_id, false);
                        if (found == points.length) decodeElevation();
                    }
                }
            }
        }
    }

    askRoute(a, b, c, layer) {
        const Http = new XMLHttpRequest();
        var url = "https://graphhopper.com/api/1/route?"
        url += "point=" + a.lat + ',' + a.lng;
        if (!a.equals(b) && !b.equals(c)) url += "&point=" + b.lat + ',' + b.lng;
        url += "&point=" + + c.lat + ',' + c.lng;
        url += "&vehicle=" + this.buttons.activity;
        url += "&elevation=true&details=surface&points_encoded=false&key="+this.buttons.graphhopper_token;
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const new_pts = ans.paths[0].points.coordinates;
                const details = ans.paths[0].details.surface;
                const new_points = [];
                var mid = -1, dist = -1, j = 0;
                for (var i=0; i<new_pts.length; i++) {
                    if (i > details[j][1]) j++;
                    new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                    new_points[i].meta = {time:null, original_time:false, ele:new_pts[i][2], surface:details[j][2]};
                    new_points[i].routing = true;
                    if (mid == -1 || new_points[i].distanceTo(b) < dist) {
                        dist = new_points[i].distanceTo(b);
                        mid = i;
                    }
                }
                if (!a.equals(b) && !b.equals(c)) new_points[mid].routing = false;

                trace.addRoute(new_points, a, c, layer);
            } else if (this.readyState == 4) {
                trace.addRoute([b], a, c, layer);
            }
        }
    }

    addRoute(new_points, a, c, layer) {
        const pts = layer._latlngs;
        // remove old
        pts.splice(a.index+1, c.index-a.index-1);
        // add new
        pts.splice(a.index+1, 0, ...new_points);
        // update points indices
        this.updatePointIndices();
        // update markers indices
        this.updateEditMarkers();
        this.extendTimeData(this.buttons.keep_timestamps);

        this.redraw();
        this.recomputeStats();
        this.update();
    }

    askRoute2(a, b, layer) {
        const Http = new XMLHttpRequest();
        var url = "https://graphhopper.com/api/1/route?"
        url += "point=" + a.lat + ',' + a.lng;
        url += "&point=" + b.lat + ',' + b.lng;
        url += "&vehicle=" + this.buttons.activity;
        url += "&elevation=true&details=surface&points_encoded=false&key="+this.buttons.graphhopper_token;
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const new_pts = ans.paths[0].points.coordinates;
                const details = ans.paths[0].details.surface;
                const new_points = [];
                var j=0;
                for (var i=0; i<new_pts.length; i++) {
                    if (i > details[j][1]) j++;
                    new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                    new_points[i].meta = {time:null, original_time:false, ele:new_pts[i][2], surface:details[j][2]};
                    new_points[i].routing = true;
                }
                new_points[new_points.length-1].routing = false;
                trace.addRoute2(new_points, a, b, layer);
            } else if (this.readyState == 4) {
                trace.addRoute2([b], a, b, layer);
            }
        }
    }

    addRoute2(new_points, a, b, layer) {
        const pts = layer._latlngs;
        // add new
        pts.splice(a.index+1, 1, ...new_points);
        // update points indices
        this.updatePointIndices();
        // update markers indices
        this.updateEditMarkers();
        this.extendTimeData(this.buttons.keep_timestamps);

        this.redraw();
        this.recomputeStats();
        this.update();
    }

    // UNDO REDO

    save(noUpdate) {
        // wipe all redo info on save
        if (this.at != this.memory.length-1) this.memory.splice(this.at+1, this.memory.length);
        if (this.lastSaveIsNew) {
            const mem = [];
            const segments = this.getSegments();
            for (var l=0; l<segments.length; l++) {
                const segment_mem = {
                    index: l,
                    points: []
                };
                const points = segments[l]._latlngs;
                for (var i=0; i<points.length; i++) {
                    const pt = points[i].clone();
                    pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                    if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                    pt.index = points[i].index;
                    pt.routing = points[i].routing;
                    segment_mem.points.push(pt);
                }
                mem.push(segment_mem);
            }
            this.memory.push(mem);
            this.at++;
        }

        this.backToZero = false;
        if (noUpdate) {
            this.lastSaveIsNew = false;
            return;
        }
        this.lastSaveIsNew = true;
        this.updateUndoRedo();
    }

    undo() {
        if (this.at == -1) return;
        if (this.at == this.memory.length-1 && this.lastSaveIsNew) this.save(true);
        if (this.at <= 0) return;

        this.at--;
        if (this.at == 0) this.backToZero = true;
        else this.backToZero = false;
        this.do();
    }

    redo() {
        if (this.at >= this.memory.length-1) return;

        this.backToZero = false;
        this.at++;
        this.do();
    }

    do() {
        const segments = this.getSegments();
        const mem = this.memory[this.at];
        for (var l=0; l<mem.length; l++) {
            const index = mem[l].index;
            const points = mem[l].points;
            const cpy = [];
            for (var i=0; i<points.length; i++) {
                const pt = points[i].clone();
                pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                pt.index = points[i].index;
                pt.routing = points[i].routing;
                cpy.push(pt);
            }
            segments[index]._latlngs = cpy;
        }

        this.updateUndoRedo();
        this.recomputeStats();
        this.update();
        this.redraw();
        this.updateEditMarkers();
    }
}
