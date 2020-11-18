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

const normal_style = { weight: 3 };
const focus_style = { weight: 5 };
const options = {
    async: true,
    polyline_options: normal_style,
    marker_options: {
        startIconUrl: '',
        endIconUrl: '',
        shadowUrl: '',
        wptIconUrls : { '': '../favicon.png' }
    },
    max_point_interval: 10 * 60000,
    gpx_options: {
        joinTrackSegments: false
    }
};

export default class Trace {
    constructor(file, name, map, total) {
        name = name.split('.')[0];
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

        const color = total.getColor();
        this.normal_style.color = color;
        this.focus_style.color = color;

        this.memory = [];
        this.at = -1;
        this.lastSaveIsNew = true;
        this.backToZero = false;

        this.gpx = new L.GPX(file, options, this).addTo(map);
        this.gpx.trace = this;
        this.waypoints = [];

        this.index = total.traces.length;
        total.traces.push(this);

        const trace = this;

        this.gpx.on('loaded', function(e) {
            if (this.getLayers().length > 0) {
                var layers = this.getLayers()[0].getLayers();
                var wptMissingEle = [];
                for (var i=0; i<layers.length; i++) {
                    if (layers[i]._latlng) { // wpt
                        trace.waypoints.push(layers[i]);
                        if (layers[i]._latlng.ele == -1) wptMissingEle.push(layers[i]._latlng);
                    }
                }
                if (wptMissingEle.length > 0) trace.askElevation(wptMissingEle, true);
            }
            if (this.getLayers().length > 0) total.buttons.updateBounds();

            var ul = document.getElementById("sortable");
            var li = document.createElement("li");
            li.innerHTML = name+'<div class="tab-color" style="background:'+trace.normal_style.color+';">';
            li.title = name;
            li.classList.add('tab');
            li.trace = trace;
            li.addEventListener('click', function (e) {
                if (total.to_merge && total.to_merge != trace) {
                    total.to_merge.merge(trace, total.buttons.merge_as_segments.checked);
                    total.removeTrace(trace.index);
                    total.to_merge.focus();
                    total.to_merge = null;
                    total.buttons.combine.popup.remove();
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
            total.buttons.updateTabWidth();
            total.buttons.circlesToFront();

            trace.focus();

            if (trace.gpx.missing_elevation) trace.askElevation(trace.getPoints());
        }).on('click', function (e) {
            if (e.layer.sym) return;
            if (trace.buttons.disable_trace) return;
            if (!e.target.trace.isEdited) e.target.trace.updateFocus();
        }).on('mousedown', function (e) {
            const trace = e.target.trace;
            if (trace.buttons.disable_trace) return;
            if (trace.isEdited) {
                if (e.originalEvent.which == 3) return;
                if (e.layer._latlng) return;
                const marker = trace.insertEditMarker(e.layer, e.layerPoint);
                marker.fire('mousedown');
            }
        });

        if (file === undefined) this.gpx.fire('loaded');
    }

    rename(name) {
        var newname = name ? name : this.tabname.value;
        if (newname.length == 0) this.tab.innerHTML = this.name+'<div class="tab-color" style="background:'+this.normal_style.color+';">';
        else {
            this.name = newname;
            this.tab.innerHTML = newname+'<div class="tab-color" style="background:'+this.normal_style.color+';">';
            this.tab.title = newname;
            this.total.buttons.updateTabWidth();
        }
        this.renaming = false;
    }

    clone() {
        const newTrace = this.total.addTrace(undefined, this.name);
        newTrace.gpx.addLayer(new L.FeatureGroup());

        const layers = this.getLayers();
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
            const points = layers[l]._latlngs;
            const cpy = [];
            for (var i=0; i<points.length; i++) {
                const pt = points[i].clone();
                pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                if (pt.meta.time) pt.meta.time = new Date(pt.meta.time);
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
        if (newTrace.buttons.show_direction) newTrace.showChevrons();

        for (var i=0; i<this.waypoints.length; i++) {
            const marker = this.waypoints[i];
            const newMarker = newTrace.gpx._get_marker(marker._latlng, marker.ele, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
            newTrace.gpx.getLayers()[0].addLayer(newMarker);
            newTrace.waypoints.push(newMarker);
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
        this.buttons.slider.reset();
        this.showData();
        this.showElevation();
        this.showWaypoints();
        this.updateExtract();
        if (this.buttons.show_direction) this.showChevrons();
    }

    unfocus() {
        this.hasFocus = false;
        this.gpx.setStyle(this.normal_style);
        this.closePopup();
        this.hideWaypoints();
        this.hideChevrons();
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
        this.updateExtract();
    }

    updateUndoRedo() {
        if (this.at >= 0 && !this.backToZero) this.buttons.undo.classList.remove('unselected','no-click2');
        else this.buttons.undo.classList.add('unselected','no-click2');
        if (this.at < this.memory.length-1) this.buttons.redo.classList.remove('unselected','no-click2');
        else this.buttons.redo.classList.add('unselected','no-click2');
    }

    updateExtract() {
        const layers = this.getLayers();
        var count = 0;
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs) count++;
        if (count < 2) {
            this.buttons.extract.classList.add('unselected','no-click');
            this.can_extract = false;
        } else {
            this.buttons.extract.classList.remove('unselected','no-click');
            this.can_extract = true;
        }
    }

    showWaypoints() {
        for (var i=0; i<this.waypoints.length; i++) {
            this.waypoints[i].addTo(this.map);
        }
    }

    hideWaypoints() {
        for (var i=0; i<this.waypoints.length; i++) {
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
        this._draggingWaypoint = false;
        this.buttons.map._container.style.cursor = 'crosshair';
        const _this = this;
        this.buttons.map.addEventListener("click", function (e) {
            if (e.originalEvent.target.id != "mapid") return;
            if (!_this._draggingWaypoint) _this.addEndPoint(e.latlng.lat, e.latlng.lng);
            _this._draggingWaypoint = false;
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

    redraw() {
        const layers = this.getLayers();
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs) {
            layers[i].redraw();
        }
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
        if (this.isEdited) this.buttons.elev._removeSliderCircles();
    }

    addElevation() {
        if (this.hasPoints()) {
            const layers = this.getLayers();
            for (var i=0; i<layers.length; i++) if(layers[i]._latlngs) {
                this.buttons.elev.addData(layers[i]);
            }
        } else this.buttons.elev.clear();
    }

    showChevrons() {
        if (this.buttons.show_direction) {
            this.hideChevrons();
            this.gpx.setText('     ➜     ', {
                repeat: true,
                attributes: {
                    fill: this.normal_style.color,
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

    getBounds() {
        return this.gpx.getBounds();
    }

    newEditMarker(point, layer) {
        const trace = this;
        const map = this.map;
        const marker = L.circleMarker([point.lat, point.lng], {
            className: 'edit-marker',
            radius: 4
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
            ele: (points[best_idx-1].meta.ele + points[best_idx].meta.ele) / 2
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
        if (this.isEdited) {
            this.removeEditMarkers();
            const bounds = this.map.getBounds();
            const dist = Math.abs(bounds._southWest.lat - bounds._northEast.lat);
            const layers = this.getLayers();
            for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
                const points = layers[l]._latlngs;
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
                    this._editMarkers.push(this.newEditMarker(simplifiedPoints[i], layers[l]));
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
        const layers = this.getLayers();
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
            const points = layers[l]._latlngs;
            for (var i=0; i<points.length; i++)
                points[i].index = i;
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
        const layers = this.getLayers();
        var totalPoints = 0;
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
            const simplifiedPoints = simplify.douglasPeucker(layers[l]._latlngs, tol);
            const preview_layer = new L.Polyline(simplifiedPoints, preview_style);
            this.preview.addLayer(preview_layer);
            preview_layer.layer = layers[l];
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
        for (var l=0; l<preview_layers.length; l++) preview_layers[l].layer._latlngs = preview_layers[l]._latlngs;

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

    getLayers() {
        if (this.gpx.getLayers().length == 0) return [];
        else return this.gpx.getLayers()[0].getLayers();
    }

    hasPoints() {
        const layers = this.getLayers();
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs)
            return true;
        return false;
    }

    getPoints() {
        const layers = this.getLayers();
        var points = [];
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs)
            points = points.concat(layers[i]._latlngs);
        return points;
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

    crop(start, end, no_recursion) {
        var copy = null;
        if (!no_recursion) {
            copy = this.clone();
        }

        const layers = this.getLayers();
        var cumul = 0;
        for (var i=0; i<layers.length; i++) if (layers[i]._latlngs) {
            const len = layers[i]._latlngs.length;
            if (start >= cumul+len) this.gpx.getLayers()[0].removeLayer(layers[i]);
            else if (end < cumul) this.gpx.getLayers()[0].removeLayer(layers[i]);
            else {
                if (end-cumul < len) layers[i]._latlngs.splice(end-cumul);
                if (start >= cumul) layers[i]._latlngs.splice(0, start-cumul);
                layers[i]._latlngs[0].routing = false;
                layers[i]._latlngs[layers[i]._latlngs.length-1].routing = false;
            }
            cumul += len;
        }

        if (!no_recursion) {
            if (start > 0 && end < cumul-1) {
                const copy2 = copy.clone();
                copy.crop(0, start, true);
                copy2.crop(end, cumul, true);
            } else if (start > 0) {
                copy.crop(0, start, true);
            } else if (end < cumul-1) {
                copy.crop(end, cumul, true);
            }
        }

        this.recomputeStats();
        this.redraw();
        this.showData();
        this.showElevation();
        this.buttons.slider.reset();
        this.focus();
    }

    reverse() {
        const layers = this.getLayers();
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs)
            layers[l]._latlngs.reverse();

        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs)
            this.gpx.getLayers()[0].removeLayer(layers[l]);

        for (var l=layers.length-1; l>=0; l--) if (layers[l]._latlngs)
            this.gpx.getLayers()[0].addLayer(new L.Polyline(layers[l]._latlngs, this.gpx.options.polyline_options));

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
        this.gpx.setStyle(this.focus_style);
        this.recomputeStats();
        this.update();
        this.redraw();
        if (this.buttons.show_direction) this.showChevrons();
    }

    merge(trace, as_segments) {
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
            } else if (this.firstTimeData() >= 0 && trace.firstTimeData() >= 0) {
                const avg1 = this.getMovingSpeed();
                const avg2 = trace.getMovingSpeed();
                const dist1 = this.getMovingDistance();
                const dist2 = trace.getMovingDistance();
                const avg = (dist1 * avg1 + dist2 * avg2) / (dist1 + dist2);
                const a = points[points.length-1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b);
                const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                trace.changeTimeData(startTime, avg2);
            }
        }

        if (as_segments) {
            const layers = trace.getLayers();
            for (var l=0; l<layers.length; l++) if (layers[l]._latlngs)
                this.gpx.getLayers()[0].addLayer(new L.Polyline(layers[l]._latlngs, this.gpx.options.polyline_options));
        } else {
            if (this.hasPoints()) {
                points.push(...otherPoints);
                const layers = this.getLayers();
                for (var l=0; l<layers.length; l++) if (layers[l]._latlngs)
                    this.gpx.getLayers()[0].removeLayer(layers[l]);
                this.gpx.getLayers()[0].addLayer(new L.Polyline(points, this.gpx.options.polyline_options));
            } else {
                this.gpx.getLayers()[0].addLayer(new L.Polyline(otherPoints, this.gpx.options.polyline_options));
            }
        }

        this.gpx.setStyle(this.focus_style);

        for (var i=0; i<trace.waypoints.length; i++) {
            const marker = trace.waypoints[i];
            const newMarker = this.gpx._get_marker(marker._latlng, marker.ele, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
            this.gpx.getLayers()[0].addLayer(newMarker);
            this.waypoints.push(newMarker);
        }

        this.recomputeStats();
        this.update();
        this.redraw();
    }

    extract_segments() {
        const layers = this.getLayers();
        var count = 1;
        var lastTrace = null;
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
            const newTrace = this.total.addTrace(undefined, this.name);
            newTrace.gpx.addLayer(new L.FeatureGroup());

            const points = layers[l]._latlngs;
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
                newTrace.gpx.getLayers()[0].addLayer(new L.Polyline(cpy, newTrace.gpx.options.polyline_options));
            }

            newTrace.recomputeStats();
            newTrace.rename(newTrace.name.split('.')[0] + "_" + count);
            count++;

            lastTrace = newTrace;
        }

        lastTrace.gpx.setStyle(lastTrace.focus_style);
        lastTrace.update();
    }

    addEndPoint(lat, lng) {
        this.save();

        const pt = new L.LatLng(lat, lng);
        pt.meta = {"time":null, "ele":0};
        var layer = null;

        if (!this.hasPoints()) {
            this.gpx.addLayer(new L.FeatureGroup());
            this.gpx.getLayers()[0].addLayer(new L.Polyline([pt], this.gpx.options.polyline_options));
            this.gpx.setStyle(this.focus_style);
            if (this.buttons.show_direction) this.showChevrons();
            pt.index = 0;
            layer = this.gpx.getLayers()[0].getLayers()[0];
        } else {
            const layers = this.getLayers();
            for (var i=layers.length-1; i>=0; i--) if (layers[i]._latlngs) {
                pt.index = layers[i]._latlngs.length;
                layer = layers[i];
                layers[i]._latlngs.push(pt);
                break;
            }
        }

        const marker = this.newEditMarker(pt, layer);
        this._editMarkers.push(marker);
        const len = this._editMarkers.length;
        if (len > 1) {
            this._editMarkers[len-1]._prec = this._editMarkers[len-2]._pt;
            this._editMarkers[len-2]._succ = this._editMarkers[len-1]._pt;
        }

        if (this.buttons.routing && len > 1) this.askRoute2(this._editMarkers[len-2]._pt, this._editMarkers[len-1]._pt, layer);
        else {
            this.redraw();
            this.askElevation([pt]);
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
        const marker = this.gpx._get_marker(
            latlng,
            0,
            this.buttons.clone_wpt ? this.buttons.clone_wpt.sym : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.name : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.desc : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.cmt : '',
            this.gpx.options
        );
        this.gpx.getLayers()[0].addLayer(marker);
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
            this.gpx.getLayers()[0].removeLayer(marker);
            return;
        }
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
            this.recomputeStats();
            this.update();
            this.updateExtract();
            this.redraw();
        }
    }

    updatePointManual(marker, lat, lng) {
        const points = marker._layer._latlngs;

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
        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        b.lat = lat;
        b.lng = lng;

        if (a.equals(b) && b.equals(c)) return;

        this.askRoute(a,b,c,marker._layer);
    }

    firstTimeData() {
        const points = this.getPoints();
        for (var i=0; i<points.length; i++) {
            if (points[i].meta.time != null) {
                return i;
            }
        }
        return -1;
    }

    changeTimeData(start, avg) {
        const points = this.getPoints();
        const curAvg = this.getMovingSpeed(true);
        const index = this.firstTimeData();
        if (index != -1 && curAvg > 0) {
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

    extendTimeData() {
        const points = this.getPoints();
        const index = this.firstTimeData();
        var avg = this.getMovingSpeed(true);

        if (index == -1 || avg <= 0) return;
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

    timeConsistency() {
        if (this.firstTimeData() == -1) return;

        const points = this.getPoints();
        if (this.getMovingSpeed(true) <= 0) {
            for (var i=0; i<points.length; i++) {
                points[i].meta.time = null;
            }
        } else {
            var lastTime = null;
            for (var i=0; i<points.length; i++) {
                if (points[i].meta.time) {
                    if (lastTime && lastTime > points[i].meta.time) points[i].meta.time = lastTime;
                    lastTime = points[i].meta.time;
                }
            }
            this.extendTimeData();
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
        const layers = this.getLayers();
        for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
            var ll = null, last = null;
            const points = layers[l]._latlngs;
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
                } else trace.askPointsElevation(requests.slice(1), step, 0);
            } else if (this.readyState == 4 && this.status != 200) {
                console.log('elevation query timeout : retry');
                if (depth < 10) trace.askPointsElevation(requests, step, depth+1);
            }
        }
    }

    askRoute(a, b, c, layer) {
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

                trace.addRoute(new_points, a, c, layer);
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
        this.extendTimeData();

        this.redraw();

        // ask elevation of new points
        this.askElevation(new_points);
    }

    askRoute2(a, b, layer) {
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
                trace.addRoute2(ans['routes'][0]['geometry']['coordinates'], a, b, layer);
            }
        }
    }

    addRoute2(new_pts, a, b, layer) {
        const new_points = [];
        for (var i=0; i<new_pts.length; i++) {
            new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
            new_points[i].meta = {"time":null, "ele":0};
            new_points[i].routing = true;
        }

        const pts = layer._latlngs;
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
            const mem = [];
            const layers = this.getLayers();
            for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
                const layer_mem = {
                    index: l,
                    points: []
                };
                const points = layers[l]._latlngs;
                for (var i=0; i<points.length; i++) {
                    const pt = points[i].clone();
                    pt.meta = points[i].meta;
                    pt.index = points[i].index;
                    pt.routing = points[i].routing;
                    layer_mem.points.push(pt);
                }
                mem.push(layer_mem);
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
        const layers = this.getLayers();
        const mem = this.memory[this.at];
        for (var l=0; l<mem.length; l++) {
            const index = mem[l].index;
            const points = mem[l].points;
            const cpy = [];
            for (var i=0; i<points.length; i++) {
                const pt = points[i].clone();
                pt.meta = points[i].meta;
                pt.index = points[i].index;
                pt.routing = points[i].routing;
                cpy.push(pt);
            }
            layers[index]._latlngs = cpy;
        }

        this.updateUndoRedo();
        this.recomputeStats();
        this.update();
        this.redraw();
        this.updateEditMarkers();
    }
}
