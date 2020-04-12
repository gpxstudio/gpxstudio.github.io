// MAIN MAP DISPLAY

var map = L.map('mapid', {
    zoomControl: false
}).setView([50.772, 3.890], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoidmNvcHBlIiwiYSI6ImNrOGhkY3g0ZDAxajczZWxnNW1jc3Q3dWIifQ.tCrnYH85RYxUzvKugY2khw'
}).addTo(map);

L.control.zoom({
    position: 'topright'
}).addTo(map);

var elev = L.control.elevation({
    theme: "steelblue-theme",
    useHeightIndicator: true,
    width: 400,
	height: 100,
    margins:{
        top:20,
        right:30,
        bottom:18,
        left:40
    }
});
elev.addTo(map);

// HTML ELEMENTS

const input = document.getElementById("input-file");
const load_button = document.getElementById("load");
const clear_button = document.getElementById("clear");
const donate_button = document.getElementById("donate");
const delete_button = document.getElementById("delete");
const reverse_button = document.getElementById("reverse");
const validate_button = document.getElementById("validate");
const unvalidate_button = document.getElementById("unvalidate");
const export_button = document.getElementById("export");
const data_distance = document.getElementById("distance-val");
const data_elevation = document.getElementById("elevation-val");
const data_duration = document.getElementById("duration-val");
const data_speed = document.getElementById("speed-val");
const elevation_profile = document.getElementsByClassName('elevation')[0];
const trace_info_grid = document.getElementById('info-grid');
const start_slider = document.getElementById('start-point');
const end_slider = document.getElementById('end-point');
const tabs = document.getElementById('sortable');
const total_tab = document.getElementById('total-tab');

// OVERLAY COMPONENTS

var toolbar = L.control({position: 'topleft'});
toolbar.onAdd = function (map) {
    var div = document.getElementById('toolbar');
    L.DomEvent.disableClickPropagation(div);
    return div;
};
toolbar.addTo(map);

var trace_info = L.control({position: 'bottomleft'});
trace_info.onAdd = function (map) {
    var div = document.getElementById('info');
    L.DomEvent.disableClickPropagation(div);
    return div;
};
trace_info.addTo(map);

trace_info_grid.appendChild(elevation_profile);

end_slider.classList.add('hidden');

// GLOBAL LOGIC VARIABLES

var traces = [];
var bounds = map.getBounds();
var focus_on = -1;

// STYLE CONSTS

const normal_style = { color: '#FF4040', weight: 3 };
const focus_style = { color: 'red', weight: 5 };

// HELPER FUNCTIONS

function load_file(file, should_update_bounds, name) {
    new L.GPX(file, {
        async: true,
        polyline_options: normal_style,
        marker_options: {
            startIconUrl: '',
            endIconUrl: '',
            shadowUrl: '',
            wptIconUrls : { '': '' }
        }
    }).on('loaded', function(e) {
        traces.push(e.target);
        trace_info_grid.style.visibility = "visible";
        if (end_slider.classList.contains('hidden')) {
            end_slider.classList.remove('hidden');
            end_slider.classList.add('visible');
        }
        if (should_update_bounds)
            update_bounds();
        if (focus_on == -1)
            lose_focus(focus_on, true);
        var ul = document.getElementById("sortable");
        var li = document.createElement("li");
        li.innerHTML = name;
        li.classList.add('tab');
        li.addEventListener('click', focus_tab);
        li._trace = e.target;
        ul.appendChild(li);
        update_tab_width();
        e.target._tab = li;
        if (elev._startCircle) {
            elev._startCircle.bringToFront();
            elev._endCircle.bringToFront();
        }
    }).on('click', function(e) {
        const trace = e.target;
        const index = traces.indexOf(trace);
        update_focus(index);
        if (focus_on == index) focus_tab_element(trace._tab);
        else focus_tab_element(total_tab);
    }).addTo(map);
}

