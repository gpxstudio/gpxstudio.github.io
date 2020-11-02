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

const trace_colors = ['#ff0000', '#0000ff', '#33cc33', '#00ccff', '#ff9900', '#ff00ff', '#ffff00', '#9933ff'];
const normal_style = { weight: 3 };
const focus_style = { weight: 5 };
const gpx_options = {
    async: true,
    polyline_options: normal_style,
    marker_options: {
        startIconUrl: '',
        endIconUrl: '',
        shadowUrl: '',
        wptIconUrls : { '': '../favicon.png' }
    },
    max_point_interval: 10 * 60000
};

export default class Trace {
    constructor(file, name, map, total) {
        this.name = name;
        this.map = map;
        this.total = total;
        this.buttons = total.buttons;
        this.hasFocus = false;
        this.isEdited = false;
        this.drawing = false;
        this.popup = null;
        this.renaming = false;
        this.normal_style = {...normal_style};
        this.focus_style = {...focus_style};

        this.normal_style.color = trace_colors[total.color_count % trace_colors.length];
        this.focus_style.color = trace_colors[total.color_count % trace_colors.length];
        total.color_count++;

        this.memory = [];
        this.at = -1;
        this.lastSaveIsNew = true;
        this.backToZero = false;

        this.gpx = new L.GPX(file, gpx_options, this).addTo(map);
        this.gpx.trace = this;
        this.waypoints = [];

        const trace = this;

        this.gpx.on('loaded', function(e) {
            trace.index = total.traces.length;

            if (this.getLayers().length > 0) {
                var layers = this.getLayers()[0].getLayers();
                this.removeLayer(this.getLayers()[0]);
                var mergedLayer = null;
                var wptLayers = [];
                for (var i=0; i<layers.length; i++) {
                    if (layers[i]._latlngs) { // trk
                        if (mergedLayer) mergedLayer._latlngs = mergedLayer._latlngs.concat(layers[i]._latlngs);
                        else mergedLayer = layers[i];
                    } else if (layers[i]._latlng) { // wpt
                        wptLayers.push(layers[i]);
                        trace.waypoints.push(layers[i]);
                    }
                }
                if (mergedLayer) this.addLayer(mergedLayer);

                var wptMissingEle = [];
                for (var i=0; i<wptLayers.length; i++) {
                    wptLayers[i].addTo(map);
                    if (wptLayers[i].ele == -1) wptMissingEle.push(wptLayers[i]._latlng);
                }
                if (wptMissingEle.length > 0) trace.askElevation(wptMissingEle, true);
            }

            total.traces.push(trace);
            if (this.getLayers().length > 0) total.buttons.updateBounds();

            var ul = document.getElementById("sortable");
            var li = document.createElement("li");
            li.innerHTML = name;
            li.classList.add('tab');
            li.trace = trace;
            li.addEventListener('click', function (e) {
                if (total.to_merge && total.to_merge != trace) {
                    total.to_merge.merge(trace);
                    total.removeTrace(trace.index);
                    total.to_merge.focus();
                    total.to_merge = null;
                    total.buttons.combine.popup.remove();
                    gtag('event', 'button', {'event_category' : 'merge'});
                } else if (!trace.hasFocus) trace.focus();
            });
            li.addEventListener('dblclick', function (e) {
                if (trace.renaming) return;
                trace.renaming = true;
                li.innerHTML = '<input type="text" id="tabname" class="input-minimal" minlength="1" size="'+(trace.name.length-5)+'">.gpx';
                trace.tabname = document.getElementById("tabname");
                trace.tabname.addEventListener('keydown', function (e) {
                    if(e.key === 'Enter') trace.rename();
                });
                trace.tabname.addEventListener('focusout', trace.rename.bind(trace));
                trace.tabname.focus();
                trace.tabname.value = trace.name.substring(0, trace.name.length-4);
            });
            ul.appendChild(li);

            trace.tab = li;
            total.buttons.updateTabWidth();
            total.buttons.circlesToFront();

            trace.focus();

            if (trace.gpx.missing_elevation) trace.askElevation(trace.getPoints());
        }).on('click', function (e) {
            if (e.layer.sym) return;
            if (!e.target.trace.isEdited) e.target.trace.updateFocus();
        }).on('mousedown', function (e) {
            const trace = e.target.trace;
            if (trace.isEdited) {
                if (e.originalEvent.which == 3) return;
                trace.insertMarker = true;
                const marker = trace.insertEditMarker(e.layerPoint);
                marker.fire('mousedown');
            }
        });

        if (file === undefined) this.gpx.fire('loaded');
    }

