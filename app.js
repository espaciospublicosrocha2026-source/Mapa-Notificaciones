let map;
let drawnItems;
let currentColor = 'red';
let modoContador = false;
let contador = 0;
let puntosContador;
let modoEliminar = false;
let modoCirculo = false;

// ======================
// FUNCIONES GLOBALES
// ======================

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

// ======================
// ACTIVAR CÍRCULO
// ======================

function activarCirculo(){

    modoCirculo = !modoCirculo;

    if(modoCirculo){

        modoContador = false;
        modoEliminar = false;

        alert(
            "Modo círculo activado. Hacé clic en el mapa para colocar el centro."
        );

    }else{

        alert(
            "Modo círculo desactivado"
        );

    }

}

// HACER GLOBALES

window.setColor = setColor;
window.limpiarDibujos = limpiarDibujos;
window.activarContador = activarContador;
window.limpiarContador = limpiarContador;
window.activarEliminar = activarEliminar;
window.activarCirculo = activarCirculo;


// ======================
// INICIAR MAPA
// ======================

map = L.map('mapa').setView(
    [-34.48,-54.33],
    13
);

console.log("MAPA CREADO");


// ======================
// CAPAS BASE
// ======================

const ortofotoUrbana = L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:ortofoto_urbana',
        format:'image/png',
        transparent:false,
        version:'1.1.1',
        maxZoom:22
    }
);


const catastroParcelas = L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:cat_parcelario_urbano_buscar',
        format:'image/png',
        transparent:true,
        version:'1.1.1',
        maxZoom:22
    }
);


// ======================
// CARGAR CAPAS
// ======================

ortofotoUrbana.addTo(map);

catastroParcelas.addTo(map);

console.log("CAPAS CARGADAS");

puntosContador = L.layerGroup().addTo(map);


// ======================
// FEATURE GROUP
// ======================

drawnItems = new L.FeatureGroup();

map.addLayer(drawnItems);

console.log("DRAW CARGADO");


// ======================
// CONTROLES DRAW
// ======================

const drawControl = new L.Control.Draw({

    draw:{

        polygon:true,
        polyline:true,
        rectangle:true,
        circle:false,
        marker:false,
        circlemarker:false

    },

    edit:{
        featureGroup: drawnItems
    }

});

map.addControl(drawControl);


// ======================
// CREAR DIBUJOS
// ======================

map.on(L.Draw.Event.CREATED,function(e){

    const layer = e.layer;

    layer.setStyle({

        color: currentColor,
        fillColor: currentColor,
        fillOpacity:0.25,
        weight:3

    });

    // GUARDAR COLOR EN EL LAYER

    layer.options.colorGuardado =
    currentColor;

    drawnItems.addLayer(layer);

    guardarGeoJSON();

});


// ======================
// EDITAR
// ======================

map.on(L.Draw.Event.EDITED,function(){

    drawnItems.eachLayer(function(layer){

        if(layer instanceof L.Circle){

            layer.options.radioGuardado =
            layer.getRadius();

        }

    });

    guardarGeoJSON();

});


// ======================
// BORRAR
// ======================

map.on(L.Draw.Event.DELETED,function(){

    guardarGeoJSON();

});


// ======================
// CLICK EN MAPA
// ======================

