'use strict'

const express = require('express')
const app = express()
const fs = require('fs')
const unquote = require('unquote')
const elasticsearch = require('elasticsearch')

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

/** transforma un agrupamiento de casos en un único caso */
const expandCases = (cases) => {
    const r = []
    cases.forEach(case_ => {
        for (let i = 0; i < case_.q; i++)
            r.push({...case_}) // una copia del caso
    })
    r.forEach(case_ => {
        delete case_.q // borrar cantidad de cada caso
    })
    return r
}

/** son todos los casos ordenados tal cual se enviarán a elasticsearch */
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
                    c: expandCases(cases
                        .filter(este_caso => este_caso.provincia_id.padStart(2, '0') + este_caso.departamento_id.padStart(3, '0') == este_departamento.id)
                        .map(case_ => { return {
                            y: case_.anio,
                            w: case_.semanas_epidemiologicas,
                            eid: case_.grupo_edad_id,
                            e: case_.grupo_edad_desc,
                            q: case_.cantidad_casos,
                            p: population
                                .filter(p => p.id == este_departamento.id) // filtro por departamento
                                .map(p => p.p)
                                .find(() => true)
                                .find(p => p.y == case_.anio) // busco por año
                                // .map(p => p.y) // tomo el valor de población
                                .p
                            }})
                        .map(c => { // calcular tasa por 10.000 habitantes
                            c.r = c.q / c.p * 10000
                            return c
                        }))
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




// meter todo en elasticsearch

const elasticsearchClient = new elasticsearch.Client( {
    hosts: [
        'http://localhost:9200/',
    ]
})

// // check health
// elasticsearchClient.cluster.health({}, (err, resp/*, status*/) => {
//     console.log("Elasticsearch cluster health: ", resp)
// })

async function run() {
    const INDEX = 'eti'

    // borrar el índice si ya existe
    console.log(`check if index ${INDEX} exists`)
    if(await elasticsearchClient.indices.exists({index: INDEX})){
        console.log(`index ${INDEX} exists, deleting`)
        await elasticsearchClient.indices.delete({index: INDEX})
    }

    // crear el índice
    await elasticsearchClient.indices.create({
        index: INDEX,
        body: {
            mappings: {
                properties: {
                    y: { type: 'integer' },
                    w: { type: 'integer' },
                    e_id: {type: 'keyword' },
                    e_n: {type: 'keyword' },
                    p: { type: 'integer' },
                    r: { type: 'float' },
                    d_id: {type: "keyword"},
                    d_n: {type: "keyword"},
                    d_g: {type: "geo_point"},
                    p_id: {type: "keyword"},
                    p_n: {type: "keyword"},
                    p_g: {type: "geo_point"},
                }
            }
        }
    })
    console.log(`index ${INDEX} created`)

    // aplastar la jerarquía Ⓐ y separar en tandas de a 100.000? documentos
    const allReqBody = []

    eti.p.forEach(p => {
        p.d.forEach(d => {
            d.c.forEach(c => {
                allReqBody.push({ index: { _index: INDEX }})
                allReqBody.push({
                    y: c.y,
                    w: c.w,
                    e_id: c.eid,
                    e_n: c.e,
                    p: c.p,
                    r: c.r,
                    d_id: d.id,
                    d_n: d.n,
                    d_g: d.g,
                    p_id: p.id,
                    p_n:  p.n,
                    p_g: p.g,
                })
            })
        })
    })

    while (allReqBody.length > 0){
        const bulkResponse = await elasticsearchClient.bulk({
            refresh: true,
            index: INDEX,
            body: allReqBody.splice(0, 100000),
            maxRetries: 0,
        })

        if (bulkResponse.errors) {
            console.log(JSON.stringify(bulkResponse))
        }
    }

    // contar la cantidad de documentos que se insertaron
    const count = await elasticsearchClient.count({ index: INDEX })
    console.log(count)
}

run().catch(console.error)

app.listen(port, () => console.log(`Listening on port ${port}!`))
