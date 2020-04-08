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
        left:30
    }
});
elev.addTo(map);

// HTML ELEMENTS

const input = document.getElementById("input-file");
const load_button = document.getElementById("load");
const clear_button = document.getElementById("clear");
const donate_button = document.getElementById("donate");
const delete_button = document.getElementById("delete");
const validate_button = document.getElementById("validate");
const unvalidate_button = document.getElementById("unvalidate");
const data_distance = document.getElementById("distance-val");
const data_elevation = document.getElementById("elevation-val");
const data_duration = document.getElementById("duration-val");
const data_speed = document.getElementById("speed-val");
const elevation_profile = document.getElementsByClassName('elevation')[0];
const trace_info_grid = document.getElementById('info-grid');
const start_slider = document.getElementById('start-point');
const end_slider = document.getElementById('end-point');

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

function load_file(file) {
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
        var map_bounds = map.getBounds();
        var trace_bounds = e.target.getBounds();

        if (!map_bounds.contains(trace_bounds)) {
            if (traces.length == 0) {
                map.fitBounds(trace_bounds);
            } else {
                map_bounds.extend(trace_bounds);
                map.fitBounds(map_bounds);
            }
        }

        traces.push(e.target);
        trace_info_grid.style.visibility = "visible";
        if (end_slider.classList.contains('hidden')) {
            end_slider.classList.remove('hidden');
            end_slider.classList.add('visible');
        }
    }).on('click', function(e) {
        const trace = e.target;
        const index = traces.indexOf(trace);
        update_focus(index);
    }).addTo(map);
}

function trace_get_points(trace) {
    return trace.getLayers()[0]._latlngs;
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
            lose_focus(index);
        } else if (focus_on > index) {
            focus_on--;
        }
        traces.splice(index, 1);
        trace.clearLayers();
    }
    if (traces.length == 0) {
        trace_info_grid.style.visibility = "hidden";
        end_slider.classList.remove('visible');
        end_slider.classList.add('hidden');
    }
}

function lose_focus(index) {
    traces[index].setStyle(normal_style);
    focus_on = -1;
    data_distance.innerHTML = "- km";
    data_elevation.innerHTML = "- m";
    data_speed.innerHTML = "- km/h";
    data_duration.innerHTML = "- h -";
    elev.clear();
    reset_slider();
}

function update_data() {
    traces[focus_on].setStyle(focus_style);
    data_distance.innerHTML = (traces[focus_on].get_distance() / 1000).toFixed(1).toString() + ' km';
    data_elevation.innerHTML = traces[focus_on].get_elevation_gain().toFixed(0).toString() + ' m';
    data_speed.innerHTML = traces[focus_on].get_moving_speed().toFixed(1).toString() + ' km/h';
    data_duration.innerHTML = msToTime(traces[focus_on].get_moving_time());
    elev.clear();
    elev.addData(traces[focus_on].getLayers()[0]);
}

function update_focus(index) {
    if (focus_on == index) {
        lose_focus(index);
        return;
    } else if (focus_on != -1) {
        lose_focus(focus_on);
    }
    focus_on = index;
    update_data();
    reset_slider();
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h" + minutes;
}

function total_distance() {
    var tot = 0;
    for (var trace in traces) {
        tot += trace._info.length;
    }
    return tot;
}

function total_elevation() {
    var tot = 0;
    for (var trace in traces) {
        tot += trace._info.elevation.gain;
    }
    return tot;
}

function total_moving_time() {
    var tot = 0;
    for (var trace in traces) {
        tot += trace._info.duration.moving;
    }
    return tot;
}

function total_moving_speed() {
    return total_distance() / (total_moving_time() / (3600 * 1000));
}

function total_moving_pace() {
    return total_moving_time() / (total_distance() / 1000);
}

// USER INTERACTION

input.oninput = function() { load_files(this.files) };
load_button.addEventListener("click", open_input_dialog);
clear_button.addEventListener("click", clear_traces);
donate_button.addEventListener("click", donate);
delete_button.addEventListener("click", function () {
    if (focus_on != -1) remove_trace(traces[focus_on]);
});
validate_button.addEventListener("click", function () {
    // cut
    reset_slider();
});
unvalidate_button.addEventListener("click", function () {
    reset_slider();
});

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
        hide_buttons();
    } else {
        show_buttons();
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
        hide_buttons();
    } else {
        show_buttons();
    }
});

function reset_slider() {
    start_slider.value = start_slider.min;
    end_slider.value = end_slider.max;
    hide_buttons();
}

function open_input_dialog() {
    input.click();
}

function load_files(files) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = (function(f) {
            return function(e) {
                load_file(e.target.result)
            };
        })(file);
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

load_file('test.gpx');
