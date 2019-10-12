const PopulationLoader = require('./population-loader')
const ProvinceLoader = require('./province-loader')
const MunicipalityLoader = require('./municipality-loader')

const provinces = ProvinceLoader.load('datos-gobierno/provincias.json')
const municipalities = MunicipalityLoader.load('datos-gobierno/departamentos.json')
const population = PopulationLoader.load('datos-gobierno/proy_1025.csv')

// delvolver los municipios geolocalizados con las provincias geolocalizadas y población
const load = () => {

    const geo = municipalities.map(municipality => { 

        const province = provinces.find(province => municipality.provincia.id === province.id)

        return {
            municipality: {
                id: municipality.id,
                name: municipality.nombre,
                geo: {
                    lat: municipality.centroide.lat,
                    lon: municipality.centroide.lon,
                },
            },
            province: {
                id: province.id,
                name: province.nombre,
                geo: {
                    lat: province.centroide.lat,
                    lon: province.centroide.lon,
                },
            },
            population: population.find(p => p.municipalityId == municipality.id).population,
        }
    })

    return geo
}

module.exports = {
    load
}


/*

departamento
{"nombre_completo":"Partido de José C. Paz",
"fuente":"ARBA - Gerencia de Servicios Catastrales",
"nombre":"José C. Paz",
"id":"06412",
"provincia":{"nombre":"Buenos Aires","id":"06","interseccion":0.000159541555300346},
"categoria":"Partido",
"centroide":{"lat":-34.5118758903445,"lon":-58.7776710941743}}

provincias
{"nombre_completo":"Provincia de Misiones","fuente":"IGN","iso_id":"AR-N","nombre":"Misiones","id":"54","categoria":"Provincia","iso_nombre":"Misiones","centroide":{"lat":-26.8753965086829,"lon":-54.6516966230371}}
*/