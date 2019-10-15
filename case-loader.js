const fs = require('fs')
const unquote = require('unquote')
const epical = require('./epical')

const load = (geo, ...files) => {

    let cases = []

    files.forEach(file => {

        let isFirstLine = true

        fs.readFileSync(file, 'utf-8').split('\n').forEach(line => {

            if(isFirstLine)
            {
                isFirstLine = false
                return
            }

            line = line.substring(0, line.length - 1) // eliminar \r
            
            const columns = line.split(',')

            // sólo tomamos los casos de Enfermedad tipo Influenza
            if (unquote(columns[6]) === 'Enfermedad tipo influenza (ETI)') {

                // corregimos algunos departamentos inconsistentes con la información geográfica
                const { municipalityId, provinceId } = fixInconsistentMunicipality(unquote(columns[0]), unquote(columns[2]))

                const caseGeo = geo.find(g => g.municipality.id == provinceId.padStart(2, '0') + municipalityId.padStart(3, '0'))
                if (!caseGeo) {
                    throw `invalid case without valid municipality mun: ${municipalityId}, prov: ${provinceId}`
                }
                const caseYear = parseInt(unquote(columns[4]), 10)
                const caseEpiweek = parseInt(unquote(columns[5]), 10)

                let case_ = {
                    date: epical.epiweekToDate(caseEpiweek, caseYear).getTime(),
                    year: caseYear,
                    epiweek: caseEpiweek,
                    municipality: {
                        id: caseGeo.municipality.id,
                        name: caseGeo.municipality.name,
                        geo: {...caseGeo.municipality.geo},
                    },
                    province: {
                        id: caseGeo.province.id,
                        name: caseGeo.province.name,
                        geo: {...caseGeo.province.geo},
                    },
                    age_group: {
                        id: unquote(columns[7]),
                        name: unquote(columns[8]),
                    }
                }

                // los casos vienen agrupados por grupo de edades, por lo que se expande en casos individuales
                let cantidad_casos = parseInt(unquote(columns[9]), 10)
                for (let i = 0; i < cantidad_casos; i++) {
                    cases.push({...case_}) // copia del caso
                }
            }
        })
    })

    return cases
}

/**
 * corregir los códigos de departamento
 * por ejemplo departamento_id: 94014 no existe en departamentos.json, pero sí existe 94015
 * devuelve el municipality id corregido
*/
const fixInconsistentMunicipality = (municipalityId, provinceId) => {

    if (provinceId.padStart(2, '0') === '02') {
        // todo CABA lo mando a la Comuna 1, porque los archivos tienen diferentes maneras de contarlo
        return { municipalityId: '7', provinceId }
    } else if (provinceId === '94' && municipalityId === '7') {
        // tierra del fuego, río grande
        return { municipalityId: '8', provinceId }
    } else if (provinceId === '94' && municipalityId === '14') {
        // tierra del fuego, ushuaia
        return { municipalityId: '15', provinceId }
    } else if (provinceId === '58' && municipalityId === '113') {
        // neuquén, zapala
        return { municipalityId: '112', provinceId }
    }
    return { municipalityId, provinceId }
}

module.exports = {
    load
}