function update_bounds() {
    var trace_bounds = new L.LatLngBounds();
    for (var i=0; i<traces.length; i++)
        trace_bounds.extend(traces[i].getLayers()[0]._bounds);
    trace_bounds._northEast.lat += 0.1 * (trace_bounds._northEast.lat - trace_bounds._southWest.lat);
    trace_bounds._southWest.lat -= 0.45 * (trace_bounds._northEast.lat - trace_bounds._southWest.lat);
    map.fitBounds(trace_bounds);
}

function trace_get_points(trace) {
    return trace.getLayers()[0]._latlngs;
}

function trace_recompute_stats(trace) {
    // reset
    trace._info.length = 0.0;
    trace._info.elevation.gain = 0.0;
    trace._info.elevation.loss = 0.0;
    trace._info.elevation.max = 0.0;
    trace._info.elevation.min = Infinity;
    trace._info.duration.start = null;
    trace._info.duration.end = null;
    trace._info.duration.moving = 0;
    trace._info.duration.total = 0;

    // recompute on remaining data
    var ll = null, last = null;
    const points = trace_get_points(trace);
    for (var i=0; i<points.length; i++) {
        ll = points[i];
        if (ll.meta.ele > trace._info.elevation.max) {
            trace._info.elevation.max = ll.meta.ele;
        }

        if (ll.meta.ele < trace._info.elevation.min) {
            trace._info.elevation.min = ll.meta.ele;
        }

        trace._info.duration.end = ll.meta.time;

        if (last != null) {
            trace._info.length += trace._dist3d(last, ll);

            var t = ll.meta.ele - last.meta.ele;
            if (t > 0) {
              trace._info.elevation.gain += t;
            } else {
              trace._info.elevation.loss += Math.abs(t);
            }

            t = Math.abs(ll.meta.time - last.meta.time);
            trace._info.duration.total += t;
            if (t < trace.options.max_point_interval) {
              trace._info.duration.moving += t;
            }
        } else if (trace._info.duration.start == null) {
            trace._info.duration.start = ll.meta.time;
        }

        last = ll;
    }
}

function trace_update_point(index, lat, lng) {
    const Http = new XMLHttpRequest();
    const url = 'https://elevation-api.io/api/elevation?points=(' + lat + ',' + lng + ')&key=w2-Otn-4S7sAahUs-Ubd7o7f0P4Fms';
    Http.open("GET", url);
    Http.send();

    const trace = traces[focus_on];
    var points = trace_get_points(trace);

    var a = points[index].clone();
    var b = points[index].clone();
    var c = points[index].clone();

    if (index > 0) {
        a = points[index-1].clone();
        a.meta = {"ele" : trace.get_elevation_data()[index-1][1]};
    } else a.meta = {"ele" : trace.get_elevation_data()[index][1]};
    b.meta = {"ele" : trace.get_elevation_data()[index][1]};
    if (index < points.length-1) {
        c = points[index+1].clone();
        c.meta = {"ele" : trace.get_elevation_data()[index+1][1]};
    } else a.meta = {"ele" : trace.get_elevation_data()[index][1]};

    Http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var ans = JSON.parse(this.responseText);
            const ele = ans["elevations"][0]["elevation"];

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
    trace.remove();
    trace.addTo(map);
}

function remove_trace(trace) {
    const index = traces.indexOf(trace);
    if (index > -1) {
        if (focus_on == index) {
            lose_focus(index, true);
            focus_tab_element(total_tab);
        } else if (focus_on > index) {
            focus_on--;
        }
        traces.splice(index, 1);
        tabs.removeChild(trace._tab);
        trace.clearLayers();
    }
    if (focus_on == -1) {
        lose_focus(focus_on, true);
    }
}

