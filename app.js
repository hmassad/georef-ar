
'use strict';

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

const fs = require('fs');

const localidades = JSON.parse(fs.readFileSync('datos-gobierno/localidades.json'))
const departamentos = JSON.parse(fs.readFileSync('datos-gobierno/departamentos.json'))
const provincias = JSON.parse(fs.readFileSync('datos-gobierno/provincias.json'))

let all = []
provincias.forEach(provincia => {

    const p1 = {
        id: provincia.id,
        n: provincia.nombre,
        geo: {
            lat: provincia.centroide.lat,
            lon: provincia.centroide.lon,
        },
        dep: []
    }

    departamentos.forEach(departamento => {
        if (departamento.provincia.id === p1.id)
        {
            const d1 = {
                id: departamento.id,
                n: departamento.nombre,
                geo: {
                    lat: departamento.centroide.lat,
                    lon: departamento.centroide.lon,
                },
                loc: []
            }

            localidades.forEach(localidad => {

                if (localidad.departamento.id === d1.id)
                {
                    const l1 = {
                        id: localidad.id,
                        n: localidad.nombre,
                        geo: {
                            lat: localidad.centroide.lat,
                            lon: localidad.centroide.lon,
                        },
                    }

                    d1.loc.push(l1)
                }
            })

            p1.dep.push(d1)
        }
    })

    all.push(p1)
})

app.get('/localidades', (req, res) => res.send(JSON.stringify(localidades)))
app.get('/departamentos', (req, res) => res.send(JSON.stringify(departamentos)))
app.get('/provincias', (req, res) => res.send(JSON.stringify(provincias)))
app.get('/all', (req, res) => res.send(JSON.stringify(all)))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
