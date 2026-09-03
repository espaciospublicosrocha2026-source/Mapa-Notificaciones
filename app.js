const URL = 'https://script.google.com/macros/s/AKfycbw2SXmohpdMj2LHgWGq-LFEIjjkA1JezHLPDW2BW-GJyO352iWGZTnTh1rE3EFT_bwnXw/exec';


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
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// =====================================================
// ORTOFOTO
// =====================================================

L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:
            'sigRocha:ortofoto_urbana',

        format:
            'image/png',

        transparent:
            true,

        opacity:
            0.7
    }
).addTo(map);


// =====================================================
// GRUPO DE DIBUJOS
// =====================================================

drawnItems =
    new L.FeatureGroup();

map.addLayer(
    drawnItems
);


// =====================================================
// LEAFLET DRAW
// =====================================================

const drawControl =
    new L.Control.Draw({

        position:
            'topleft',

        draw: {

            polygon:
                true,

            polyline:
                true,

            rectangle:
                true,

            circle:
                false,

            marker:
                false,

            circlemarker:
                false

        },

        edit: {

            featureGroup:
                drawnItems

        }

    });


map.addControl(
    drawControl
);


// =====================================================
// COLOR
// =====================================================

function setColor(color) {

    currentColor =
        color;


    const elemento =
        document.getElementById(
            'colorActual'
        );


    if (elemento) {

        elemento.innerHTML =
            'Color actual: ' +
            color;

    }

}


// =====================================================
// CREAR DIBUJO NORMAL
// =====================================================

map.on(
    L.Draw.Event.CREATED,
    function(event) {

        const layer =
            event.layer;


        layer.options
            .colorGuardado =
            currentColor;


        if (layer.setStyle) {

            layer.setStyle({

                color:
                    currentColor,

                fillColor:
                    currentColor

            });

        }


        drawnItems.addLayer(
            layer
        );


        guardarGeoJSON();

    }
);


// =====================================================
// EDITAR
// =====================================================

map.on(
    L.Draw.Event.EDITED,
    function() {

        guardarGeoJSON();

        guardarCirculos();

    }
);


// =====================================================
// ELIMINAR
// =====================================================

map.on(
    L.Draw.Event.DELETED,
    function() {

        guardarGeoJSON();

        guardarCirculos();

    }
);


// =====================================================
// GUARDAR DIBUJOS
// =====================================================

