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

total.addTrace('4.gpx', '4.gpx');
total.addTrace('5.gpx', '5.gpx');

//get_path();
