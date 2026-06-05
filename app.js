let map;
let drawnItems;
let currentColor = 'red';

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

// HACER GLOBALES

window.setColor = setColor;
window.limpiarDibujos = limpiarDibujos;

// ======================
// INICIAR MAPA
// ======================

map = L.map('mapa').setView(
    [-34.48,-54.33],
    13
);

// ======================
// CAPAS BASE
// ======================

const ortofotoRocha = L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:ortofoto_nacional',
        format:'image/png',
        transparent:false,
        version:'1.1.1',
        maxZoom:22
    }
);

const parcelasWMS = L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:parcelas_mobile',
        format:'image/png',
        transparent:true,
        version:'1.1.1',
        maxZoom:22
    }
);

const manzanasWMS = L.tileLayer.wms(
    'https://sig.rocha.gub.uy/geoserver226/wms',
    {
        layers:'sigRocha:v_fr_manzanas_rocha',
        format:'image/png',
        transparent:true,
        version:'1.1.1',
        maxZoom:22
    }
);


ortofotoRocha.addTo(map);
parcelasWMS.addTo(map);
manzanasWMS.addTo(map);

// ======================
// FEATURE GROUP
// ======================

drawnItems = new L.FeatureGroup();

map.addLayer(drawnItems);

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
        fillOpacity:0.5,
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

    guardarGeoJSON();

});

// ======================
// BORRAR
// ======================

map.on(L.Draw.Event.DELETED,function(){

    guardarGeoJSON();

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

        feature.properties.color =
        layer.options.colorGuardado || 'red';

    });

    fetch(
        'https://script.google.com/macros/s/AKfycbxmiKNXuRFGrjAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec',
        {

            method:'POST',

            headers:{
                'Content-Type':'text/plain'
            },

            body:JSON.stringify(geojson)

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

fetch('https://script.google.com/macros/s/AKfycbxmiKNXuRFGrjAxxiigZAxvMb4r8_Ld8j_iX5Zx5RPDGxdxltLLsWYgW-I6qi-tpMWbVw/exec')

.then(res => res.json())

.then(data => {

    const capa = L.geoJSON(data,{

        style:function(feature){

            return{

                color:
                feature.properties.color
                ||
                'red',

                fillColor:
                feature.properties.color
                ||
                'red',

                fillOpacity:0.5,
                weight:3

            };

        },

        onEachFeature:function(
            feature,
            layer
        ){

            // RECUPERAR COLOR ORIGINAL

            layer.options.colorGuardado =
            feature.properties.color || 'red';

            drawnItems.addLayer(layer);

        }

    });

})

.catch(error => {

    console.error(
        'Error cargando GeoJSON',
        error
    );

});
