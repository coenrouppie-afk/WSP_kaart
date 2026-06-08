// ============================
// 1. KAART INITIALISEREN
// ============================

// Nederland + baselayer
var map = L.map('map', {
  center: [52.1326, 5.2913],
  zoom: 7,
  layers: [osm]
});


// ============================
// 2. LAGEN DEFINIËREN
// ============================

var overlayLayers = {};

// BAG layer (LEEG starten!)
var bagPandLayer = L.layerGroup();
overlayLayers["BAG Panden (PDOK)"] = bagPandLayer;


// ============================
// 3. BAG FUNCTIE (ZEER BELANGRIJK)
// ============================

function loadBagPanden() {

  // ✅ STOP als te ver uitgezoomd (anders crash je browser)
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

  var url = "https://service.pdok.nl/lv/bag/wfs/v2_0?" +
    "service=WFS&version=2.0.0&request=GetFeature" +
    "&typeName=bag:pand" +
    "&outputFormat=application/json" +
    "&srsName=EPSG:4326" +
    "&bbox=" + bbox + ",EPSG:4326";

  fetch(url)
    .then(res => res.json())
    .then(data => {

      // oude data verwijderen
      bagPandLayer.clearLayers();

      var geojson = L.geoJSON(data, {
        style: function(feature) {
          return {
            color: "#ff7800",
            weight: 1,
            fillOpacity: 0.2
          };
        },

        onEachFeature: function(feature, layer) {
          layer.bindPopup(`
            <b>Pand ID:</b> ${feature.properties.identificatie}<br>
            Status: ${feature.properties.status}
          `);
        }

      });

      bagPandLayer.addLayer(geojson);

    });
}


// ============================
// 4. EVENTS (WANNEER LADEN)
// ============================

// 🔁 elke keer als je beweegt
map.on("moveend", function () {
  loadBagPanden();
});


// ============================
// 5. EERSTE LOAD (INIT)
// ============================

loadBagPanden();


// ============================
// 6. LAYER CONTROL (LAATSTE)
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