    rename() {
        var newname = this.tabname.value;
        if (newname.length == 0) this.tab.innerHTML = this.name;
        else {
            newname += '.gpx';
            this.name = newname;
            this.tab.innerHTML = newname;
            this.total.buttons.updateTabWidth();
        }
        this.renaming = false;
    }

    clone() {
        const newTrace = this.total.addTrace(undefined, this.name);

        const points = this.getPoints();
        const cpy = [];
        for (var i=0; i<points.length; i++) {
            const pt = points[i].clone();
            pt.meta = JSON.parse(JSON.stringify(points[i].meta));
            pt.meta.time = new Date(pt.meta.time);
            pt.index = points[i].index;
            pt.routing = points[i].routing;
            cpy.push(pt);
        }

        if (cpy.length > 0) {
            newTrace.gpx.addLayer(new L.Polyline(cpy, newTrace.gpx.options.polyline_options));
            newTrace.gpx.setStyle(newTrace.focus_style);
            newTrace.recomputeStats();
            newTrace.update();
        }

        for (var i=0; i<this.waypoints.length; i++) {
            const marker = this.waypoints[i];
            const newMarker = this.gpx._get_marker(marker._latlng, marker.ele, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
            newTrace.gpx.addLayer(newMarker);
            newTrace.waypoints.push(newMarker);
        }
    }

    /*** LOGIC ***/

    remove() {
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
        this.buttons.slider.reset();
        this.showData();
        this.showElevation();
        this.showWaypoints();
    }

    unfocus() {
        this.hasFocus = false;
        this.gpx.setStyle(this.normal_style);
        this.closePopup();
        this.hideWaypoints();
        if (this.isEdited) this.stopEdit();
        if (this.drawing) this.stopDraw();
        if (this.renaming) this.rename();
    }

    updateFocus() {
        if (this.hasFocus) {
            this.unfocus();
            this.total.focus();
        } else this.focus();
    }

    update() {
        this.showData();
        this.showElevation();
    }

    updateUndoRedo() {
        if (this.at >= 0 && !this.backToZero) this.buttons.undo.classList.remove('unselected','no-click2');
        else this.buttons.undo.classList.add('unselected','no-click2');
        if (this.at < this.memory.length-1) this.buttons.redo.classList.remove('unselected','no-click2');
        else this.buttons.redo.classList.add('unselected','no-click2');
    }

    showWaypoints() {
        for (var i=0; i<this.waypoints.length; i++) if (!this.waypoints[i]._map){
            this.waypoints[i].addTo(this.map);
        }
    }

    hideWaypoints() {
        for (var i=0; i<this.waypoints.length; i++) if (this.waypoints[i]._map) {
            this.waypoints[i].remove();
        }
    }

    edit() {
        this.isEdited = true;
        this.updatePointIndices();
        this.updateEditMarkers();
        this.buttons.greyTraceButtons();
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
        this.buttons.elev._addSliderCircles();
        this.buttons.validateToEdit();
        this.closePopup();

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
        this.insertMarker = false;
        const _this = this;
        this.buttons.map.addEventListener("click", function (e) {
            if (e.originalEvent.target.id != "mapid") return;
            if (!_this.insertMarker) _this.addEndPoint(e.latlng.lat, e.latlng.lng);
            _this.insertMarker = false;
        });
    }

    stopDraw() {
        this.buttons.map._container.style.cursor = '';
        this.buttons.map.removeEventListener("click");
        this.drawing = false;
        if (this.getPoints().length == 0) {
            this.total.removeTrace(this.index);
        }
    }

    closePopup() {
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
    }

    redraw() {
        if (this.hasPoints()) this.gpx.getLayers()[0].redraw();
    }

    showData() {
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(1).toString() + (this.buttons.km ? ' km' : ' mi');
        this.buttons.elevation.innerHTML = this.getElevation().toFixed(0).toString() + (this.buttons.km ? ' m' : ' ft');
        if (this.buttons.cycling) this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' ' + (this.buttons.km ? ' km' : ' mi') + '/h';
        else this.buttons.speed.innerHTML = this.total.msToTimeMin(this.getMovingPace()) + ' min/' + (this.buttons.km ? 'km' : 'mi');
        this.buttons.duration.innerHTML = this.total.msToTime(this.getMovingTime());
    }

    showElevation() {
        this.buttons.elev.clear();
        this.buttons.elev.options.imperial = !this.buttons.km;
        this.addElevation();
    }

    addElevation() {
        if (this.hasPoints()) this.buttons.elev.addData(this.gpx.getLayers()[0]);
        else this.buttons.elev.clear();
    }

    getBounds() {
        return this.gpx.getBounds();
    }

    newEditMarker(point) {
        const trace = this;
        const map = this.map;
        const marker = L.circleMarker([point.lat, point.lng], {
            className: 'edit-marker',
            radius: 4
        }).addTo(map);
        marker._pt = point;
        marker._prec = point;
        marker._succ = point;
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
                const popup = L.popup({
                    closeButton: false
                }).setContent(`<div id="remove-waypoint" class="custom-button" style="display: inline-block">Remove point</div>
                <div class="custom-button" style="display: inline-block; width: 4px"></i></div>
                <div id="close-popup" class="custom-button" style="display: inline-block"><i class="fas fa-times"></i></div>`);
                popup.setLatLng(e.latlng);
                popup.openOn(map);
                popup.addEventListener('remove', function (e) {
                    trace.closePopup();
                });

                var button = document.getElementById("remove-waypoint");
                button.addEventListener("click", function () {
                    trace.deletePoint(marker);
                    marker.remove();
                    trace.closePopup();
                });

                var close = document.getElementById("close-popup");
                close.addEventListener("click", function () {
                    trace.closePopup();
                });

                trace.closePopup();
                trace.popup = popup;

                return false;
            }
        });
        return marker;
    }

    insertEditMarker(layer_point) {
        const polyline = this.gpx.getLayers()[0];
        const layer_pt = polyline.closestLayerPoint(layer_point);
        const pt = this.map.layerPointToLatLng(layer_pt);
        const points = this.getPoints();
        var best_dist = -1, best_idx = -1;
        for (var i=0; i<points.length-1; i++) {
            const dist = L.LineUtil.pointToSegmentDistance(layer_pt,
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
            ele: (points[best_idx-1].meta.ele + points[best_idx].meta.ele) / 2
        };
        points.splice(best_idx, 0, newPt);
        this.updatePointIndices();

        const marker = this.newEditMarker(newPt);
        var marker_idx = -1;
        // find index for new marker (could binary search)
        for (var i=0; i<this._editMarkers.length; i++) {
            if (this._editMarkers[i]._pt.index >= best_idx) {
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
        if (this.isEdited) {
            this.removeEditMarkers();
            const bounds = this.map.getBounds();
            const points = this.getPoints();
            const dist = Math.abs(bounds._southWest.lat - bounds._northEast.lat);
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
                this._editMarkers.push(this.newEditMarker(simplifiedPoints[i]));
                if (i > 0) {
                    this._editMarkers[i]._prec = this._editMarkers[i-1]._pt;
                    this._editMarkers[i-1]._succ = this._editMarkers[i]._pt;
                }
            }
        }
    }

    updatePointIndices() {
        const points = this.getPoints();
        for (var i=0; i<points.length; i++)
            points[i].index = i;
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
        this.preview = new L.GPX(undefined, gpx_options, null).addTo(this.map);
        this.preview.addLayer(new L.Polyline(simplify.douglasPeucker(this.getPoints(), tol), preview_style));
        return this.preview.getLayers()[0]._latlngs.length;
    }

    cancelSimplify() {
        if (this.preview) {
            this.preview.clearLayers();
            this.preview = null;
        }
    }

    simplify() {
        this.gpx.getLayers()[0]._latlngs = this.preview.getLayers()[0]._latlngs;

        const points = this.getPoints();
        for (var i=0; i<points.length; i++) {
            points[i].routing = false;
        }

        this.recomputeStats();
        this.update();
        this.redraw();

        this.preview.clearLayers();
        this.preview = null;
    }

    /*** GPX DATA ***/

    hasPoints() {
        return this.gpx.getLayers().length > 0 && this.gpx.getLayers()[0]._latlngs;
    }

    getPoints() {
        if (this.hasPoints()) return this.gpx.getLayers()[0]._latlngs;
        else return [];
    }

    getDistance(noConversion) {
        if (this.buttons.km || noConversion) return this.gpx._info.length;
        else return this.gpx._info.length / 1.60934;
    }

    getMovingDistance(noConversion) {
        if (this.buttons.km || noConversion) return this.gpx._info.moving_length;
        else return this.gpx._info.moving_length / 1.60934;
    }

    getElevation() {
        if (this.buttons.km) return this.gpx._info.elevation.gain;
        else return this.gpx._info.elevation.gain * 3.28084;
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

        const points = this.getPoints();

        for (var i=0; i<points.length; i++) {
            if (points[i].meta.hr) {
                totHr += points[i].meta.hr;
                cntHr++;
            }
            if (points[i].meta.atemp) {
                totTemp += points[i].meta.atemp;
                cntTemp++;
            }
            if (points[i].meta.cad) {
                totCad += points[i].meta.cad;
                cntCad++;
            }
        }

        this.additionalAvgData = {
            hr: cntHr > 0 ? Math.round((totHr/cntHr) * 10) / 10 : null,
            atemp: cntTemp > 0 ? Math.round((totTemp/cntTemp) * 10) / 10 : null,
            cad: cntCad > 0 ? Math.round((totCad/cntCad) * 10) / 10 : null,
        };
        return this.additionalAvgData;
    }

    /*** MODIFIERS ***/

    crop(start, end) {
        const points = this.getPoints();
        const length = points.length;

        points.splice(end);
        points.splice(0, start);

        points[0].routing = false;
        points[points.length-1].routing = false;

        this.recomputeStats();
        this.redraw();
        this.showData();
        this.showElevation();
        this.buttons.slider.reset();
    }

    reverse() {
        this.gpx.getLayers()[0]._latlngs.reverse();

        if (this.firstTimeData() != -1) {
            const points = this.getPoints();

            var missing = false;
            for (var i=0; i<points.length && !missing; i++) {
                if (!points[i].meta.time) missing = true;
            }
            if (missing) this.extendTimeData();

            var last = points[0].meta.time;
            points[0].meta.time = points[points.length-1].meta.time;
            for (var i=1; i<points.length; i++) {
                const tmp = new Date(points[i-1].meta.time.getTime() + (last.getTime() - points[i].meta.time.getTime()));
                last = points[i].meta.time;
                points[i].meta.time = tmp;
            }
        }

        this.recomputeStats();
        this.update();
        this.redraw();
    }

    merge(trace) {
        const points = this.getPoints();
        const otherPoints = trace.getPoints();

        const data = this.getAverageAdditionalData();
        const otherData = trace.getAverageAdditionalData();

        for (var i=0; i<points.length; i++) {
            if (!data.hr && otherData.hr) points[i].meta.hr = otherData.hr;
            if (!data.atemp && otherData.atemp) points[i].meta.atemp = otherData.atemp;
            if (!data.cad && otherData.cad) points[i].meta.cad = otherData.cad;
        }
        for (var i=0; i<otherPoints.length; i++) {
            if (data.hr && !otherData.hr) otherPoints[i].meta.hr = data.hr;
            if (data.atemp && !otherData.atemp) otherPoints[i].meta.atemp = data.atemp;
            if (data.cad && !otherData.cad) otherPoints[i].meta.cad = data.cad;
        }

        if (this.hasPoints() && trace.hasPoints()) {
            if (this.firstTimeData() >= 0 && trace.firstTimeData() == -1) {
                const avg = this.getMovingSpeed();
                const a = points[points.length-1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b);
                const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                trace.changeTimeData(startTime, avg);
            } else if (this.firstTimeData() == -1 && trace.firstTimeData() >= 0) {
                const avg = trace.getMovingSpeed();
                const a = points[points.length-1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b) + this.getDistance(true);
                const startTime = new Date(b.meta.time.getTime() - 1000 * 60 * 60 * dist/(1000 * avg));
                this.changeTimeData(startTime, avg);
            }
        }

        if (this.hasPoints()) points.push(...otherPoints);
        else {
            this.gpx.addLayer(new L.Polyline(otherPoints, this.gpx.options.polyline_options));
            this.gpx.setStyle(focus_style);
        }

        for (var i=0; i<trace.waypoints.length; i++) {
            const marker = trace.waypoints[i];
            const newMarker = this.gpx._get_marker(marker._latlng, marker.ele, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
            this.gpx.addLayer(newMarker);
            this.waypoints.push(newMarker);
        }
        this.swapLayers();

        this.recomputeStats();
        this.update();
        this.redraw();
    }

    addEndPoint(lat, lng) {
        this.save();

        const pt = new L.LatLng(lat, lng);
        pt.meta = {"time":null, "ele":0};

        if (!this.hasPoints()) {
            this.gpx.addLayer(new L.Polyline([pt], this.gpx.options.polyline_options));
            this.gpx.setStyle(this.focus_style);
            this.swapLayers();
        } else this.getPoints().push(pt);

        const points = this.getPoints();
        pt.index = points.length-1;

        const marker = this.newEditMarker(pt);
        this._editMarkers.push(marker);
        const len = this._editMarkers.length;
        if (len > 1) {
            this._editMarkers[len-1]._prec = this._editMarkers[len-2]._pt;
            this._editMarkers[len-2]._succ = this._editMarkers[len-1]._pt;
        }

        if (this.buttons.routing && len > 1) this.askRoute2(this._editMarkers[len-2]._pt, this._editMarkers[len-1]._pt);
        else {
            this.redraw();
            this.askElevation([pt]);
        }
    }

    swapLayers() {
        const layers = this.gpx.getLayers();
        var ptLayerIndex = 0;
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs) {
            ptLayerIndex = i;
            break;
        }
        const keys = Object.keys(this.gpx._layers);
        const ptLayer = this.gpx._layers[keys[ptLayerIndex]];
        this.gpx._layers[keys[ptLayerIndex]] = this.gpx._layers[keys[0]];
        this.gpx._layers[keys[0]] = ptLayer;
        this.gpx._layers[keys[ptLayerIndex]]._leaflet_id = keys[ptLayerIndex];
        this.gpx._layers[keys[0]]._leaflet_id = keys[0];
    }

    updatePoint(marker, lat, lng) {
        this.save();

        if (this.buttons.routing) this.updatePointRouting(marker, lat, lng);
        else this.updatePointManual(marker, lat, lng);
    }

    deletePoint(marker) {
        this.save();

        const points = this.getPoints();

        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        this.deletePointManual(marker);

        if (this.buttons.routing) {
            if(!marker._prec.equals(marker._pt) && !marker._succ.equals(marker._pt)) this.askRoute2(a, c);
            else {
                this.recomputeStats();
                this.update();
                this.redraw();
                this.buttons.elev._removeSliderCircles();
            }
        }
    }

    addWaypoint(latlng) {
        const marker = this.gpx._get_marker(
            latlng,
            0,
            this.buttons.clone_wpt ? this.buttons.clone_wpt.sym : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.name : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.desc : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.cmt : '',
            this.gpx.options
        );
        marker.addTo(this.map);
        this.waypoints.push(marker);
        marker.fire('click');
        const edit_marker = document.getElementById('edit' + marker._popup._leaflet_id);
        edit_marker.click();
        this.askElevation([marker._latlng], true);
        this.buttons.clone_wpt = null;
    }

    deleteWaypoint(marker) {
        for (var i=0; i<this.waypoints.length; i++) if (this.waypoints[i] == marker) {
            this.waypoints.splice(i, 1);
            return;
        }
    }

    deletePointManual(marker) {
        const points = this.getPoints();

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
            this.buttons.elev._removeSliderCircles();
        }
    }

    updatePointManual(marker, lat, lng) {
        const points = this.getPoints();

        const prec_idx = marker._prec.index;
        const this_idx = marker._pt.index;
        const succ_idx = marker._succ.index;

        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        b.lat = lat;
        b.lng = lng;

        if (succ_idx-this_idx-1 > 0) points.splice(this_idx+1, succ_idx-this_idx-1);
        if (this_idx-prec_idx-1 > 0) points.splice(prec_idx+1, this_idx-prec_idx-1);
        this.updatePointIndices();
        //this.updateEditMarkers();

        this.redraw();
        this.askElevation([b]);
    }

    updatePointRouting(marker, lat, lng) {
        const points = this.getPoints();

        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        b.lat = lat;
        b.lng = lng;

        if (a.equals(b) && b.equals(c)) return;

        this.askRoute(a,b,c);
    }

    firstTimeData() {
        const points = this.getPoints();
        var hasTimeInfo = false;
        for (var i=0; i<points.length; i++) {
            if (points[i].meta.time != null)
                return i;
        }
        return -1;
    }

    changeTimeData(start, avg) {
        const points = this.getPoints();
        const index = this.firstTimeData();
        if (index != -1) {
            this.extendTimeData();
            this.shiftAndCompressTime(start, avg);
        } else {
            points[0].meta.time = start;
            for (var i=1; i<points.length; i++) {
                const dist = this.gpx._dist2d(points[i-1], points[i]);
                points[i].meta.time = new Date(points[i-1].meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
            }
        }
    }

    shiftAndCompressTime(start, avg) {
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

    extendTimeData() {
        const points = this.getPoints();
        const index = this.firstTimeData();
        const avg = this.getMovingSpeed(true);

        if (index == -1) return;
        else if (index > 0) {
            const dist = this.gpx._dist2d(points[0], points[index]);
            points[0].meta.time = new Date(points[index].meta.time.getTime() - 1000 * 60 * 60 * dist/(1000 * avg));
        }

        var last = points[0].meta.time;
        for (var i=1; i<points.length; i++) {
            if (!points[i].meta.time || !last) {
                last = points[i].meta.time;
                const dist = this.gpx._dist2d(points[i-1], points[i]);
                points[i].meta.time = new Date(points[i-1].meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
            } else {
                const newTime = new Date(points[i-1].meta.time.getTime() + points[i].meta.time.getTime() - last.getTime());
                last = points[i].meta.time;
                points[i].meta.time = newTime;
            }
        }
    }

    recomputeStats() {
        // reset
        this.gpx._info.length = 0.0;
        this.gpx._info.moving_length = 0.0;
        this.gpx._info.elevation.gain = 0.0;
        this.gpx._info.elevation.loss = 0.0;
        this.gpx._info.elevation.max = 0.0;
        this.gpx._info.elevation.min = Infinity;
        this.gpx._info.duration.start = null;
        this.gpx._info.duration.end = null;
        this.gpx._info.duration.moving = 0;
        this.gpx._info.duration.total = 0;

        // recompute on remaining data
        var ll = null, last = null;
        const points = this.getPoints();
        for (var i=0; i<points.length; i++) {
            ll = points[i];
            this.gpx._info.elevation.max = Math.max(ll.meta.ele, this.gpx._info.elevation.max);
            this.gpx._info.elevation.min = Math.min(ll.meta.ele, this.gpx._info.elevation.min);
            this.gpx._info.duration.end = ll.meta.time;

            if (last != null) {
                const dist = this.gpx._dist2d(last, ll);
                this.gpx._info.length += dist;

                var t = ll.meta.ele - last.meta.ele;
                if (t > 0) {
                  this.gpx._info.elevation.gain += t;
                } else {
                  this.gpx._info.elevation.loss += Math.abs(t);
                }

                t = Math.abs(ll.meta.time - last.meta.time);
                this.gpx._info.duration.total += t;
                if (t < this.gpx.options.max_point_interval && (dist/1000)/(t/1000/60/60) >= 0.5) {
                  this.gpx._info.duration.moving += t;
                  this.gpx._info.moving_length += dist;
                }
            } else if (this.gpx._info.duration.start == null) {
                this.gpx._info.duration.start = ll.meta.time;
            }

            last = ll;
        }
    }

    /*** REQUESTS ***/

    askElevation(points, wpt) {
        var step = Math.max(10, Math.ceil(points.length / 1000));
        if (wpt) step = 1;
        const maxpoints = 2000;
        var pts = [], start = -1, requests = [];
        for (var i=0; i<points.length; i += step) {
            pts.push(points[i]);
            if (start == -1) start = i;
            if (pts.length == maxpoints) {
                requests.push([points.slice(start, i + step - 1), pts]);
                pts = [];
                start = -1;
            }
        }
        if (pts.length > 0) {
            pts.push(points[points.length-1]);
            requests.push([points.slice(start, i + step - 1), pts]);
        }
        this.askPointsElevation(requests, step, 0);
    }

    askPointsElevation(requests, step, depth) {
        const trace_points = requests[0][0], points = requests[0][1];
        const Http = new XMLHttpRequest();
        var url = 'https://api.airmap.com/elevation/v1/ele?points=';
        for (var i=0; i<points.length; i++) {
            url += points[i].lat + ',' + points[i].lng;
            if (i < points.length-1) url += ',';
        }
        Http.open("GET", url);
        Http.setRequestHeader('X-API-Key', this.buttons.airmap_token);
        Http.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        Http.send();

        const trace = this;
        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);

                for (var i=0; i<trace_points.length; i++) {
                    if (!trace_points[i].meta) trace_points[i].meta = {ele: 0};
                    if (Math.floor(i/step) + 1 < ans["data"].length) {
                        const s = Math.min(step, trace_points.length-step*Math.floor(i/step));
                        trace_points[i].meta.ele =
                            (
                                (s - i % s) * ans["data"][Math.floor(i/step)]
                                + (i % s) * ans["data"][Math.floor(i/step) + 1]
                            ) / s;

                    } else trace_points[i].meta.ele = ans["data"][Math.floor(i/step)];
                }

                if (requests.length == 1) {
                    // update trace info
                    trace.recomputeStats();

                    trace.update();
                    if (trace.isEdited) trace.buttons.elev._removeSliderCircles();
                } else trace.askPointsElevation(requests.slice(1), step, 0);
            } else if (this.readyState == 4 && this.status != 200) {
                console.log('elevation query timeout : retry');
                if (depth < 10) trace.askPointsElevation(requests, step, depth+1);
            }
        }
    }

    askRoute(a, b, c, override_openroute) {
        if (this.buttons.openroute && !override_openroute) {
            this.askRouteOpenroute(a, b, c);
            return;
        }

        const Http = new XMLHttpRequest();
        var url = "https://api.mapbox.com/directions/v5/mapbox/" + (this.buttons.cycling ? "cycling" : "walking") + "/";
        url += a.lng.toFixed(6) + ',' + a.lat.toFixed(6) + ';';
        if (!a.equals(b) && !b.equals(c)) url += b.lng.toFixed(6) + ',' + b.lat.toFixed(6) + ';';
        url += c.lng.toFixed(6) + ',' + c.lat.toFixed(6) ;
        url += "?geometries=geojson&access_token="+this.buttons.mapbox_token+"&overview=full";
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const new_pts = ans['routes'][0]['geometry']['coordinates'];
                const new_points = [];
                var mid = -1, dist = -1;
                for (var i=0; i<new_pts.length; i++) {
                    new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                    new_points[i].meta = {"time":null, "ele":0};
                    new_points[i].routing = true;
                    if (mid == -1 || new_points[i].distanceTo(b) < dist) {
                        dist = new_points[i].distanceTo(b);
                        mid = i;
                    }
                }
                if (!a.equals(b) && !b.equals(c)) new_points[mid].routing = false;

                trace.addRoute(new_points, a, c);
            }
        }
    }

    askRouteOpenroute(a, b, c) {
        const Http = new XMLHttpRequest();
        var url = "https://api.openrouteservice.org/v2/directions/" + (this.buttons.cycling ? "cycling-road" : "foot-hiking") + "?";
        url += "api_key=5b3ce3597851110001cf624874258de335114cc6b5d5c26de9a3587c&";
        url += "start=" + a.lng.toFixed(6) + ',' + a.lat.toFixed(6) + '&';
        if (!a.equals(b)) url += "end=" + b.lng.toFixed(6) + ',' + b.lat.toFixed(6);
        else url += "end=" + c.lng.toFixed(6) + ',' + c.lat.toFixed(6);
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 403) {
                trace.buttons.openroute = false;
                trace.askRoute(a,b,c);
            } else if (this.readyState == 4 && this.status == 404) {
                trace.askRoute(a,b,c,true);
            } else if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                var new_pts = ans['features'][0]['geometry']['coordinates'];
                const new_points = [];
                for (var i=0; i<new_pts.length; i++) {
                    new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                    new_points[i].meta = {"time":null, "ele":0};
                    new_points[i].routing = true;
                }

                if (!a.equals(b) && !b.equals(c)) {
                    const Http2 = new XMLHttpRequest();
                    url = "https://api.openrouteservice.org/v2/directions/" + (trace.buttons.cycling ? "cycling-road" : "foot-hiking") + "?";
                    url += "api_key=5b3ce3597851110001cf624874258de335114cc6b5d5c26de9a3587c&";
                    url += "start=" + b.lng.toFixed(6) + ',' + b.lat.toFixed(6) + '&';
                    url += "end=" + c.lng.toFixed(6) + ',' + c.lat.toFixed(6);
                    Http2.open("GET", url);
                    Http2.send();

                    Http2.onreadystatechange = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            ans = JSON.parse(this.responseText);
                            new_pts = ans['features'][0]['geometry']['coordinates'];
                            new_points[new_points.length-1].routing = false;
                            for (var i=0; i<new_pts.length; i++) {
                                new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                                new_points[new_points.length-1].meta = {"time":null, "ele":0};
                                new_points[new_points.length-1].routing = true;
                            }
                            trace.addRoute(new_points, a, c);
                        }
                    }
                } else trace.addRoute(new_points, a, c);
            }
        }
    }

    addRoute(new_points, a, c) {
        const pts = this.getPoints();
        // remove old
        pts.splice(a.index+1, c.index-a.index-1);
        // add new
        pts.splice(a.index+1, 0, ...new_points);
        // update points indices
        this.updatePointIndices();
        // update markers indices
        this.updateEditMarkers();
        this.extendTimeData();

        this.redraw();

        // ask elevation of new points
        this.askElevation(new_points);
    }

    askRoute2(a, b, override_openroute) {
        if (this.buttons.openroute && !override_openroute) {
            this.askRoute2Openroute(a, b);
            return;
        }

        const Http = new XMLHttpRequest();
        var url = "https://api.mapbox.com/directions/v5/mapbox/" + (this.buttons.cycling ? "cycling" : "walking") + "/";
        url += a.lng.toFixed(6) + ',' + a.lat.toFixed(6) + ';';
        url += b.lng.toFixed(6) + ',' + b.lat.toFixed(6);
        url += "?geometries=geojson&access_token="+this.buttons.mapbox_token+"&overview=full";
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                trace.addRoute2(ans['routes'][0]['geometry']['coordinates'], a, b);
            }
        }
    }

    askRoute2Openroute(a, b) {
        const Http = new XMLHttpRequest();
        var url = "https://api.openrouteservice.org/v2/directions/" + (this.buttons.cycling ? "cycling-road" : "foot-hiking") + "?";
        url += "api_key=5b3ce3597851110001cf624874258de335114cc6b5d5c26de9a3587c&";
        url += "start=" + a.lng.toFixed(6) + ',' + a.lat.toFixed(6) + '&';
        url += "end=" + b.lng.toFixed(6) + ',' + b.lat.toFixed(6);
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 403) {
                trace.buttons.openroute = false;
                trace.askRoute2(a,b);
            } else if (this.readyState == 4 && this.status == 404) {
                trace.askRoute2(a,b,true);
            } else if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                trace.addRoute2(ans['features'][0]['geometry']['coordinates'], a, b);
            }
        }
    }

    addRoute2(new_pts, a, b) {
        const new_points = [];
        for (var i=0; i<new_pts.length; i++) {
            new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
            new_points[i].meta = {"time":null, "ele":0};
            new_points[i].routing = true;
        }

        const pts = this.getPoints();
        // add new
        pts.splice(a.index+1, 0, ...new_points);
        // update points indices
        this.updatePointIndices();
        // update markers indices
        this.updateEditMarkers();
        this.extendTimeData();

        this.redraw();

        // ask elevation of new points
        if (b.meta.ele == 0) new_points.push(b);
        this.askElevation(new_points);
    }

    // UNDO REDO

    save(noUpdate) {
        // wipe all redo info on save
        if (this.at != this.memory.length-1) this.memory.splice(this.at+1, this.memory.length);
        if (this.lastSaveIsNew) {
            const points = this.getPoints();
            if (points.length == 0) return;
            const mem = [];
            for (var i=0; i<points.length; i++) {
                const pt = points[i].clone();
                pt.meta = points[i].meta;
                pt.index = points[i].index;
                pt.routing = points[i].routing;
                mem.push(pt);
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
        const points = this.memory[this.at];
        const cpy = [];
        for (var i=0; i<points.length; i++) {
            const pt = points[i].clone();
            pt.meta = points[i].meta;
            pt.index = points[i].index;
            pt.routing = points[i].routing;
            cpy.push(pt);
        }
        this.gpx.getLayers()[0]._latlngs = cpy;

        this.updateUndoRedo();
        this.recomputeStats();
        this.update();
        this.redraw();
        this.updateEditMarkers();
        this.buttons.elev._removeSliderCircles();
    }
}
