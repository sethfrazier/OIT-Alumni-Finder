function getMap(){

    var myMap;
    var selectedMarkerClusterGroup;

    /* jquery variables */
    var $neighborhoodSelectBox = $('#neigbhorbood-select-box');
    var $filterFeedback = $('#filter-feedback');
    var $neighborhoodDisplayText = $('#displayed-neighborhood');
    var $degreeSelectBox = $('#degree-select-box');

    /* default map values */
    var pdxCenterCoords = [45.5410, -122.6769];
    //var defaultZoom = getZoomValue();
    var defaultZoom = 6;
    
    /*limits to panning*/
    //var southWest = L.latLng(45.411, -123.00),
    //northEast = L.latLng(45.67, -122.452);
    //var bounds = L.latLngBounds(southWest, northEast);

     /* pseudo-globals for map */
    var selectedNeighborhood = '';
    var selectedTreeCondition = '';
    var selectedPresenceOfWires = '';
    var selectedFunctionalType = '';
    var selectedDegree = '';

    var allNbhdData = [{
        condition: 'Good',      //Total values of each class of tree
        value: 35.40            //77152 
    },{
        condition: 'Fair',
        value: 55.33            //120576
    },{
        condition: 'Poor',
        value: 8.42             //18346
    },{
        condition: 'Dead',
        value: 0.85             //1852
    }];

    /* variables to populate with values from the geojson so they can be easily consumed 
    in other functions */
    var allBounds = {};
    var allConditions = {};

    var treeConditionRadioButtons = document.getElementsByName("treeCondition");
    var presenceOfWiresCheckBox = document.getElementById("presence-of-wires-checkbox");
    var functionalTypeRadioButtons = document.getElementsByName("functionalTypeFilter");

    /* tile layers */
    var cartoDB = L.tileLayer.provider('CartoDB.Positron');
    var EsriImgagery = L.tileLayer.provider('Esri.WorldImagery');

    var baseMaps = {
        '<span class="tileLayer__text">Map</span>': cartoDB,
        '<span class="tileLayer__text">Satellite Imagery</span>': EsriImgagery,
    };
    
    /* create Leaflet map object */
    myMap = L.map('map', {layers: [cartoDB]}).setView(pdxCenterCoords, defaultZoom);
    
    //set bounds and animate the edge of panning area
    //myMap.setMaxBounds(bounds);
    //myMap.on('drag', function() {
        //myMap.panInsideBounds(bounds, { animate: true });
    //});

    L.tileLayer.provider('CartoDB.Positron').addTo(myMap);
    L.control.layers(baseMaps).addTo(myMap);
    myMap.zoomControl.setPosition('bottomright');
    myMap.options.minZoom = 5;
    myMap.options.maxZoom = 18;

    getData(myMap, selectedNeighborhood);
    
    //getNeighborhoodPoly(myMap);

    /* retrieve list of distinct neighborhoods from database and set event listeners on select box */
    getNeighborhoodList();

    //setChart(allNbhdData);
    //updateLegend(allNbhdData);

    /* event listeners for filters */
    for (var i = 0; i  < treeConditionRadioButtons.length; i++) {
        treeConditionRadioButtons[i].addEventListener('click', function() {
            selectedTreeCondition = this.value;
            // only make call if there is a value for the selected neigbhorhood
            if (selectedNeighborhood.length) {
                filterAttributes();
            }
        });
    }
    
    /*presenceOfWiresCheckBox.addEventListener('click', function() {
        if (presenceOfWiresCheckBox.checked) {
            selectedPresenceOfWires = this.value;
        } else {
            selectedPresenceOfWires = '';
        }
        if (selectedNeighborhood.length) {
            filterAttributes();
        }
    });*/

    for (var i = 0; i  < functionalTypeRadioButtons.length; i++) {
        functionalTypeRadioButtons[i].addEventListener('click', function() {
            selectedFunctionalType = this.value;
            if (selectedNeighborhood.length) {
                filterAttributes();
            }
        });
    }

    function getData(map, neighborhood, degree) {
        var ajaxCall = createAjaxCall(neighborhood, degree);
        console.log("in getDataFunction: "+ajaxCall)
        $.ajax(ajaxCall, {
            dataType: 'json',
            success: function(response) {
                if (!response.features.length) {
                    //if (!neighborhood || neighborhood === 'ALL') {
                    //    return;
                    //}
                    // only trigger feedback if a single neighborhood is selected
                    displayFilterFeedback('0 results for selected filter(s)');
                }

                var geojsonLayer = L.geoJson(response, {
                    pointToLayer: pointToLayer
                });

                // add new markers
                var markers = L.markerClusterGroup({
                    disableClusteringAtZoom: 18,
                    showCoverageOnHover: true,
                    zoomToBoundsOnClick: true,
                    spiderfyOnMaxZoom: true,
                    polygonOptions: {
                        color: '#66bd63',
                        weight: 2,
                        opacity: 0.9 
                    }
                });
                selectedMarkerClusterGroup = markers;
                markers.addLayer(geojsonLayer);
                map.addLayer(markers);
            }
        });
    }
    
   

    getDegreeList();

    function getDegreeList(){
        if (selectedNeighborhood === 'ALL'){
            lUrl = "https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT major FROM alumnibyzip2019";
            lQurery = " ORDER BY major ASC";
        } else if(selectedNeighborhood!=="ALL"){
            //$('#degree-select-box').empty();
            lUrl = "https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT major FROM alumnibyzip2019";
            lQurery = " WHERE college ILIKE '" + selectedNeighborhood + "' ORDER BY major ASC";
        }

        console.log(lUrl+lQurery);
        //"https://sfrazier.carto.com/api/v2/sql/?q=SELECT DISTINCT major FROM alumnibyzip2019 WHERE college ILIKE '"+selectedNeighborhood+"' ORDER BY major ASC"

        $.getJSON(lUrl+lQurery, function(data) {
            $.each(data.rows, function(key, val) {
                if (val.college !== '') {
                    $degreeSelectBox.append($('<option/>', {
                        value: val.major,
                        text : val.major
                    }));
                }
            });

            $degreeSelectBox.on('change', function() {
                selectedDegree = this.value;
                if (selectedDegree === 'ALL' || selectedDegree === false) {

                    // set display text of selected neighborhood in info panel heading
                    selectNeighborhood = $("#degree-select-box option:selected").text();
                    console.log(selectedDegree +' in select degree box');
                    $neighborhoodDisplayText.text('All Degrees');
                } else {

                    // set display text of selected neighborhood in info panel heading
                    console.log(selectedDegree +' in select box1');
                    $neighborhoodDisplayText.text(selectedDegree);
                }

                //if previous marker cluster group exists, remove it
                if (selectedMarkerClusterGroup) {
                    myMap.removeLayer(selectedMarkerClusterGroup);
                } 

                //if previous marker cluster group exists, remove it
                if (selectedMarkerClusterGroup) {
                    myMap.removeLayer(selectedMarkerClusterGroup);
                } 
                
                if (selectedDegree === 'ALL') {
                    // zoom out to city 
                    //myMap.setView(pdxCenterCoords, defaultZoom);
                    //$('#degree-select-box').empty();
                    //getDegreeList();
                    //updateChart(allNbhdData);
                    //updateLegend(allNbhdData);
                } else {
                    //$('#degree-select-box').empty();
                    //getDegreeList();
                    //var selectedNeighborhoodBounds = allBounds[selectedNeighborhood];
                    //var selectedNeighborhoodTreeCondition = allConditions[selectedNeighborhood];
                    //myMap.fitBounds(selectedNeighborhoodBounds);
                    //updateChart(selectedNeighborhoodTreeCondition);
                    //updateLegend(selectedNeighborhoodTreeCondition);
                }

                getData(selectedDegree);
            })
        }); 
        
        //$('#degree-select-box').empty();
    }
    
    schoolVal = $neighborhoodSelectBox.text;
    console.log("outside "+ schoolVal);

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

            // set event listener on neighborhood select box
            $neighborhoodSelectBox.on('change', function() {
                selectedNeighborhood = this.value;
                if (selectedNeighborhood === 'ALL' || selectedNeighborhood === false) {
                    // disable all filters and clear filter values
                    //selectedTreeCondition = '';
                    //treeConditionRadioButtons[0].checked=true;
                    //for (var i = 0; i < treeConditionRadioButtons.length;  i++){
                        //treeConditionRadioButtons[i].disabled = true;
                    //}
                    //selectedFunctionalType = '';
                    //functionalTypeRadioButtons[0].checked=true;
                    //for (var i = 0; i < functionalTypeRadioButtons.length;  i++){
                        //functionalTypeRadioButtons[i].disabled = true;
                    //}
                    //selectedPresenceOfWires = '';
                    //presenceOfWiresCheckBox.checked=false;
                    //presenceOfWiresCheckBox.disabled=true;

                    // set display text of selected neighborhood in info panel heading
                    //getDegreeList();
                    selectNeighborhood = $("#neighborhood-select-box option:selected").text();
                    console.log(selectedNeighborhood +' in select box');
                    $neighborhoodDisplayText.text('All Alumni');
                } else {
                    //enable radio buttons
                    //for (var i = 0; i < treeConditionRadioButtons.length;  i++){
                       // treeConditionRadioButtons[i].disabled = false;
                    //}
                    //for (var i = 0; i < functionalTypeRadioButtons.length;  i++){
                    //    functionalTypeRadioButtons[i].disabled = false;
                    //}
                    // enable checkbox
                    //presenceOfWiresCheckBox.disabled = false;

                    // set display text of selected neighborhood in info panel heading
                    console.log(selectedNeighborhood +' in select box1');
                    $neighborhoodDisplayText.text(selectedNeighborhood);
                }

                //if previous marker cluster group exists, remove it
                if (selectedMarkerClusterGroup) {
                    myMap.removeLayer(selectedMarkerClusterGroup);
                } 
                
                if (selectedNeighborhood === 'ALL') {
                    // zoom out to city 
                    myMap.setView(pdxCenterCoords, defaultZoom);
                    $('#degree-select-box').empty();
                    getDegreeList();
                    //updateChart(allNbhdData);
                    //updateLegend(allNbhdData);
                } else {
                    $('#degree-select-box').empty();
                    getDegreeList();
                    var selectedNeighborhoodBounds = allBounds[selectedNeighborhood];
                    var selectedNeighborhoodTreeCondition = allConditions[selectedNeighborhood];
                    //myMap.fitBounds(selectedNeighborhoodBounds);
                    //updateChart(selectedNeighborhoodTreeCondition);
                    //updateLegend(selectedNeighborhoodTreeCondition);
                }

                getData(myMap, selectedNeighborhood);

            });
        });
    }
    console.log("line 319 "+selectedNeighborhood);
    function filterAttributes() {
        //if previous marker cluster group exists, remove it
        if (selectedMarkerClusterGroup) {
            myMap.removeLayer(selectedMarkerClusterGroup);
        }
        getData(myMap, selectedNeighborhood);
    }

    function pointToLayer(feature, latlng) {
        var geojsonMarkerOptions =  {
            radius: 6,
            //fillColor: getFillColor(feature.properties.condition),
            fillColor: '#0000ff',
            color: '#f2f2f2',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        };

        var layer = L.circleMarker(latlng, geojsonMarkerOptions);
        var popupContent = createPopupContent(feature.properties);
        layer.bindPopup(popupContent);
        return layer;
    }

    function getZoomValue() {
        var clientWidth = document.documentElement.clientWidth;

        if (clientWidth < 500) {
            return 8;
        } else if (clientWidth < 1000) {
            return 10;
        } else  {
            return 11.49;
        }
    }

    function createPopupContent(props) {
        //reformat text for No HV wire prop to more user-friendly text
        var wiresProps = props.wires === 'No HV' ? 'No high voltage' : props.wires;

        var popupTitle = "<h1>" + props.major.toUpperCase()  + "</h1>";
        var treeScientificName = createPopupAttributeText("Scientific Name: ", props.scientific);
        var treeAddress = createPopupAttributeText("Address: ", props.address);
        //var treeCondition = createPopupAttributeText("Tree Condition: ", props.condition);
        //var wiresPresent = createPopupAttributeText("Wires Present: ", wiresProps);
        //var functionalType = createPopupAttributeText("Functional Type: ", convertTreeTypeToText(props.functional));
        var popupContent = popupTitle+ "<hr>" + treeAddress  + treeScientificName //+ treeCondition + wiresPresent + functionalType;
    
        return popupContent;
    }


    function createPopupAttributeText(labelName, propValue) {
        return "<div class='popupAttributes'><span class='labelName'>" + labelName + "</span> " + propValue + "</div>";
    }

    function createAjaxCall(neighborhood, selectedDegree) {
        if (neighborhood === "SULLIVAN'S GULCH") {
            // the correct way to escape a SQL apostrophe or single quote 
            // is with two single quotes
            neighborhood = "SULLIVAN''S GULCH";
        }

        if (neighborhood==="ALL"){
            var url = "https://sfrazier.carto.com/api/v2/sql/?format=GeoJSON&q=";
            var query = query = "SELECT * FROM alumnibyzip2019";
        } else if(neighborhood!=="ALL"){
            var url = "https://sfrazier.carto.com/api/v2/sql?format=GeoJSON&q=";
            var query = "SELECT * FROM alumnibyzip2019 WHERE college ILIKE '" + neighborhood + "'";
        }

         //if (selectedDegree==="ALL"){
            //var url = "https://sfrazier.carto.com/api/v2/sql/?format=GeoJSON&q=";
            //query += "WHERE major ILIKE '" +selectedDegree+"'";
        //} else 
        
        if(selectedDegree!=="ALL"){
            //var url = "https://sfrazier.carto.com/api/v2/sql?format=GeoJSON&q=";
            query += "AND major ILIKE '" + selectedDegree + "'";
        }

        console.log("createajaxCall degree: "+ selectedDegree);
        
        if (selectedTreeCondition) {
            query += "AND lower(condition) = '" + selectedTreeCondition + "'";
        }

        if (selectedPresenceOfWires) {
            query += "AND lower(wires) = '" + selectedPresenceOfWires + "'";
        }

        if (selectedFunctionalType) {
            query += "AND lower(functional) = '" + selectedFunctionalType + "'";
        }
        var ajaxString = url + query;
        return ajaxString;
    }

    function displayFilterFeedback(feedbackText) {
        $filterFeedback.hide();
        $filterFeedback.text('');
        $filterFeedback.fadeIn('slow').text(feedbackText);
    }
    
}

$(document).ready(getMap);

