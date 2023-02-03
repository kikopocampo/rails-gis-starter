import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { defaultSchema } from '@hotwired/stimulus';
import ResultList from './resultList';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFya2Jlbm5ldHQiLCJhIjoiY2tyamVlcTdhMTRiYjJvbzR5eHJsdnpjbiJ9.x_spN1OL-wE2rG5I6iV-eg';

export default props => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-113.4816);
    const [lat, setLat] = useState(53.5294);
    const [zoom, setZoom] = useState(9);
    const [filterW, setFilterW] = useState("");
    const [geoData, setGeoData]= useState([]);
    const [filterGeoData, setFilterGeoData] = useState([]);
    console.log('GeoData:' , geoData)
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

    useEffect(() => {
        if (!map.current) return; // wait for map to initialize
        // Display the places GeoJSON on load
        map.current.on('load', async() => {
            const dataFetch = await
              fetch(
                '/places.geojson'
                );
            const data = await dataFetch.json();
            setGeoData(data)
            setFilterGeoData(data)
         
            map.current.addSource('places', {
                type: 'geojson',
                // Use a URL for the value for the `data` property.
                // data: '/places.geojson',
                data: data,
                // data: filterGeoData ? filterGeoData : data,

                // add cluster
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });
    
        // places layer
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


        // cluster layer
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

         // cluster count layer
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
        
            // When a click event occurs on a feature in the places layer, open a popup at the
            // location of the feature, with description HTML from its properties.

            // inspect a cluster on click, zooming on the target cluster
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
            const nameFormat = `<strong>Name of place :</strong> ${name}`;
            const descriptionFormat = `<strong>Description :</strong> ${description}`;
            const coordinatesFormat = `<strong>Coordinates :</strong> ${lonlat}`;
            const ratingFormat = `<strong>Rating :</strong> ${rating} / 5`
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            
            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`<strong>Place Information: </strong><br/>${nameFormat}<br/>${descriptionFormat}<br/>${coordinatesFormat}<br/>${ratingFormat}`)
                .addTo(map.current);
                
        });
 
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
        <form>  
            <label htmlFor="filters">Filter ice cream shops:</label>
            <input type="text" id="filters" name="filters" onChange={(e)=>{
            e.preventDefault();
            setFilterW(e.target.value.trim().toLowerCase())
         
            const filteredShops = geoData.features.slice().filter(el => {
                    return el.properties.name.toLowerCase().includes(filterW)
            }  
                )
            const geojsonSource = map.current.getSource('places');
            // filter data based on input
            geojsonSource.setData({type: 'FeatureCollection', features: filteredShops})
            setFilterGeoData({type: 'FeatureCollection', features: filteredShops})
            
        }}/></form>
        <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
        <div ref={mapContainer} className="map-container" />
        <div><ResultList result={filterGeoData.features || []}/></div>
    </div>;
}
