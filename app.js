alert('ESTOY CARGANDO EL APP.JS NUEVO');
const URL = 'https://script.google.com/macros/s/AKfycbxmiKNXuRFGrJxAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec';

let map;
let drawnItems;

let currentColor = 'red';

let modoContador = false;
let contador = 0;
let puntosContador;

let modoEliminar = false;
let modoCirculo = false;


// =====================================================
// MAPA
// =====================================================

map = L.map('mapa').setView(
    [-34.48, -54.33],
    13
);


// =====================================================
// MAPA BASE
// =====================================================

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// =====================================================
// ORTOFOTO
// =====================================================

L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers: 'sigRocha:ortofoto_urbana',
        format: 'image/png',
        transparent: true,
        opacity: 0.7
    }
).addTo(map);


// =====================================================
// GRUPO DE DIBUJOS
// =====================================================

drawnItems = new L.FeatureGroup();

map.addLayer(drawnItems);


// =====================================================
// HERRAMIENTA LEAFLET DRAW
// =====================================================

const drawControl = new L.Control.Draw({

    position: 'topleft',

    draw: {

        polygon: true,

        polyline: true,

        rectangle: true,

        circle: false,

        marker: false,

        circlemarker: false
    },

    edit: {

        featureGroup: drawnItems
    }

});

map.addControl(drawControl);


// =====================================================
// COLOR
// =====================================================

function setColor(color) {

    currentColor = color;

    document.getElementById(
        'colorActual'
    ).innerHTML =
        'Color actual: ' + color;
}


// =====================================================
// CREACIÓN DE DIBUJOS NORMALES
// =====================================================

map.on(
    L.Draw.Event.CREATED,
    function(event) {

        const layer = event.layer;

        // Guardamos el color
        layer.options.colorGuardado =
            currentColor;

        // Aplicamos color
        layer.setStyle({

            color: currentColor,

            fillColor: currentColor

        });

        // Agregamos al grupo
        drawnItems.addLayer(layer);

        // Guardamos SOLO dibujos
        guardarGeoJSON();

    }
);


// =====================================================
// EDICIÓN
// =====================================================

map.on(
    L.Draw.Event.EDITED,
    function() {

        // Guardar dibujos
        guardarGeoJSON();

        // Guardar círculos
        guardarCirculos();

    }
);


// =====================================================
// ELIMINACIÓN
// =====================================================

map.on(
    L.Draw.Event.DELETED,
    function() {

        // Guardar dibujos
        guardarGeoJSON();

        // Guardar círculos
        guardarCirculos();

    }
);


// =====================================================
// GUARDAR DIBUJOS
// =====================================================

function guardarGeoJSON() {

    const geojson = {

        type: 'FeatureCollection',

        features: []

    };


    drawnItems.eachLayer(
        function(layer) {

            // IMPORTANTE:
            // Los círculos NO van a dibujos.geojson

            if (
                layer instanceof L.Circle
            ) {

                return;

            }


            const feature =
                layer.toGeoJSON();


            feature.properties =
                feature.properties || {};


            feature.properties.color =

                layer.options.colorGuardado ||

                layer.options.color ||

                currentColor;


            geojson.features.push(
                feature
            );

        }
    );


    console.log(
        'GUARDANDO DIBUJOS:',
        geojson
    );


    fetch(
        URL,
        {

            method: 'POST',

            headers: {

                'Content-Type':
                    'text/plain'

            },

            body:
                JSON.stringify(geojson)

        }
    )

    .then(
        function(response) {

            return response.text();

        }
    )

    .then(
        function(data) {

            console.log(
                'RESPUESTA DIBUJOS:',
                data
            );

        }
    )

    .catch(
        function(error) {

            console.error(
                'ERROR GUARDANDO DIBUJOS:',
                error
            );

        }
    );

}


// =====================================================
// GUARDAR CÍRCULOS
// =====================================================