function guardarGeoJSON() {

    const geojson = {

        type:
            'FeatureCollection',

        features:
            []

    };


    drawnItems.eachLayer(
        function(layer) {

            // Los círculos van a otro archivo

            if (
                layer instanceof L.Circle
            ) {

                return;

            }


            const feature =
                layer.toGeoJSON();


            feature.properties =
                feature.properties ||
                {};


            feature.properties.color =

                layer.options
                    .colorGuardado ||

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

            method:
                'POST',

            mode:
                'no-cors',

            headers: {

                'Content-Type':
                    'text/plain'

            },

            body:
                JSON.stringify(
                    geojson
                )

        }

    )

    .then(
        function() {

            console.log(
                'DIBUJOS ENVIADOS'
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

        type:
            'FeatureCollection',

        features:
            []

    };


    drawnItems.eachLayer(
        function(layer) {

            if (
                !(layer instanceof L.Circle)
            ) {

                return;

            }


            const centro =
                layer.getLatLng();


            const feature = {

                type:
                    'Feature',

                properties: {

                    tipo:
                        'circulo',

                    radio:
                        layer.getRadius(),

                    color:

                        layer.options
                            .colorGuardado ||

                        layer.options.color ||

                        'red'

                },

                geometry: {

                    type:
                        'Point',

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


    const datos = {

        tipo:
            'circulos',

        geojson:
            geojson

    };


    console.log(
        'GUARDANDO CÍRCULOS:',
        datos
    );


    fetch(
        URL,
        {

            method:
                'POST',

            mode:
                'no-cors',

            headers: {

                'Content-Type':
                    'text/plain'

            },

            body:
                JSON.stringify(
                    datos
                )

        }

    )

    .then(
        function() {

            console.log(
                'CÍRCULOS ENVIADOS'
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
// JSONP CON REINTENTOS
// =====================================================

function cargarDatosConReintentos(
    intentosRestantes,
    callback
) {

    const nombreCallback =
        'mapaCallback_' +
        Date.now() +
        '_' +
        Math.floor(
            Math.random() * 100000
        );


    const script =
        document.createElement(
            'script'
        );


    let terminado =
        false;


    function limpiar() {

        if (script.parentNode) {

            script.parentNode
                .removeChild(
                    script
                );

        }


        try {

            delete window[
                nombreCallback
            ];

        }

        catch (e) {}

    }


    window[nombreCallback] =
        function(data) {

            if (terminado) {

                return;

            }


            terminado =
                true;


            limpiar();


            callback(
                data
            );

        };


    script.src =
        URL +
        '?callback=' +
        nombreCallback +
        '&t=' +
        Date.now();


    script.onload =
        function() {

            console.log(
                'RESPUESTA DEL SERVIDOR RECIBIDA'
            );

        };


    script.onerror =
        function() {

            if (terminado) {

                return;

            }


            terminado =
                true;


            limpiar();


            console.warn(
                'FALLÓ LA CARGA. ' +
                'Intentos restantes:',
                intentosRestantes - 1
            );


            if (
                intentosRestantes > 1
            ) {

                setTimeout(
                    function() {

                        cargarDatosConReintentos(
                            intentosRestantes - 1,
                            callback
                        );

                    },
                    1200
                );

            }

            else {

                console.error(
                    'NO SE PUDIERON CARGAR LOS DATOS'
                );

            }

        };


    document.body.appendChild(
        script
    );

}


// =====================================================
// CARGAR DIBUJOS Y CÍRCULOS
// =====================================================

function cargarDatos() {

    console.log(
        'CARGANDO DIBUJOS Y CÍRCULOS...'
    );


    cargarDatosConReintentos(
        3,
        function(datos) {

            console.log(
                'DATOS RECIBIDOS:',
                datos
            );


            if (!datos) {

                console.error(
                    'Respuesta vacía del servidor.'
                );

                return;

            }


            // =================================================
            // DIBUJOS
            // =================================================

            if (
                datos.dibujos &&
                datos.dibujos.features
            ) {

                cargarDibujosDesdeGeoJSON(
                    datos.dibujos
                );

            }


            // =================================================
            // CÍRCULOS
            // =================================================

            if (
                datos.circulos &&
                datos.circulos.features
            ) {

                cargarCirculosDesdeGeoJSON(
                    datos.circulos
                );

            }


            console.log(
                'DIBUJOS Y CÍRCULOS CARGADOS'
            );

        }
    );

}


// =====================================================
// INSERTAR DIBUJOS EN MAPA
// =====================================================

function cargarDibujosDesdeGeoJSON(
    geojson
) {

    L.geoJSON(
        geojson,
        {

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

                        color:
                            color,

                        fillColor:
                            color,

                        fillOpacity:
                            0.2,

                        weight:
                            3

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


                    layer.options
                        .colorGuardado =
                        color;


                    drawnItems.addLayer(
                        layer
                    );

                }

        }
    );

}


// =====================================================
// INSERTAR CÍRCULOS EN MAPA
// =====================================================

function cargarCirculosDesdeGeoJSON(
    geojson
) {

    geojson.features.forEach(
        function(feature) {

            if (
                !feature.geometry ||
                feature.geometry.type !==
                    'Point'
            ) {

                return;

            }


            const coordenadas =
                feature.geometry
                    .coordinates;


            const lng =
                coordenadas[0];


            const lat =
                coordenadas[1];


            const propiedades =
                feature.properties ||
                {};


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

                        radius:
                            radio,

                        color:
                            color,

                        fillColor:
                            color,

                        fillOpacity:
                            0.2,

                        weight:
                            3

                    }
                );


            circulo.options
                .colorGuardado =
                color;


            drawnItems.addLayer(
                circulo
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

        modoContador =
            false;

        modoEliminar =
            false;


        alert(
            'Hacé clic en el mapa para colocar el centro del círculo.'
        );

    }

}


// =====================================================
// CLICK EN MAPA
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


            let eliminado =
                false;


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

                        puntosContador
                            .removeLayer(
                                layer
                            );


                        contador--;


                        document.getElementById(
                            'contadorParcelas'
                        ).innerText =
                            contador;


                        eliminado =
                            true;

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

                        radius:
                            6,

                        color:
                            'black',

                        fillColor:
                            'black',

                        fillOpacity:
                            1

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


            const circulo =
                L.circle(
                    e.latlng,
                    {

                        radius:
                            radio,

                        color:
                            currentColor,

                        fillColor:
                            currentColor,

                        fillOpacity:
                            0.2,

                        weight:
                            3

                    }
                );


            circulo.options
                .colorGuardado =
                currentColor;


            drawnItems.addLayer(
                circulo
            );


            console.log(
                'CÍRCULO CREADO:',
                circulo
            );


            guardarCirculos();


            modoCirculo =
                false;


            return;

        }

    }
);


// =====================================================
// CONTADOR
// =====================================================

function activarContador() {

    modoContador =
        !modoContador;


    modoEliminar =
        false;

    modoCirculo =
        false;


    if (modoContador) {

        if (!puntosContador) {

            puntosContador =
                L.layerGroup()
                    .addTo(map);

        }

    }

}


// =====================================================
// ELIMINAR
// =====================================================

function activarEliminar() {

    modoEliminar =
        !modoEliminar;


    modoContador =
        false;

    modoCirculo =
        false;

}


// =====================================================
// LIMPIAR CONTADOR
// =====================================================

function limpiarContador() {

    contador =
        0;


    document.getElementById(
        'contadorParcelas'
    ).innerText =
        contador;


    if (puntosContador) {

        puntosContador.clearLayers();

    }

}


// =====================================================
// LIMPIAR TODO
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


    guardarGeoJSON();

    guardarCirculos();

}


// =====================================================
// FUNCIONES PARA HTML
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
// INICIAR CARGA
// =====================================================

cargarDatos();
