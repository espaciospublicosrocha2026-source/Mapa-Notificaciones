let map;
let drawnItems;

let currentColor = 'red';

let modoContador = false;
let contador = 0;
let puntosContador;

let modoEliminar = false;
let modoCirculo = false;


// =====================================================
// URL GOOGLE APPS SCRIPT
// =====================================================

const URL =
'https://script.google.com/macros/s/AKfycbxmiKNXuRFGrJxAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec';


// =====================================================
// FUNCIONES GLOBALES
// =====================================================

function setColor(color){

    currentColor = color;

    document.getElementById(
        'colorActual'
    ).innerHTML =
    'Color actual: ' + color;

}


function limpiarDibujos(){

    drawnItems.clearLayers();

    guardarGeoJSON();

}


function activarContador(){

    modoContador = !modoContador;

    if(modoContador){

        modoCirculo = false;
        modoEliminar = false;

    }

    alert(
        modoContador
        ? "Modo contador activado"
        : "Modo contador desactivado"
    );

}


function limpiarContador(){

    puntosContador.clearLayers();

    contador = 0;

    document.getElementById(
        "contadorParcelas"
    ).innerHTML = contador;

}


function activarEliminar(){

    modoEliminar = !modoEliminar;

    if(modoEliminar){

        modoContador = false;
        modoCirculo = false;

    }

    alert(
        modoEliminar
        ? "Modo eliminar activado"
        : "Modo eliminar desactivado"
    );

}


// =====================================================
// ACTIVAR CÍRCULO
// =====================================================

function activarCirculo(){

    modoCirculo = !modoCirculo;

    if(modoCirculo){

        modoContador = false;
        modoEliminar = false;

        alert(
            "Modo círculo activado. Hacé clic en el mapa para colocar el centro."
        );

    }
    else{

        alert(
            "Modo círculo desactivado"
        );

    }

}


// HACER FUNCIONES GLOBALES

window.setColor = setColor;
window.limpiarDibujos = limpiarDibujos;
window.activarContador = activarContador;
window.limpiarContador = limpiarContador;
window.activarEliminar = activarEliminar;
window.activarCirculo = activarCirculo;


// =====================================================
// INICIAR MAPA
// =====================================================

map = L.map('mapa').setView(
    [-34.48,-54.33],
    13
);


console.log("MAPA CREADO");


// =====================================================
// CAPAS BASE
// =====================================================

const ortofotoUrbana =
L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:ortofoto_urbana',
        format:'image/png',
        transparent:false,
        version:'1.1.1',
        maxZoom:22
    }
);


const catastroParcelas =
L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:cat_parcelario_urbano_buscar',
        format:'image/png',
        transparent:true,
        version:'1.1.1',
        maxZoom:22
    }
);


ortofotoUrbana.addTo(map);

catastroParcelas.addTo(map);


console.log("CAPAS CARGADAS");


// =====================================================
// CONTADOR
// =====================================================

puntosContador =
L.layerGroup().addTo(map);


// =====================================================
// FEATURE GROUP
// =====================================================

drawnItems =
new L.FeatureGroup();

map.addLayer(drawnItems);


// =====================================================
// CONTROLES DRAW
// =====================================================

const drawControl =
new L.Control.Draw({

    draw:{

        polygon:true,
        polyline:true,
        rectangle:true,

        circle:false,
        marker:false,
        circlemarker:false

    },

    edit:{
        featureGroup:drawnItems
    }

});


map.addControl(drawControl);


// =====================================================
// CREAR DIBUJOS NORMALES
// =====================================================

map.on(
    L.Draw.Event.CREATED,
    function(e){

        const layer = e.layer;


        layer.setStyle({

            color:currentColor,

            fillColor:currentColor,

            fillOpacity:0.25,

            weight:3

        });


        layer.options.colorGuardado =
        currentColor;


        drawnItems.addLayer(layer);


        // GUARDAR EN dibujos.geojson

        guardarGeoJSON();

    }
);