function lose_focus(index, total) {
    if (index != -1) traces[index].setStyle(normal_style);
    focus_on = -1;
    if (total) {
        start_slider.style.display = 'none';
        end_slider.style.display = 'none';
        data_distance.innerHTML = (total_distance() / 1000).toFixed(1).toString() + ' km';
        data_elevation.innerHTML = total_elevation().toFixed(0).toString() + ' m';
        data_speed.innerHTML = total_moving_speed().toFixed(1).toString() + ' km/h';
        data_duration.innerHTML = msToTime(total_moving_time());
        elev.clear();
        for (var i=0; i<traces.length; i++) {
            if (i > 0) {
                const between = new L.GPX('', {});
                between._latlngs = [
                    traces[i-1].getLayers()[0]._latlngs[traces[i-1].getLayers()[0]._latlngs.length-1],
                    traces[i].getLayers()[0]._latlngs[0]
                ];
                elev.addData(between);
            }
            elev.addData(traces[i].getLayers()[0]);
        }
        elev._removeSliderCircles();
    }
    reset_slider();
}

function update_data() {
    traces[focus_on].setStyle(focus_style);
    data_distance.innerHTML = (traces[focus_on].get_distance() / 1000).toFixed(1).toString() + ' km';
    data_elevation.innerHTML = traces[focus_on].get_elevation_gain().toFixed(0).toString() + ' m';
    data_speed.innerHTML = traces[focus_on].get_moving_speed().toFixed(1).toString() + ' km/h';
    data_duration.innerHTML = msToTime(traces[focus_on].get_moving_time());
    start_slider.style.display = 'block';
    end_slider.style.display = 'block';
    elev.clear();
    elev.addData(traces[focus_on].getLayers()[0]);
}

function update_focus(index) {
    if (focus_on == index) {
        lose_focus(index, true);
        return;
    } else if (focus_on != -1) {
        lose_focus(focus_on, false);
    }
    focus_on = index;
    update_data();
    reset_slider();
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor(duration / (1000 * 60 * 60));

  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h" + minutes;
}

function total_distance() {
    var tot = 0;
    for (var i=0; i<traces.length; i++) {
        tot += traces[i]._info.length;
    }
    return tot;
}

function total_elevation() {
    var tot = 0;
    for (var i=0; i<traces.length; i++) {
        tot += traces[i]._info.elevation.gain;
    }
    return tot;
}

function total_moving_time() {
    var tot = 0;
    for (var i=0; i<traces.length; i++) {
        tot += traces[i]._info.duration.moving;
    }
    return tot;
}

function total_moving_speed() {
    const time = total_moving_time();
    if (time == 0) return 0;
    return total_distance() / (time / 3600);
}

function total_moving_pace() {
    return total_moving_time() / (total_distance() / 1000);
}

function get_index_for_slider_val(val) {
    return elev._findItemForX(parseInt(val)/start_slider.max * elev._width());
}

