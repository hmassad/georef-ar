// meter todo en elasticsearch
const elasticsearch = require('elasticsearch')

module.exports = ({host, eventsIndex}) => {

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

    this.createEventsIndex = async () => {

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
                            //type: 'nested',
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                            }
                        },
                        municipality: {
                            //type: 'nested',
                            properties: {
                                id: { type: 'keyword' },
                                name: {type: 'keyword' },
                                geo: {type: 'geo_point' },
                            }
                        },
                        province: {
                            //type: 'nested',
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
    
    this.insert = async (cases) => {
    
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
                console.log(JSON.stringify(bulkResponse))
            }
        }
    }
    
    this.count = () => elasticsearchClient.count({ index: eventsIndex })

    return this
}