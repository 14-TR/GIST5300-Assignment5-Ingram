var Main;

require(
    [
        "esri/Map",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/layers/ElevationLayer",
        "esri/views/SceneView",
        "esri/widgets/Search"
    ],
    function(
       Map, Graphic, GraphicsLayer, ElevationLayer, SceneView, Search
    ) {
        $(document).ready(function() {
            Main = (function() {
                let layer = new ElevationLayer({
                    url: "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
                });
                
                var map = new Map({
                    basemap: "hybrid",
                    ground: {
                        layers: [layer]
                    }
                });

                var view = new SceneView({
                    container: "map",
                    viewingMode: "global",
                    map: map,
                    camera: {
                        position: {
                            x: -105.503,
                            y: 44.270,
                            z: 20000000,
                            spatialReference: {
                                wkid: 4326
                            }
                        },
                        heading: 0,
                        tilt: 0
                    },
                    popup: {
                        dockEnabled: true,
                        dockOptions: {
                            breakpoint: false
                        }
                    },
                    environment: {
                        lighting: {
                            directShadowsEnabled: false
                        }
                    }
                });

                const initMap = function() {
                    const graphicsLayer = new GraphicsLayer({
                        featureReduction: {
                            type: "cluster",
                            clusterRadius: "150000px",
                            popupTemplate: {
                                title: "Cluster Summary",
                                content: function (event) {
                                    const graphics = event.graphic.attributes.clusteredGraphics;
                                    let contentString = "<ul>";
                                    graphics.forEach((graphic) => {
                                        contentString += `<li>${graphic.attributes.city}, ${graphic.attributes.state}</li>`;
                                    });
                                    contentString += "</ul>"; 
                                    return contentString;
                                }
                            },
                            clusterMinSize: "24px",
                            clusterMaxSize: "60px",
                            labelingInfo: [{
                                deconflictionStrategy: "none",
                                symbol: {
                                    type: "text",
                                    color: "white",
                                    font: {
                                        size: 12,
                                        family: "Arial",
                                        weight: "bold"
                                    }
                                },
                                labelPlacement: "center-center",
                                labelExpressionInfo: {
                                    expression: "Text($feature.cluster_count, '#,###')"
                                }
                            }]
                        }
                    });
                    map.add(graphicsLayer);

                    // pnts = {name: {city: "city", state: "state", coord: [x, y]}}
                    for (const [key, value] of Object.entries(myStuff)) {
                        const point = {
                            type: "point", 
                            x: value.coord[0],
                            y: value.coord[1],
                            z: 10000
                        };
                  
                        const markerSymbol = {
                            type: "simple-marker", 
                            color: [0, 0, 255],
                            outline: {
                                color: [255, 255, 255],
                                width: 2
                            }
                        };
                      
                        const pointGraphic = new Graphic({
                            geometry: point,
                            symbol: markerSymbol,
                            attributes: {
                                city: value.city,
                                state: value.state
                            },
                            popupTemplate: {
                                title: key + ": " + value.city + ", " + value.state
                            }
                        });

                        graphicsLayer.add(pointGraphic);
                    }
                    
                    // zoom to point on click
                    view.on("click", function(event) {
                        view.hitTest(event).then(function(response) {
                            var results = response.results;
                            if (results.length > 0) {
                                var graphic = results.filter(function(result) {
                                    return result.graphic.layer === graphicsLayer;
                                })[0].graphic;

                                if (graphic) {
                                    view.goTo({
                                        target: graphic.geometry,
                                        zoom: 10
                                    });
                                }
                            }
                        });
                    });

                    // search cities
                    var searchWidget = new Search({
                        view: view,
                        sources: [{
                            layer: graphicsLayer,
                            searchFields: ["name"],
                            displayField: "name",
                            exactMatch: false,
                            outFields: ["*"],
                            name: "Cities",
                            placeholder: "Search city"
                        }]
                    });

                    view.ui.add(searchWidget, {
                        position: "top-right"
                    });
                }

                initMap();

                return {};
            })();
        });
    });
