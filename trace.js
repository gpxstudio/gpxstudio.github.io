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

        this.gpx = new L.GPX(file, gpx_options).addTo(map);
        this.gpx.trace = this;

        this.gpx.on('loaded', function(e) {
            this.trace.index = total.traces.length;
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
        }).on('click', function(e) {
            e.target.trace.updateFocus();
        });
    }

    /*** LOGIC ***/

    remove() {
        this.gpx.clearLayers();
        this.buttons.tabs.removeChild(this.tab);
    }

    afterLoad() {

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
    }

    updateFocus() {
        if (this.hasFocus) {
            this.unfocus();
            this.total.focus();
        } else this.focus();
    }

    redraw() {
        this.gpx.remove();
        this.gpx.addTo(this.map);
    }

    showData() {
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(1).toString() + ' km';
        this.buttons.elevation.innerHTML = this.getElevation().toFixed(0).toString() + ' m';
        this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' km/h';
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

    /*** GPX DATA ***/

    getPoints() {
        return this.gpx.getLayers()[0]._latlngs;
    }

    getElevationAt(index) {
        return this.gpx.get_elevation_data()[index][1];
    }

    getDistance() {
        return this.gpx._info.length;
    }

    getElevation() {
        return this.gpx._info.elevation.gain;
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

    updatePoint(index, lat, lng) {
        var points = this.getPoints();

        var a = points[index].clone();
        var b = points[index].clone();
        var c = points[index].clone();

        if (index > 0) {
            a = points[index-1].clone();
            a.meta = {"ele" : this.getElevationAt(index-1)};
        } else a.meta = {"ele" : this.getElevationAt(index)};
        b.meta = {"ele" : this.getElevationAt(index)};
        if (index < points.length-1) {
            c = points[index+1].clone();
            c.meta = {"ele" : this.getElevationAt(index+1)};
        } else a.meta = {"ele" : this.getElevationAt(index)};

        const Http = new XMLHttpRequest();
        //const url = 'https://elevation-api.io/api/elevation?points=(' + lat + ',' + lng + ')&key=w2-Otn-4S7sAahUs-Ubd7o7f0P4Fms';
        const url = 'https://api.airmap.com/elevation/v1/ele/?points=' + lat + ',' + lng;
        Http.open("GET", url);
        Http.setRequestHeader('X-API-Key', '{eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVkZW50aWFsX2lkIjoiY3JlZGVudGlhbHx6eFcwM1p4QzlRYW4wbmZCeVFQejVoTDJ4NjUiLCJhcHBsaWNhdGlvbl9pZCI6ImFwcGxpY2F0aW9ufDllS3hvV1lJSkw3S1phaEFLd0trWWgwOE04cHAiLCJvcmdhbml6YXRpb25faWQiOiJkZXZlbG9wZXJ8cXBlOU0yR1VlT1o4Tlh0ODVSbk9nSEo2bmJnZyIsImlhdCI6MTU4Njg3NjYwOX0.LpZdUZ_jnxhwPHyheDqYnVdQ91kTNuraJq7I9djl6Hc}');
        Http.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        Http.send();

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const ele = ans["data"][0]; //ans["elevations"][0]["elevation"];

                const d1 = trace._dist3d(a, b) + trace._dist3d(b, c);
                const e1 = Math.max(b.meta.ele - a.meta.ele, 0) + Math.max(c.meta.ele - b.meta.ele, 0);

                // data of new point
                b.lat = lat;
                b.lng = lng;
                b.meta.ele = ele;

                const d2 = trace._dist3d(a, b) + trace._dist3d(b, c);
                const e2 = Math.max(b.meta.ele - a.meta.ele, 0) + Math.max(c.meta.ele - b.meta.ele, 0);

                // update trace info
                trace._info.length += d2 - d1;
                trace._info.elevation.gain += e2 - e1;
                update_data();
            }
        }

        points[index].lat = lat;
        points[index].lng = lng;
        this.redraw();
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
}