function guardarCirculos() {

    const geojson = {

        type: 'FeatureCollection',

        features: []

    };


    drawnItems.eachLayer(
        function(layer) {

            // Ignorar todo lo que NO sea círculo

            if (
                !(layer instanceof L.Circle)
            ) {

                return;

            }


            const centro =
                layer.getLatLng();


            const feature = {

                type: 'Feature',

                properties: {

                    tipo: 'circulo',

                    radio:
                        layer.getRadius(),

                    color:

                        layer.options.colorGuardado ||

                        layer.options.color ||

                        'red'

                },

                geometry: {

                    type: 'Point',

                    coordinates: [

                        centro.lng,

                        centro.lat

                    ]

                }

            };


            geojson.features.push(
                feature
            );

        }
    );


    // =================================================
    // MUY IMPORTANTE
    // EL APPS SCRIPT ACTUAL ESPERA:
    //
    // {
    //    tipo: 'circulos',
    //    geojson: {...}
    // }
    // =================================================

    const datos = {

        tipo: 'circulos',

        geojson: geojson

    };


    console.log(
        'GUARDANDO CÍRCULOS:',
        datos
    );


    fetch(
        URL,
        {

            method: 'POST',

            headers: {

                'Content-Type':
                    'text/plain'

            },

            body:
                JSON.stringify(datos)

        }
    )

    .then(
        function(response) {

            return response.text();

        }
    )

    .then(
        function(data) {

            console.log(
                'RESPUESTA CÍRCULOS:',
                data
            );

        }
    )

    .catch(
        function(error) {

            console.error(
                'ERROR GUARDANDO CÍRCULOS:',
                error
            );

        }
    );

}


// =====================================================
// CARGAR DIBUJOS
// =====================================================

function cargarDibujos() {

    fetch(URL)

        .then(
            function(response) {

                if (!response.ok) {

                    throw new Error(
                        'Error HTTP: ' +
                        response.status
                    );

                }

                return response.json();

            }
        )

        .then(
            function(geojson) {

                console.log(
                    'DIBUJOS CARGADOS:',
                    geojson
                );


                L.geoJSON(

                    geojson,

                    {

                        // Por seguridad,
                        // ignoramos círculos si hubiera
                        // alguno viejo dentro de dibujos.geojson

                        filter:
                            function(feature) {

                                return !(
                                    feature.properties &&
                                    feature.properties.tipo ===
                                        'circulo'
                                );

                            },


                        style:
                            function(feature) {

                                const color =

                                    feature.properties &&

                                    feature.properties.color

                                        ? feature.properties.color

                                        : 'red';


                                return {

                                    color: color,

                                    fillColor: color,

                                    fillOpacity: 0.2,

                                    weight: 3

                                };

                            },


                        onEachFeature:

                            function(
                                feature,
                                layer
                            ) {

                                const color =

                                    feature.properties &&

                                    feature.properties.color

                                        ? feature.properties.color

                                        : 'red';


                                layer.options.colorGuardado =
                                    color;


                                drawnItems.addLayer(
                                    layer
                                );

                            }

                    }

                );

            }
        )

        .catch(
            function(error) {

                console.error(
                    'ERROR CARGANDO DIBUJOS:',
                    error
                );

            }
        );

}


// =====================================================
// CARGAR CÍRCULOS
// =====================================================

function cargarCirculos() {

    // IMPORTANTE:
    // El Apps Script actual utiliza ?tipo=circulos
    // SOLO para cargar.

    fetch(
        URL + '?tipo=circulos'
    )

        .then(
            function(response) {

                if (!response.ok) {

                    throw new Error(
                        'Error HTTP: ' +
                        response.status
                    );

                }

                return response.json();

            }
        )

        .then(
            function(geojson) {

                console.log(
                    'CÍRCULOS CARGADOS:',
                    geojson
                );


                if (
                    !geojson ||
                    !geojson.features
                ) {

                    return;

                }


                geojson.features.forEach(

                    function(feature) {

                        // Verificamos que sea un punto

                        if (
                            !feature.geometry ||
                            feature.geometry.type !==
                                'Point'
                        ) {

                            return;

                        }


                        const coordenadas =
                            feature.geometry.coordinates;


                        const lng =
                            coordenadas[0];


                        const lat =
                            coordenadas[1];


                        const propiedades =
                            feature.properties || {};


                        const radio =

                            Number(
                                propiedades.radio
                            ) || 100;


                        const color =

                            propiedades.color ||

                            'red';


                        // Crear círculo

                        const circulo =

                            L.circle(

                                [lat, lng],

                                {

                                    radius: radio,

                                    color: color,

                                    fillColor: color,

                                    fillOpacity: 0.2,

                                    weight: 3

                                }

                            );


                        // Guardar color

                        circulo.options.colorGuardado =
                            color;


                        // Agregar al grupo editable

                        drawnItems.addLayer(
                            circulo
                        );

                    }

                );

            }
        )

        .catch(
            function(error) {

                console.error(
                    'ERROR CARGANDO CÍRCULOS:',
                    error
                );

            }
        );

}


