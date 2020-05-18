import Trace from './trace.js';

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
        while (this.traces.length > 0) {
            this.removeTrace(0);
        }
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
    }

    unfocus() {
        this.hasFocus = false;
        this.buttons.showTraceButtons();
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
        for (var i=0; i<this.traces.length; i++) {
            /*if (i > 0) {
                const between = new L.GPX('', {});
                between._latlngs = [
                    traces[i-1].getLayers()[0]._latlngs[traces[i-1].getLayers()[0]._latlngs.length-1],
                    traces[i].getLayers()[0]._latlngs[0]
                ];
                elev.addData(between);
            }*/
            this.traces[i].addElevation();
        }
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

    getMovingSpeed() {
        const time = this.getMovingTime();
        if (time == 0) return 0;
        return this.getDistance() / (time / 3600);
    }

    getMovingPace() {
        return this.getMovingTime() / (this.getDistance() / 1000);
    }

    /*** OUTPUT ***/

    outputGPX() {
        const xmlStart = `<?xml version="1.0" encoding="UTF-8"?>
    <gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="GPX Online Studio">`;
        const xmlEnd = '</gpx>';

        let xmlOutput = xmlStart;
            xmlOutput += `
    <metadata>
        <name>Activity</name>
        <author><name>GPX Online Studio</name></author>
    </metadata>`;

            xmlOutput += `
    <trk>
    <trkseg>
    `;
        for (let i=0; i<this.traces.length; i++) {
            let points = this.traces[i].getPoints();
            for (let j=0; j<points.length; j++) {
                let point = points[j];
                xmlOutput += `<trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">
    `;
                if (point.meta) {
                    if (point.meta.ele) {
                        xmlOutput += `    <ele>${point.meta.ele.toFixed(1)}</ele>
    `;
                    }
                    if (point.meta.time) {
                        xmlOutput += `    <time>${point.meta.time.toISOString()}</time>
    `;
                    }
                }
                xmlOutput += `</trkpt>
    `;
            }
        }

        xmlOutput += `</trkseg>
    </trk>
    ${xmlEnd}`;
        return xmlOutput;
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