function merged_gpx() {
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
    for (let i=0; i<traces.length; i++) {
        let points = trace_get_points(traces[i]);
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

// USER INTERACTION

total_tab.addEventListener('click', focus_tab);
input.oninput = function() { load_files(this.files) };
load_button.addEventListener("click", open_input_dialog);
clear_button.addEventListener("click", clear_traces);
donate_button.addEventListener("click", donate);
export_button.addEventListener("click", function () {
    if (traces.length > 0)
        download('track.gpx',merged_gpx());
});
delete_button.addEventListener("click", function () {
    if (focus_on != -1) remove_trace(traces[focus_on]);
});
validate_button.addEventListener("click", function () {
    if (focus_on == -1) return;

    let start = get_index_for_slider_val(start_slider.value);
    let end = get_index_for_slider_val(end_slider.value);

    const trace = traces[focus_on];
    const points = trace_get_points(trace);
    const length = points.length;

    // store this to revert action
    const deleted_end = points.splice(end);
    const deleted_start = points.splice(0, start);

    trace_recompute_stats(trace);

    trace.remove();
    trace.addTo(map);

    update_data();
    reset_slider();
});
unvalidate_button.addEventListener("click", function () {
    reset_slider();
});
$( ".sortable" ).on( "sortupdate", function( event, ui ) {
    const order = tabs.childNodes;
    const offset = 3;
    for (var i=offset; i<order.length; i++) {
        const j = traces.indexOf(order[i]._trace);
        var tmp = traces[i-offset];
        traces[i-offset] = order[i]._trace;
        traces[j] = tmp;
        if (j == focus_on) focus_on = i-offset;
    }
    if (focus_on == -1) lose_focus(-1, true);
});

function focus_tab(e) {
    focus_tab_element(e.target);
    var focus = -1;
    for (var i=0; i<traces.length; i++) {
        if (e.target == traces[i]._tab) {
            focus = i;
            break;
        }
    }
    if (focus == -1) lose_focus(focus_on, true);
    else update_focus(focus);
}

function focus_tab_element(tab) {
    document.querySelectorAll('.tab').forEach(item => {item.classList.remove('tab-focus');});
    tab.classList.add('tab-focus');
}

function hide_buttons() {
    validate_button.style.opacity = 0;
    unvalidate_button.style.opacity = 0;
    validate_button.style.visibility = "hidden";
    unvalidate_button.style.visibility = "hidden";
}

function show_buttons() {
    validate_button.style.opacity = 1;
    unvalidate_button.style.opacity = 1;
    validate_button.style.visibility = "visible";
    unvalidate_button.style.visibility = "visible";
}

start_slider.addEventListener("input", function () {
    let start = parseInt(start_slider.value);
    let end = parseInt(end_slider.value);
    if (start > end) {
        start_slider.value = end;
        start = end;
    }
    if (start == start_slider.min && end == end_slider.max) {
        reset_slider();
    } else if (focus_on != -1) {
        show_buttons();
        elev._drawRectangle(
            start/start_slider.max,
            end/end_slider.max,
            get_index_for_slider_val(start),
            get_index_for_slider_val(end)
        );
    }
});

end_slider.addEventListener("input", function () {
    let start = parseInt(start_slider.value);
    let end = parseInt(end_slider.value);
    if (start > end) {
        end_slider.value = start;
        end = start;
    }
    if (start == start_slider.min && end == end_slider.max) {
        reset_slider();
    } else if (focus_on != -1) {
        show_buttons();
        elev._drawRectangle(
            start/start_slider.max,
            end/end_slider.max,
            get_index_for_slider_val(start),
            get_index_for_slider_val(end)
        );
    }
});

function reset_slider() {
    start_slider.value = start_slider.min;
    end_slider.value = end_slider.max;
    elev._resetDrag();
    hide_buttons();
}

function update_tab_width() {
    const offset = 3;
    const remaining_width = trace_info_grid.offsetWidth - total_tab.offsetWidth;
    var tabs_width = 0;
    for (var i=offset; i<tabs.childNodes.length; i++) {
        tabs_width += tabs.childNodes[i].offsetWidth;
    }
    if (tabs_width > remaining_width) {
        const avg_tab_width = tabs_width / (tabs.childNodes.length - offset);
        var cnt = 0;
        var to_divide = remaining_width;
        for (var i=offset; i<tabs.childNodes.length; i++) {
            if (tabs.childNodes[i].offsetWidth > avg_tab_width) cnt++;
            else to_divide -= tabs.childNodes[i].offsetWidth;
        }
        const new_tab_width = to_divide / cnt - 2 * parseFloat(window.getComputedStyle(total_tab, null).getPropertyValue('padding-left'));
        for (var i=offset; i<tabs.childNodes.length; i++) {
            if (tabs.childNodes[i].offsetWidth > avg_tab_width) {
                tabs.childNodes[i].style.width = new_tab_width + 'px';
            }
        }
    }
}

function open_input_dialog() {
    input.click();
}

function load_files(files) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = (function(f, update, name) {
            return function(e) {
                load_file(e.target.result, update, name)
            };
        })(file, i == files.length-1, file.name);
        reader.readAsDataURL(file);
    }
    input.value = "";
}

function clear_traces() {
    while (traces.length > 0) {
        remove_trace(traces[0]);
    }
}

function donate() {
    window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TCK9RME3XUV9N&source=url');
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

load_file('4.gpx', false, '4.gpx');
load_file('5.gpx', true, '5.gpx');
