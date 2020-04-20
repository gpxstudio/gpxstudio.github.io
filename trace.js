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
    }
};

export default class Trace {
    constructor(file, name, map, total) {
        this.map = map;
        this.total = total;
        this.buttons = total.buttons;
        this.hasFocus = false;
        this.isEdited = false;

        this.gpx = new L.GPX(file, gpx_options).addTo(map);
        this.gpx.trace = this;

        this.gpx.on('loaded', function(e) {
            this.trace.index = total.traces.length;

            if (!this.getLayers()[0]._latlngs) {
                var layers = this.getLayers()[0].getLayers();
                this.removeLayer(this.getLayers()[0]);
                var mergedLayer = layers[0];
                for (var i=1; i<layers.length; i++) {
                    mergedLayer._latlngs = mergedLayer._latlngs.concat(layers[i]._latlngs);
                }
                this.addLayer(mergedLayer);
            }

            total.traces.push(this.trace);
            total.buttons.updateBounds();

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
                const marker = trace.insertEditMarker(e.layerPoint);
                marker.fire('mousedown');
            }
        });
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
        this.buttons.elev.addData(this.gpx.getLayers()[0]);
    }

    getBounds() {
        return this.gpx.getBounds();
    }

    newEditMarker(point) {
        const map = this.map;
        const marker = L.circleMarker([point.lat, point.lng], {
            className: 'edit-marker',
            radius: 4
        }).addTo(map);
        marker._index = point.index;
        marker.on({
            mousedown: function (e) {
                map.dragging.disable();
                map.on('mousemove', function (e) {
                    marker.setLatLng(e.latlng);
                });
                map._draggedMarker = marker;
                marker.getElement().style.cursor = 'grabbing';
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
        pt.meta = {"ele" : 0};
        pt.index = best_idx;
        this.askPointsElevation([pt]);

        points.splice(best_idx, 0, pt);

        const marker = this.newEditMarker(pt);
        var marker_idx = -1;

        // update markers indices + find index
        for (var i=0; i<this._editMarkers.length; i++) {
            if (this._editMarkers[i]._prec && this._editMarkers[i]._prec >= best_idx) this._editMarkers[i]._prec++;
            if (this._editMarkers[i]._index && this._editMarkers[i]._index >= best_idx) {
                this._editMarkers[i]._index++;
                if (marker_idx == -1) marker_idx = i;
            }
            if (this._editMarkers[i]._succ && this._editMarkers[i]._succ >= best_idx) this._editMarkers[i]._succ++;
        }

        // insert new marker
        this._editMarkers.splice(marker_idx, 0, marker);
        this._editMarkers[marker_idx]._prec = this._editMarkers[marker_idx-1]._index;
        this._editMarkers[marker_idx]._succ = this._editMarkers[marker_idx+1]._index;
        this._editMarkers[marker_idx-1]._succ = this._editMarkers[marker_idx]._index;
        this._editMarkers[marker_idx+1]._prec = this._editMarkers[marker_idx]._index;

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
            const simplifiedPoints = simplify.douglasPeucker(points, dist/100);
            for (var i=0; i<simplifiedPoints.length; i++) {
                this._editMarkers.push(this.newEditMarker(simplifiedPoints[i]));
                if (i > 0) {
                    this._editMarkers[i]._prec = this._editMarkers[i-1]._index;
                    this._editMarkers[i-1]._succ = this._editMarkers[i]._index;
                }
            }
        }
    }

    refreshEditMarkers() {
        for (var i=0; i<this._editMarkers.length; i++)
            this._editMarkers[i].bringToFront();
    }

    /*** GPX DATA ***/

    getPoints() {
        return this.gpx.getLayers()[0]._latlngs;
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

        // store this to revert action
        const deleted_end = points.splice(end);
        const deleted_start = points.splice(0, start);

        this.recomputeStats();
        this.redraw();
        this.showData();
        this.showElevation();
        this.buttons.slider.reset();
    }

    updatePoint(marker, lat, lng) {
        const points = this.getPoints();

        const prec_idx = marker._prec ? marker._prec : marker._index;
        const this_idx = marker._index;
        const succ_idx = marker._succ ? marker._succ : marker._index;

        var a = points[prec_idx];
        var b = points[this_idx];
        var c = points[succ_idx];

        b.lat = lat;
        b.lng = lng;

        if (succ_idx-this_idx-1 > 0) points.splice(this_idx+1, succ_idx-this_idx-1);
        if (this_idx-prec_idx-1 > 0) points.splice(prec_idx+1, this_idx-prec_idx-1);

        // update markers indices
        for (var i=0; i<this._editMarkers.length; i++) {
            if (this._editMarkers[i]._prec) {
                if (this._editMarkers[i]._prec > this_idx) this._editMarkers[i]._prec -= Math.max(0,succ_idx-this_idx-1) + Math.max(0,this_idx-prec_idx-1);
                else if (this._editMarkers[i]._prec > prec_idx) this._editMarkers[i]._prec -= Math.max(0,this_idx-prec_idx-1);
            }
            if (this._editMarkers[i]._index) {
                if (this._editMarkers[i]._index > this_idx) this._editMarkers[i]._index -= Math.max(0,succ_idx-this_idx-1) + Math.max(0,this_idx-prec_idx-1);
                else if (this._editMarkers[i]._index > prec_idx) this._editMarkers[i]._index -= Math.max(0,this_idx-prec_idx-1);
            }
            if (this._editMarkers[i]._succ) {
                if (this._editMarkers[i]._succ > this_idx) this._editMarkers[i]._succ -= Math.max(0,succ_idx-this_idx-1) + Math.max(0,this_idx-prec_idx-1);
                else if (this._editMarkers[i]._succ > prec_idx) this._editMarkers[i]._succ -= Math.max(0,this_idx-prec_idx-1);
            }
        }

        this.redraw();
        this.askPointsElevation([b]);
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

    askPointsElevation(points) {
        const point = points[0];
        const lat = point.lat;
        const lng = point.lng;

        const Http = new XMLHttpRequest();
        //const url = 'https://elevation-api.io/api/elevation?points=(' + lat + ',' + lng + ')&key=w2-Otn-4S7sAahUs-Ubd7o7f0P4Fms';
        const url = 'https://api.airmap.com/elevation/v1/ele/?points=' + lat + ',' + lng;
        Http.open("GET", url);
        Http.setRequestHeader('X-API-Key', '{eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVkZW50aWFsX2lkIjoiY3JlZGVudGlhbHx6eFcwM1p4QzlRYW4wbmZCeVFQejVoTDJ4NjUiLCJhcHBsaWNhdGlvbl9pZCI6ImFwcGxpY2F0aW9ufDllS3hvV1lJSkw3S1phaEFLd0trWWgwOE04cHAiLCJvcmdhbml6YXRpb25faWQiOiJkZXZlbG9wZXJ8cXBlOU0yR1VlT1o4Tlh0ODVSbk9nSEo2bmJnZyIsImlhdCI6MTU4Njg3NjYwOX0.LpZdUZ_jnxhwPHyheDqYnVdQ91kTNuraJq7I9djl6Hc}');
        Http.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        Http.send();

        const trace = this;
        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const ele = ans["data"][0]; //ans["elevations"][0]["elevation"];
                point.meta.ele = ele;

                // update trace info
                trace.recomputeStats();

                trace.update();
                trace.buttons.elev._removeSliderCircles();
            }
        }
    }
}
