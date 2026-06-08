// ============================
// 1. KAART INITIALISEREN
// ============================

var map = L.map("map", {
  center: [52.1326, 5.2913],
  zoom: 7,
  layers: [osm]
});


// ============================
// 2. LAGEN DEFINIËREN
// ============================

var overlayLayers = {};

// BAG laag
var bagPandLayer = L.layerGroup();
overlayLayers["BAG Panden (PDOK)"] = bagPandLayer;


// ============================
// 3. BAG DATA LADEN (WFS)
// ============================

function loadBagPanden() {

  if (map.getZoom() < 15) {
    bagPandLayer.clearLayers();
    return;
  }

  var bounds = map.getBounds();

  var bbox =
    bounds.getWest() + "," +
    bounds.getSouth() + "," +
    bounds.getEast() + "," +
    bounds.getNorth();

  var url =
    "https://service.pdok.nl/lv/bag/wfs/v2_0?" +
    "service=WFS&version=2.0.0&request=GetFeature" +
    "&typeName=bag:pand" +
    "&outputFormat=application/json" +
    "&srsName=EPSG:4326" +
    "&bbox=" + bbox + ",EPSG:4326";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      bagPandLayer.clearLayers();

      var geojson = L.geoJSON(data, {

        style: function () {
          return {
            color: "#ff7800",
            weight: 1,
            fillOpacity: 0.2
          };
        },

        onEachFeature: function (feature, layer) {
          layer.bindPopup(
            "<b>Pand ID:</b> " + feature.properties.identificatie +
            "<br>Status: " + feature.properties.status
          );
        }

      });

      bagPandLayer.addLayer(geojson);
    });
}


// ============================
// 4. EVENTS (KAART)
// ============================

map.on("moveend", function () {
  loadBagPanden();
});

// eerste keer laden
loadBagPanden();


// ============================
// 5. DRAW TOOL (BBOX)
// ============================

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    polyline: false,
    circle: false,
    marker: false,
    circlemarker: false,
    rectangle: true
  },
  edit: {
    featureGroup: drawnItems
  }
});

map.addControl(drawControl);


// ============================
// 6. BBOX EVENT
// ============================

map.on(L.Draw.Event.CREATED, function (event) {

  var layer = event.layer;

  drawnItems.clearLayers();
  drawnItems.addLayer(layer);

  var bounds = layer.getBounds();

  exportBagFromBBox(bounds);

});


// ============================
// 7. EXPORT VIA PDOK WFS
// ============================

function exportBagFromBBox(bounds) {

  var bbox =
    bounds.getWest() + "," +
    bounds.getSouth() + "," +
    bounds.getEast() + "," +
    bounds.getNorth();

  var url =
    "https://service.pdok.nl/lv/bag/wfs/v2_0?" +
    "service=WFS&version=2.0.0&request=GetFeature" +
    "&typeName=bag:pand" +
    "&outputFormat=application/json" +
    "&srsName=EPSG:4326" +
    "&bbox=" + bbox + ",EPSG:4326";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      downloadGeoJSON(data);
    });
}


// ============================
// 8. DOWNLOAD FUNCTIE
// ============================

function downloadGeoJSON(data) {

  var blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });

  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = "bag_export.geojson";
  a.click();

  URL.revokeObjectURL(url);
}


// ============================
// 9. LAYER CONTROL
// ============================

L.control.layers(
  {
    "OpenStreetMap": osm
  },
  overlayLayers,
  {
    collapsed: false
  }
).addTo(map);
