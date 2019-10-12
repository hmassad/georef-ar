process.stdout.write('\033c') // clear console on startup

const geoLoader = require('./geo-loader')
const caseLoader = require('./case-loader')

const elasticsearchClient = require('./elasticsearchClient')({
    host: process.env.ES_HOST || 'http://localhost:9200/',
    eventsIndex: process.env.EVENTS_INDEX || 'sdp-cases'
})

const geo = geoLoader.load()

const cases = caseLoader.load(
    geo,
    'datos-gobierno/informacion-publica-respiratorias-nacional-hasta-20180626.csv',
    'datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-20181228.csv',
    'datos-gobierno/vigilancia-de-infecciones-respiratorias-agudas-201907.csv')

async function bootstrap() {

    console.log(`checking elasticsearch connection...`)
    await elasticsearchClient.checkHealth()
    console.log(`looking good.`)

    console.log(`creating event index...`)
    await elasticsearchClient.createEventsIndex()
    console.log(`event index created.`)

    console.log(`uploading cases...`)
    await elasticsearchClient.insert(cases)

    if ((await elasticsearchClient.count()).count === 455492) {
        console.log(`cases uploaded.`)
    } else {
        throw `not all cases uploaded`
    }
}

bootstrap()
.then(() => {
    elasticsearchClient.close()
})
.catch(e => {
    console.error(e)
    elasticsearchClient.close()
})