// =====================================================
// EDITAR DIBUJOS
// =====================================================

map.on(
    L.Draw.Event.EDITED,
    function(){

        guardarGeoJSON();

    }
);


// =====================================================
// BORRAR DIBUJOS
// =====================================================

map.on(
    L.Draw.Event.DELETED,
    function(){

        guardarGeoJSON();

    }
);


// =====================================================
// CLICK EN MAPA
// =====================================================

map.on(
    "click",
    function(e){


        // =============================================
        // CREAR CÍRCULO
        // =============================================

        if(modoCirculo){

            const radioInput =
            document.getElementById(
                "radioCirculo"
            );


            const radio =
            Number(
                radioInput.value
            );


            if(
                !radio ||
                radio <= 0
            ){

                alert(
                    "Ingresá un radio válido en metros."
                );

                return;

            }


            const circulo =
            L.circle(
                e.latlng,
                {

                    radius:radio,

                    color:currentColor,

                    fillColor:currentColor,

                    fillOpacity:0.25,

                    weight:3

                }
            );


            circulo.options.colorGuardado =
            currentColor;


            drawnItems.addLayer(
                circulo
            );


            // =========================================
            // GUARDAR SOLO LOS CÍRCULOS
            // =========================================

            guardarCirculos();


            modoCirculo = false;


            return;

        }


        // =============================================
        // ELIMINAR PUNTO DEL CONTADOR
        // =============================================

        if(modoEliminar){

            let eliminado = false;


            puntosContador.eachLayer(
                function(layer){

                    const distancia =
                    map.distance(
                        e.latlng,
                        layer.getLatLng()
                    );


                    if(
                        distancia < 20 &&
                        !eliminado
                    ){

                        puntosContador
                        .removeLayer(layer);


                        contador--;


                        document.getElementById(
                            "contadorParcelas"
                        ).innerHTML =
                        contador;


                        eliminado = true;

                    }

                }
            );


            return;

        }


        // =============================================
        // CONTADOR
        // =============================================

        if(!modoContador)
            return;


        const punto =
        L.circleMarker(
            e.latlng,
            {

                radius:15,

                stroke:true,

                color:"#000000",

                weight:3,

                fillColor:"#000000",

                fillOpacity:1

            }
        );


        punto.addTo(
            puntosContador
        );


        contador++;


        document.getElementById(
            "contadorParcelas"
        ).innerHTML =
        contador;

    }
);


// =====================================================
// GUARDAR DIBUJOS EXISTENTES
// =====================================================

function guardarGeoJSON(){

    const geojson =
    drawnItems.toGeoJSON();


    // ================================================
    // IMPORTANTE:
    // EXCLUIR LOS CÍRCULOS
    // ================================================

    geojson.features =
    geojson.features.filter(
        function(feature){

            return !(
                feature.properties &&
                feature.properties.tipo === "circulo"
            );

        }
    );


    geojson.features.forEach(
        function(feature,index){

            const layers =
            drawnItems.getLayers()
            .filter(
                function(layer){

                    return !(layer instanceof L.Circle);

                }
            );


            const layer =
            layers[index];


            feature.properties =
            feature.properties || {};


            feature.properties.color =
            layer.options.colorGuardado
            ||
            layer.options.color
            ||
            'red';

        }
    );


    fetch(
        URL,
        {

            method:'POST',

            headers:{
                'Content-Type':'text/plain'
            },

            body:JSON.stringify(
                geojson
            )

        }
    )

    .then(
        res => res.text()
    )

    .then(
        data => {

            console.log(
                'Dibujos guardados:',
                data
            );

        }
    )

    .catch(
        error => {

            console.error(
                'Error guardando dibujos:',
                error
            );

        }
    );

}


// =====================================================
// GUARDAR CÍRCULOS
// =====================================================

