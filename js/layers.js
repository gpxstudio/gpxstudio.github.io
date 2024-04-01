const MAX_ZOOM = 22;

const layers = {
    openStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxNativeZoom: 19,
        maxZoom: MAX_ZOOM
    }),
    cyclOSM: L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxNativeZoom: 17,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    cyclOSMLite: L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm-lite/{z}/{x}/{y}.png', {
        maxNativeZoom: 17,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    openHikingMap: L.tileLayer('https://maps.refuges.info/hiking/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://wiki.openstreetmap.org/wiki/Hiking/mri" target="_blank">sly</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }),
    openTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 17,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.opentopomap.org" target="_blank">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }),
    swisstopo: L.tileLayer('https://wmts20.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    swisstopoSlope: L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hangneigung-ueber_30/default/current/3857/{z}/{x}/{y}.png', {
        maxNativeZoom: 17,
        maxZoom: MAX_ZOOM,
        opacity: 0.4,
        attribution: '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    swisstopoCycling: L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.astra.veloland/default/current/3857/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    swisstopoMountainBike: L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.astra.mountainbikeland/default/current/3857/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    ignPlanV2: L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: "IGN-F/Géoportail"
    }),
    ignFrScan25: L.tileLayer('https://wxs.ign.fr/ifj1o8jmglxpfn6p1tn4b3g1/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&FORMAT=image/jpeg&STYLE=normal', {
        maxNativeZoom: 16,
        maxZoom: MAX_ZOOM,
        attribution: "IGN-F/Géoportail"
    }),
    ignSatellite: L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
        maxNativeZoom: 19,
        maxZoom: MAX_ZOOM,
        attribution: "IGN-F/Géoportail"
    }),
    ignFrCadastre: L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&LAYER=CADASTRALPARCELS.PARCELS&FORMAT=image/png&STYLE=normal', {
        maxNativeZoom: 20,
        maxZoom: MAX_ZOOM,
        opacity: 0.5,
        attribution: "IGN-F/Géoportail"
    }),
    ignSlope: L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&TileMatrixSet=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&Layer=GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN&FORMAT=image/png&Style=normal', {
        maxNativeZoom: 17,
        maxZoom: MAX_ZOOM,
        opacity: 0.4,
        attribution: "IGN-F/Géoportail"
    }),
    ignEs: L.tileLayer('https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}', {
        maxNativeZoom: 20,
        maxZoom: MAX_ZOOM,
        attribution: "IGN-F/Géoportail"
    }),
    ordnanceSurvey: L.tileLayer('https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=piCT8WysfuC3xLSUW7sGLfrAAJoYDvQz', {
        maxNativeZoom: 20,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="http://www.ordnancesurvey.co.uk/" target="_blank">Ordnance Survey</a>'
    }),
    norwayTopo: L.tileLayer('https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}', {
        maxNativeZoom: 20,
        maxZoom: MAX_ZOOM,
        subdomains: ['opencache', 'opencache2', 'opencache3'],
        attribution: '&copy; <a href="https://www.geonorge.no/" target="_blank">Geonorge</a>'
    }),
    swedenTopo: L.tileLayer('https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/1d54dd14-a28c-38a9-b6f3-b4ebfcc3c204/1.0.0/topowebb/default/3857/{z}/{y}/{x}.png', {
        maxNativeZoom: 14,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.lantmateriet.se" target="_blank">Lantmäteriet</a>'
    }),
    finlandTopo: L.tileLayer('https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts?layer=maastokartta&amp;style=default&tilematrixset=WGS84_Pseudo-Mercator&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}&api-key=30cb768c-c968-493c-ae24-2b0b974ebd29', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.maanmittauslaitos.fi/" target="_blank">Maanmittauslaitos</a>'
    }),
    bgMountains: L.tileLayer('https://bgmtile.kade.si/{z}/{x}/{y}.png', {
        maxNativeZoom: 19,
        maxZoom: MAX_ZOOM,
        attribution: '<a href="http://mountain.bajhui.org/trac/wiki/BGMountains%20%D0%BB%D0%B5%D0%B3%D0%B5%D0%BD%D0%B4%D0%B0" target="_blank">BGM Legend</a> / <a href="https://cart.uni-plovdiv.net/" target="_blank">CART Lab</a>, <a href="http://www.bgmountains.org/" target="_blank">BGM team</a>, © <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC BY-SA 4.0</a>, <a href="http://bgmountains.org/en/maps/garmin-maps/category/9-bgmountains/" target="_blank">Garmin version</a>'
    }),
    usgs: L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}?blankTile=false', {
        maxNativeZoom: 16,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="usgs.gov" target="_blank">USGS</a>'
    }),
    linz: L.mapboxGL({
        attribution: '&copy; <a href="//www.linz.govt.nz/data/linz-data/linz-basemaps/data-attribution" target="_blank">LINZ</a>',
        maxZoom: MAX_ZOOM,
        style: 'https://basemaps.linz.govt.nz/v1/tiles/topographic/EPSG:3857/style/topographic.json?api=d01fbtg0ar23gctac5m0jgyy2ds',
        interactive: true,
        minZoom: 1,
        dragRotate: false,
        touchZoomRotate: false,
        boxZoom: false,
        dragPan: false,
        touchPitch: false,
        doubleClickZoom: false,
        scrollZoom: false,
        boxZoom: false
    }),
    linzTopo: L.tileLayer('https://tiles-cdn.koordinates.com/services;key=39a8b989633a4bef98bc0e065380454a/tiles/v4/layer=50767/EPSG:3857/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="//www.linz.govt.nz/data/linz-data/linz-basemaps/data-attribution" target="_blank">LINZ</a>'
    }),
    waymarkedTrailsHiking: L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsCycling: L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsMTB: L.tileLayer('https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsSkating: L.tileLayer('https://tile.waymarkedtrails.org/skating/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsHorseRiding: L.tileLayer('https://tile.waymarkedtrails.org/riding/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsWinter: L.tileLayer('https://tile.waymarkedtrails.org/slopes/{z}/{x}/{y}.png', {
        maxNativeZoom: 18,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    stravaHeatmapAll: L.tileLayer('', {
        maxNativeZoom: 14,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapRide: L.tileLayer('', {
        maxNativeZoom: 14,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapRun: L.tileLayer('', {
        maxNativeZoom: 14,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapWater: L.tileLayer('', {
        maxNativeZoom: 14,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapWinter: L.tileLayer('', {
        maxNativeZoom: 14,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    })
};

const overPassMinZoomOptions = {
    position: 'topright',
    minZoomMessage: 'Zoom in to refresh POI'
};
const overPassAttribution = '&copy; <a href="https://www.overpass-api.de" target="_blank">Overpass API</a>';
const onSuccess = function (data) {
    for (let i = 0; i < data.elements.length; i++) {
        let pos;
        let marker;
        const e = data.elements[i];

        if (e.id in this._ids) {
            continue;
        }

        this._ids[e.id] = true;

        if (e.type === 'node') {
            pos = L.latLng(e.lat, e.lon);
        } else {
            pos = L.latLng(e.center.lat, e.center.lon);
        }

        if (this.options.markerIcon) {
            marker = L.marker(pos, { icon: this.options.markerIcon });
        } else {
            marker = L.circle(pos, 20, {
                stroke: false,
                fillColor: '#E54041',
                fillOpacity: 0.9
            });
        }

        const popupContent = this._getPoiPopupHTML(e.tags, e.id);

        var link = popupContent.getElementsByTagName('a')[0];
        link.target = "_blank";

        var extra = document.createElement("div");
        extra.classList.add('popup-content');

        var button = document.createElement("div");
        button.classList.add('panels', 'custom-button', 'normal-button');
        button.innerText = document.getElementById("add-poi-text").innerText;

        extra.append(button);
        popupContent.append(extra);

        const _this = this;
        const buttons = this.buttons;
        button.addEventListener('click', function () {
            if (buttons.total.focusOn >= 0) {
                var cmt = '';
                var first = true;
                for (const [key, value] of Object.entries(e.tags)) {
                    if (first) first = false;
                    else cmt += ', ';
                    cmt += `${key}: ${value}`;
                }
                buttons.clone_wpt = {
                    sym: _this.options.sym,
                    name: _this.options.type,
                    cmt: cmt,
                    desc: '',
                }

                const trace = buttons.total.traces[buttons.total.focusOn];
                trace.addWaypoint(pos);
            }
        });

        const popup = L.popup().setContent(popupContent);
        marker.bindPopup(popup);

        this._markers.addLayer(marker);
    }
};

let pointsOfInterestLayers = {}, pointsOfInterestLayerSelection = {};
for (var category in pointsOfInterest) {
    pointsOfInterestLayers[category] = {};
    pointsOfInterestLayerSelection[category] = {};
    for (var poi of pointsOfInterest[category]) {
        pointsOfInterestLayers[category][poi.name] = new L.OverPassLayer({
            debug: false,
            minZoom: 14,
            endPoint: "https://overpass.kumi.systems/api/",
            query: "node({{bbox}})" + poi.query + ";out;",
            markerIcon: L.icon.glyph({
                iconUrl: '/res/poi.png',
                prefix: "fas",
                glyph: poi.glyph,
            }),
            minZoomIndicatorOptions: overPassMinZoomOptions,
            attribution: overPassAttribution,
            type: poi.name,
            sym: poi.sym,
            onSuccess: onSuccess,
        });
        pointsOfInterestLayerSelection[category][poi.name] = true;
        layers["poi" + poi.query] = pointsOfInterestLayers[category][poi.name];
    }
}
