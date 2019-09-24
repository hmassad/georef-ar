
'use strict'

const express = require('express')
const app = express()
const port = 3000
const fs = require('fs')
const unquote = require('unquote')

// const localidades = JSON.parse(fs.readFileSync('datos-gobierno/localidades.json'))
const departamentos = JSON.parse(fs.readFileSync('datos-gobierno/departamentos.json'))
const provincias = JSON.parse(fs.readFileSync('datos-gobierno/provincias.json'))

const leerCSV = (file) => {

    const r = []

    let isFirstLine = true

    fs.readFileSync(file, 'utf-8').replace('\r', '').split('\n').forEach(line => {
        if(isFirstLine)
        {
            isFirstLine = false
            return
        }

        const columns = line.split(',')
        r.push({
            departamento_id: unquote(columns[0]),
            departamento_nombre: unquote(columns[1]),
            provincia_id: unquote(columns[2]),
            provincia_nombre: unquote(columns[3]),
            anio: unquote(columns[4]),
            semanas_epidemiologicas: unquote(columns[5]),
            evento_nombre: unquote(columns[6]),
            grupo_edad_id: unquote(columns[7]),
            grupo_edad_desc: unquote(columns[8]),
            cantidad_casos: unquote(columns[9]),
        })
    })
    
    return r
}

let casos = [
    ...leerCSV('datos-gobierno/informacion-publica-respiratorias-nacional-hasta-20180626.csv'),
    ...leerCSV('datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-20181228.csv'),
    ...leerCSV('datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-201907.csv')
]

console.log(`casos: ` + casos.length)

const eti = provincias.map(esta_provincia => {
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
                    casos: casos
                        // TODO hay un problema con los códigos de departamento, por ejemplo departamento_id: 94014 no existe en departamentos.json, pero sí existe 94015
                        .filter(este_caso => este_caso.provincia_id.padStart(2, '0') + este_caso.departamento_id.padStart(3, 0) === este_departamento.id)
                        .filter(este_caso => este_caso.evento_nombre === 'Enfermedad tipo influenza (ETI)')
                        .map(este_caso => {
                            return {
                                y: este_caso.anio,
                                epiw: este_caso.semanas_epidemiologicas,
                                gid: este_caso.grupo_edad_id,
                                g: este_caso.grupo_edad_desc,
                                q: este_caso.cantidad_casos,
                            }
                        })
                }
        })
    }
})
app.get('/eti', (req, res) => res.send(JSON.stringify(eti)))


const huerfanas = casos
    .filter(este_caso => este_caso.evento_nombre === 'Enfermedad tipo influenza (ETI)')
    .filter(este_caso => este_caso.provincia_id.padStart(2, '0') + este_caso.departamento_id.padStart(3, 0) === este_departamento.id)
    .map(este_caso => {
        return {
            y: este_caso.anio,
            epiw: este_caso.semanas_epidemiologicas,
            gid: este_caso.grupo_edad_id,
            g: este_caso.grupo_edad_desc,
            q: este_caso.cantidad_casos,
        }
    })
app.get('/huerfanas', (req, res) => res.send(JSON.stringify(huerfanas)))

app.listen(port, () => console.log(`Listening on port ${port}!`))
