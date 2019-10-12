// meter todo en elasticsearch
const elasticsearch = require('elasticsearch')
const epical = require('./epical')

module.exports = ({host, eventsIndex, ratesIndex}) => {

    const elasticsearchClient = new elasticsearch.Client({
        hosts: [ host ],
        maxRetries: 0,
    })

    this.close = () => {
        elasticsearchClient.close()
    }

    // consultar el estado del cluster
    // transforma callbacks en promise
    this.checkHealth = () => new Promise((resolve, reject) =>
        elasticsearchClient.cluster.health({}, (error, response) =>
            error ? reject(error) : resolve(response))
    )

    this.createEventIndex = async () => {

        // borrar el índice si ya existe
        if (await elasticsearchClient.indices.exists({index: eventsIndex})) {
            await elasticsearchClient.indices.delete({index: eventsIndex})
        }
    
        // crear el índice
        await elasticsearchClient.indices.create({
            index: eventsIndex,
            body: {
                mappings: {
                    properties: {
                        date: {type: 'date', format: 'basic_date_time||epoch_millis' },
                        year: {type: 'integer', },
                        epiweek: {type: 'integer', },
                        age_group: {
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                            }
                        },
                        municipality: {
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                                geo: {type: 'geo_point' },
                            }
                        },
                        province: {
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                                geo: {type: 'geo_point' },
                            }
                        }
                    }
                }
            }
        })
    }

    this.insertCase = async case_ => {

        const response = await elasticsearchClient.index({
            refresh: true,
            index: eventsIndex,
            body: case_,
        })

        if (response.erros) {
            throw response
        }
    }

    this.bulkInsertCases = async (cases) => {
    
        // meter en lotes de 5.000 documentos
        const allReqBody = []
    
        cases.forEach(case_ => {
            allReqBody.push({ index: { _index: eventsIndex }})
            allReqBody.push(case_)
        })
    
        while (allReqBody.length > 0){
            const bulkResponse = await elasticsearchClient.bulk({
                refresh: true,
                index: eventsIndex,
                body: allReqBody.splice(0, 10000),
            })

            if (bulkResponse.errors) {
                throw bulkResponse
            }
        }
    }

    this.createRateIndex = async () => {

        // borrar el índice si ya existe
        if (await elasticsearchClient.indices.exists({index: ratesIndex})) {
            await elasticsearchClient.indices.delete({index: ratesIndex})
        }
    
        // crear el índice
        await elasticsearchClient.indices.create({
            index: ratesIndex,
            body: {
                mappings: {
                    properties: {
                        date: {type: 'date', format: 'basic_date_time||epoch_millis' },
                        year: {type: 'integer', },
                        epiweek: {type: 'integer', },
                        municipality: {
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                                geo: {type: 'geo_point' },
                            }
                        },
                        province: {
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                                geo: {type: 'geo_point' },
                            }
                        },
                        cases: {type: 'integer', },
                        population: {type: 'integer', },
                        rate: {type: 'float', },
                        rate10000: {type: 'float', },
                    }
                }
            }
        })
    }

    /**
     * buscar el caso más viejo y el caso más nuevo
     * para cada semana y municipality, consultar la cantidad de casos
     * actualizar el documento departamento-semana con la tasa
     */
    this.calculateRates = async (geo) => {

        // calcular la tasa de enfermos por semana por municipality por semana

        // empezar desde el evento más viejo y terminar en el evento más nuevo
        // responde {"took":1,"timed_out":false,"_shards":{"total":1,"successful":1,"skipped":0,"failed":0},"hits":{"total":{"value":10000,"relation":"gte"},"max_score":null,"hits":[]},"aggregations":{"max_date":{"value":1554001200000,"value_as_string":"1554001200000"},"min_date":{"value":1525575600000,"value_as_string":"1525575600000"}}}
        const minMaxYear = await elasticsearchClient.search({
            index: eventsIndex,
            size: 0,
            body: {
                aggs: {
                    min_year: {
                        min: {
                            field: 'year',
                        }
                    },
                    max_year: {
                        max: {
                            field: 'year',
                        }
                    }
                }
            }
        })

        const minYear =  minMaxYear.aggregations.min_year.value
        const maxYear =  minMaxYear.aggregations.max_year.value

        let year = minYear
        while (year <= maxYear) {

            const searchResult = await elasticsearchClient.search({
                index: eventsIndex,
                body: {
                    "query": {
                        "match": {
                            "year": year
                        }
                    },
                    "size": 0,
                    "aggs": {
                        "by_municipality": {
                            "terms": {
                                "field": "municipality.id",
                                "size": 10000
                            },
                            "aggs": {
                                "by_year": {
                                    "terms": {
                                        "field": "year",
                                        "size": 10000
                                    },
                                    "aggs": {
                                        "by_week": {
                                            "terms": {
                                                "field": "epiweek",
                                                "size": 10000
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            // {
            // "took" : 1,
            // "timed_out" : false,
            // "_shards" : {
            //     "total" : 1,
            //     "successful" : 1,
            //     "skipped" : 0,
            //     "failed" : 0
            // },
            // "hits" : {
            //     "total" : {
            //     "value" : 7337,
            //     "relation" : "eq"
            //     },
            //     "max_score" : null,
            //     "hits" : [ ]
            // },
            // "aggregations" : {
            //     "by_municipality" : {
            //     "doc_count_error_upper_bound" : 0,
            //     "sum_other_doc_count" : 0,
            //     "buckets" : [
            //         {
            //         "key" : "10049",
            //         "doc_count" : 531,
            //         "by_year" : {
            //             "doc_count_error_upper_bound" : 0,
            //             "sum_other_doc_count" : 0,
            //             "buckets" : [
            //             {
            //                 "key" : 2019,
            //                 "doc_count" : 531,
            //                 "by_week" : {
            //                     "doc_count_error_upper_bound" : 0,
            //                     "sum_other_doc_count" : 0,
            //                     "buckets" : [
            //                         {
            //                             "key" : 1,
            //                             "doc_count" : 230
            //                         },

            const rates = []
            searchResult.aggregations.by_municipality.buckets.forEach(mun =>
                mun.by_year.buckets.forEach(y =>
                    y.by_week.buckets.forEach(w =>{
                        const g = geo.find(g => g.municipality.id == mun.key)
                        const population = g.population.find(p => p.year == year).value
                        const cases = w.doc_count

                        rates.push({
                            date: epical.epiweekToDate(w.key, y.key).getTime(),
                            year: y.key,
                            epiweek: w.key,
                            municipality: g.municipality,
                            province: g.province,
                            population: population,
                            cases: cases,
                            rate: (1.0 * cases / population),
                            rate10000: (10000.0 * cases / population)
                        })
                    })
                )
            )

            // meter en lotes de 5.000 documentos
            const allReqBody = []
        
            rates.forEach(rate => {
                allReqBody.push({ index: { _index: ratesIndex }})
                allReqBody.push(rate)
            })
        
            while (allReqBody.length > 0){
                const bulkResponse = await elasticsearchClient.bulk({
                    refresh: true,
                    index: eventsIndex,
                    body: allReqBody.splice(0, 10000),
                })

                if (bulkResponse.errors) {
                    throw bulkResponse
                }
            }

            year += 1
        }
    }

    this.count = () => elasticsearchClient.count({ index: eventsIndex })

    return this
}