// =====================================================
// ACTIVAR CÍRCULO
// =====================================================

function activarCirculo() {

    modoCirculo =
        !modoCirculo;


    if (modoCirculo) {

        // Desactivar otros modos

        modoContador = false;

        modoEliminar = false;


        alert(
            'Hacé clic en el mapa para colocar el centro del círculo.'
        );

    }

}


// =====================================================
// CLICK EN EL MAPA
// =====================================================

map.on(
    'click',
    function(e) {


        // =================================================
        // ELIMINAR PUNTO DEL CONTADOR
        // =================================================

        if (modoEliminar) {

            if (!puntosContador) {

                return;

            }


            let eliminado = false;


            puntosContador.eachLayer(

                function(layer) {

                    const distancia =

                        map.distance(

                            e.latlng,

                            layer.getLatLng()

                        );


                    if (

                        distancia <= 20 &&

                        !eliminado

                    ) {

                        puntosContador.removeLayer(
                            layer
                        );


                        contador--;


                        document.getElementById(
                            'contadorParcelas'
                        ).innerText =
                            contador;


                        eliminado = true;

                    }

                }

            );


            return;

        }


        // =================================================
        // CONTADOR
        // =================================================

        if (modoContador) {

            if (!puntosContador) {

                puntosContador =
                    L.layerGroup()
                        .addTo(map);

            }


            const punto =

                L.circleMarker(

                    e.latlng,

                    {

                        radius: 6,

                        color: 'black',

                        fillColor: 'black',

                        fillOpacity: 1

                    }

                );


            puntosContador.addLayer(
                punto
            );


            contador++;


            document.getElementById(
                'contadorParcelas'
            ).innerText =
                contador;


            return;

        }


        // =================================================
        // CREAR CÍRCULO
        // =================================================

        if (modoCirculo) {

            const input =

                document.getElementById(
                    'radioCirculo'
                );


            const radio =

                Number(
                    input.value
                );


            if (
                !radio ||
                radio <= 0
            ) {

                alert(
                    'Ingresá un radio válido en metros.'
                );

                return;

            }


            // Crear círculo

            const circulo =

                L.circle(

                    e.latlng,

                    {

                        radius: radio,

                        color: currentColor,

                        fillColor: currentColor,

                        fillOpacity: 0.2,

                        weight: 3

                    }

                );


            // Guardar color

            circulo.options.colorGuardado =
                currentColor;


            // Agregar al grupo

            drawnItems.addLayer(
                circulo
            );


            // Guardar SOLO círculos

            guardarCirculos();


            // Desactivar modo círculo

            modoCirculo = false;


            return;

        }

    }

);


// =====================================================
// ACTIVAR CONTADOR
// =====================================================

function activarContador() {

    modoContador =
        !modoContador;


    modoEliminar = false;

    modoCirculo = false;


    if (modoContador) {

        if (!puntosContador) {

            puntosContador =
                L.layerGroup()
                    .addTo(map);

        }

    }

}


// =====================================================
// ACTIVAR ELIMINAR
// =====================================================

function activarEliminar() {

    modoEliminar =
        !modoEliminar;


    modoContador = false;

    modoCirculo = false;

}


// =====================================================
// LIMPIAR CONTADOR
// =====================================================

function limpiarContador() {

    contador = 0;


    document.getElementById(
        'contadorParcelas'
    ).innerText =
        contador;


    if (puntosContador) {

        puntosContador.clearLayers();

    }

}


// =====================================================
// LIMPIAR TODOS LOS DIBUJOS
// =====================================================

function limpiarDibujos() {

    if (
        !confirm(
            '¿Querés eliminar todos los dibujos y círculos?'
        )
    ) {

        return;

    }


    drawnItems.clearLayers();


    // Vaciar dibujos.geojson

    guardarGeoJSON();


    // Vaciar circulos.geojson

    guardarCirculos();

}


// =====================================================
// HACER FUNCIONES DISPONIBLES PARA HTML
// =====================================================

window.setColor =
    setColor;

window.limpiarDibujos =
    limpiarDibujos;

window.activarContador =
    activarContador;

window.limpiarContador =
    limpiarContador;

window.activarEliminar =
    activarEliminar;

window.activarCirculo =
    activarCirculo;


// =====================================================
// CARGAR INFORMACIÓN AL INICIAR
// =====================================================

cargarDibujos();

cargarCirculos();
