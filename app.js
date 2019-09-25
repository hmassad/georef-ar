'use strict'

const express = require('express')
const app = express()
const fs = require('fs')
const unquote = require('unquote')

// config de salida del servidor web
app.set('json spaces', 0);
const port = 3000

const departamentos = JSON.parse(fs.readFileSync('datos-gobierno/departamentos.json'))
const provincias = JSON.parse(fs.readFileSync('datos-gobierno/provincias.json'))

const geo = {
    p: provincias.map(esta_provincia => { return {
        id: esta_provincia.id,
        n: esta_provincia.nombre,
        g: {
            lat: esta_provincia.centroide.lat,
            lon: esta_provincia.centroide.lon,
        },
        d: departamentos
            .filter(este_departamento => este_departamento.provincia.id === esta_provincia.id)
            .map(este_departamento => { return {
                id: este_departamento.id,
                n: este_departamento.nombre,
                g: {
                    lat: este_departamento.centroide.lat,
                    lon: este_departamento.centroide.lon,
                },
            }})
    }})
}
app.get('/geo', (req, res) => res.json(geo))

const loadPopulationCSV = (file) => {

    const r = []

    let isFirstLine = true

    fs.readFileSync(file, 'utf-8').split('\n').forEach(line => {
        if(isFirstLine)
        {
            isFirstLine = false
            return
        }

        line = line.substring(0, line.length - 1) // eliminar \r, revisar
        
        const columns = line.split(',')

        r.push({
            id: columns[0].padStart(5, '0'),
            //n: columns[1]},
            p: [
                {y: "2010", p: parseInt(columns[2], 10)},
                {y: "2011", p: parseInt(columns[3], 10)},
                {y: "2012", p: parseInt(columns[4], 10)},
                {y: "2013", p: parseInt(columns[5], 10)},
                {y: "2014", p: parseInt(columns[6], 10)},
                {y: "2015", p: parseInt(columns[7], 10)},
                {y: "2016", p: parseInt(columns[8], 10)},
                {y: "2017", p: parseInt(columns[9], 10)},
                {y: "2018", p: parseInt(columns[10], 10)},
                {y: "2019", p: parseInt(columns[11], 10)},
                {y: "2020", p: parseInt(columns[12], 10)},
                {y: "2021", p: parseInt(columns[13], 10)},
                {y: "2022", p: parseInt(columns[14], 10)},
                {y: "2023", p: parseInt(columns[15], 10)},
                {y: "2024", p: parseInt(columns[16], 10)},
                {y: "2025", p: parseInt(columns[17], 10)},
            ]
        })
    })
    
    return r
}

const population = [
    ...loadPopulationCSV('datos-gobierno/proy_1025.csv'),
]
app.get('/pop', (req, res) => res.json(population))


const loadCasesCSV = (file) => {

    const r = []

    let isFirstLine = true

    fs.readFileSync(file, 'utf-8').split('\n').forEach(line => {
        if(isFirstLine)
        {
            isFirstLine = false
            return
        }

        line = line.substring(0, line.length - 1) // eliminar \r
        
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

const cases = [
    ...loadCasesCSV('datos-gobierno/informacion-publica-respiratorias-nacional-hasta-20180626.csv'),
    ...loadCasesCSV('datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-20181228.csv'),
    ...loadCasesCSV('datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-201907.csv')
]
.filter(este_caso => este_caso.evento_nombre === 'Enfermedad tipo influenza (ETI)')

// corregir los códigos de departamento
// hay un problema con los códigos de departamento, por ejemplo departamento_id: 94014 no existe en departamentos.json, pero sí existe 94015
cases.forEach(caso => {
    if (caso.provincia_id.padStart(2, '0') === '02') {
        // todo CABA lo mando a la Comuna 1, porque los archivos tienen diferentes maneras de contarlo
        caso.departamento_id = '7'
    } else if (caso.provincia_id === '94' && caso.departamento_id === '7') {
        // tierra del fuego, río grande
        caso.departamento_id = '8'
    } else if (caso.provincia_id === '94' && caso.departamento_id === '14') {
        // tierra del fuego, ushuaia
        caso.departamento_id = '15'
    } else if (caso.provincia_id === '58' && caso.departamento_id === '113') {
        // neuquén, zapala
        caso.departamento_id = '112'
    }
})

const eti = {
    p: provincias.map(esta_provincia => { return {
        id: esta_provincia.id,
        n: esta_provincia.nombre_completo,
        g: {
            lat: esta_provincia.centroide.lat,
            lon: esta_provincia.centroide.lon,
        },
        d: departamentos
            .filter(este_departamento => este_departamento.provincia.id === esta_provincia.id)
            .map(este_departamento => {
                return {
                    id: este_departamento.id,
                    n: este_departamento.nombre_completo,
                    g: {
                        lat: este_departamento.centroide.lat,
                        lon: este_departamento.centroide.lon,
                    },
                    c: cases
                        .filter(este_caso => este_caso.provincia_id.padStart(2, '0') + este_caso.departamento_id.padStart(3, '0') == este_departamento.id)
                        .reduce((groups, case_) => { // agrupar y sumar los casos del mismo momento pero diferente rango de edades
                            // buscar el grupo que corresponde
                            let group = groups.find(g => g.y === case_.anio && g.w === case_.semanas_epidemiologicas)

                            if (!group) {
                                // no existe, crear el grupo
                                group = {
                                    y: case_.anio,
                                    w: case_.semanas_epidemiologicas,
                                    q: 0,
                                    p: population
                                        .filter(p => p.id == este_departamento.id) // filtro por departamento
                                        .map(p => p.p)
                                        .find(() => true)
                                        .find(p => p.y == case_.anio) // busco por año
                                        // .map(p => p.y) // tomo el valor de población
                                        .p
                                }
                                groups.push(group)
                            }

                            // sumar la cantidad al grupo
                            group.q += parseInt(case_.cantidad_casos, 10)

                            return groups
                        }, [])

                        // TODO eliminar y calcular con el mismo mecanismo que para realtime
                        .map(c => { // calcular tasa por 10.000 habitantes
                            c.r = c.q / c.p * 10000
                            if (c.r > 109){ // threshold de 109/10.000 según ?
                                console.log(`${esta_provincia.nombre} - ${este_departamento.nombre} - ${c.y} - ${c.w} - ${c.q} - ${c.r}`)
                            }
                            return c
                        })
                }
        })
    }})
}
app.get('/eti', (req, res) => res.json(eti))

// buscar los casos sin departamento
const huerfanas = []
cases.forEach(este_caso => {
    let provincia = geo.p.find(esta_provincia => esta_provincia.id === este_caso.provincia_id.padStart(2, 0))
    if (provincia) {
        let departamento = provincia.d.find(este_departamento => este_departamento.id === provincia.id + este_caso.departamento_id.padStart(3, 0))
        if (departamento)
            return // found, do not add to orphans
    }
    huerfanas.push(este_caso)
})
app.get('/huerfanas', (req, res) => res.json(huerfanas)) // tiene que devolver [] si no hay casos huérfanos

app.listen(port, () => console.log(`Listening on port ${port}!`))
