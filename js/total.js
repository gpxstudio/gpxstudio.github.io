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
        this.color_index = 0;
        this.same_color = false;
        this.style = { opacity: 0.7, weight: (buttons.isMobile() ? 6 : 3) };
        this.buttons = buttons;
        this.focus();
        this.buttons.addHandlersWithTotal(this);
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

    setTraceIndex(i, newI) {
        var tmp = this.traces[i];
        if (i < newI) {
            for (var j=i; j<newI; j++) {
                this.traces[j] = this.traces[j+1];
                this.traces[j].index = j;
            }
            if (i == this.focusOn) this.focusOn = newI;
            else if (this.focusOn > i && this.focusOn <= newI) this.focusOn--;
        } else {
            for (var j=i; j>newI; j--) {
                this.traces[j] = this.traces[j-1];
                this.traces[j].index = j;
            }
            if (i == this.focusOn) this.focusOn = newI;
            else if (this.focusOn < i && this.focusOn >= newI) this.focusOn++;
        }
        this.traces[newI] = tmp;
        this.traces[newI].index = newI;
        for (var j=0; j<this.traces.length; j++) {
            this.buttons.sortable.el.appendChild(this.traces[j].tab);
        }
    }

    /*** DISPLAY ***/

    focus() {
        this.hasFocus = true;
        this.focusOn = -1;
        this.showData();
        this.showElevation();
        this.buttons.focusTabElement(this.tab);
        this.buttons.hideTraceButtons();
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
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(2).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.elevation.innerHTML = '<i class="fas fa-angle-up"></i> ' + this.getElevationGain().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text) +
            ' <i class="fas fa-angle-down"></i> ' + this.getElevationLoss().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text);
        if (this.buttons.speed_units) this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text) + '/' + this.buttons.unit_hours_text;
        else this.buttons.speed.innerHTML = this.msToTimeMin(this.getMovingPace()) + ' ' + this.buttons.unit_minutes_text + '/' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.duration.innerHTML = this.msToTime(this.getMovingTime());
        this.buttons.points.innerHTML = this.getPoints();
        this.buttons.segments.innerHTML = this.getSegments();
        this.buttons.tracks.innerHTML = this.getTracks();
    }

    showElevation() {
        this.buttons.elev.clear();
        this.buttons.elev.options.imperial = !this.buttons.km;
        var points = [];
        for (var i=0; i<this.traces.length; i++) {
            const segments = this.traces[i].getSegments();
            for (var j=0; j<segments.length; j++) points.push(segments[j]._latlngs);
        }
        this.buttons.elev.addData(points);
        this.buttons.elev._removeSliderCircles();
        this.buttons.setElevationProfileWidth();
    }

    getBounds() {
        var bounds = new L.LatLngBounds();
        for (var i=0; i<this.traces.length; i++)
            bounds.extend(this.traces[i].getBounds());
        if (bounds._northEast) bounds._northEast.lat += 0.10 * (bounds._northEast.lat - bounds._southWest.lat);
        if (bounds._southWest) bounds._southWest.lat -= 0.45 * (bounds._northEast.lat - bounds._southWest.lat);
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

    getTracks() {
        var tot = 0;
        for (var i=0; i<this.traces.length; i++)
            tot += this.traces[i].getTracks().length;
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
        for (var i=0; i<this.traces.length; i++) if (this.traces[i].hasTimeData())
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
        var surface = false;

        for (var i=0; i<this.traces.length; i++) {
            const data = this.traces[i].getAverageAdditionalData();
            const duration = this.traces[i].getMovingTime();
            if (data.hr != null) {
                totHr += data.hr * duration;
                cntHr += duration;
            }
            if (data.atemp != null) {
                totTemp += data.atemp * duration;
                cntTemp += duration;
            }
            if (data.cad != null) {
                totCad += data.cad * duration;
                cntCad += duration;
            }
            if (data.power != null) {
                totPower += data.power * duration;
                cntPower += duration;
            }
            if (data.surface) {
                surface = true;
            }
        }

        this.additionalAvgData = {
            hr: cntHr > 0 ? Math.round(totHr/cntHr) : null,
            atemp: cntTemp > 0 ? Math.round((totTemp/cntTemp) * 10) / 10 : null,
            cad: cntCad > 0 ? Math.round(totCad/cntCad) : null,
            power: cntPower > 0 ? Math.round(totPower/cntPower) : null,
            surface: surface
        };
        return this.additionalAvgData;
    }

    /*** OUTPUT ***/

    outputGPX(mergeAll, incl_time, incl_hr, incl_atemp, incl_cad, incl_power, incl_surface, trace_idx) {
        if (mergeAll && incl_time && this.getMovingTime() > 0 && trace_idx === undefined) { // at least one track has time data
            const avg = this.getMovingSpeed(true);
            var lastPoints = null;
            for (var i=0; i<this.traces.length; i++) {
                const points = this.traces[i].getPoints();
                if (points.length == 0) continue;
                if (!this.traces[i].hasTimeData()) { // no time data
                    var startTime = new Date();
                    if (lastPoints) {
                        const a = lastPoints[lastPoints.length-1];
                        const b = points[0];
                        const dist = this.traces[i].gpx._dist2d(a, b);
                        startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                    } else if (i < this.traces.length-1) {
                        var a = points[points.length-1];
                        var b;
                        var dist = this.traces[i].getDistance(true);
                        for (var j=i+1; j<this.traces.length; j++) {
                            const cur_points = this.traces[j].getPoints();
                            if (cur_points.length == 0) continue;
                            b = cur_points[0];
                            dist += this.traces[j].gpx._dist2d(a, b);
                            if (!this.traces[j].hasTimeData()) dist += this.traces[j].getDistance(true);
                            else break;
                            a = cur_points[cur_points.length-1];
                        }
                        startTime = new Date(b.meta.time.getTime() - 1000 * 60 * 60 * dist/(1000 * avg));
                    }
                    this.traces[i].changeTimeData(startTime, avg);
                    this.traces[i].recomputeStats();
                } else if (lastPoints && points[0].meta.time < lastPoints[lastPoints.length-1].meta.time) { // time precedence constraint
                    const a = lastPoints[lastPoints.length-1];
                    const b = points[0];
                    const dist = this.traces[i].gpx._dist2d(a, b);
                    const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist/(1000 * avg));
                    const curAvg = this.traces[i].getMovingSpeed(true);
                    this.traces[i].changeTimeData(startTime, curAvg > 0 ? curAvg : avg);
                    this.traces[i].recomputeStats();
                }
                lastPoints = points;
            }
        }

        const xmlStart1 = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpx_style="http://www.topografix.com/GPX/gpx_style/0/2" version="1.1" creator="`;
        const xmlStart2 = `">
<metadata>
    <name>`;
        const xmlStart3 = `</name>
    <author>
        <name>gpx.studio</name>
        <link href="https://gpx.studio"></link>
    </author>
</metadata>
`;
        const xmlStart4 = `<trk>
    <name>`;
        const xmlStart5 = `</name>
    <type>`+(this.buttons.activity != 'Hiking-Alpine-SAC6' ? 'Cycling' : 'Running')+`</type>
`;
        const styleOutputStart = `    <extensions>
        <gpx_style:line>
    `;
        const styleOutputEnd = `    </gpx_style:line>
    </extensions>
`;

        const xmlEnd1 = `</trk>
`;
        const xmlEnd2 = `</gpx>`;

        const output = [];
        var xmlOutput = '';
        var waypointsOutput = '';
        const waypointsInOutput = [];

        const totalData = this.additionalAvgData;
        for (var i=(trace_idx!==undefined ? trace_idx : 0); i<(trace_idx!==undefined ? trace_idx+1 : this.traces.length); i++) {
            const data = this.traces[i].additionalAvgData;
            const hr = data.hr != null ? data.hr : ((mergeAll && totalData) ? totalData.hr : null);
            const atemp = data.atemp != null ? data.atemp : ((mergeAll && totalData) ? totalData.atemp : null);
            const cad = data.cad != null ? data.cad : ((mergeAll && totalData) ? totalData.cad : null);
            const power = data.power != null ? data.power : ((mergeAll && totalData) ? totalData.power : null);

            const tracks = this.traces[i].getTracks();
            for (var t=0; t<tracks.length; t++) {
                xmlOutput += xmlStart4 + this.encodeString(tracks[t].name ? tracks[t].name : this.traces[i].name) + xmlStart5;

                if (tracks[t].style) {
                    var styleOutput = '';
                    if (tracks[t].style.color) {
                        styleOutput += `    <color>${tracks[t].style.color.substring(1)}</color>
    `;
                    }
                    if (tracks[t].style.opacity) {
                        styleOutput += `    <opacity>${tracks[t].style.opacity}</opacity>
    `;
                    }
                    if (tracks[t].style.weight) {
                        styleOutput += `    <weight>${tracks[t].style.weight}</weight>
    `;
                    }

                    if (styleOutput) {
                        xmlOutput += styleOutputStart + styleOutput + styleOutputEnd;
                    }
                }

                const segments = this.traces[i].getSegments(tracks[t]);
                for (var s=0; s<segments.length; s++) {
                    xmlOutput += `    <trkseg>
`;
                    const points = segments[s]._latlngs;
                    for (var j=0; j<points.length; j++) {
                        const point = points[j];
                        xmlOutput += `    <trkpt lat="${point.lat}" lon="${point.lng}">
    `;
                        if (point.meta) {
                            if (point.meta.hasOwnProperty('ele') && point.meta.ele != null) {
                                xmlOutput += `    <ele>${point.meta.ele.toFixed(1)}</ele>
    `;
                            }
                            if (incl_time && point.meta.time) {
                                xmlOutput += `    <time>${point.meta.time.toISOString()}</time>
    `;
                            }

                            var trackPointExtensionsOutput = '';
                            if (incl_atemp) {
                                if (point.meta.hasOwnProperty('atemp') && point.meta.atemp != null) {
                                    trackPointExtensionsOutput += `    <gpxtpx:atemp>${point.meta.atemp}</gpxtpx:atemp>
    `;
                                } else if (atemp != null) {
                                    trackPointExtensionsOutput += `    <gpxtpx:atemp>${atemp}</gpxtpx:atemp>
    `;
                                }
                            }
                            if (incl_hr) {
                                if (point.meta.hasOwnProperty('hr') && point.meta.hr != null) {
                                    trackPointExtensionsOutput += `    <gpxtpx:hr>${point.meta.hr}</gpxtpx:hr>
    `;
                                } else if (hr != null) {
                                    trackPointExtensionsOutput += `    <gpxtpx:hr>${hr}</gpxtpx:hr>
    `;
                                }
                            }
                            if (incl_cad) {
                                if (point.meta.hasOwnProperty('cad') && point.meta.cad != null) {
                                    trackPointExtensionsOutput += `    <gpxtpx:cad>${point.meta.cad}</gpxtpx:cad>
    `;
                                } else if (cad != null) {
                                    trackPointExtensionsOutput += `    <gpxtpx:cad>${cad}</gpxtpx:cad>
    `;
                                }
                            }
                            if (incl_surface) {
                                if (point.meta.hasOwnProperty('surface') && point.meta.surface != "missing") {
                                    trackPointExtensionsOutput += `    <gpxtpx:Extensions>
            <surface>${point.meta.surface}</surface>
        </gpxtpx:Extensions>
    `;
                                }
                            }

                            var trackPointPowerOutput = '';
                            if (incl_power) {
                                if (point.meta.hasOwnProperty('power') && point.meta.power != null) {
                                    trackPointPowerOutput += `    <power>${point.meta.power}</power>
    `;
                                } else if (power != null) {
                                    trackPointPowerOutput += `    <power>${power}</power>
    `;
                                }
                            }
                            if (trackPointExtensionsOutput.length > 0 || trackPointPowerOutput.length > 0) {
                                xmlOutput += `    <extensions>
        <gpxtpx:TrackPointExtension>
    `;
                                xmlOutput += trackPointExtensionsOutput;
                                xmlOutput += `    </gpxtpx:TrackPointExtension>
    `;
                                xmlOutput += trackPointPowerOutput;
                                xmlOutput += `    </extensions>
    `;
                            }
                        }
                        xmlOutput += `</trkpt>
`;
                    }

                    xmlOutput += `    </trkseg>
`;
                }

                xmlOutput += xmlEnd1;
            }

            const waypoints = this.traces[i].getWaypoints();
            for (var j=0; j<waypoints.length; j++) {
                const point = waypoints[j];

                if (mergeAll) {
                    const same = waypointsInOutput.filter(wpt => wpt._latlng.equals(point._latlng) && wpt.name == point.name && wpt.cmt == point.cmt && wpt.desc == point.desc && wpt.sym == point.sym);
                    if (same.length > 0) continue;
                    else waypointsInOutput.push(point);
                }

                waypointsOutput += `<wpt lat="${point._latlng.lat}" lon="${point._latlng.lng}">
`;
                if (point._latlng.meta.hasOwnProperty('ele')) {
                    waypointsOutput += `    <ele>${point._latlng.meta.ele.toFixed(1)}</ele>
`;
                }
                if (point.name) {
                    waypointsOutput += `    <name>`+this.encodeString(point.name)+`</name>
`;
                }
                if (point.cmt) {
                    waypointsOutput += `    <cmt>`+this.encodeString(point.cmt)+`</cmt>
`;
                }
                if (point.desc) {
                    waypointsOutput += `    <desc>`+this.encodeString(point.desc)+`</desc>
`;
                }
                if (point.sym) {
                    waypointsOutput += `    <sym>${point.sym}</sym>
`;
                }
                waypointsOutput += `</wpt>
`;
            }

            if (!mergeAll || this.traces.length == 1 || trace_idx !== undefined) {
                var creator = this.traces[i].gpx._info.creator || "https://gpx.studio";
                output.push({
                    name: this.traces[i].name + '.gpx',
                    text: (xmlStart1+creator+xmlStart2+this.encodeString(this.traces[i].name)+xmlStart3+waypointsOutput+xmlOutput+xmlEnd2)
                });
                xmlOutput = '';
                waypointsOutput = '';
            }
        }

        if (mergeAll && this.traces.length > 1) {
            var creator = "https://gpx.studio";
            for (var i=0; i<this.traces.length; i++) {
                if (this.traces[i].gpx._info.creator) {
                    creator = this.traces[i].gpx._info.creator;
                    break;
                }
            }
            output.push({
                name: 'track.gpx',
                text: (xmlStart1+creator+xmlStart2+'track'+xmlStart3+waypointsOutput+xmlOutput+xmlEnd2)
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

    getColor() {
        if (this.same_color) return this.style.color;

        const colorCount = {};
        for (var i=0; i<trace_colors.length; i++) {
            colorCount[trace_colors[i]] = 0;
        }

        for (var i=0; i<this.traces.length; i++) {
            const tracks = this.traces[i].getTracks();
            for (var t=0; t<tracks.length; t++) {
                var trackColor = this.traces[i].getTrackStyle(tracks[t]).color;
                if (colorCount.hasOwnProperty(trackColor)) {
                    colorCount[trackColor]++;
                }
            }

            if (tracks.length == 0) {
                if (colorCount.hasOwnProperty(this.traces[i].style.color)) {
                    colorCount[this.traces[i].style.color]++;
                }
            }
        }

        var minCount = Infinity, color = null;
        for (var i=0; i<trace_colors.length; i++) {
            if (colorCount[trace_colors[i]] < minCount) {
                minCount = colorCount[trace_colors[i]];
                color = trace_colors[i];
            }
        }

        return color;
    }
}
