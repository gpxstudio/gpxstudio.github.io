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

import Trace from './trace.js';

const trace_colors = ['#ff0000', '#0000ff', '#46e646', '#00ccff', '#ff9900', '#ff00ff', '#ffff32', '#288228', '#9933ff', '#50f0be', '#8c645a'];

export default class Total {
    constructor(buttons) {
        this.traces = [];
        this.tab = buttons.total_tab;
        this.tab.trace = this;
        this.tab.addEventListener('click', function(e) {
            e.target.trace.updateFocus();
        });
        this.buttons = buttons;
        this.buttons.addHandlersWithTotal(this);
        this.focus();
        this.initColors();
    }

    /*** LOGIC ***/

    addTrace(file, name, callback) {
        if (this.traces.length == 1) this.buttons.combine.classList.remove('unselected','no-click');
        return new Trace(file, name, this.buttons.map, this, callback);
    }

    removeTrace(index) {
        if (this.traces.length == 2) this.buttons.combine.classList.add('unselected','no-click');
        this.traces[index].remove();
        this.traces.splice(index, 1);
        for (var i=index; i<this.traces.length; i++)
            this.traces[i].index--;
        if (index > 0) this.traces[index-1].focus();
        else this.focus();
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
        this.showData();
        this.showElevation();
        this.buttons.focusTabElement(this.tab);
        this.buttons.hideTraceButtons();
        this.buttons.elev._removeSliderCircles();
        this.buttons.unhideToHide();

        for (var i=0; i<this.traces.length; i++) if (this.traces[i].visible) {
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
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(1).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.elevation.innerHTML = '<i class="fas fa-angle-up"></i> ' + this.getElevationGain().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text) +
            ' <i class="fas fa-angle-down"></i> ' + this.getElevationLoss().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text);
        if (this.buttons.cycling) this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text) + '/' + this.buttons.unit_hours_text;
        else this.buttons.speed.innerHTML = this.msToTimeMin(this.getMovingPace()) + ' ' + this.buttons.unit_minutes_text + '/' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.duration.innerHTML = this.msToTime(this.getMovingTime());
        this.buttons.points.innerHTML = this.getPoints();
        this.buttons.segments.innerHTML = this.getSegments();
    }

    showElevation() {
        this.buttons.elev.clear();
        this.buttons.elev.options.imperial = !this.buttons.km;
        var total_points = 0;
        for (var i=0; i<this.traces.length; i++)
            total_points += this.traces[i].getPoints().length;
        for (var i=0; i<this.traces.length; i++)
            this.traces[i].addElevation(total_points);
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

    getPoints() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getPoints().length;
        return tot;
    }

    getSegments() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getSegments().length;
        return tot;
    }

    getDistance() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getDistance();
        return tot;
    }

    getMovingDistance(noConversion) {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++) if (this.traces[i].firstTimeData() != -1)
            tot += this.traces[i].getMovingDistance(noConversion);
        return tot;
    }

    getElevationGain() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getElevationGain();
        return tot;
    }

    getElevationLoss() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getElevationLoss();
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
        var cntPower = 0, totPower = 0;

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
            if (data.power) {
                totPower += data.power * duration;
                cntPower += duration;
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

    /*** OUTPUT ***/

    outputGPX(mergeAll, incl_time, incl_hr, incl_atemp, incl_cad, incl_power, trace_idx) {
        if (incl_time && this.getMovingTime() > 0 && trace_idx === undefined) { // at least one track has time data
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

        const xmlStart1 = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" version="1.1" creator="https://gpx.studio">
<metadata>
    <name>`;
        const xmlStart2 = `</name>
    <author>
        <name>gpx.studio</name>
        <link href="https://gpx.studio"></link>
    </author>
</metadata>
`;
        const xmlStart3 = `<trk>
    <name>`;
        const xmlStart4 = `</name>
    <type>`+(this.buttons.cycling ? 'Cycling' : 'Running')+`</type>
`;

        const xmlEnd = `</trk>
</gpx>`;

        const output = [];
        var xmlOutput = '';
        var waypointsOutput = '';

        const totalData = this.additionalAvgData;
        for (var i=(trace_idx!==undefined ? trace_idx : 0); i<(trace_idx!==undefined ? trace_idx+1 : this.traces.length); i++) {
            const data = this.traces[i].additionalAvgData;
            const hr = data.hr ? data.hr : (totalData ? totalData.hr : null);
            const atemp = data.atemp ? data.atemp : (totalData ? totalData.atemp : null);
            const cad = data.cad ? data.cad : (totalData ? totalData.cad : null);
            const power = data.power ? data.power : (totalData ? totalData.power : null);

            const segments = this.traces[i].getSegments();
            for (var l=0; l<segments.length; l++) {
                xmlOutput += `    <trkseg>
`;
                const points = segments[l]._latlngs;
                for (var j=0; j<points.length; j++) {
                    const point = points[j];
                    xmlOutput += `    <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">
    `;
                    if (point.meta) {
                        if (point.meta.ele || point.meta.ele == 0) {
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

                        if (incl_atemp) {
                            if (point.meta.atemp) {
                                xmlOutput += `    <gpxtpx:atemp>${point.meta.atemp}</gpxtpx:atemp>
    `;
                            } else if (atemp) {
                                xmlOutput += `    <gpxtpx:atemp>${atemp}</gpxtpx:atemp>
    `;
                            }
                        }
                        if (incl_hr) {
                            if (point.meta.hr) {
                                xmlOutput += `    <gpxtpx:hr>${point.meta.hr}</gpxtpx:hr>
    `;
                            } else if (hr) {
                                xmlOutput += `    <gpxtpx:hr>${hr}</gpxtpx:hr>
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
    `;
                        if (incl_power) {
                            if (point.meta.power) {
                                xmlOutput += `    <power>${point.meta.power}</power>
    `;
                            } else if (power) {
                                xmlOutput += `    <power>${power}</power>
    `;
                            }
                        }
                        xmlOutput += `    </extensions>
    `;
                    }
                    xmlOutput += `</trkpt>
`;
                }

                xmlOutput += `    </trkseg>
`;
            }

            const waypoints = this.traces[i].getWaypoints();
            for (var j=0; j<waypoints.length; j++) {
                const point = waypoints[j];
                waypointsOutput += `<wpt lat="${point._latlng.lat.toFixed(6)}" lon="${point._latlng.lng.toFixed(6)}">
`;
                if (point._latlng.meta.ele || point._latlng.meta.ele == 0) {
                    waypointsOutput += `    <ele>${point._latlng.meta.ele.toFixed(1)}</ele>
`;
                }
                waypointsOutput += `    <name>`+this.encodeString(point.name)+`</name>
`;
                waypointsOutput += `    <cmt>`+this.encodeString(point.cmt)+`</cmt>
`;
                waypointsOutput += `    <desc>`+this.encodeString(point.desc)+`</desc>
`;
                waypointsOutput += `    <sym>${point.sym}</sym>
`;
                waypointsOutput += `</wpt>
`;
            }

            if (!mergeAll || this.traces.length == 1 || trace_idx!==undefined) {
                const colorOutput = this.traces[i].set_color ? `    <extensions>
        <gpxx:TrackExtension>
        <gpxx:Extensions>
        <color>`+this.traces[i].normal_style.color+`</color>
        <opacity>`+this.traces[i].normal_style.opacity+`</opacity>
        </gpxx:Extensions>
        </gpxx:TrackExtension>
    </extensions>
` : '';

                output.push({
                    name: this.traces[i].name + '.gpx',
                    text: (xmlStart1+this.traces[i].name+xmlStart2+waypointsOutput+xmlStart3+this.traces[i].name+xmlStart4+colorOutput+xmlOutput+xmlEnd)
                });
                xmlOutput = '';
                waypointsOutput = '';
            }
        }

        if (mergeAll && this.traces.length > 1) {
            output.push({
                name: 'track.gpx',
                text: (xmlStart1+'track'+xmlStart2+waypointsOutput+xmlStart3+'track'+xmlStart4+xmlOutput+xmlEnd)
            });
        }

        return output;
    }

    encodeString(value) {
        return value.replaceAll(/&/g, '&amp;')
            .replaceAll(/</g, '&lt;')
            .replaceAll(/>/g, '&gt;')
            .replaceAll(/"/g, '&quot;')
            .replaceAll(/'/g, '&apos;');
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

    // COLORS

    initColors() {
        this.colors = [];
        for (var i=0; i<trace_colors.length; i++) {
            this.colors.push({
                color: trace_colors[i],
                count: 0
            });
        }
        this.normal_style = { weight: 3, opacity: 0.7 };
        this.focus_style = { weight: 5, opacity: 0.7 };
        this.same_color = false;
    }

    getColor() {
        if (this.same_color) return this.normal_style.color;
        var lowest_count = Infinity;
        var lowest_index = 0;
        for (var i=0; i<this.colors.length; i++) if (this.colors[i].count < lowest_count) {
            lowest_count = this.colors[i].count;
            lowest_index = i;
        }
        this.colors[lowest_index].count++;
        return this.colors[lowest_index].color;
    }

    removeColor(color) {
        for (var i=0; i<this.colors.length; i++) if (this.colors[i].color == color) {
            this.colors[i].count--;
            break;
        }
    }

    changeColor(oldColor, newColor) {
        this.removeColor(oldColor);
        for (var i=0; i<this.colors.length; i++) if (this.colors[i].color == newColor) {
            this.colors[i].count++;
            break;
        }
    }
}
