// Nederland centrum
var map = L.map('map', {
  center: [52.1326, 5.2913], // Nederland
  zoom: 7,
  layers: [osm] // standaard baselayer
});


// -----------------------
// 🔁 LAGEN
// -----------------------

var overlayLayers = {};


// -----------------------
// 📦 PDOK BAG API (voorbeeld)
// -----------------------

// Voorbeeld: panden ophalen via PDOK locatie server
var bagLayer = L.layerGroup();

fetch("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?wt=json&q=Utrecht")
  .then(res => res.json())
  .then(data => {

    var docs = data.response.docs;

    docs.forEach(doc => {
      if (!doc.centroide_ll) return;

      // PDOK geeft coords als string: "lat lon"
      var coords = doc.centroide_ll.replace("POINT(", "").replace(")", "").split(" ");
      var lon = parseFloat(coords[0]);
      var lat = parseFloat(coords[1]);

      var marker = L.marker([lat, lon])
        .bindPopup(`
          <b>${doc.weergavenaam}</b><br>
          Type: ${doc.type}
        `);

      bagLayer.addLayer(marker);
    });

  });

overlayLayers["BAG (PDOK voorbeeld)"] = bagLayer;


// -----------------------
// 📍 EXTRA VOORBEELD LAAG
// -----------------------

var voorbeeldLayer = L.layerGroup();

var marker1 = L.marker([52.1, 5.1]).bindPopup("Voorbeeld 1");
var marker2 = L.marker([51.9, 4.5]).bindPopup("Voorbeeld 2");

voorbeeldLayer.addLayer(marker1);
voorbeeldLayer.addLayer(marker2);

overlayLayers["Voorbeeld laag"] = voorbeeldLayer;


// -----------------------
// 🎛️ LAYER CONTROL
// -----------------------

L.control.layers(
  {
    "OpenStreetMap": osm
  },
  overlayLayers,
  {
    collapsed: false
  }
).addTo(map);

