
 var $degreeSelectBox = $('#degree-select-box');
 var $neighborhoodSelectBox = $('#neigbhorbood-select-box');
 var $marriedSelectBox = $('#married-select-box');
 var $yearSelectBox = $('#year-select-box');

//function createMap(){
    //create the map with map options
    var myMap = L.map('map',{
        center: [47.6366, -117.41119],
        zoom: 16,
        maxZoom: 19,
        minZoom: 14, 
});

var cartoDB = L.tileLayer.provider('CartoDB.Positron');
var EsriImgagery = L.tileLayer.provider('Esri.WorldImagery');

var baseMaps = {
    '<span class="tileLayer__text">Map</span>': cartoDB,
    '<span class="tileLayer__text">Satellite Imagery</span>': EsriImgagery,
};

L.tileLayer.provider('CartoDB.Positron').addTo(myMap);
//Load layercontrol
L.control.layers(baseMaps, {
    //collapsed: false, // keep the list open.
   // autoZIndex: true, // Assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off
}).addTo(myMap);

myMap.zoomControl.setPosition('bottomright');

getDegreeList();
getNeighborhoodList();
getYearList();
getMarriedList();

function getDegreeList(){

    $.getJSON("https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT major FROM alumnibyzip2019 WHERE college ILIKE 'College of ETM' ORDER BY major ASC" , function(data) {
        $.each(data.rows, function(key, val) {
            if (val.college !== '') {
                $degreeSelectBox.append($('<option/>', {
                    value: val.major,
                    text : val.major
                }));
            }
        });
    });    
}


function getNeighborhoodList() {
    $.getJSON("https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT college FROM alumnibyzip2019 ORDER BY college ASC", function(data) {
        $.each(data.rows, function(key, val) {
            if (val.college !== '') {
                $neighborhoodSelectBox.append($('<option/>', {
                    value: val.college,
                    text : val.college
                }));
            }
        });
    });
}    

function getYearList() {
    $.getJSON("https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT primarycla FROM alumnibyzip2019 ORDER BY primarycla ASC", function(data) {
        $.each(data.rows, function(key, val) {
            if (val.college !== '') {
                $yearSelectBox.append($('<option/>', {
                    value: val.primarycla,
                    text : val.primarycla
                }));
            }
        });
    });
}  

function getMarriedList() {
    $.getJSON("https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT spousealum FROM alumnibyzip2019 ORDER BY spousealum ASC", function(data) {
        $.each(data.rows, function(key, val) {
            if (val.college !== '') {
                $marriedSelectBox.append($('<option/>', {
                    value: val.spousealum,
                    text : val.spousealum
                }));
            }
        });
    });
} 



// Function to load the park features onto the map
//function loadParkFeatures(sqlFilteredQueryFeat) {
function loadParkFeatures() {

    // If the layer is already shown on the map, remove it
    if (myMap.hasLayer(parkFeatures)) {
        console.log('removing')
        myMap.removeLayer(parkFeatures);
    }

    // Run the specified sqlQuery from CARTO, return it as a JSON, convert it to a Leaflet GeoJson, and add it to the map with a popup

    // For the data source, enter the URL that goes to the SQL API, including our username and the SQL query
    $.getJSON("https://sfrazier.carto.com/api/v2/sql?format=GeoJSON&q="+ sqlFilteredQueryFeat, function (data) {
        console.log(sqlFilteredQueryFeat);
        // Convert the JSON to a Leaflet GeoJson
        parkFeatures = L.geoJson(data, {

            // Create a style for the points
            pointToLayer: function (feature, latlng) {
                
                //get the feature category to use its icon
                //var featureType = feature.properties.feattype;
                return L.circleMarker(latlng, {
                    fillColor: '#5d0000',
                    fillOpacity: 1,
                    color: '#ffffff',
                    weight: 0.25,
                    opacity: 1,
                    radius: 2.5
                
                    return L.marker(latlng,{
                        //icon: getParkFeatureIcon(featureType)
                
                });
            },

            // Loop through each feature
            onEachFeature: function (feature, layer) {
                // console.log(feature.properties)

                // Bind the name to a popup
                layer.bindPopup('<b>'+feature.properties.feattype+'</b> <br>'+feature.properties.featname);

            }
        
        //}).addTo(myMap)

        }).addTo(parkFeaturesGroup);

        // Turn the layer on by default
        myMap.addLayer(parkFeaturesGroup);
    });

}
function getMap(){

}

$(document).ready(getMap);