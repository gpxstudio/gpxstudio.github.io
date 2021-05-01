/**
 * Copyright (C) 2011-2012 Pavel Shramov
 * Copyright (C) 2013-2017 Maxime Petazzoni <maxime.petazzoni@bulix.org>
 * All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Thanks to Pavel Shramov who provided the initial implementation and Leaflet
 * integration. Original code was at https://github.com/shramov/leaflet-plugins.
 *
 * It was then cleaned-up and modified to record and make available more
 * information about the GPX track while it is being parsed so that the result
 * can be used to display additional information about the track that is
 * rendered on the Leaflet map.
 */

//var L = L || require('leaflet');

const icons = [
    [" ",{prefix: "", glyph: ""}],
    ["ATV",{prefix: "", glyph: ""}],
	["Airport",{prefix: "fas", glyph: "plane"}],
	["Amusement Park",{prefix: "", glyph: ""}],
	["Anchor",{prefix: "fas", glyph: "anchor"}],
	["Anchor Prohibited",{prefix: "", glyph: ""}],
	["Animal Tracks",{prefix: "fas", glyph: "paw"}],
	["Asian Food",{prefix: "fas", glyph: "utensils"}],
	["Bait and Tackle",{prefix: "", glyph: ""}],
	["Ball Park",{prefix: "fas", glyph: "futbol"}],
	["Bank",{prefix: "fas", glyph: "dollar-sign"}],
	["Bar",{prefix: "fas", glyph: "beer"}],
	["Beach",{prefix: "fas", glyph: "umbrella-beach"}],
	["Beacon",{prefix: "", glyph: ""}],
	["Bell",{prefix: "fas", glyph: "bell"}],
	["Big Game",{prefix: "fas", glyph: "dice"}],
	["Bike Trail",{prefix: "fas", glyph: "biking"}],
	["Blind",{prefix: "fas", glyph: "blind"}],
	["Block, Blue",{prefix: "fas", glyph: "cube"}],
	["Block, Green",{prefix: "fas", glyph: "cube"}],
	["Block, Red",{prefix: "fas", glyph: "cube"}],
	["Blood Trail",{prefix: "", glyph: ""}],
	["Boat Ramp",{prefix: "fas", glyph: "ship"}],
	["Border Crossing (Port Of Entry)",{prefix: "", glyph: ""}],
	["Bottom Conditions",{prefix: "", glyph: ""}],
	["Bowling",{prefix: "fas", glyph: "bowling-ball"}],
	["Bridge",{prefix: "fas", glyph: "archway"}],
	["Building",{prefix: "fas", glyph: "building"}],
	["Buoy, White",{prefix: "fas", glyph: "life-ring"}],
	["Campground",{prefix: "fas", glyph: "campground"}],
	["Car",{prefix: "fas", glyph: "car-side"}],
	["Car Rental",{prefix: "fas", glyph: "car-side"}],
	["Car Repair",{prefix: "fas", glyph: "tools"}],
	["Cemetery",{prefix: "fas", glyph: "cross"}],
	["Church",{prefix: "fas", glyph: "place-of-worship"}],
	["Circle with X",{prefix: "fas", glyph: "times-circle"}],
	["Circle, Blue",{prefix: "fas", glyph: "circle"}],
	["Circle, Green",{prefix: "fas", glyph: "circle"}],
	["Circle, Red",{prefix: "fas", glyph: "circle"}],
	["City (Capitol)",{prefix: "fas", glyph: "city"}],
	["City (Large)",{prefix: "fas", glyph: "city"}],
	["City (Medium)",{prefix: "fas", glyph: "city"}],
	["City (Small)",{prefix: "fas", glyph: "city"}],
	["City Hall",{prefix: "fas", glyph: "landmark"}],
	["Civil",{prefix: "fas", glyph: "male"}],
	["Coast Guard",{prefix: "fas", glyph: "life-ring"}],
	["Contact, Afro",{prefix: "fas", glyph: "info"}],
	["Contact, Alien",{prefix: "fas", glyph: "info"}],
	["Contact, Ball Cap",{prefix: "fas", glyph: "info"}],
	["Contact, Big Ears",{prefix: "fas", glyph: "info"}],
	["Contact, Biker",{prefix: "fas", glyph: "info"}],
	["Contact, Blonde",{prefix: "fas", glyph: "info"}],
	["Contact, Bug",{prefix: "fas", glyph: "info"}],
	["Contact, Cat",{prefix: "fas", glyph: "info"}],
	["Contact, Clown",{prefix: "fas", glyph: "info"}],
	["Contact, Dog",{prefix: "fas", glyph: "info"}],
	["Contact, Dreadlocks",{prefix: "fas", glyph: "info"}],
	["Contact, Female1",{prefix: "fas", glyph: "info"}],
	["Contact, Female2",{prefix: "fas", glyph: "info"}],
	["Contact, Female3",{prefix: "fas", glyph: "info"}],
	["Contact, Glasses",{prefix: "fas", glyph: "info"}],
	["Contact, Goatee",{prefix: "fas", glyph: "info"}],
	["Contact, Kung-Fu",{prefix: "fas", glyph: "info"}],
	["Contact, Panda",{prefix: "fas", glyph: "info"}],
	["Contact, Pig",{prefix: "fas", glyph: "info"}],
	["Contact, Pirate",{prefix: "fas", glyph: "info"}],
	["Contact, Ranger",{prefix: "fas", glyph: "info"}],
	["Contact, Smiley",{prefix: "fas", glyph: "info"}],
	["Contact, Spike",{prefix: "fas", glyph: "info"}],
	["Contact, Sumo",{prefix: "fas", glyph: "info"}],
	["Controlled Area",{prefix: "fas", glyph: "exclamation"}],
	["Convenience Store",{prefix: "fas", glyph: "store"}],
	["Cover",{prefix: "", glyph: ""}],
	["Covey",{prefix: "", glyph: ""}],
	["Crossing",{prefix: "fas", glyph: "traffic-light"}],
	["Dam",{prefix: "fas", glyph: "water"}],
	["Danger Area",{prefix: "fas", glyph: "exclamation"}],
	["Deli",{prefix: "fas", glyph: "store"}],
	["Department Store",{prefix: "fas", glyph: "store"}],
	["Diamond, Blue",{prefix: "fas", glyph: "gem"}],
	["Diamond, Green",{prefix: "fas", glyph: "gem"}],
	["Diamond, Red",{prefix: "fas", glyph: "gem"}],
	["Diver Down Flag 1",{prefix: "fas", glyph: "flag"}],
	["Diver Down Flag 2",{prefix: "fas", glyph: "flag"}],
	["Dock",{prefix: "fas", glyph: "anchor"}],
	["Dot, White",{prefix: "fas", glyph: "circle"}],
	["Drinking Water",{prefix: "fas", glyph: "faucet"}],
	["Dropoff",{prefix: "", glyph: ""}],
	["Elevation point",{prefix: "fas", glyph: "mountain"}],
	["Event Cache",{prefix: "fas", glyph: "search"}],
	["Exit",{prefix: "fas", glyph: "door-open"}],
	["Exit without services",{prefix: "fas", glyph: "door-open"}],
	["Fast Food",{prefix: "fas", glyph: "hamburger"}],
	["First approach fix",{prefix: "", glyph: ""}],
	["Fishing Area",{prefix: "fas", glyph: "fish"}],
	["Fishing Hot Spot Facility",{prefix: "fas", glyph: "fish"}],
	["Fitness Center",{prefix: "fas", glyph: "dumbbell"}],
	["Flag",{prefix: "fas", glyph: "flag"}],
	["Flag, Blue",{prefix: "fas", glyph: "flag"}],
	["Flag, Green",{prefix: "fas", glyph: "flag"}],
	["Flag, Red",{prefix: "fas", glyph: "flag"}],
	["Food Source",{prefix: "fas", glyph: "seedling"}],
	["Forest",{prefix: "fas", glyph: "tree"}],
	["Furbearer",{prefix: "fas", glyph: "paw"}],
	["Gambling/casino",{prefix: "fas", glyph: "dice"}],
	["Gas Station",{prefix: "fas", glyph: "gas-pump"}],
	["Geocache",{prefix: "fas", glyph: "search"}],
	["Geocache Found",{prefix: "fas", glyph: "search"}],
	["Geographic place name, Man-made",{prefix: "fas", glyph: "building"}],
	["Geographic place name, land",{prefix: "fas", glyph: "globe-europe"}],
	["Geographic place name, water",{prefix: "fas", glyph: "water"}],
	["Ghost Town",{prefix: "fas", glyph: "city"}],
	["Glider Area",{prefix: "fas", glyph: "plane"}],
	["Golf Course",{prefix: "fas", glyph: "golf-ball"}],
	["Ground Transportation",{prefix: "fas", glyph: "subway"}],
	["Heliport",{prefix: "fas", glyph: "helicopter"}],
	["Horn",{prefix: "fas", glyph: "bullhorn"}],
	["Hotel",{prefix: "fas", glyph: "hotel"}],
	["House",{prefix: "fas", glyph: "home"}],
	["Hunting Area",{prefix: "fas", glyph: "paw"}],
	["Ice Skating",{prefix: "fas", glyph: "skating"}],
	["Information",{prefix: "fas", glyph: "info"}],
	["Intersection",{prefix: "fas", glyph: "traffic-light"}],
	["Intl freeway hwy",{prefix: "fas", glyph: "road"}],
	["Intl national hwy",{prefix: "fas", glyph: "road"}],
	["Italian food",{prefix: "fas", glyph: "pizza"}],
	["Large Ramp intersection",{prefix: "fas", glyph: "traffic-light"}],
	["Large exit without services",{prefix: "fas", glyph: "door-open"}],
	["Letter A, Blue",{prefix: "", glyph: "A"}],
	["Letter A, Green",{prefix: "", glyph: "A"}],
	["Letter A, Red",{prefix: "", glyph: "A"}],
	["Letter B, Blue",{prefix: "", glyph: "B"}],
	["Letter B, Green",{prefix: "", glyph: "B"}],
	["Letter B, Red",{prefix: "", glyph: "B"}],
	["Letter C, Blue",{prefix: "", glyph: "C"}],
	["Letter C, Green",{prefix: "", glyph: "C"}],
	["Letter C, Red",{prefix: "", glyph: "C"}],
	["Letter D, Blue",{prefix: "", glyph: "D"}],
	["Letter D, Green",{prefix: "", glyph: "D"}],
	["Letter D, Red",{prefix: "", glyph: "D"}],
	["Letterbox Cache",{prefix: "fas", glyph: "box-open"}],
	["Levee",{prefix: "fas", glyph: "anchor"}],
	["Library",{prefix: "fas", glyph: "book"}],
	["Light",{prefix: "fas", glyph: "lightbulb"}],
	["Live Theater",{prefix: "fas", glyph: "theater-masks"}],
	["Localizer Outer Marker",{prefix: "fas", glyph: "crosshairs"}],
	["Locationless (Reverse) Cache",{prefix: "fas", glyph: "search"}],
	["Lodge",{prefix: "fas", glyph: "bed"}],
	["Lodging",{prefix: "fas", glyph: "bed"}],
	["Man Overboard",{prefix: "", glyph: ""}],
	["Marina",{prefix: "fas", glyph: "anchor"}],
	["Medical Facility",{prefix: "fas", glyph: "clinic-medical"}],
	["Micro-Cache",{prefix: "fas", glyph: "search"}],
	["Mile Marker",{prefix: "fas", glyph: "ruler-horizontal"}],
	["Military",{prefix: "fas", glyph: "fighter-jet"}],
	["Mine",{prefix: "fas", glyph: "bomb"}],
	["Missed approach point",{prefix: "", glyph: ""}],
	["Movie Theater",{prefix: "fas", glyph: "film"}],
	["Multi-Cache",{prefix: "fas", glyph: "search"}],
	["Museum",{prefix: "fas", glyph: "monument"}],
	["Navaid, Amber",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Black",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Blue",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Green",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Green/Red",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Green/White",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Orange",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Red",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Red/Green",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Red/White",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, Violet",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, White",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, White/Green",{prefix: "fas", glyph: "drafting-compass"}],
	["Navaid, White/Red",{prefix: "fas", glyph: "drafting-compass"}],
	["Non-directional beacon",{prefix: "", glyph: ""}],
	["Null",{prefix: "", glyph: ""}],
	["Number 0, Blue",{prefix: "", glyph: "0"}],
	["Number 0, Green",{prefix: "", glyph: "0"}],
	["Number 0, Red",{prefix: "", glyph: "0"}],
	["Number 1, Blue",{prefix: "", glyph: "1"}],
	["Number 1, Green",{prefix: "", glyph: "1"}],
	["Number 1, Red",{prefix: "", glyph: "1"}],
	["Number 2, Blue",{prefix: "", glyph: "2"}],
	["Number 2, Green",{prefix: "", glyph: "2"}],
	["Number 2, Red",{prefix: "", glyph: "2"}],
	["Number 3, Blue",{prefix: "", glyph: "3"}],
	["Number 3, Green",{prefix: "", glyph: "3"}],
	["Number 3, Red",{prefix: "", glyph: "3"}],
	["Number 4, Blue",{prefix: "", glyph: "4"}],
	["Number 4, Green",{prefix: "", glyph: "4"}],
	["Number 4, Red",{prefix: "", glyph: "4"}],
	["Number 5, Blue",{prefix: "", glyph: "5"}],
	["Number 5, Green",{prefix: "", glyph: "5"}],
	["Number 5, Red",{prefix: "", glyph: "5"}],
	["Number 6, Blue",{prefix: "", glyph: "6"}],
	["Number 6, Green",{prefix: "", glyph: "6"}],
	["Number 6, Red",{prefix: "", glyph: "6"}],
	["Number 7, Blue",{prefix: "", glyph: "7"}],
	["Number 7, Green",{prefix: "", glyph: "7"}],
	["Number 7, Red",{prefix: "", glyph: "7"}],
	["Number 8, Blue",{prefix: "", glyph: "8"}],
	["Number 8, Green",{prefix: "", glyph: "8"}],
	["Number 8, Red",{prefix: "", glyph: "8"}],
	["Number 9, Blue",{prefix: "", glyph: "9"}],
	["Number 9, Green",{prefix: "", glyph: "9"}],
	["Number 9, Red",{prefix: "", glyph: "9"}],
	["Oil Field",{prefix: "fas", glyph: "oil-can"}],
	["Open 24 Hours",{prefix: "", glyph: ""}],
	["Oval, Blue",{prefix: "fas", glyph: "circle"}],
	["Oval, Green",{prefix: "fas", glyph: "circle"}],
	["Oval, Red",{prefix: "fas", glyph: "circle"}],
	["Parachute Area",{prefix: "fas", glyph: "parachute-box"}],
	["Park",{prefix: "fas", glyph: "tree"}],
	["Parking Area",{prefix: "fas", glyph: "parking"}],
	["Pharmacy",{prefix: "fas", glyph: "first-aid"}],
	["Picnic Area",{prefix: "fas", glyph: "utensils"}],
	["Pin, Blue",{prefix: "fas", glyph: "map-pin"}],
	["Pin, Green",{prefix: "fas", glyph: "map-pin"}],
	["Pin, Red",{prefix: "fas", glyph: "map-pin"}],
	["Pizza",{prefix: "fas", glyph: "pizza"}],
	["Police Station",{prefix: "fas", glyph: "shield-alt"}],
	["Post Office",{prefix: "fas", glyph: "envelope"}],
	["Private Field",{prefix: "fas", glyph: "lock"}],
	["Puzzle Cache",{prefix: "fas", glyph: "search"}],
	["RV Park",{prefix: "fas", glyph: "caravan"}],
	["Radio Beacon",{prefix: "", glyph: ""}],
	["Ramp intersection",{prefix: "fas", glyph: "traffic-light"}],
	["Rectangle, Blue",{prefix: "fas", glyph: "square"}],
	["Rectangle, Green",{prefix: "fas", glyph: "square"}],
	["Rectangle, Red",{prefix: "fas", glyph: "square"}],
	["Reef",{prefix: "fas", glyph: "exclamation"}],
	["Residence",{prefix: "fas", glyph: "home"}],
	["Restaurant",{prefix: "fas", glyph: "utensils"}],
	["Restricted Area",{prefix: "fas", glyph: "exclamation"}],
	["Restroom",{prefix: "fas", glyph: "restroom"}],
	["Road",{prefix: "fas", glyph: "road"}],
	["Scales",{prefix: "fas", glyph: "balance-scale"}],
	["Scenic Area",{prefix: "fas", glyph: "binoculars"}],
	["School",{prefix: "fas", glyph: "graduation-cap"}],
	["Seafood",{prefix: "fas", glyph: "fish"}],
	["Seaplane Base",{prefix: "fas", glyph: "plane"}],
	["Shipwreck",{prefix: "fas", glyph: "ship"}],
	["Shopping Center",{prefix: "fas", glyph: "shopping-cart"}],
	["Short Tower",{prefix: "", glyph: ""}],
	["Shower",{prefix: "fas", glyph: "shower"}],
	["Ski Resort",{prefix: "fas", glyph: "skiing"}],
	["Skiing Area",{prefix: "fas", glyph: "skiing"}],
	["Skull and Crossbones",{prefix: "fas", glyph: "skull-crossbones"}],
	["Small City",{prefix: "fas", glyph: "city"}],
	["Small Game",{prefix: "fas", glyph: "dice"}],
	["Soft Field",{prefix: "", glyph: ""}],
	["Square, Blue",{prefix: "fas", glyph: "square"}],
	["Square, Green",{prefix: "fas", glyph: "square"}],
	["Square, Red",{prefix: "fas", glyph: "square"}],
	["Stadium",{prefix: "fas", glyph: "futbol"}],
	["State Hwy",{prefix: "fas", glyph: "road"}],
	["Steak",{prefix: "fas", glyph: "utensils"}],
	["Street Intersection",{prefix: "fas", glyph: "traffic-light"}],
	["Stump",{prefix: "", glyph: ""}],
	["Summit",{prefix: "fas", glyph: "mountain"}],
	["Swimming Area",{prefix: "fas", glyph: "swimmer"}],
	["TACAN",{prefix: "fas", glyph: "fighter-jet"}],
	["Tall Tower",{prefix: "", glyph: ""}],
	["Telephone",{prefix: "fas", glyph: "phone"}],
	["Tide/Current PRediction Station",{prefix: "", glyph: ""}],
	["Toll Booth",{prefix: "", glyph: ""}],
	["TracBack Point",{prefix: "", glyph: ""}],
	["Trail Head",{prefix: "", glyph: ""}],
	["Tree Stand",{prefix: "", glyph: ""}],
	["Treed Quarry",{prefix: "", glyph: ""}],
	["Triangle, Blue",{prefix: "", glyph: ""}],
	["Triangle, Green",{prefix: "", glyph: ""}],
	["Triangle, Red",{prefix: "", glyph: ""}],
	["Truck",{prefix: "fas", glyph: "truck"}],
	["Truck Stop",{prefix: "fas", glyph: "truck"}],
	["Tunnel",{prefix: "fas", glyph: "archway"}],
	["U Marina",{prefix: "fas", glyph: "anchor"}],
	["U stump",{prefix: "", glyph: ""}],
	["US hwy",{prefix: "fas", glyph: "road"}],
	["Ultralight Area",{prefix: "", glyph: ""}],
	["Unknown Cache",{prefix: "fas", glyph: "search"}],
	["Upland Game",{prefix: "", glyph: ""}],
	["VHF Omni-range",{prefix: "fas", glyph: "fighter-jet"}],
	["VOR-DME",{prefix: "fas", glyph: "fighter-jet"}],
	["VOR/TACAN",{prefix: "fas", glyph: "fighter-jet"}],
	["Virtual cache",{prefix: "fas", glyph: "search"}],
	["Water Hydrant",{prefix: "fas", glyph: "tint"}],
	["Water Source",{prefix: "fas", glyph: "faucet"}],
	["Waterfowl",{prefix: "", glyph: ""}],
	["Waypoint",{prefix: "fas", glyph: "map-sign"}],
	["Webcam Cache",{prefix: "fas", glyph: "camera"}],
	["Weed Bed",{prefix: "fas", glyph: "bed"}],
	["Winery",{prefix: "fas", glyph: "wine-glass"}],
	["Wrecker",{prefix: "", glyph: ""}],
	["Zoo",{prefix: "fas", glyph: "paw"}]
];
const iconMap = new Map(icons);

