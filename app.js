
'use strict';

const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');

const localidades = JSON.parse(fs.readFileSync('datos-gobierno/localidades.json'))
const departamentos = JSON.parse(fs.readFileSync('datos-gobierno/departamentos.json'))
const provincias = JSON.parse(fs.readFileSync('datos-gobierno/provincias.json'))

const geo = provincias.map(esta_provincia => {
    return {
        id: esta_provincia.id,
        n: esta_provincia.nombre,
        geo: {
            lat: esta_provincia.centroide.lat,
            lon: esta_provincia.centroide.lon,
        },
        dep: departamentos
            .filter(este_departamento => este_departamento.provincia.id === esta_provincia.id)
            .map(este_departamento => {
                return {
                    id: este_departamento.id,
                    n: este_departamento.nombre,
                    geo: {
                        lat: este_departamento.centroide.lat,
                        lon: este_departamento.centroide.lon,
                    },
                    loc: localidades
                        .filter(esta_localidad => esta_localidad.departamento.id === este_departamento.id)
                        .map(esta_localidad => {
                            return {
                                id: esta_localidad.id,
                                n: esta_localidad.nombre,
                                geo: {
                                    lat: esta_localidad.centroide.lat,
                                    lon: esta_localidad.centroide.lon,
                                }
                            }
                        })
                }
        })
    }
})

app.get('/geo', (req, res) => res.send(JSON.stringify(geo)))

app.listen(port, () => console.log(`Listening on port ${port}!`))
