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

import Trace from './trace.js';

export default class Total {
    constructor(buttons) {
        this.traces = [];
        this.tab = buttons.total_tab;
        this.tab.trace = this;
        this.tab.addEventListener('click', function(e) {
            e.target.trace.updateFocus();
        });
        this.color_count = 0;
        this.buttons = buttons;
        this.buttons.addHandlersWithTotal(this);
        this.focus();
    }

    /*** LOGIC ***/

    addTrace(file, name) {
        return new Trace(file, name, this.buttons.map, this);
    }

    removeTrace(index) {
        this.traces[index].remove();
        this.traces.splice(index, 1);
        for (var i=index; i<this.traces.length; i++)
            this.traces[i].index--;
        this.focus();
        this.buttons.updateTabWidth();
    }

    clear() {
        for (var i=0; i<this.traces.length; i++)
            this.traces[i].remove();
        this.traces = [];
        this.focus();
    }

    swapTraces(i, j) {
        var tmp = this.traces[i];
        this.traces[i] = this.traces[j];
        this.traces[j] = tmp;
        this.traces[i].index = i;
        this.traces[j].index = j;

        if (i == this.focusOn) this.focusOn = j;
        else if (j == this.focusOn) this.focusOn = i;
    }

    /*** DISPLAY ***/

    focus() {
        this.hasFocus = true;
        this.focusOn = -1;
        this.buttons.slider.reset();
        this.showData();
        this.showElevation();
        this.buttons.focusTabElement(this.tab);
        this.buttons.hideTraceButtons();
        this.buttons.elev._removeSliderCircles();

        for (var i=0; i<this.traces.length; i++) {
            this.traces[i].showWaypoints();
        }
    }

    unfocus() {
        this.hasFocus = false;
        this.buttons.showTraceButtons();

        for (var i=0; i<this.traces.length; i++) {
            this.traces[i].hideWaypoints();
        }
    }

    updateFocus() {
        if (!this.hasFocus) {
            this.traces[this.focusOn].unfocus();
            this.focus();
        }
    }

    unfocusAll() {
        if (this.hasFocus) this.unfocus();
        else for (var i=0; i<this.traces.length; i++)
            this.traces[i].unfocus();
    }

    update() {
        this.showData();
        this.showElevation();
    }

    showData() {
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(1).toString() + (this.buttons.km ? ' km' : ' mi');
        this.buttons.elevation.innerHTML = this.getElevation().toFixed(0).toString() + (this.buttons.km ? ' m' : ' ft');
        if (this.buttons.cycling) this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' ' + (this.buttons.km ? ' km' : ' mi') + '/h';
        else this.buttons.speed.innerHTML = this.msToTimeMin(this.getMovingPace()) + ' min/' + (this.buttons.km ? 'km' : 'mi');
        this.buttons.duration.innerHTML = this.msToTime(this.getMovingTime());
    }

    showElevation() {
        this.buttons.elev.clear();
        this.buttons.elev.options.imperial = !this.buttons.km;
        for (var i=0; i<this.traces.length; i++)
            this.traces[i].addElevation();
        this.buttons.elev._removeSliderCircles();
    }

    getBounds() {
        var bounds = new L.LatLngBounds();
        for (var i=0; i<this.traces.length; i++)
            bounds.extend(this.traces[i].getBounds());
        bounds._northEast.lat += 0.10 * (bounds._northEast.lat - bounds._southWest.lat);
        bounds._southWest.lat -= 0.45 * (bounds._northEast.lat - bounds._southWest.lat);
        return bounds;
    }

    /*** GPX DATA ***/

