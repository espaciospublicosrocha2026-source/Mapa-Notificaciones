// ======================================================
// CONFIGURACIÓN
// ======================================================

const URL = 'https://script.google.com/macros/s/AKfycbxmiKNXuRFGrjAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec';


// ======================================================
// VARIABLES
// ======================================================

let map;
let drawnItems;

let currentColor = 'red';

let modoContador = false;
let contador = 0;
let puntosContador;

let modoEliminar = false;
let modoCirculo = false;


// ======================================================
// INICIALIZAR MAPA
// ======================================================

map = L.map('mapa').setView([-34.48, -54.33], 13);


// ======================================================
// MAPA BASE
// ======================================================

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// ======================================================
// CAPAS WMS
// ======================================================

L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers: 'sigRocha:ortofoto_urbana',
        format: 'image/png',
        transparent: true,
        opacity: 0.7
    }
).addTo(map);


// ======================================================
// GRUPO DE DIBUJOS
// ======================================================

drawnItems = new L.FeatureGroup();

map.addLayer(drawnItems);


// ======================================================
// HERRAMIENTA LEAFLET DRAW
// ======================================================

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


// ======================================================
// COLOR
// ======================================================

function setColor(color) {

    currentColor = color;

    document.getElementById('colorActual').innerHTML =
        'Color actual: ' + color;

}


// ======================================================
// EVENTO: DIBUJO CREADO
// ======================================================

map.on(L.Draw.Event.CREATED, function (event) {

    const layer = event.layer;

    // Guardamos el color utilizado
    layer.options.colorGuardado = currentColor;

    layer.setStyle({
        color: currentColor,
        fillColor: currentColor
    });

    drawnItems.addLayer(layer);

    guardarGeoJSON();

});


// ======================================================
// EVENTO: DIBUJOS EDITADOS
// ======================================================

map.on(L.Draw.Event.EDITED, function () {

    // Guardar dibujos normales
    guardarGeoJSON();

    // Guardar círculos
    guardarCirculos();

});


// ======================================================
// EVENTO: DIBUJOS ELIMINADOS
// ======================================================

map.on(L.Draw.Event.DELETED, function () {

    // Guardar dibujos normales
    guardarGeoJSON();

    // Guardar círculos
    guardarCirculos();

});


// ======================================================
// GUARDAR DIBUJOS NORMALES
// ======================================================

function guardarGeoJSON() {

    const geojson = {

        type: 'FeatureCollection',

        features: []

    };


    drawnItems.eachLayer(function (layer) {

        // IMPORTANTE:
        // Los círculos NO se guardan aquí.
        if (layer instanceof L.Circle) {

            return;

        }


        const feature = layer.toGeoJSON();


        feature.properties =
            feature.properties || {};


        feature.properties.color =
            layer.options.colorGuardado ||
            layer.options.color ||
            currentColor;


        geojson.features.push(feature);

    });


    fetch(URL, {

        method: 'POST',

        headers: {

            'Content-Type': 'text/plain'

        },

        body: JSON.stringify(geojson)

    })

    .then(response => response.text())

    .then(data => {

        console.log(
            'Dibujos guardados:',
            data
        );

    })

    .catch(error => {

        console.error(
            'Error guardando dibujos:',
            error
        );

    });

}


// ======================================================
// GUARDAR CÍRCULOS
// ======================================================

function guardarCirculos() {

    const geojson = {

        type: 'FeatureCollection',

        features: []

    };


    drawnItems.eachLayer(function (layer) {

        // Solamente círculos
        if (!(layer instanceof L.Circle)) {

            return;

        }


        const centro =
            layer.getLatLng();


        const feature = {

            type: 'Feature',

            properties: {

                tipo: 'circulo',

                radio: layer.getRadius(),

                color:
                    layer.options.colorGuardado ||
                    layer.options.color ||
                    currentColor

            },

            geometry: {

                type: 'Point',

                coordinates: [

                    centro.lng,

                    centro.lat

                ]

            }

        };


        geojson.features.push(feature);

    });


    fetch(URL, {

        method: 'POST',

        headers: {

            'Content-Type': 'text/plain'

        },

        body: JSON.stringify({

            tipo: 'circulos',

            geojson: geojson

        })

    })

    .then(response => response.text())

    .then(data => {

        console.log(
            'Círculos guardados:',
            data
        );

    })

    .catch(error => {

        console.error(
            'Error guardando círculos:',
            error
        );

    });

}


// ======================================================
// CARGAR DIBUJOS NORMALES
// ======================================================

