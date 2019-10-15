process.stdout.write('\033c') // clear console on startup

const geoLoader = require('./geo-loader')
const caseLoader = require('./case-loader')

const geo = geoLoader.load()

const cases = caseLoader.load(
    geo,
    'datos-gobierno/informacion-publica-respiratorias-nacional-hasta-20180626.csv',
    'datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-20181228.csv',
    'datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-201907.csv')

const elasticsearchClient = require('./elasticsearchClient')({
    host: process.env.ES_HOST || 'http://localhost:9200/',
    eventsIndex: process.env.EVENTS_INDEX || 'sdp-cases',
    ratesIndex: process.env.RATES_INDEX || 'sdp-rates'
})

async function bootstrap() {

    // console.debug(`checking elasticsearch connection...`)
    // await elasticsearchClient.checkHealth()
    // console.log(`looking good.`)

    // console.debug(`creating events index...`)
    // await elasticsearchClient.createEventIndex()
    // console.log(`events index created.`)

    // console.debug(`uploading cases...`)
    // await elasticsearchClient.bulkInsertCases(cases)

    // if ((await elasticsearchClient.count()).count === 455492) {
    //     console.log(`cases uploaded.`)
    // } else {
    //     throw `not all cases uploaded`
    // }

    console.debug(`creating rate index...`)
    await elasticsearchClient.createRateIndex()
    console.log(`rate index created.`)

    console.debug(`calculating rates...`)
    await elasticsearchClient.calculateRates(geo)
    console.log(`rates calculated.`)
}

bootstrap()
.then(() => {
    elasticsearchClient.close()
})
.catch(e => {
    console.error(e)
    elasticsearchClient.close()
})