var _MAX_POINT_INTERVAL_MS = 15000;
var _SECOND_IN_MILLIS = 1000;
var _MINUTE_IN_MILLIS = 60 * _SECOND_IN_MILLIS;
var _HOUR_IN_MILLIS = 60 * _MINUTE_IN_MILLIS;
var _DAY_IN_MILLIS = 24 * _HOUR_IN_MILLIS;

var _GPX_STYLE_NS = 'http://www.topografix.com/GPX/gpx_style/0/2';

var _DEFAULT_MARKER_OPTS = {
  startIconUrl: 'pin-icon-start.png',
  endIconUrl: 'pin-icon-end.png',
  shadowUrl: 'pin-shadow.png',
  wptIcons: [],
  wptIconUrls : {
    '': 'pin-icon-wpt.png',
  },
  pointMatchers: [],
  iconSize: [33, 50],
  shadowSize: [50, 50],
  iconAnchor: [16, 45],
  shadowAnchor: [16, 47],
  clickable: true
};
var _DEFAULT_POLYLINE_OPTS = {
  color: 'blue'
};
var _DEFAULT_GPX_OPTS = {
  parseElements: ['track', 'route', 'waypoint'],
  joinTrackSegments: true
};

L.GPX = L.FeatureGroup.extend({
  initialize: function(gpx, options, trace) {
    options.max_point_interval = options.max_point_interval || _MAX_POINT_INTERVAL_MS;
    options.marker_options = this._merge_objs(
      _DEFAULT_MARKER_OPTS,
      options.marker_options || {});
    options.polyline_options = options.polyline_options || {};
    options.gpx_options = this._merge_objs(
      _DEFAULT_GPX_OPTS,
      options.gpx_options || {});

    L.Util.setOptions(this, options);

    // Base icon class for track pins.
    L.GPXTrackIcon = L.Icon.extend({ options: options.marker_options });

    this._gpx = gpx;
    this._trace = trace;
    this._layers = {};
    this._init_info();

    if (gpx) {
      this._parse(gpx, options, this.options.async);
    }
  },

  get_duration_string: function(duration, hidems) {
    var s = '';

    if (duration >= _DAY_IN_MILLIS) {
      s += Math.floor(duration / _DAY_IN_MILLIS) + 'd ';
      duration = duration % _DAY_IN_MILLIS;
    }

    if (duration >= _HOUR_IN_MILLIS) {
      s += Math.floor(duration / _HOUR_IN_MILLIS) + ':';
      duration = duration % _HOUR_IN_MILLIS;
    }

    var mins = Math.floor(duration / _MINUTE_IN_MILLIS);
    duration = duration % _MINUTE_IN_MILLIS;
    if (mins < 10) s += '0';
    s += mins + '\'';

    var secs = Math.floor(duration / _SECOND_IN_MILLIS);
    duration = duration % _SECOND_IN_MILLIS;
    if (secs < 10) s += '0';
    s += secs;

    if (!hidems && duration > 0) s += '.' + Math.round(Math.floor(duration)*1000)/1000;
    else s += '"';

    return s;
  },

  get_duration_string_iso: function(duration, hidems) {
    var s = this.get_duration_string(duration, hidems);
    return s.replace("'",':').replace('"','');
  },

  // Public methods
  to_miles:            function(v) { return v / 1.60934; },
  to_ft:               function(v) { return v * 3.28084; },
  m_to_km:             function(v) { return v / 1000; },
  m_to_mi:             function(v) { return v / 1609.34; },

  get_name:            function() { return this._info.name; },
  get_desc:            function() { return this._info.desc; },
  get_author:          function() { return this._info.author; },
  get_copyright:       function() { return this._info.copyright; },
  get_distance:        function() { return this._info.length; },
  get_distance_imp:    function() { return this.to_miles(this.m_to_km(this.get_distance())); },

  get_start_time:      function() { return this._info.duration.start; },
  get_end_time:        function() { return this._info.duration.end; },
  get_moving_time:     function() { return this._info.duration.moving; },
  get_total_time:      function() { return this._info.duration.total; },

  get_moving_pace:     function() { return this.get_moving_time() / this.m_to_km(this.get_distance()); },
  get_moving_pace_imp: function() { return this.get_moving_time() / this.get_distance_imp(); },

  get_moving_speed:    function() { return this.m_to_km(this.get_distance()) / (this.get_moving_time() / (3600 * 1000)) ; },
  get_moving_speed_imp:function() { return this.to_miles(this.m_to_km(this.get_distance())) / (this.get_moving_time() / (3600 * 1000)) ; },

  get_total_speed:     function() { return this.m_to_km(this.get_distance()) / (this.get_total_time() / (3600 * 1000)); },
  get_total_speed_imp: function() { return this.to_miles(this.m_to_km(this.get_distance())) / (this.get_total_time() / (3600 * 1000)); },

  get_elevation_gain:     function() { return this._info.elevation.gain; },
  get_elevation_loss:     function() { return this._info.elevation.loss; },
  get_elevation_gain_imp: function() { return this.to_ft(this.get_elevation_gain()); },
  get_elevation_loss_imp: function() { return this.to_ft(this.get_elevation_loss()); },
  get_elevation_data:     function() {
    var _this = this;
    return this._info.elevation._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' m'; });
      });
  },
  get_elevation_data_imp: function() {
    var _this = this;
    return this._info.elevation._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, _this.to_ft,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' ft'; });
      });
  },
  get_elevation_max:      function() { return this._info.elevation.max; },
  get_elevation_min:      function() { return this._info.elevation.min; },
  get_elevation_max_imp:  function() { return this.to_ft(this.get_elevation_max()); },
  get_elevation_min_imp:  function() { return this.to_ft(this.get_elevation_min()); },

  get_average_hr:         function() { return this._info.hr.avg; },
  get_average_temp:         function() { return this._info.atemp.avg; },
  get_average_cadence:         function() { return this._info.cad.avg; },
  get_heartrate_data:     function() {
    var _this = this;
    return this._info.hr._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' bpm'; });
      });
  },
  get_heartrate_data_imp: function() {
    var _this = this;
    return this._info.hr._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, null,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' bpm'; });
      });
  },
  get_cadence_data:     function() {
    var _this = this;
    return this._info.cad._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' rpm'; });
      });
  },
  get_temp_data:     function() {
    var _this = this;
    return this._info.atemp._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' degrees'; });
      });
  },
  get_cadence_data_imp:     function() {
    var _this = this;
    return this._info.cad._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, null,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' rpm'; });
      });
  },
  get_temp_data_imp:     function() {
    var _this = this;
    return this._info.atemp._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, null,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' degrees'; });
      });
  },

  reload: function() {
    this._init_info();
    this.clearLayers();
    this._parse(this._gpx, this.options, this.options.async);
  },

  // Private methods
  _merge_objs: function(a, b) {
    var _ = {};
    for (var attr in a) { _[attr] = a[attr]; }
    for (var attr in b) { _[attr] = b[attr]; }
    return _;
  },

  _prepare_data_point: function(p, trans1, trans2, trans_tooltip) {
    var r = [trans1 && trans1(p[0]) || p[0], trans2 && trans2(p[1]) || p[1]];
    r.push(trans_tooltip && trans_tooltip(r[0], r[1]) || (r[0] + ': ' + r[1]));
    return r;
  },

  _init_info: function() {
    this._info = {
      name: null,
      length: 0.0,
      moving_length: 0.0,
      elevation: {gain: 0.0, loss: 0.0, max: 0.0, min: Infinity, _points: []},
      hr: {avg: 0, _total: 0, _points: []},
      duration: {start: null, end: null, moving: 0, total: 0},
      atemp: {avg: 0, _total: 0, _points: []},
      cad: {avg: 0, _total: 0, _points: []}
    };
  },

  _load_xml: function(url, cb, options, async) {
    if (async == undefined) async = this.options.async;
    if (options == undefined) options = this.options;

    var req = new window.XMLHttpRequest();
    req.open('GET', url, async);
    try {
      req.overrideMimeType('text/xml'); // unsupported by IE
    } catch(e) {}
    req.onreadystatechange = function() {
      if (req.readyState != 4) return;
      if(req.status == 200) cb(req.responseXML, options);
    };
    req.send(null);
  },

  _parse: function(input, options, async) {
    var _this = this;
    var cb = function(gpx, options) {
      var layers = _this._parse_gpx_data(gpx, options);
      if (!layers) {
        _this.fire('error', { err: 'No parseable layers of type(s) ' + JSON.stringify(options.gpx_options.parseElements) });
        return;
      }
      _this.addLayer(layers);
      _this.fire('loaded', { layers: layers, element: gpx });
    }
    if (input.substr(0,1)==='<') { // direct XML has to start with a <
      var parser = new DOMParser();
      if (async) {
        setTimeout(function() {
          cb(parser.parseFromString(input, "text/xml"), options);
        });
      } else {
        cb(parser.parseFromString(input, "text/xml"), options);
      }
    } else {
      this._load_xml(input, cb, options, async);
    }
  },

  _parse_gpx_data: function(xml, options) {
    var i, j, t, l, el, layers = [];

    var name = xml.getElementsByTagName('name');
    if (name.length > 0) {
      this._info.name = name[0].textContent;
    }
    var desc = xml.getElementsByTagName('desc');
    if (desc.length > 0) {
      this._info.desc = desc[0].textContent;
    }
    var author = xml.getElementsByTagName('author');
    if (author.length > 0) {
      this._info.author = author[0].textContent;
    }
    var copyright = xml.getElementsByTagName('copyright');
    if (copyright.length > 0) {
      this._info.copyright = copyright[0].textContent;
    }

    var color = xml.getElementsByTagName('color');
    if (color.length > 0) {
        var s = new Option().style;
        s.color = color[0].textContent;
        if (s.color !== '') {
            this._trace.total.changeColor(this._trace.normal_style.color, color[0].textContent);
            this._trace.normal_style.color = color[0].textContent;
            this._trace.focus_style.color = color[0].textContent;
            this._trace.set_color = true;
        }
    }

    var opacity = xml.getElementsByTagName('opacity');
    if (opacity.length > 0) {
        var op = parseFloat(opacity[0].textContent);
        if (op >= 0 && op <= 1) {
            this._trace.normal_style.opacity = op;
            this._trace.focus_style.opacity = op;
        } else if (op >= 0 && op <= 100) {
            this._trace.normal_style.opacity = op/100;
            this._trace.focus_style.opacity = op/100;
        }
    }

    var parseElements = options.gpx_options.parseElements;
    if (parseElements.indexOf('route') > -1) {
      // routes are <rtept> tags inside <rte> sections
      var routes = xml.getElementsByTagName('rte');
      for (i = 0; i < routes.length; i++) {
        layers = layers.concat(this._parse_segment(routes[i], options, {}, 'rtept'));
      }
    }

    if (parseElements.indexOf('track') > -1) {
      // tracks are <trkpt> tags in one or more <trkseg> sections in each <trk>
      var tracks = xml.getElementsByTagName('trk');
      for (i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var polyline_options = this._extract_styling(track);

        if (options.gpx_options.joinTrackSegments) {
          layers = layers.concat(this._parse_segment(track, options, polyline_options, 'trkpt'));
        } else {
          var segments = track.getElementsByTagName('trkseg');
          for (j = 0; j < segments.length; j++) {
            layers = layers.concat(this._parse_segment(segments[j], options, polyline_options, 'trkpt'));
          }
        }
      }
    }

    this._info.hr.avg = Math.round(this._info.hr._total / this._info.hr._points.length);
    this._info.cad.avg = Math.round(this._info.cad._total / this._info.cad._points.length);
    this._info.atemp.avg = Math.round(this._info.atemp._total / this._info.atemp._points.length);

    // parse waypoints and add markers for each of them
    if (parseElements.indexOf('waypoint') > -1) {
      el = xml.getElementsByTagName('wpt');
      for (i = 0; i < el.length; i++) {
        var ll = new L.LatLng(
            el[i].getAttribute('lat'),
            el[i].getAttribute('lon'));

        var eleEl = el[i].getElementsByTagName('ele');
        var ele = -1;
        if (eleEl.length > 0) {
          ele = parseFloat(eleEl[0].textContent);
          if (Number.isNaN(ele)) ele = -1;
        }
        ll.meta = {'ele': ele};

        var nameEl = el[i].getElementsByTagName('name');
        var name = '';
        if (nameEl.length > 0) {
          name = nameEl[0].textContent;
        }

        var descEl = el[i].getElementsByTagName('desc');
        var desc = '';
        if (descEl.length > 0) {
          desc = descEl[0].textContent;
        }

        var cmtEl = el[i].getElementsByTagName('cmt');
        var cmt = '';
        if (cmtEl.length > 0) {
          cmt = cmtEl[0].textContent;
        }

        var symEl = el[i].getElementsByTagName('sym');
        var sym = '';
        if (symEl.length > 0) {
          sym = symEl[0].textContent;
        }

        var marker = this._get_marker(ll, sym, name, desc, cmt, options);
        this.fire('addpoint', { point: marker, point_type: 'waypoint', element: el[i] });
        layers.push(marker);
      }
    }

    if (layers.length == 0) return null;
    return new L.FeatureGroup(layers);
  },

  _get_marker: function(ll, sym, name, desc, cmt, options) {
      const trace = this._trace;
      const map = trace.map;

      var icon = iconMap.get(sym);
      if (!icon) {
          icon = {prefix: '', glyph: ''};
          sym = " ";
      }
      var marker = new L.Marker(ll, {
        clickable: options.marker_options.clickable,
        draggable: !trace.buttons.embedding,
        keyboard: false,
        title: name,
        icon: L.icon.glyph(icon)
      });

      marker.name = filterXSS(name);
      marker.desc = filterXSS(desc);
      marker.cmt = filterXSS(cmt);
      marker.sym = sym;

      marker.on({
          dragstart: function (e) {
              if (trace.buttons.embedding) return;
              if (trace.total.hasFocus) return;
              if (e.originalEvent !== undefined && e.originalEvent.which == 3) return false;
              map.dragging.disable();
              marker._latlng_origin = marker._latlng;
              map._draggedMarker = marker;
              marker.getElement().style.cursor = 'grabbing';
              trace._draggingWaypoint = true;
          },
          drag: function (e) {
              const pt = map.latLngToLayerPoint(e.latlng);
              const layers = trace.getLayers();
              var best_pt = null;
              for (var l=0; l<layers.length; l++) if (layers[l]._latlngs) {
                  const closest_pt = layers[l].closestLayerPoint(pt);
                  if (closest_pt && (!best_pt || closest_pt.distance < best_pt.distance)) {
                      best_pt = closest_pt;
                  }
              }
              if (best_pt && best_pt.distance < 15) {
                  marker.setLatLng(map.layerPointToLatLng(best_pt));
              }
          },
          click: function () {
              if (this.isPopupOpen()) {
                  this.closePopup();
              } else {
                  const popup = L.popup({
                      closeButton: false
                  });
                  marker.bindPopup(popup).openPopup();
                  popup.setContent(`<div style="width: 200px; display: inline-block; overflow-wrap: break-word;">
                                        `+(trace.buttons.embedding ? '' : (`<div style="float: right;"><i id="edit`+popup._leaflet_id+`" class="fas fa-pencil-alt custom-button" style="display: inline-block" title="`+trace.buttons.edit_info_text+`"></i> <i id="clone`+popup._leaflet_id+`" class="fas fa-copy custom-button" style="display: inline-block" title="`+trace.buttons.duplicate_text+`"></i> <i id="delete`+popup._leaflet_id+`" class="fas fa-trash-alt custom-button" style="display: inline-block" title="`+trace.buttons.delete_text+`"></i></div>`))+`
                                        <div class="wpt-cmt"><b>`+(marker.name.length > 0 ? marker.name : trace.buttons.empty_title_text)+`</b></div>
                                        <div class="wpt-cmt">`+(marker.cmt.length > 0 ? (marker.cmt + '<br>') : '')+`<i class="wpt-cmt">`+marker.desc+`</i></div>
                                    </div>`);
                  if (!trace.buttons.embedding) {
                      const edit = document.getElementById('edit' + popup._leaflet_id);
                      edit.addEventListener('click', function () {
                          popup.setContent(`<div style="width: 300px; display: inline-block; overflow-wrap: break-word;">
                                         <div>`+trace.buttons.name_text+`</div>
                                         <div id="name`+popup._leaflet_id+`" contenteditable class="wpt-input"></div>
                                         <div>`+trace.buttons.comment_text+`</div>
                                         <div id="cmt`+popup._leaflet_id+`" contenteditable class="wpt-input"></div>
                                         <div>`+trace.buttons.description_text+`</div>
                                         <div id="desc`+popup._leaflet_id+`" contenteditable class="wpt-input"></div>
                                         <label for="sym`+popup._leaflet_id+`">`+trace.buttons.symbol_text+`</label><br>
                                         <select type="text" id="sym`+popup._leaflet_id+`" name="sym`+popup._leaflet_id+`" style="width: 100%"></select><br>
                                         <div style="text-align: center">
                                            <div id="change`+popup._leaflet_id+`" class="panels custom-button normal-button">`+trace.buttons.ok_button_text+`</div>
                                            <div id="cancel`+popup._leaflet_id+`" class="panels custom-button normal-button"><b>`+trace.buttons.cancel_button_text+`</b></div>
                                         </div></div>`);
                          const name = document.getElementById('name'+popup._leaflet_id);
                          const cmt = document.getElementById('cmt'+popup._leaflet_id);
                          const desc = document.getElementById('desc'+popup._leaflet_id);
                          const select = document.getElementById('sym'+popup._leaflet_id);
                          const change = document.getElementById('change'+popup._leaflet_id);
                          const cancel = document.getElementById('cancel'+popup._leaflet_id);

                          for (var i=0; i<icons.length; i++) {
                              var opt = document.createElement('option');
                              opt.value = icons[i][0];
                              opt.innerHTML = icons[i][0];
                              select.appendChild(opt);
                          }

                          name.innerHTML = trace.total.encodeString(marker.name);
                          cmt.innerHTML = trace.total.encodeString(marker.cmt);
                          desc.innerHTML = trace.total.encodeString(marker.desc);
                          select.value = iconMap.get(marker.sym) ? marker.sym : " ";

                          change.addEventListener('click', function () {
                              marker.name = filterXSS(name.innerText);
                              marker.cmt = filterXSS(cmt.innerText);
                              marker.desc = filterXSS(desc.innerText);
                              marker.sym = select.value;
                              marker.setIcon(L.icon.glyph(iconMap.get(marker.sym)));
                              marker._icon.title = filterXSS(name.innerText);

                              marker.closePopup();
                              marker.fire('click');
                          });
                          cancel.addEventListener('click', function () {
                              marker.closePopup();
                              marker.fire('click');
                          });
                      });

                      const clone = document.getElementById('clone' + popup._leaflet_id);
                      clone.addEventListener('click', function () {
                          trace.buttons.add_wpt.click();
                          trace.buttons.clone_wpt = marker;
                          popup.remove();
                      });

                      const remove = document.getElementById('delete' + popup._leaflet_id);
                      remove.addEventListener("click", function () {
                          trace.deleteWaypoint(marker);
                          popup.remove();
                      });
                  }

                  popup.addEventListener('remove', function () {
                      marker.unbindPopup();
                  });
              }
          }
      });

      L.DomEvent.on(marker,"click",L.DomEvent.stopPropagation);
      L.DomEvent.on(marker,"dblclick",L.DomEvent.stopPropagation);

      return marker;
  },

  _parse_segment: function(line, options, polyline_options, tag) {
    var el = line.getElementsByTagName(tag);
    if (!el.length) return [];

    var coords = [];
    var markers = [];
    var layers = [];
    var last = null;
    var last_ele = null;

    for (var i = 0; i < el.length; i++) {
      var _, ll = new L.LatLng(
        el[i].getAttribute('lat'),
        el[i].getAttribute('lon'));
      ll.meta = { time: null, ele: null, hr: null, cad: null, atemp: null };

      _ = el[i].getElementsByTagName('time');
      if (_.length > 0) {
        ll.meta.time = new Date(Date.parse(_[0].textContent));
      } else {
        ll.meta.time = null;
      }

      _ = el[i].getElementsByTagName('ele');
      if (_.length > 0) {
        ll.meta.ele = parseFloat(_[0].textContent);
      } else {
        ll.meta.ele = 0;
        this.missing_elevation = true;
      }

      _ = el[i].getElementsByTagName('name');
      if (_.length > 0) {
        var name = _[0].textContent;
        var ptMatchers = options.marker_options.pointMatchers || [];

        for (var j = 0; j < ptMatchers.length; j++) {
          if (ptMatchers[j].regex.test(name)) {
            markers.push({ label: name, coords: ll, icon: ptMatchers[j].icon, element: el[i] });
            break;
          }
        }
      }

      _ = el[i].getElementsByTagNameNS('*', 'hr');
      if (_.length > 0) {
        ll.meta.hr = parseInt(_[0].textContent);
        this._info.hr._points.push([this._info.length, ll.meta.hr]);
        this._info.hr._total += ll.meta.hr;
      }

      _ = el[i].getElementsByTagNameNS('*', 'cad');
      if (_.length > 0) {
        ll.meta.cad = parseInt(_[0].textContent);
        this._info.cad._points.push([this._info.length, ll.meta.cad]);
        this._info.cad._total += ll.meta.cad;
      }

      _ = el[i].getElementsByTagNameNS('*', 'atemp');
      if (_.length > 0) {
        ll.meta.atemp = parseInt(_[0].textContent);
        this._info.atemp._points.push([this._info.length, ll.meta.atemp]);
        this._info.atemp._total += ll.meta.atemp;
      }

      if (ll.meta.ele > this._info.elevation.max) {
        this._info.elevation.max = ll.meta.ele;
      }

      if (ll.meta.ele < this._info.elevation.min) {
        this._info.elevation.min = ll.meta.ele;
      }

      this._info.elevation._points.push([this._info.length, ll.meta.ele]);
      this._info.duration.end = ll.meta.time;

      if (last != null) {
        const dist = this._dist2d(last, ll);
        this._info.length += dist;

        if (last_ele == null) last_ele = ll;
        var t = ll.meta.ele - last_ele.meta.ele;
        const dist_to_last_ele = this._dist2d(last_ele, ll);
        if (Math.abs(t) > 20 || dist_to_last_ele > 120) {
            if (t > 0) {
              this._info.elevation.gain += t;
            } else {
              this._info.elevation.loss += Math.abs(t);
            }
            last_ele = ll;
        }

        t = Math.abs(ll.meta.time - last.meta.time);
        this._info.duration.total += t;
        if (t < options.max_point_interval && (dist/1000)/(t/1000/60/60) >= 0.5) {
          this._info.duration.moving += t;
          this._info.moving_length += dist;
        }
      } else if (this._info.duration.start == null) {
        this._info.duration.start = ll.meta.time;
      }
      ll._dist = Math.round(this._info.length/1e3*1e5)/1e5;

      last = ll;
      coords.push(ll);
    }

    // add track
    var l = new L.Polyline(coords, options.polyline_options);
    this.fire('addline', { line: l, element: line });
    layers.push(l);

    if (options.marker_options.startIcon || options.marker_options.startIconUrl) {
      // add start pin
      var marker = new L.Marker(coords[0], {
        clickable: options.marker_options.clickable,
        icon: options.marker_options.startIcon || new L.GPXTrackIcon({iconUrl: options.marker_options.startIconUrl})
      });
      this.fire('addpoint', { point: marker, point_type: 'start', element: el[0] });
      layers.push(marker);
    }

    if (options.marker_options.endIcon || options.marker_options.endIconUrl) {
      // add end pin
      var marker = new L.Marker(coords[coords.length-1], {
        clickable: options.marker_options.clickable,
        icon: options.marker_options.endIcon || new L.GPXTrackIcon({iconUrl: options.marker_options.endIconUrl})
      });
      this.fire('addpoint', { point: marker, point_type: 'end', element: el[el.length-1] });
      layers.push(marker);
    }

    // add named markers
    for (var i = 0; i < markers.length; i++) {
      var marker = new L.Marker(markers[i].coords, {
        clickable: options.marker_options.clickable,
        title: markers[i].label,
        icon: markers[i].icon
      });
      this.fire('addpoint', { point: marker, point_type: 'label', element: markers[i].element });
      layers.push(marker);
    }

    return layers;
  },

  _extract_styling: function(el, base, overrides) {
    var style = this._merge_objs(_DEFAULT_POLYLINE_OPTS, base);
    var e = el.getElementsByTagNameNS(_GPX_STYLE_NS, 'line');
    if (e.length > 0) {
      var _ = e[0].getElementsByTagName('color');
      if (_.length > 0) style.color = '#' + _[0].textContent;
      var _ = e[0].getElementsByTagName('opacity');
      if (_.length > 0) style.opacity = _[0].textContent;
      var _ = e[0].getElementsByTagName('weight');
      if (_.length > 0) style.weight = _[0].textContent;
      var _ = e[0].getElementsByTagName('linecap');
      if (_.length > 0) style.lineCap = _[0].textContent;
    }
    return this._merge_objs(style, overrides)
  },

  _dist2d: function(a, b) {
    var R = 6371000;
    var dLat = this._deg2rad(b.lat - a.lat);
    var dLon = this._deg2rad(b.lng - a.lng);
    var r = Math.sin(dLat/2) *
      Math.sin(dLat/2) +
      Math.cos(this._deg2rad(a.lat)) *
      Math.cos(this._deg2rad(b.lat)) *
      Math.sin(dLon/2) *
      Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(r), Math.sqrt(1-r));
    var d = R * c;
    return d;
  },

  _dist3d: function(a, b) {
    var planar = this._dist2d(a, b);
    var height = Math.abs(b.meta.ele - a.meta.ele);
    return Math.sqrt(Math.pow(planar, 2) + Math.pow(height, 2));
  },

  _deg2rad: function(deg) {
    return deg * Math.PI / 180;
  }
});

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = L;
} else if (typeof define === 'function' && define.amd) {
  define(L);
}