function cargarDibujos() {

    fetch(URL)

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    'Error HTTP: ' +
                    response.status
                );

            }

            return response.json();

        })

        .then(geojson => {

            console.log(
                'Dibujos cargados:',
                geojson
            );


            L.geoJSON(

                geojson,

                {

                    filter: function (feature) {

                        // Por seguridad:
                        // si algún círculo quedó
                        // accidentalmente en dibujos.geojson,
                        // no lo cargamos aquí.

                        return !(
                            feature.properties &&
                            feature.properties.tipo === 'circulo'
                        );

                    },


                    style: function (feature) {

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
                        function (
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


                            drawnItems.addLayer(layer);

                        }

                }

            );

        })

        .catch(error => {

            console.error(
                'Error cargando dibujos:',
                error
            );

        });

}


// ======================================================
// CARGAR CÍRCULOS
// ======================================================

function cargarCirculos() {

    fetch(
        URL + '?tipo=circulos'
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    'Error HTTP: ' +
                    response.status
                );

            }

            return response.json();

        })

        .then(geojson => {

            console.log(
                'Círculos cargados:',
                geojson
            );


            if (
                !geojson ||
                !geojson.features
            ) {

                return;

            }


            geojson.features.forEach(
                function (feature) {

                    if (
                        !feature.geometry ||
                        feature.geometry.type !== 'Point'
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


                    // Guardamos el color
                    // para conservarlo al editar.
                    circulo.options.colorGuardado =
                        color;


                    drawnItems.addLayer(
                        circulo
                    );

                }
            );

        })

        .catch(error => {

            console.error(
                'Error cargando círculos:',
                error
            );

        });

}


// ======================================================
// HERRAMIENTA CÍRCULO
// ======================================================

function activarCirculo() {

    modoCirculo = !modoCirculo;


    if (modoCirculo) {

        // Desactivamos otros modos

        modoContador = false;

        modoEliminar = false;


        alert(
            'Hacé clic en el mapa para colocar el centro del círculo.'
        );

    }

}


// ======================================================
// CLICK EN EL MAPA
// ======================================================

map.on('click', function (e) {


    // --------------------------------------------------
    // ELIMINAR PUNTO DEL CONTADOR
    // --------------------------------------------------

    if (modoEliminar) {

        if (!puntosContador) {

            return;

        }


        let eliminado = false;


        puntosContador.eachLayer(
            function (layer) {

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
                    ).innerText = contador;


                    eliminado = true;

                }

            }
        );


        return;

    }


    // --------------------------------------------------
    // CONTADOR
    // --------------------------------------------------

    if (modoContador) {

        if (!puntosContador) {

            puntosContador =
                L.layerGroup().addTo(map);

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
        ).innerText = contador;


        return;

    }


    // --------------------------------------------------
    // CÍRCULO
    // --------------------------------------------------

    if (modoCirculo) {

        const input =
            document.getElementById(
                'radioCirculo'
            );


        const radio =
            Number(input.value);


        if (
            !radio ||
            radio <= 0
        ) {

            alert(
                'Ingresá un radio válido en metros.'
            );

            return;

        }


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


        circulo.options.colorGuardado =
            currentColor;


        drawnItems.addLayer(
            circulo
        );


        // Guardar únicamente
        // en circulos.geojson
        guardarCirculos();


        modoCirculo = false;


        return;

    }

});


// ======================================================
// CONTADOR
// ======================================================

function activarContador() {

    modoContador = !modoContador;

    modoEliminar = false;
    modoCirculo = false;


    if (modoContador) {

        if (!puntosContador) {

            puntosContador =
                L.layerGroup().addTo(map);

        }

    }

}


// ======================================================
// ELIMINAR PUNTO
// ======================================================

function activarEliminar() {

    modoEliminar = !modoEliminar;

    modoContador = false;
    modoCirculo = false;

}


// ======================================================
// REINICIAR CONTADOR
// ======================================================

function limpiarContador() {

    contador = 0;


    document.getElementById(
        'contadorParcelas'
    ).innerText = contador;


    if (puntosContador) {

        puntosContador.clearLayers();

    }

}


// ======================================================
// LIMPIAR DIBUJOS
// ======================================================

function limpiarDibujos() {

    if (
        !confirm(
            '¿Querés eliminar todos los dibujos y círculos?'
        )
    ) {

        return;

    }


    drawnItems.clearLayers();


    guardarGeoJSON();

    guardarCirculos();

}


// ======================================================
// EXPONER FUNCIONES AL HTML
// ======================================================

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


// ======================================================
// CARGAR INFORMACIÓN AL INICIAR
// ======================================================

cargarDibujos();

cargarCirculos();
