import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { defaultSchema } from '@hotwired/stimulus';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFya2Jlbm5ldHQiLCJhIjoiY2tyamVlcTdhMTRiYjJvbzR5eHJsdnpjbiJ9.x_spN1OL-wE2rG5I6iV-eg';

export default props => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-113.4816);
    const [lat, setLat] = useState(53.5294);
    const [zoom, setZoom] = useState(9);
    const [geoData, setGeoData] = useState();

    // Centre the map on Edmonton on load
    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: zoom
        });
    });

    // Update the coordinates and zoom on move
    useEffect(() => {
        if (!map.current) return; // wait for map to initialize
        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });

       
    });

    // useEffect(() => {
    //     const fetchData = async () => {
    //         let data = await
    //           fetch(
    //             '/places.geojson'
    //             ).then(res => res.json())
    //         console.log('apple', data)
    //         const filteredData = data.features.filter(item => {
    //             if (!item.properties.name.includes('Random')){
    //                 return item
    //             }
    //         })
    //         // console.log(data.features)
    //         setGeoData({type: 'FeatureCollection', features: filterDummy ? data.features : filteredData})
    //         return 
    //     }
    //     fetchData();
    // },[]);

    // console.log('GEODATA', JSON.stringify(geoData))
   

    useEffect(() => {
        if (!map.current) return; // wait for map to initialize
        // Display the places GeoJSON on load

        map.current.on('load', () => {
            map.current.addSource('places', {
                type: 'geojson',
                // Use a URL for the value for the `data` property.
                data: '/places.geojson',
                // add cluster
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50

            });
            
            // map.getSource("places").setData({
            //     type: 'FeatureCollection',
            //     features: features
            //   });

        map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'places',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                'step',
                ['get', 'point_count'],
                'lightgreen',
                50,
                'orange',
                200,
                'pink',
                500,
                'red',
                
                ],
                'circle-radius': [
                'step',
                ['get', 'point_count'],
                10,
                50,
                20,
                200,
                30,
                500,
                40
                ]
            }
         });

        map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'places',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 18
            }
        });

        map.current.addLayer({
            'id': 'places-layer',
            'type': 'circle',
            'source': 'places',
            'filter': ['!', ['has', 'point_count']],
            'paint': {
                'circle-radius': 4,
                'circle-stroke-width': 2,
                'circle-color': 'blue',
                'circle-stroke-color': 'white'
                
            }
        });
            
            // When a click event occurs on a feature in the places layer, open a popup at the
            // location of the feature, with description HTML from its properties.

            // inspect a cluster on click
        map.current.on('click', 'clusters', (e) => {
            const features = map.current.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });

            const clusterId = features[0].properties.cluster_id;
            map.current.getSource('places').getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;
                
                map.current.easeTo({
                    center: features[0].geometry.coordinates,
                zoom: zoom
                });
            }
            );
            });

   
            map.current.on('click', 'places-layer', (e) => {

                // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                // console.log(e.features[0].properties)
                const { name, description, lonlat, rating } = e.features[0].properties;
                
        
                // Change the contents of the place pop up:
                const nameFormat = `Name of place : ${name}`;
                const descriptionFormat = `Description: ${description}`;
                const coordinatesFormat = `Coordinates: ${lonlat}`;
                const ratingFormat = `Rating: ${rating} / 5`
                
                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`<strong>Place Information: </strong><br/><em>${nameFormat}</em><br/>${descriptionFormat}<br/>${coordinatesFormat}<br/>${ratingFormat}`)
                    .addTo(map.current);
            },[]);


 
            // Change the cursor to a pointer when the mouse is over the places layer.
            map.current.on('mouseenter', 'places-layer', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });
            
            // Change it back to a pointer when it leaves.
            map.current.on('mouseleave', 'places-layer', () => {
                map.current.getCanvas().style.cursor = '';
            });

        });
    });

    // render a polygon to the map
    useEffect(() => {
        if (!map.current) return; // wait for map to initialize
        map.current.on('load', () => {
            // Add a data source containing GeoJSON data.
            map.current.addSource('polygon', {
                'type': 'geojson',
                'data': {
                'type': 'Feature',
                'geometry': {
                'type': 'Polygon',
                'coordinates': [
                                    [
                                        [-113.35316927100915, 53.64482597964384],
                                        [-113.35941987722474, 53.61009541281007],
                                        [-113.42560453412555, 53.614453793030194],
                                        [-113.40880663475289, 53.6360706841722],
                                        [-113.35316927100915, 53.64482597964384],
                                    ]
                                ]
                            }
                        }
            });
             
            // Fill the polygon source
            map.current.addLayer({
                'id': 'polygonFill',
                'type': 'fill',
                'source': 'polygon', // reference the data source
                'layout': {},
                'paint': {
                        'fill-color': 'red', // blue color fill
                        'fill-opacity': 0.3
                    }
            });
            
            // Add outline to the polygon source
            map.current.addLayer({
                'id': 'outline',
                'type': 'line',
                'source': 'polygon',
                'layout': {},
                'paint': {
                    'line-color': '#000',
                    'line-width': 2
                }
            });
        });
    });

   
    
    return <div>
        <h1>Statvis</h1>
        <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
        <div ref={mapContainer} className="map-container" />
    </div>;
}