function guardarCirculos(){

    const geojson = {

        type:'FeatureCollection',

        features:[]

    };


    // ================================================
    // RECORRER LOS LAYERS
    // ================================================

    drawnItems.eachLayer(
        function(layer){

            if(
                layer instanceof L.Circle
            ){

                const centro =
                layer.getLatLng();


                const feature = {

                    type:'Feature',

                    geometry:{

                        type:'Point',

                        coordinates:[
                            centro.lng,
                            centro.lat
                        ]

                    },

                    properties:{

                        tipo:'circulo',

                        radio:layer.getRadius(),

                        color:
                        layer.options.colorGuardado
                        ||
                        layer.options.color
                        ||
                        'red'

                    }

                };


                geojson.features.push(
                    feature
                );

            }

        }
    );


    // ================================================
    // ENVIAR AL APPS SCRIPT
    // ================================================

    fetch(
        URL,
        {

            method:'POST',

            headers:{
                'Content-Type':'text/plain'
            },

            body:JSON.stringify({

                tipo:'circulos',

                geojson:geojson

            })

        }
    )

    .then(
        res => res.text()
    )

    .then(
        data => {

            console.log(
                'Círculos guardados:',
                data
            );

        }
    )

    .catch(
        error => {

            console.error(
                'Error guardando círculos:',
                error
            );

        }
    );

}


// =====================================================
// CARGAR DIBUJOS EXISTENTES
// =====================================================

function cargarDibujos(){

    fetch(URL)

    .then(
        res => res.json()
    )

    .then(
        data => {

            console.log(
                "Dibujos existentes:",
                data
            );


            if(
                !data.features
            )
                return;


            data.features.forEach(
                function(feature){

                    const capa =
                    L.geoJSON(
                        feature,
                        {

                            style:function(feature){

                                const color =
                                feature.properties &&
                                feature.properties.color
                                ||
                                'red';


                                return{

                                    color:color,

                                    fillColor:color,

                                    fillOpacity:0.5,

                                    weight:3

                                };

                            },


                            onEachFeature:
                            function(
                                feature,
                                layer
                            ){

                                layer.options
                                .colorGuardado =
                                feature.properties &&
                                feature.properties.color
                                ||
                                'red';


                                drawnItems.addLayer(
                                    layer
                                );

                            }

                        }
                    );

                }
            );

        }
    )

    .catch(
        error => {

            console.error(
                'Error cargando dibujos:',
                error
            );

        }
    );

}


// =====================================================
// CARGAR CÍRCULOS
// =====================================================

function cargarCirculos(){

    fetch(
        URL + '?tipo=circulos'
    )

    .then(
        res => res.json()
    )

    .then(
        data => {

            console.log(
                "Círculos existentes:",
                data
            );


            if(
                !data.features
            )
                return;


            data.features.forEach(
                function(feature){

                    const propiedades =
                    feature.properties ||
                    {};


                    if(
                        propiedades.tipo !==
                        "circulo"
                    )
                        return;


                    if(
                        !feature.geometry ||
                        !feature.geometry.coordinates
                    )
                        return;


                    const coordenadas =
                    feature.geometry.coordinates;


                    const lng =
                    Number(
                        coordenadas[0]
                    );


                    const lat =
                    Number(
                        coordenadas[1]
                    );


                    const radio =
                    Number(
                        propiedades.radio
                    );


                    if(
                        isNaN(lat) ||
                        isNaN(lng) ||
                        isNaN(radio) ||
                        radio <= 0
                    ){

                        return;

                    }


                    const color =
                    propiedades.color ||
                    'red';


                    const circulo =
                    L.circle(
                        [lat,lng],
                        {

                            radius:radio,

                            color:color,

                            fillColor:color,

                            fillOpacity:0.5,

                            weight:3

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
    )

    .catch(
        error => {

            console.error(
                'Error cargando círculos:',
                error
            );

        }
    );

}


// =====================================================
// CARGAR TODO
// =====================================================

cargarDibujos();

cargarCirculos();


console.log(
    "APP TERMINÓ DE CARGAR"
);
