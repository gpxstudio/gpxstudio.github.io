import Buttons from './buttons.js';
import Total from './total.js';

const buttons = new Buttons();
const total =  new Total(buttons);

function get_path() {
    const Http = new XMLHttpRequest();
    const url = "https://api.mapbox.com/directions/v5/mapbox/cycling/13.43,52.51;13.42,52.5;13.41,52.5?geometries=geojson&access_token=pk.eyJ1IjoidmNvcHBlIiwiYSI6ImNrOGhkY3g0ZDAxajczZWxnNW1jc3Q3dWIifQ.tCrnYH85RYxUzvKugY2khw";
    Http.open("GET", url);
    Http.send();

    Http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var ans = JSON.parse(this.responseText);
            console.log(ans['routes'][0]['geometry']['coordinates']);
        }
    }
}

// USER INTERACTION

/*map.addEventListener("zoomend", update_edit_markers);
//map.addEventListener("movestart", update_edit_markers);

edit_button.addEventListener("click", function() {
    if (edit_mode) {
        edit_mode = false;
        const trace = traces[focus_on];
        for (var i=0; i<trace._editMarkers.length; i++)
            trace._editMarkers[i].remove();
        trace._editMarkers = [];
    } else {
        edit_mode = true;
        update_edit_markers();
        hide_trace_buttons();
        elev._removeSliderCircles();
    }
});*/

/*map.on('mouseup',function(e){
    map.dragging.enable();
    map.removeEventListener('mousemove');
    if (map._draggedMarker) {
        const trace = traces[focus_on];
        const marker = map._draggedMarker;
        console.log(e.latlng, marker._index);
        trace_update_point(marker._index, e.latlng.lat, e.latlng.lng);
        for (var i=0; i<trace._editMarkers.length; i++)
            trace._editMarkers[i].bringToFront();
    }
    map._draggedMarker = null;
})

function new_edit_marker(points, i) {
    const marker = L.circleMarker([points[i].lat, points[i].lng], {
        className: 'edit-marker',
        radius: 4
    }).addTo(map);
    marker._index = i;
    marker.on({
        mousedown: function () {
            map.dragging.disable();
            map.on('mousemove', function (e) {
                marker.setLatLng(e.latlng);
            });
            map._draggedMarker = marker;
        }
    });
    return marker;
}

function update_edit_markers() {
    if (edit_mode) {
        const trace = traces[focus_on];
        if (trace._editMarkers) {
            for (var i=0; i<trace._editMarkers.length; i++)
                trace._editMarkers[i].remove();
        }
        trace._editMarkers = [];
        const points = trace_get_points(trace);
        var last = false;
        for (var i=0; i<points.length; i += Math.ceil(Math.pow(2,19-map.getZoom()))) {
            trace._editMarkers.push(new_edit_marker(points, i));
            if (i == points.length-1) last = true;
        }
        if (!last) {
            trace._editMarkers.push(new_edit_marker(points, points.length-1));
        }
    }
}*/

total.addTrace('4.gpx', '4.gpx');
total.addTrace('5.gpx', '5.gpx');

//get_path();