map.on("click", function(e){


    // ======================
    // CREAR CÍRCULO
    // ======================

    if(modoCirculo){

        const radioInput =
        document.getElementById(
            "radioCirculo"
        );

        const radio =
        Number(radioInput.value);


        if(!radio || radio <= 0){

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


        // GUARDAR COLOR

        circulo.options.colorGuardado =
        currentColor;


        // GUARDAR RADIO

        circulo.options.radioGuardado =
        radio;


        drawnItems.addLayer(
            circulo
        );


        guardarGeoJSON();


        // Desactivar modo círculo

        modoCirculo = false;


        return;

    }


    // ======================
    // ELIMINAR PUNTO
    // ======================

    if(modoEliminar){

        let eliminado = false;

        puntosContador.eachLayer(function(layer){

            let distancia = map.distance(
                e.latlng,
                layer.getLatLng()
            );

            // distancia en metros

            if(distancia < 20 && !eliminado){

                puntosContador.removeLayer(layer);

                contador--;

                document.getElementById(
                    "contadorParcelas"
                ).innerHTML = contador;

                eliminado = true;

            }

        });

        return;

    }


    // ======================
    // CREAR PUNTO
    // ======================

    if(!modoContador) return;


    const punto = L.circleMarker(e.latlng,{

        radius:15,
        stroke:true,
        color:"#000000",
        weight:3,
        fillColor:"#000000",
        fillOpacity:1

    });


    punto.addTo(puntosContador);


    contador++;


    document.getElementById(
        "contadorParcelas"
    ).innerHTML = contador;

});


// ======================
// GUARDAR EN GOOGLE DRIVE
// ======================

function guardarGeoJSON(){

    const geojson =
    drawnItems.toGeoJSON();


    geojson.features.forEach(function(feature,index){

        const layer =
        drawnItems.getLayers()[index];


        feature.properties =
        feature.properties || {};


        // ======================
        // COLOR
        // ======================

        feature.properties.color =
        layer.options.colorGuardado
        ||
        layer.options.color
        ||
        'red';


        // ======================
        // CÍRCULO
        // ======================

        if(layer instanceof L.Circle){

            feature.properties.tipo =
            "circulo";


            feature.properties.radio =
            layer.getRadius();

        }

    });


    fetch(
        'https://script.google.com/macros/s/AKfycbxmiKNXuRFGrJxAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec',
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

    .then(res => res.text())

    .then(data => {

        console.log(
            'Guardado:',
            data
        );

    })

    .catch(error => {

        console.error(error);

    });

}


// ======================
// CARGAR DIBUJOS
// ======================

fetch(
    'https://script.google.com/macros/s/AKfycbxmiKNXuRFGrJxAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec'
)

.then(res => res.json())

.then(data => {


    // ======================
    // RECORRER CADA DIBUJO
    // ======================

    data.features.forEach(function(feature){

        const propiedades =
        feature.properties || {};


        // ======================
        // CÍRCULO
        // ======================

        if(
            propiedades.tipo === "circulo"
            &&
            propiedades.radio
            &&
            feature.geometry
            &&
            feature.geometry.coordinates
        ){

            const coordenadas =
            feature.geometry.coordinates;


            const lat =
            coordenadas[1];


            const lng =
            coordenadas[0];


            const radio =
            Number(
                propiedades.radio
            );


            if(
                !isNaN(lat)
                &&
                !isNaN(lng)
                &&
                radio > 0
            ){

                const circulo =
                L.circle(
                    [lat,lng],
                    {

                        radius:radio,

                        color:
                        propiedades.color
                        ||
                        'red',

                        fillColor:
                        propiedades.color
                        ||
                        'red',

                        fillOpacity:0.5,

                        weight:3

                    }
                );


                circulo.options.colorGuardado =
                propiedades.color
                ||
                'red';


                circulo.options.radioGuardado =
                radio;


                drawnItems.addLayer(
                    circulo
                );

            }


            return;

        }


        // ======================
        // DIBUJOS NORMALES
        // ======================

        const capa =
        L.geoJSON(
            feature,
            {

                style:function(feature){

                    const color =
                    feature.properties
                    &&
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

                onEachFeature:function(
                    feature,
                    layer
                ){

                    layer.options.colorGuardado =
                    feature.properties
                    &&
                    feature.properties.color
                    ||
                    'red';


                    drawnItems.addLayer(
                        layer
                    );

                }

            }
        );

    });

})

.catch(error => {

    console.error(
        'Error cargando GeoJSON',
        error
    );

});


console.log(
    "APP TERMINO DE CARGAR"
);
