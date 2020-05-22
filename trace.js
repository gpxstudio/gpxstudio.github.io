const normal_style = { color: '#FF4040', weight: 3 };
const focus_style = { color: 'red', weight: 5 };
const gpx_options = {
    async: true,
    polyline_options: normal_style,
    marker_options: {
        startIconUrl: '',
        endIconUrl: '',
        shadowUrl: '',
        wptIconUrls : { '': '' }
    },
    max_point_interval: 3000
};

export default class Trace {
    constructor(file, name, map, total) {
        this.map = map;
        this.total = total;
        this.buttons = total.buttons;
        this.hasFocus = false;
        this.isEdited = false;
        this.drawing = false;

        this.gpx = new L.GPX(file, gpx_options).addTo(map);
        this.gpx.trace = this;

        this.gpx.on('loaded', function(e) {
            this.trace.index = total.traces.length;

            // merge multiple tracks of same file
            if (this.getLayers().length > 0 && !this.getLayers()[0]._latlngs) {
                var layers = this.getLayers()[0].getLayers();
                this.removeLayer(this.getLayers()[0]);
                var mergedLayer = layers[0];
                for (var i=1; i<layers.length; i++) {
                    mergedLayer._latlngs = mergedLayer._latlngs.concat(layers[i]._latlngs);
                }
                this.addLayer(mergedLayer);
            }

            total.traces.push(this.trace);
            if (this.getLayers().length > 0) total.buttons.updateBounds();

            if (total.hasFocus) total.update();

            var ul = document.getElementById("sortable");
            var li = document.createElement("li");
            li.innerHTML = name;
            li.classList.add('tab');
            li.trace = this.trace;
            li.addEventListener('click', function (e) {
                if (!e.target.trace.hasFocus) e.target.trace.focus();
            });
            ul.appendChild(li);

            this.trace.tab = li;
            total.buttons.updateTabWidth();
            total.buttons.circlesToFront();
        }).on('click', function (e) {
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

    /*** LOGIC ***/

    remove() {
        this.unfocus();
        this.gpx.clearLayers();
        this.buttons.tabs.removeChild(this.tab);
    }

    /*** DISPLAY ***/

    focus() {
        this.total.unfocusAll();
        this.hasFocus = true;
        this.total.focusOn = this.index;
        this.gpx.setStyle(focus_style);
        this.buttons.focusTabElement(this.tab);
        this.buttons.slider.reset();
        this.showData();
        this.showElevation();
    }

    unfocus() {
        this.hasFocus = false;
        this.gpx.setStyle(normal_style);
        if (this.isEdited) this.stopEdit();
        if (this.drawing) this.stopDraw();
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

    edit() {
        this.isEdited = true;
        this.updatePointIndices();
        this.updateEditMarkers();
        this.buttons.hideTraceButtons();
        this.buttons.elev._removeSliderCircles();
        this.buttons.editToValidate();
    }

    stopEdit() {
        this.isEdited = false;
        this.removeEditMarkers();
        this.buttons.showTraceButtons();
        this.buttons.elev._addSliderCircles();
        this.buttons.validateToEdit();
    }

    draw() {
        this.focus();
        this.edit();
        this.buttons.hideValidate();
        this.drawing = true;
        this.buttons.map._container.style.cursor = 'crosshair';
        this.insertMarker = false;
        const _this = this;
        this.buttons.map.addEventListener("click", function (e) {
            if (!_this.insertMarker) _this.addEndPoint(e.latlng.lat, e.latlng.lng);
            _this.insertMarker = false;
        });
    }

    stopDraw() {
        this.buttons.map._container.style.cursor = '';
        this.buttons.map.removeEventListener("click");
        this.drawing = false;
        if (this.getPoints().length < 2) this.total.removeTrace(this.index);
    }

    redraw() {
        this.gpx.getLayers()[0].redraw();
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
                }).setContent(`<div id="remove-waypoint" class="custom-button" style="display: inline-block">Remove waypoint</div>
                <div class="custom-button" style="display: inline-block; width: 4px"></i></div>
                <div id="close-popup" class="custom-button" style="display: inline-block"><i class="fas fa-times"></i></div>`);
                popup.setLatLng(e.latlng);
                popup.openOn(map);

                var button = document.getElementById("remove-waypoint");
                button.addEventListener("click", function () {
                    trace.deletePoint(marker);
                    marker.remove();
                    popup.remove();
                });

                var close = document.getElementById("close-popup");
                close.addEventListener("click", function () {
                    popup.remove();
                });

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
        newPt.meta = { time: points[best_idx].meta.time, ele: (points[best_idx-1].meta.ele + points[best_idx].meta.ele) / 2};
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

    /*** GPX DATA ***/

    hasPoints() {
        return this.gpx.getLayers().length > 0;
    }

    getPoints() {
        if (this.hasPoints()) return this.gpx.getLayers()[0]._latlngs;
        else return [];
    }

    getDistance() {
        if (this.buttons.km) return this.gpx._info.length;
        else return this.gpx._info.length / 1.60934;
    }

    getElevation() {
        if (this.buttons.km) return this.gpx._info.elevation.gain;
        else return this.gpx._info.elevation.gain * 3.28084;
    }

    getMovingTime() {
        return this.gpx._info.duration.moving;
    }

    getMovingSpeed() {
        const time = this.getMovingTime();
        if (time == 0) return 0;
        return this.getDistance() / (time / 3600);
    }

    getMovingPace() {
        return this.getMovingTime() / (this.getDistance() / 1000);
    }

    /*** MODIFIERS ***/

    crop(start, end) {
        const points = this.getPoints();
        const length = points.length;

        const deleted_end = points.splice(end);
        const deleted_start = points.splice(0, start);

        this.recomputeStats();
        this.redraw();
        this.showData();
        this.showElevation();
        this.buttons.slider.reset();
    }

    addEndPoint(lat, lng) {
        const pt = new L.LatLng(lat, lng);
        pt.meta = {"time":null, "ele":0};

        if (!this.hasPoints()) {
            this.gpx.addLayer(new L.Polyline([pt], this.gpx.options.polyline_options));
            this.gpx.setStyle(focus_style);
        } else this.getPoints().push(pt);

        const points = this.getPoints();
        pt.index = points.length-1;

        if (points.length >= 2) this.buttons.showValidate();

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

    updatePoint(marker, lat, lng) {
        if (this.buttons.routing) this.updatePointRouting(marker, lat, lng);
        else this.updatePointManual(marker, lat, lng);
    }

    deletePoint(marker) {
        const points = this.getPoints();

        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        this.deletePointManual(marker);

        if (points.length < 2) this.buttons.hideValidate();

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

    recomputeStats() {
        // reset
        this.gpx._info.length = 0.0;
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
                this.gpx._info.length += this.gpx._dist3d(last, ll);

                var t = ll.meta.ele - last.meta.ele;
                if (t > 0) {
                  this.gpx._info.elevation.gain += t;
                } else {
                  this.gpx._info.elevation.loss += Math.abs(t);
                }

                t = Math.abs(ll.meta.time - last.meta.time);
                this.gpx._info.duration.total += t;
                if (t < this.gpx.options.max_point_interval) {
                  this.gpx._info.duration.moving += t;
                }
            } else if (this.gpx._info.duration.start == null) {
                this.gpx._info.duration.start = ll.meta.time;
            }

            last = ll;
        }
    }

    /*** REQUESTS ***/

    askElevation(points) {
        const step = 5;
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
            requests.push([points.slice(start, i + step - 1), pts]);
        }
        this.askPointsElevation(requests, step);
    }

    askPointsElevation(requests, step) {
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
                    trace_points[i].meta.ele = ans["data"][Math.floor(i/step)] ? ans["data"][Math.floor(i/step)] : 0; //ans["elevations"][0]["elevation"];
                }

                if (requests.length == 1) {
                    // update trace info
                    trace.recomputeStats();

                    trace.update();
                    trace.buttons.elev._removeSliderCircles();
                } else trace.askPointsElevation(requests.slice(1), step);
            } else if (this.readyState == 4 && this.status == 504) {
                console.log('elevation query timeout : retry');
                trace.askPointsElevation(requests, step);
            }
        }
    }

    askRoute(a, b, c) {
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
                const new_geojson = ans['routes'][0]['geometry'];
                const new_pts = new_geojson['coordinates'];
                const new_points = [];
                var mid = -1, dist = -1;
                for (var i=0; i<new_pts.length; i++) {
                    new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                    new_points[i].meta = {"time":new Date(), "ele":0};
                    new_points[i].routing = true;
                    if (mid == -1 || new_points[i].distanceTo(b) < dist) {
                        dist = new_points[i].distanceTo(b);
                        mid = i;
                    }
                }
                if (!a.equals(b) && !b.equals(c)) new_points[mid].routing = false;

                const pts = trace.getPoints();
                // remove old
                pts.splice(a.index+1, c.index-a.index-1);
                // add new
                pts.splice(a.index+1, 0, ...new_points);
                // update points indices
                trace.updatePointIndices();
                // update markers indices
                trace.updateEditMarkers();

                trace.redraw();

                // ask elevation of new points
                trace.askElevation(new_points);
            }
        }
    }

    askRoute2(a, b) {
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
                const new_geojson = ans['routes'][0]['geometry'];
                const new_pts = new_geojson['coordinates'];
                const new_points = [];
                for (var i=0; i<new_pts.length; i++) {
                    new_points.push(L.latLng(new_pts[i][1],new_pts[i][0]));
                    new_points[i].meta = {"time":new Date(), "ele":0};
                    new_points[i].routing = true;
                }

                const pts = trace.getPoints();
                // add new
                pts.splice(a.index+1, 0, ...new_points);
                // update points indices
                trace.updatePointIndices();
                // update markers indices
                trace.updateEditMarkers();

                trace.redraw();

                // ask elevation of new points
                trace.askElevation(new_points);
            }
        }
    }
}
