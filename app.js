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

// BAG layer
var bagPandLayer = L.layerGroup().addTo(map); // ✅ direct zichtbaar
overlayLayers["BAG Panden (PDOK)"] = bagPandLayer;


// ============================
// 3. BAG DATA LADEN (FIXED)
// ============================

function loadBagPanden() {

  // ✅ Alleen laden als je goed ingezoomd bent
  if (map.getZoom() < 10) {
    bagPandLayer.clearLayers();
    console.log("Te ver uitgezoomd");
    return;
  }

  var bounds = map.getBounds();

  var bbox =
    bounds.getWest() + "," +
    bounds.getSouth() + "," +
    bounds.getEast() + "," +
    bounds.getNorth();

  console.log("BBOX:", bbox);

  var url =
    "https://service.pdok.nl/lv/bag/wfs/v2_0?" +
    "service=WFS&version=2.0.0&request=GetFeature" +
    "&typeNames=bag:pand" +   // ✅ BELANGRIJK
    "&outputFormat=application/json" +
    "&srsName=EPSG:4326" +
    "&count=1000" +           // ✅ voorkomt lege responses
    "&bbox=" + bbox + ",EPSG:4326";

  console.log("WFS URL:", url);

  fetch(url)
    .then(res => res.json())
    .then(data => {

      console.log("Aantal features:", data.features.length);

      bagPandLayer.clearLayers();

      if (data.features.length === 0) {
        console.log("Geen data → probeer verder inzoomen");
        return;
      }

      var geojson = L.geoJSON(data, {
        style: {
          color: "red",
          weight: 1,
          fillOpacity: 0.3
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(
            "<b>Pand ID:</b> " + feature.properties.identificatie +
            "<br>Status: " + feature.properties.status
          );
        }
      });

      bagPandLayer.addLayer(geojson);

    })
    .catch(err => console.error("Fout:", err));
}


// ============================
// 4. EVENTS (KAART)
// ============================

map.on("moveend", function () {
  loadBagPanden();
});


// ============================
// 5. TEST LOAD (UTRECHT fallback)
// ============================

function testLoad() {

  var url =
    "https://service.pdok.nl/lv/bag/wfs/v2_0?" +
    "service=WFS&version=2.0.0&request=GetFeature" +
    "&typeNames=bag:pand" +
    "&outputFormat=application/json" +
    "&srsName=EPSG:4326" +
    "&count=1000" +
    "&bbox=5.12,52.09,5.13,52.10,EPSG:4326";

  fetch(url)
    .then(res => res.json())
    .then(data => {

      console.log("TEST features:", data.features.length);

      var geojson = L.geoJSON(data, {
        style: { color: "blue" }
      });

      bagPandLayer.addLayer(geojson);
    });
}

// 🔥 gebruik tijdelijk om te testen
testLoad();


// ============================
// 6. DRAW TOOL (BBOX)
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
// 7. EXPORT VIA BBOX
// ============================

map.on(L.Draw.Event.CREATED, function (event) {

  var layer = event.layer;

  drawnItems.clearLayers();
  drawnItems.addLayer(layer);

  var bounds = layer.getBounds();

  exportBag(bounds);

});


function exportBag(bounds) {

  var bbox =
    bounds.getWest() + "," +
    bounds.getSouth() + "," +
    bounds.getEast() + "," +
    bounds.getNorth();

  var url =
    "https://service.pdok.nl/lv/bag/wfs/v2_0?" +
    "service=WFS&version=2.0.0&request=GetFeature" +
    "&typeNames=bag:pand" +
    "&outputFormat=application/json" +
    "&srsName=EPSG:4326" +
    "&count=1000" +
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