    getDistance() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getDistance();
        return tot;
    }

    getMovingDistance(noConversion) {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getMovingDistance(noConversion);
        return tot;
    }

    getElevation() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getElevation();
        return tot;
    }

    getMovingTime() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getMovingTime();
        return tot;
    }

    getMovingSpeed(noConversion) {
        const time = this.getMovingTime();
        if (time == 0) return 0;
        return this.getMovingDistance(noConversion) / (time / 3600);
    }

    getMovingPace() {
        const dist = this.getMovingDistance();
        if (dist == 0) return 0;
        return this.getMovingTime() / (dist / 1000);
    }

    getAverageAdditionalData() {
        var cntHr = 0, totHr = 0;
        var cntTemp = 0, totTemp = 0;
        var cntCad = 0, totCad = 0;

        for (var i=0; i<this.traces.length; i++) {
            const data = this.traces[i].getAverageAdditionalData();
            const duration = this.traces[i].getMovingTime();
            if (data.hr) {
                totHr += data.hr * duration;
                cntHr += duration;
            }
            if (data.atemp) {
                totTemp += data.atemp * duration;
                cntTemp += duration;
            }
            if (data.cad) {
                totCad += data.cad * duration;
                cntCad += duration;
            }
        }

        this.additionalAvgData = {
            hr: cntHr > 0 ? Math.round((totHr/cntHr) * 10) / 10 : null,
            atemp: cntTemp > 0 ? Math.round((totTemp/cntTemp) * 10) / 10 : null,
            cad: cntCad > 0 ? Math.round((totCad/cntCad) * 10) / 10 : null,
        };
        return this.additionalAvgData;
    }

    /*** OUTPUT ***/

    outputGPX(mergeAll, incl_time, incl_hr, incl_atemp, incl_cad) {
        if (incl_time && this.getMovingTime() > 0) { // at least one track has time data
            for (var i=0; i<this.traces.length; i++) this.traces[i].timeConsistency();
            const avg = this.getMovingSpeed(true);
            var lastPoints = null;
            for (var i=0; i<this.traces.length; i++) {
                const points = this.traces[i].getPoints();
                if (this.traces[i].firstTimeData() == -1) { // no time data
                    var startTime = new Date();
                    if(lastPoints) {
                        const a = lastPoints[lastPoints.length-1];
                        const b = points[0];
                        const dist = mergeAll ? this.traces[i].gpx._dist2d(a, b) : 0;
                        startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                    } else if (i < this.traces.length-1) {
                        var a = points[points.length-1];
                        var b;
                        var dist = this.traces[i].getDistance(true);
                        for (var j=i+1; j<this.traces.length; j++) {
                            const cur_points = this.traces[j].getPoints();
                            b = cur_points[0];
                            if (mergeAll) dist += this.traces[j].gpx._dist2d(a, b);
                            if (this.traces[j].firstTimeData() == -1) dist += this.traces[j].getDistance(true);
                            else break;
                            a = cur_points[cur_points.length-1];
                        }
                        startTime = new Date(b.meta.time.getTime() - 1000 * 60 * 60 * dist/(1000 * avg));
                    }
                    this.traces[i].changeTimeData(startTime, avg);
                } else if (mergeAll && lastPoints && points[0].meta.time < lastPoints[lastPoints.length-1].meta.time) { // time precedence constraint
                    const a = lastPoints[lastPoints.length-1];
                    const b = points[0];
                    const dist = this.traces[i].gpx._dist2d(a, b);
                    const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                    const curAvg = this.traces[i].getMovingSpeed(true);
                    this.traces[i].changeTimeData(startTime, curAvg > 0 ? curAvg : avg);
                }
                lastPoints = points;
            }
        }

        const xmlStart = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" version="1.1" creator="https://gpxstudio.github.io">
<metadata>
    <name>Activity</name>
    <author>gpx.studio</author>
    <link>https://gpxstudio.github.io</link>
</metadata>
<trk>
    `;

        const xmlEnd1 = `</trk>
`;
        const xmlEnd2 = `</gpx>`;

        const output = [];
        var xmlOutput = '';
        var waypointsOutput = '';

        const totalData = this.additionalAvgData;
        for (var i=0; i<this.traces.length; i++) {
            const data = this.traces[i].additionalAvgData;
            const hr = data.hr ? data.hr : totalData.hr;
            const atemp = data.atemp ? data.atemp : totalData.atemp;
            const cad = data.cad ? data.cad : totalData.cad;

            const layers = this.traces[i].getLayers();
            for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
                xmlOutput += `<trkseg>
    `;
                const points = layers[l]._latlngs;
                for (var j=0; j<points.length; j++) {
                    const point = points[j];
                    xmlOutput += `<trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">
    `;
                    if (point.meta) {
                        if (point.meta.ele) {
                            xmlOutput += `    <ele>${point.meta.ele.toFixed(1)}</ele>
    `;
                        }
                        if (incl_time && point.meta.time) {
                            xmlOutput += `    <time>${point.meta.time.toISOString()}</time>
    `;
                        }
                        xmlOutput += `    <extensions>
        <gpxtpx:TrackPointExtension>
    `;
                        if (incl_hr) {
                            if (point.meta.hr) {
                                xmlOutput += `    <gpxtpx:hr>${point.meta.hr}</gpxtpx:hr>
    `;
                            } else if (hr) {
                                xmlOutput += `    <gpxtpx:hr>${hr}</gpxtpx:hr>
    `;
                            }
                        }
                        if (incl_atemp) {
                            if (point.meta.atemp) {
                                xmlOutput += `    <gpxtpx:atemp>${point.meta.atemp}</gpxtpx:atemp>
    `;
                            } else if (atemp) {
                                xmlOutput += `    <gpxtpx:atemp>${atemp}</gpxtpx:atemp>
    `;
                            }
                        }
                        if (incl_cad) {
                            if (point.meta.cad) {
                                xmlOutput += `    <gpxtpx:cad>${point.meta.cad}</gpxtpx:cad>
    `;
                            } else if (cad) {
                                xmlOutput += `    <gpxtpx:cad>${cad}</gpxtpx:cad>
    `;
                            }
                        }
                        xmlOutput += `    </gpxtpx:TrackPointExtension>
        </extensions>
    `;
                    }
                    xmlOutput += `</trkpt>
    `;
                }

                xmlOutput += `</trkseg>
    `;
            }

            const waypoints = this.traces[i].waypoints;
            for (var j=0; j<waypoints.length; j++) {
                const point = waypoints[j];
                waypointsOutput += `<wpt lat="${point._latlng.lat.toFixed(6)}" lon="${point._latlng.lng.toFixed(6)}">
`;
                if (point._latlng.meta) {
                    waypointsOutput += `    <ele>${point._latlng.meta.ele.toFixed(1)}</ele>
`;
                } else if (point.ele >= 0) {
                    waypointsOutput += `    <ele>${point.ele.toFixed(1)}</ele>
`;
                }

                waypointsOutput += `    <name>${point.name}</name>
`;
                waypointsOutput += `    <desc>${point.desc}</desc>
`;
                waypointsOutput += `    <cmt>${point.cmt}</cmt>
`;
                waypointsOutput += `    <sym>${point.sym}</sym>
`;
                waypointsOutput += `</wpt>
`;
            }

            if (!mergeAll || this.traces.length == 1) {
                const colorOutput = this.traces[i].set_color ? `<extensions>
    <color>`+this.traces[i].normal_style.color+`</color>
</extensions>
` : '';
                output.push({
                    name: this.traces[i].name,
                    text: (xmlStart+xmlOutput+xmlEnd1+waypointsOutput+colorOutput+xmlEnd2)
                });
                xmlOutput = '';
                waypointsOutput = '';
            }
        }

        if (mergeAll && this.traces.length > 1) {
            output.push({
                name: 'track.gpx',
                text: (xmlStart+xmlOutput+xmlEnd1+waypointsOutput+xmlEnd2)
            });
        }

        return output;
    }

    /*** HELPER FUNCTIONS ***/
    msToTime(duration) {
      var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor(duration / (1000 * 60 * 60));

      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;

      return hours + "h" + minutes;
    }

    msToTimeMin(duration) {
      var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor(duration / (1000 * 60));

      seconds = (seconds < 10) ? "0" + seconds : seconds;

      return minutes + ":" + seconds;
    }
}
