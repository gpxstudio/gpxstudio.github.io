const layers = {
    openStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 20,
        maxNativeZoom: 19
    }),
    cyclOSM: L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    openHikingMap: L.tileLayer('https://maps.refuges.info/hiking/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://wiki.openstreetmap.org/wiki/Hiking/mri" target="_blank">sly</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }),
    openTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 17,
        attribution: '&copy; <a href="https://www.opentopomap.org" target="_blank">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }),
    swisstopo: L.tileLayer('https://wmts20.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution : '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    swisstopoSlope: L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hangneigung-ueber_30/default/current/3857/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 17,
        opacity: 0.4,
        attribution : '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    swisstopoCycling: L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.astra.veloland/default/current/3857/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution : '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    swisstopoMountainBike: L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.astra.mountainbikeland/default/current/3857/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution : '&copy; <a href="https://www.swisstopo.admin.ch" target="_blank">swisstopo</a>'
    }),
    et4: L.tileLayer('http://ec{s}.cdn.ecmaps.de/WmsGateway.ashx.jpg?Experience=demo-dahoam&MapStyle=KOMPASS&TileX={x}&TileY={y}&ZoomLevel={z}', {
        maxZoom: 20,
        maxNativeZoom: 15,
        subdomains: '0123',
        attribution: '<a href="http://hubermedia.de/et4-maps/" target="_blank">eT4&reg; MAPS</a> &copy; <a href="http://www.kompass.de" target="_blank">KOMPASS Karten GmbH</a> <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }),
    ignFrScan25: L.tileLayer('https://wxs.ign.fr/csxlabhak328gg7s096cu55r/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&FORMAT=image/jpeg&STYLE=normal', {
        maxZoom: 20,
        maxNativeZoom: 16,
        attribution : "IGN-F/Géoportail"
    }),
    ignFrCadastre: L.tileLayer('https://wxs.ign.fr/parcellaire/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&LAYER=CADASTRALPARCELS.PARCELS&FORMAT=image/png&STYLE=normal', {
        maxZoom: 20,
        opacity: 0.5,
        attribution : "IGN-F/Géoportail"
    }),
    ignEs: L.tileLayer('https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}', {
        maxZoom: 20,
        attribution : "IGN-F/Géoportail"
    }),
    ignSlope: L.tileLayer('https://wxs.ign.fr/altimetrie/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TileMatrixSet=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&Layer=GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN&FORMAT=image/png&Style=normal', {
        maxZoom: 20,
        maxNativeZoom: 17,
        opacity: 0.4,
        attribution : "IGN-F/Géoportail"
    }),
    ordnanceSurvey: L.tileLayer('https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=piCT8WysfuC3xLSUW7sGLfrAAJoYDvQz', {
        maxZoom: 20,
        attribution: '&copy; <a href="http://www.ordnancesurvey.co.uk/" target="_blank">Ordnance Survey</a>'
    }),
    norwayTopo: L.tileLayer('https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}', {
        maxZoom: 20,
        subdomains: ['opencache', 'opencache2', 'opencache3'],
        attribution: '&copy; <a href="https://www.geonorge.no/" target="_blank">Geonorge</a>'
    }),
    swedenTopo: L.tileLayer('https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/1d54dd14-a28c-38a9-b6f3-b4ebfcc3c204/1.0.0/topowebb/default/3857/{z}/{y}/{x}.png', {
        maxZoom: 20,
        maxNativeZoom: 14,
        attribution: '&copy; <a href="https://www.lantmateriet.se" target="_blank">Lantmäteriet</a>'
    }),
    finlandTopo: L.tileLayer('https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts?layer=maastokartta&amp;style=default&tilematrixset=WGS84_Pseudo-Mercator&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}&api-key=30cb768c-c968-493c-ae24-2b0b974ebd29', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.maanmittauslaitos.fi/" target="_blank">Maanmittauslaitos</a>'
    }),
    usgs: L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}?blankTile=false', {
        maxNativeZoom: 16,
        maxZoom: 20,
        attribution: '&copy; <a href="usgs.gov" target="_blank">USGS</a>'
    }),
    linz: L.mapboxGL({
        attribution: '&copy; <a href="//www.linz.govt.nz/data/linz-data/linz-basemaps/data-attribution" target="_blank">LINZ</a>',
        maxZoom: 20,
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
    waymarkedTrailsHiking: L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsCycling: L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsMTB: L.tileLayer('https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsSkating: L.tileLayer('https://tile.waymarkedtrails.org/skating/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsHorseRiding: L.tileLayer('https://tile.waymarkedtrails.org/riding/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    waymarkedTrailsWinter: L.tileLayer('https://tile.waymarkedtrails.org/slopes/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.waymarkedtrails.org" target="_blank">Waymarked Trails</a>'
    }),
    stravaHeatmapRide: L.tileLayer('', {
        maxZoom: 20,
        maxNativeZoom: 14,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapRun: L.tileLayer('', {
        maxZoom: 20,
        maxNativeZoom: 14,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapWater: L.tileLayer('', {
        maxZoom: 20,
        maxNativeZoom: 14,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    }),
    stravaHeatmapWinter: L.tileLayer('', {
        maxZoom: 20,
        maxNativeZoom: 14,
        attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
    })
};

const overPassMinZoomOptions =  {
        position: 'topright',
        minZoomMessage: 'Zoom in to refresh POI'
    };
const overPassAttribution = '&copy; <a href="https://www.overpass-api.de" target="_blank">Overpass API</a>'

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
            attribution: overPassAttribution
        });
        pointsOfInterestLayerSelection[category][poi.name] = true;
        layers["poi"+poi.query] = pointsOfInterestLayers[category][poi.name];
    }
}
